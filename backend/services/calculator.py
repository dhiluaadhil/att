from datetime import datetime

def calculate_daily_pay(form_data: dict) -> dict:
    """
    Calculates the employee's daily pay based on work hours.
    
    Formula: Daily Pay = Work Hours * ₹250
    """
    hourly_rate = 250
    work_hours = form_data["work_hours"]
    daily_pay = work_hours * hourly_rate
    
    return {
        "employee_name": form_data["name"],
        "work_hours": work_hours,
        "hourly_rate": hourly_rate,
        "daily_pay": daily_pay,
        "expenditure": form_data["expenditure"],
        "invoice_total": form_data["invoice_total"],
        "date": datetime.now().strftime("%Y-%m-%d")
    }
