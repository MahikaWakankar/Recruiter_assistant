// server/utils/googleSheets.js
import { google } from "googleapis";
import auth from "../config/googleAuth.js";

const sheets = google.sheets({ version: "v4", auth });

async function getOrCreateTodaySheet() {
  const today = new Date().toISOString().split("T")[0];
  const spreadsheetTitle = `Recruiter_Resumes_${today}`;

  const resource = { properties: { title: spreadsheetTitle } };
  const response = await sheets.spreadsheets.create({
    resource,
    fields: "spreadsheetId",
  });

  const spreadsheetId = response.data.spreadsheetId;

  // Add header row
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Sheet1!A1:D1",
    valueInputOption: "RAW",
    requestBody: {
      values: [["Name", "Email", "Phone", "Date"]],
    },
  });

  return { spreadsheetId, title: spreadsheetTitle };
}

async function appendCandidate(spreadsheetId, name, email, phone) {
  const today = new Date().toISOString().split("T")[0];
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A:D",
    valueInputOption: "RAW",
    requestBody: {
      values: [[name, email, phone, today]],
    },
  });
}

module.exports = { getOrCreateTodaySheet, appendCandidate };
