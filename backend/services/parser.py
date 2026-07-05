def parse_google_form(form_json: dict) -> dict:
    """
    Extracts and validates fields: name, work_hours, expenditure, invoice_total, email
    Raises ValueError on validation failures.
    """
    if not isinstance(form_json, dict):
        raise ValueError("Invalid payload: must be a JSON object")

    # Extract name
    name = form_json.get("name")
    if not name or not isinstance(name, str) or not name.strip():
        raise ValueError("Employee Name is required and must be a non-empty string")
    name = name.strip()

    # Extract work_hours
    work_hours_raw = form_json.get("work_hours")
    if work_hours_raw is None:
        raise ValueError("Work Hours Today is required")
    try:
        work_hours = float(work_hours_raw)
    except (TypeError, ValueError):
        raise ValueError(f"Work Hours Today must be a numeric value, got {work_hours_raw}")
    
    if work_hours <= 0:
        raise ValueError(f"Work Hours Today must be greater than zero, got {work_hours}")
    if work_hours > 24:
        raise ValueError(f"Work Hours Today cannot be greater than 24, got {work_hours}")

    # Extract expenditure
    expenditure_raw = form_json.get("expenditure")
    if expenditure_raw in (None, "", "null"):
        expenditure = 0.0
    else:
        try:
            expenditure = float(expenditure_raw)
        except (TypeError, ValueError):
            raise ValueError(f"Expenditure must be a numeric value, got {expenditure_raw}")
        if expenditure < 0:
            raise ValueError(f"Expenditure cannot be negative, got {expenditure}")

    # Extract invoice_total
    invoice_raw = form_json.get("invoice_total")
    if invoice_raw in (None, "", "null"):
        invoice_total = 0.0
    else:
        try:
            invoice_total = float(invoice_raw)
        except (TypeError, ValueError):
            raise ValueError(f"Invoice Total must be a numeric value, got {invoice_raw}")
        if invoice_total < 0:
            raise ValueError(f"Invoice Total cannot be negative, got {invoice_total}")

    # Extract optional fields
    email = form_json.get("email")
    if email and isinstance(email, str):
        email = email.strip()
    else:
        email = None

    timestamp = form_json.get("timestamp")

    return {
        "name": name,
        "work_hours": work_hours,
        "expenditure": expenditure,
        "invoice_total": invoice_total,
        "email": email,
        "timestamp": timestamp
    }
