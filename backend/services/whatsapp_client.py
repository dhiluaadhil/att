import os
import requests
import json
from typing import Dict, Any, Tuple
from backend.config import settings

def upload_pdf_to_meta(pdf_path: str) -> str:
    """
    Uploads a PDF file to Meta's WhatsApp Media API.
    Returns the media_id if successful, otherwise raises an exception.
    """
    url = f"https://graph.facebook.com/v18.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/media"
    
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"
    }
    
    filename = os.path.basename(pdf_path)
    
    # Meta requires messaging_product and type parameters
    # The file parameter must contain (filename, file_object, content_type)
    files = {
        "file": (filename, open(pdf_path, "rb"), "application/pdf"),
    }
    
    data = {
        "messaging_product": "whatsapp",
        "type": "application/pdf"
    }
    
    print(f"[WhatsApp] Uploading {filename} to Meta Media API...", flush=True)
    response = requests.post(url, headers=headers, data=data, files=files)
    
    # Make sure to close the file handle
    files["file"][1].close()
    
    if response.status_code != 200:
        raise Exception(f"Meta Media upload failed with status {response.status_code}: {response.text}")
        
    res_data = response.json()
    media_id = res_data.get("id")
    
    if not media_id:
        raise Exception(f"Meta Media API response did not contain a media ID: {res_data}")
        
    print(f"[WhatsApp] Uploaded successfully. Media ID: {media_id}", flush=True)
    return media_id

def send_text_message(to_number: str, text_body: str) -> Dict[str, Any]:
    """
    Sends a standard WhatsApp text message.
    """
    url = f"https://graph.facebook.com/v18.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_number,
        "type": "text",
        "text": {
            "body": text_body
        }
    }
    
    print(f"[WhatsApp] Sending text message to {to_number}...", flush=True)
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code not in (200, 201):
        raise Exception(f"Failed to send text message: {response.text}")
        
    return response.json()

def send_document_message(to_number: str, media_id: str, filename: str) -> Dict[str, Any]:
    """
    Sends a WhatsApp document message using a Meta media ID.
    """
    url = f"https://graph.facebook.com/v18.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_number,
        "type": "document",
        "document": {
            "id": media_id,
            "filename": filename
        }
    }
    
    print(f"[WhatsApp] Sending document message (Media ID: {media_id}) to {to_number}...", flush=True)
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code not in (200, 201):
        raise Exception(f"Failed to send document message: {response.text}")
        
    return response.json()

def send_daily_pay_to_boss(employee_name: str, work_hours: float, daily_pay: float, pdf_path: str) -> Tuple[bool, str]:
    """
    Orchestrates sending the daily pay report to the boss.
    1. Uploads PDF to Meta to get media_id.
    2. Sends a text summary message.
    3. Sends the PDF document message.
    
    Returns: (success_boolean, status_message)
    """
    to_number = settings.BOSS_WHATSAPP_NUMBER
    filename = os.path.basename(pdf_path)
    
    # Formulate summary text
    text_summary = f"📋 *Daily Pay Summary*\n\nEmployee *{employee_name}* worked *{work_hours:.2f} hours* today and earned *Rs. {daily_pay:,.2f}*."
    
    try:
        # Step 1: Upload PDF
        media_id = upload_pdf_to_meta(pdf_path)
        
        # Step 2: Send Text Message
        send_text_message(to_number, text_summary)
        
        # Step 3: Send Document Message
        send_document_message(to_number, media_id, filename)
        
        return True, "Report successfully sent to boss via WhatsApp."
    except Exception as e:
        error_msg = str(e)
        print(f"[WhatsApp Error] Failed to complete WhatsApp dispatch flow: {error_msg}", flush=True)
        return False, f"WhatsApp dispatch failed: {error_msg}"
