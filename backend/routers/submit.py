from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from backend.database import get_db
from backend.models import Employee, DailySubmission, DailyCalculation, DailyReport
from backend.services.parser import parse_google_form
from backend.services.calculator import calculate_daily_pay
from backend.services.pdf_generator import generate_daily_report_pdf
from backend.services.whatsapp_client import send_daily_pay_to_boss

router = APIRouter(prefix="/api", tags=["Submissions"])

class SubmissionResponse(BaseModel):
    status: str
    calculation_id: int
    employee_name: str
    daily_pay: float
    whatsapp_sent: bool
    whatsapp_status: str

@router.post("/submit-daily", response_model=SubmissionResponse)
def submit_daily(payload: Dict[str, Any], db: Session = Depends(get_db)):
    # 1. Clean & Parse Google Form JSON payload
    try:
        cleaned_data = parse_google_form(payload)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
        
    employee_name = cleaned_data["name"]
    email = cleaned_data["email"]
    work_hours = cleaned_data["work_hours"]
    expenditure = cleaned_data["expenditure"]
    invoice_total = cleaned_data["invoice_total"]
    
    try:
        # 2. Check if employee exists, otherwise create
        employee = db.query(Employee).filter(Employee.name == employee_name).first()
        if not employee:
            print(f"[Submit] Employee '{employee_name}' not found. Registering new employee...", flush=True)
            employee = Employee(name=employee_name, email=email)
            db.add(employee)
            db.commit()
            db.refresh(employee)
        elif email and not employee.email:
            # Update email if it was previously empty
            employee.email = email
            db.commit()
            db.refresh(employee)
            
        # 3. Store in daily_submissions table
        submission = DailySubmission(
            employee_id=employee.id,
            employee_name=employee_name,
            work_hours=work_hours,
            expenditure=expenditure,
            invoice_total=invoice_total
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        
        # 4. Calculator Processes data (work_hours * 250)
        calc_result = calculate_daily_pay(cleaned_data)
        daily_pay = calc_result["daily_pay"]
        hourly_rate = calc_result["hourly_rate"]
        
        # 5. Store in daily_calculations table
        calculation = DailyCalculation(
            submission_id=submission.id,
            employee_name=employee_name,
            work_hours=work_hours,
            hourly_rate=hourly_rate,
            daily_pay=daily_pay,
            expenditure=expenditure,
            invoice_total=invoice_total
        )
        db.add(calculation)
        db.commit()
        db.refresh(calculation)
        
        # 6. Generate PDF report
        pdf_path = generate_daily_report_pdf(calc_result)
        
        # 7. WhatsApp Dispatch
        whatsapp_sent, whatsapp_status = send_daily_pay_to_boss(
            employee_name=employee_name,
            work_hours=work_hours,
            daily_pay=daily_pay,
            pdf_path=pdf_path
        )
        
        # 8. Record report in daily_reports table
        report = DailyReport(
            calculation_id=calculation.id,
            employee_name=employee_name,
            pdf_path=pdf_path,
            sent_to_boss=whatsapp_sent,
            sent_at=datetime.now() if whatsapp_sent else None
        )
        db.add(report)
        db.commit()
        
        return {
            "status": "success",
            "calculation_id": calculation.id,
            "employee_name": employee_name,
            "daily_pay": float(daily_pay),
            "whatsapp_sent": whatsapp_sent,
            "whatsapp_status": whatsapp_status
        }
        
    except Exception as e:
        db.rollback()
        print(f"[Submit Error] Failed to complete submit-daily workflow: {str(e)}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal database or service execution error: {str(e)}"
        )
