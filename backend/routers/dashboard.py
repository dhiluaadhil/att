import os
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, Date
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from backend.database import get_db
from backend.models import Employee, DailySubmission, DailyCalculation, DailyReport
from backend.auth import get_current_user
from backend.services.whatsapp_client import send_daily_pay_to_boss

router = APIRouter(prefix="/api", tags=["Dashboard"])

# Helper function to parse dates safely
def parse_date(date_str: Optional[str]) -> Optional[date]:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None

@router.get("/dashboard/summary", response_model=Dict[str, Any])
def get_dashboard_summary(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """
    Returns high-level KPI metrics for the dashboard homepage.
    """
    today = date.today()
    
    # 1. Total unique employees
    total_employees = db.query(Employee).count()
    
    # 2. Submissions received today
    submissions_today = db.query(DailySubmission).filter(
        DailySubmission.submission_date == today
    ).count()
    
    # 3. Total pay calculated today
    # Filter calculations by cast of calculated_at to Date
    total_pay_today_result = db.query(func.sum(DailyCalculation.daily_pay)).filter(
        func.cast(DailyCalculation.calculated_at, Date) == today
    ).scalar()
    total_pay_today = float(total_pay_today_result) if total_pay_today_result is not None else 0.0
    
    # 4. Average hours per employee today
    avg_hours_today_result = db.query(func.avg(DailySubmission.work_hours)).filter(
        DailySubmission.submission_date == today
    ).scalar()
    avg_hours_today = float(avg_hours_today_result) if avg_hours_today_result is not None else 0.0
    
    # 5. Get recent 5 submissions for the feed
    recent_submissions_query = db.query(DailySubmission).order_by(DailySubmission.submitted_at.desc()).limit(5).all()
    recent_submissions = []
    for sub in recent_submissions_query:
        recent_submissions.append({
            "id": sub.id,
            "employee_name": sub.employee_name,
            "work_hours": float(sub.work_hours),
            "expenditure": float(sub.expenditure) if sub.expenditure else 0.0,
            "invoice_total": float(sub.invoice_total) if sub.invoice_total else 0.0,
            "submitted_at": sub.submitted_at.isoformat()
        })
        
    return {
        "total_employees": total_employees,
        "submissions_today": submissions_today,
        "total_pay_today": total_pay_today,
        "average_hours_today": round(avg_hours_today, 2),
        "recent_submissions": recent_submissions
    }

@router.get("/submissions")
def get_submissions(
    employee_name: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Returns list of daily submissions filtered by name and date range.
    """
    query = db.query(DailySubmission)
    
    if employee_name:
        query = query.filter(DailySubmission.employee_name.ilike(f"%{employee_name}%"))
        
    d_from = parse_date(date_from)
    if d_from:
        query = query.filter(DailySubmission.submission_date >= d_from)
        
    d_to = parse_date(date_to)
    if d_to:
        query = query.filter(DailySubmission.submission_date <= d_to)
        
    total_count = query.count()
    submissions = query.order_by(DailySubmission.submitted_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for sub in submissions:
        result.append({
            "id": sub.id,
            "employee_id": sub.employee_id,
            "employee_name": sub.employee_name,
            "work_hours": float(sub.work_hours),
            "expenditure": float(sub.expenditure) if sub.expenditure else 0.0,
            "invoice_total": float(sub.invoice_total) if sub.invoice_total else 0.0,
            "submitted_at": sub.submitted_at.isoformat(),
            "submission_date": sub.submission_date.isoformat()
        })
        
    return {
        "total": total_count,
        "data": result
    }

@router.get("/calculations")
def get_calculations(
    employee_name: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Returns list of daily calculations.
    """
    query = db.query(DailyCalculation)
    
    if employee_name:
        query = query.filter(DailyCalculation.employee_name.ilike(f"%{employee_name}%"))
        
    d_from = parse_date(date_from)
    if d_from:
        query = query.filter(func.cast(DailyCalculation.calculated_at, Date) >= d_from)
        
    d_to = parse_date(date_to)
    if d_to:
        query = query.filter(func.cast(DailyCalculation.calculated_at, Date) <= d_to)
        
    total_count = query.count()
    calculations = query.order_by(DailyCalculation.calculated_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for calc in calculations:
        result.append({
            "id": calc.id,
            "submission_id": calc.submission_id,
            "employee_name": calc.employee_name,
            "work_hours": float(calc.work_hours),
            "hourly_rate": calc.hourly_rate,
            "daily_pay": float(calc.daily_pay),
            "expenditure": float(calc.expenditure) if calc.expenditure else 0.0,
            "invoice_total": float(calc.invoice_total) if calc.invoice_total else 0.0,
            "calculated_at": calc.calculated_at.isoformat()
        })
        
    return {
        "total": total_count,
        "data": result
    }

@router.get("/reports")
def get_reports(
    employee_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Returns list of generated PDF reports and their dispatch status.
    """
    query = db.query(DailyReport).join(DailyCalculation, DailyReport.calculation_id == DailyCalculation.id)
    
    if employee_name:
        query = query.filter(DailyReport.employee_name.ilike(f"%{employee_name}%"))
        
    reports = query.order_by(DailyReport.created_at.desc()).all()
    
    result = []
    for rep in reports:
        # Get daily pay from calculation
        daily_pay = float(rep.calculation.daily_pay) if rep.calculation else 0.0
        work_hours = float(rep.calculation.work_hours) if rep.calculation else 0.0
        
        result.append({
            "id": rep.id,
            "calculation_id": rep.calculation_id,
            "employee_name": rep.employee_name,
            "work_hours": work_hours,
            "daily_pay": daily_pay,
            "pdf_path": rep.pdf_path,
            "pdf_name": os.path.basename(rep.pdf_path),
            "sent_to_boss": rep.sent_to_boss,
            "sent_at": rep.sent_at.isoformat() if rep.sent_at else None,
            "created_at": rep.created_at.isoformat()
        })
        
    return result

@router.get("/reports/download/{report_id}")
def download_report(report_id: int, db: Session = Depends(get_db)):
    """
    Downloads the PDF report file. We allow this endpoint without JWT authentication 
    so standard HTML links can hit it directly, or we can check the file locally.
    """
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if not os.path.exists(report.pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
        
    return FileResponse(
        path=report.pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(report.pdf_path)
    )

@router.post("/reports/{report_id}/resend")
def resend_report_whatsapp(report_id: int, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """
    Manually triggers resending an existing PDF report to the boss.
    """
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if not os.path.exists(report.pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
        
    calc = report.calculation
    if not calc:
        raise HTTPException(status_code=400, detail="Associated calculation record missing")
        
    # Send report via WhatsApp
    whatsapp_sent, whatsapp_status = send_daily_pay_to_boss(
        employee_name=calc.employee_name,
        work_hours=float(calc.work_hours),
        daily_pay=float(calc.daily_pay),
        pdf_path=report.pdf_path
    )
    
    # Update report record
    report.sent_to_boss = whatsapp_sent
    if whatsapp_sent:
        report.sent_at = datetime.now()
    db.commit()
    
    return {
        "status": "success" if whatsapp_sent else "failed",
        "whatsapp_sent": whatsapp_sent,
        "whatsapp_status": whatsapp_status
    }
