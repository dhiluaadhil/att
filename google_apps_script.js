function onFormSubmit(e) {
  const formResponse = e.response;
  const itemResponses = formResponse.getItemResponses();
  
  // Extract form fields
  const data = {};
  for (let i = 0; i < itemResponses.length; i++) {
    const item = itemResponses[i];
    const title = item.getItem().getTitle();
    const response = item.getResponse();
    
    // Normalize field names
    if (title.includes('Name')) {
      data.name = response;
    } else if (title.includes('Work Hours')) {
      data.work_hours = parseFloat(response);
    } else if (title.includes('Expenditure')) {
      data.expenditure = parseFloat(response);
    } else if (title.includes('Invoice')) {
      data.invoice_total = parseFloat(response);
    }
  }
  
  // Add email
  data.email = Session.getActiveUser().getEmail();
  data.timestamp = new Date().toISOString();
  
  // Send to your FastAPI endpoint
  const payload = {
    method: 'post',
    payload: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };
  
  // Exposing local port 8000 via localhost.run public tunnel
  const backendUrl = 'https://7199f924b586d7.lhr.life/api/submit-daily';
  
  const response = UrlFetchApp.fetch(
    backendUrl,
    payload
  );
  
  const result = JSON.parse(response.getContentText());
  Logger.log('Submission result: ' + JSON.stringify(result));
}
