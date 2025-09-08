import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import mongoose from 'mongoose';
import 'dotenv/config';
import { sendEmails } from "./utils/sendEmails.js";    // email sender

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Google Sheets auth
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

const HISTORY_FILE = path.join(process.cwd(), "history.json");

// Utility: load history
function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(HISTORY_FILE));
}

// Utility: save history
function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Import routes
import candidateRoutes from './routes/candidates.js';
import emailRoutes from './routes/email.js';

// Use routes
app.use('/api/candidates', candidateRoutes);
app.use('/api/email', emailRoutes);

// 📌 Upload Resume to Google Sheets
app.post("/api/upload", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const today = new Date().toISOString().split("T")[0];

    let history = loadHistory();
    let todayEntry = history.find(h => h.date === today);

    if (!todayEntry) {
      // create new sheet for today
      const sheetRes = await sheets.spreadsheets.create({
        resource: { properties: { title: `Candidates_${today}` } }
      });
      const sheetId = sheetRes.data.spreadsheetId;

      todayEntry = { date: today, sheetId, sent: false };
      history.push(todayEntry);
      saveHistory(history);

      // add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "A1:D1",
        valueInputOption: "RAW",
        requestBody: {
          values: [["Name", "Email", "Phone", "Date"]]
        }
      });
    }

    // append candidate row
    await sheets.spreadsheets.values.append({
      spreadsheetId: todayEntry.sheetId,
      range: "A:D",
      valueInputOption: "RAW",
      requestBody: {
        values: [[name, email, phone, today]]
      }
    });

    res.json({ success: true, name, email, phone, date: today });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Resume upload failed" });
  }
});

// 📌 Get history
app.get("/history", (req, res) => {
  const history = loadHistory();
  res.json(history);
});

// 📌 Send email for a specific day
app.post("/send-emails", async (req, res) => {
  try {
    const { date } = req.body;
    let history = loadHistory();
    const entry = history.find(h => h.date === date);

    if (!entry) return res.status(404).json({ error: "No sheet found for date" });
    if (entry.sent) return res.json({ success: false, message: "Emails already sent" });

    // fetch candidates
    const values = await sheets.spreadsheets.values.get({
      spreadsheetId: entry.sheetId,
      range: "A2:D"
    });

    const candidates = values.data.values || [];

    // ✅ Dedupe emails & skip blanks
    const seen = new Set();
    const clean = [];
    for (const row of candidates) {
      const email = (row[1] || "").trim().toLowerCase();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      clean.push(row);
    }

    await sendEmails(clean);

    entry.sent = true;
    saveHistory(history);

    res.json({ success: true, sent: clean.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send emails" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));