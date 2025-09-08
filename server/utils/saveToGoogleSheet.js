const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function saveToGoogleSheet(rowData) {
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: "Sheet1!A:C",
    valueInputOption: "RAW",
    resource: { values: [rowData] },
  });
}

module.exports = { saveToGoogleSheet };
