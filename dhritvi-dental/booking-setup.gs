/**
 * Dhritvi Advanced Dental Care - booking receiver
 * Saves every appointment request to a Google Sheet and emails the owner.
 *
 * SETUP (about 5 minutes):
 * 1. Create a new Google Sheet. Name it "Appointments".
 * 2. In the Sheet: Extensions > Apps Script. Delete any code and paste this file.
 * 3. Change OWNER_EMAIL below to the clinic's email address.
 * 4. Click Deploy > New deployment > type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 *    Click Deploy and allow the permissions it asks for.
 * 5. Copy the Web app URL and paste it into index.html as SHEET_URL.
 *
 * If you edit this script later, use Deploy > Manage deployments > Edit > New version.
 */

const OWNER_EMAIL = 'clinic@example.com'; // <-- change this

function doPost(e) {
  const p = e.parameter;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  // Header row on first use
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Received', 'Patient type', 'Name', 'Phone', 'Email',
                     'Service', 'Date', 'Time', 'Notes', 'Status']);
  }

  sheet.appendRow([new Date(), p.patientType, p.name, p.phone, p.email,
                   p.service, p.date, p.time, p.notes, 'New']);

  const body =
    'New appointment request\n\n' +
    'Name: ' + p.name + '\n' +
    'Phone: ' + p.phone + '\n' +
    'Email: ' + p.email + '\n' +
    'Service: ' + p.service + '\n' +
    'Date: ' + p.date + '\n' +
    'Time: ' + p.time + '\n' +
    'Patient: ' + p.patientType + '\n' +
    'Notes: ' + (p.notes || '-');

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'New appointment: ' + p.name + ' - ' + p.date + ' ' + p.time,
    body: body
  });

  return ContentService.createTextOutput('ok');
}
