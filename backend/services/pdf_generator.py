import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from backend.config import settings

def generate_daily_report_pdf(calculation_data: dict) -> str:
    """
    Generates a professional PDF report showing employee pay calculations.
    Returns the absolute file path of the generated PDF.
    """
    employee_name = calculation_data["employee_name"]
    date_str = calculation_data.get("date", datetime.now().strftime("%Y-%m-%d"))
    
    # Create clean file name
    clean_name = "".join([c if c.isalnum() else "_" for c in employee_name])
    filename = f"report_{clean_name}_{date_str}_{int(datetime.now().timestamp())}.pdf"
    file_path = os.path.join(settings.PDF_OUTPUT_DIR, filename)
    
    # Page setup - 0.75 in (54 pt) margins
    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Premium Color Palette
    PRIMARY_COLOR = colors.HexColor("#1E3A8A")  # Deep Navy Blue
    SECONDARY_COLOR = colors.HexColor("#475569")  # Slate Gray
    HIGHLIGHT_BG = colors.HexColor("#EFF6FF")  # Very Light Blue
    HIGHLIGHT_BORDER = colors.HexColor("#BFDBFE")  # Light Blue Border
    TEXT_COLOR = colors.HexColor("#1F2937")  # Charcoal
    
    # Custom Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        textColor=PRIMARY_COLOR,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=SECONDARY_COLOR,
        spaceAfter=20
    )
    
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=PRIMARY_COLOR,
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=TEXT_COLOR,
        leading=14
    )
    
    bold_body_style = ParagraphStyle(
        'BodyDarkBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    highlight_text_style = ParagraphStyle(
        'HighlightText',
        parent=body_style,
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=PRIMARY_COLOR
    )
    
    footer_style = ParagraphStyle(
        'FooterText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        textColor=SECONDARY_COLOR,
        alignment=1  # Centered
    )

    story = []
    
    # 1. Header Band
    story.append(Paragraph("DAILY WORK & EARNINGS RECEIPT", title_style))
    story.append(Paragraph(f"Generated automatically on {datetime.now().strftime('%Y-%m-%d %I:%M %p')}", subtitle_style))
    
    # 2. Metadata Block (Employee and Date Details)
    meta_data = [
        [Paragraph("<b>Employee Name:</b>", body_style), Paragraph(employee_name, body_style)],
        [Paragraph("<b>Date of Work:</b>", body_style), Paragraph(date_str, body_style)],
        [Paragraph("<b>Report ID:</b>", body_style), Paragraph(f"EMP-PAY-{date_str.replace('-', '')}-{clean_name[:4].upper()}", body_style)]
    ]
    
    meta_table = Table(meta_data, colWidths=[120, 384])
    meta_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('LINEBELOW', (0,2), (1,2), 0.5, SECONDARY_COLOR),
    ]))
    
    story.append(meta_table)
    story.append(Spacer(1, 20))
    
    # 3. Earnings Summary Title
    story.append(Paragraph("Earnings & Calculations Summary", h2_style))
    
    # Table data - using "INR" and "Rs." instead of Unicode Rupee symbol to prevent font fallback boxes in PDF
    work_hours = calculation_data["work_hours"]
    hourly_rate = calculation_data["hourly_rate"]
    daily_pay = calculation_data["daily_pay"]
    expenditure = calculation_data["expenditure"]
    invoice_total = calculation_data["invoice_total"]
    
    summary_data = [
        [Paragraph("Description", bold_body_style), Paragraph("Calculation Metrics", bold_body_style), Paragraph("Amount (INR)", bold_body_style)],
        [Paragraph("Work Hours Today", body_style), Paragraph(f"{work_hours:.2f} Hours", body_style), Paragraph(f"Rs. {work_hours:.2f} hrs", body_style)],
        [Paragraph("Standard Hourly Rate", body_style), Paragraph(f"Rs. {hourly_rate} / hr", body_style), Paragraph(f"Rs. {hourly_rate}.00", body_style)],
        [Paragraph("Daily Calculated Pay", highlight_text_style), Paragraph(f"{work_hours:.2f} hrs * Rs. {hourly_rate}", highlight_text_style), Paragraph(f"Rs. {daily_pay:,.2f}", highlight_text_style)],
        [Paragraph("Out-of-Pocket Expenditure", body_style), Paragraph("Reimbursement (Claimed separately)", body_style), Paragraph(f"Rs. {expenditure:,.2f}", body_style)],
        [Paragraph("Daily Project Invoice Total", body_style), Paragraph("Client Billing Value", body_style), Paragraph(f"Rs. {invoice_total:,.2f}", body_style)]
    ]
    
    summary_table = Table(summary_data, colWidths=[160, 200, 144])
    summary_table.setStyle(TableStyle([
        # Headers
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        
        # Row padding
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        
        # Highlighted row for Daily Pay
        ('BACKGROUND', (0, 3), (-1, 3), HIGHLIGHT_BG),
        ('BOX', (0, 3), (-1, 3), 1, HIGHLIGHT_BORDER),
        
        # Grid lines
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.lightgrey),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, PRIMARY_COLOR),
    ]))
    
    # Quick styling adjustment for header row text
    for i in range(3):
        summary_data[0][i].style.textColor = colors.white
        
    story.append(summary_table)
    story.append(Spacer(1, 30))
    
    # 4. Note / Disclaimer Section
    story.append(Paragraph("Notes & Status", h2_style))
    note_text = (
        "<b>Important Note:</b> Daily Pay calculation is computed at the base rate of Rs. 250.00 per hour. "
        "Out-of-pocket expenditures represent reimbursable business expenses incurred today and are logged separately. "
        "Invoice totals track the revenue generated for the company from this employee's assignments. "
        "All calculations are logged inside the central PostgreSQL server and synced to the management dashboard."
    )
    story.append(Paragraph(note_text, body_style))
    story.append(Spacer(1, 40))
    
    # 5. Signatures
    sig_data = [
        [Paragraph("_____________________________<br/><b>Employee Signature</b>", body_style),
         Paragraph("_____________________________<br/><b>Approver Signature</b>", body_style)]
    ]
    sig_table = Table(sig_data, colWidths=[250, 254])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 30))
    
    # 6. Page Footer
    story.append(Paragraph("Employee Daily Pay Automation System • Automated PDF Reporting", footer_style))
    
    # Build Document
    doc.build(story)
    return file_path
