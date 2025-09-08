import React, { useEffect, useState } from "react";

export default function History() {
  const [items, setItems] = useState([]);
  const [sending, setSending] = useState(null);
  const base = "http://localhost:5000";

  const fetchHistory = async () => {
    const res = await fetch(`${base}/history`);
    const data = await res.json();
    setItems(data); // [{date, sheetId, sent}]
  };

  useEffect(() => { fetchHistory(); }, []);

  const sendForDay = async (date) => {
    try {
      setSending(date);
      const res = await fetch(`${base}/send-emails`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ date })
      });
      const data = await res.json();
      await fetchHistory();
      alert(data.success ? `Emails sent for ${date}` : (data.message || "Already sent"));
    } catch (e) {
      alert("Failed to send: " + e.message);
    } finally {
      setSending(null);
    }
  };

  const sheetUrl = (id) => `https://docs.google.com/spreadsheets/d/${id}`;

  return (
    <div style={{maxWidth:900}}>
      <h2>History (Daily Sheets)</h2>
      <table border="1" cellPadding="8" style={{width:"100%", borderCollapse:"collapse"}}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Google Sheet</th>
            <th>Emails</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.date}>
              <td>{item.date}</td>
              <td>
                <a href={sheetUrl(item.sheetId)} target="_blank" rel="noreferrer">
                  Open Sheet
                </a>
              </td>
              <td>
                <button
                  onClick={() => sendForDay(item.date)}
                  disabled={item.sent || sending === item.date}
                  title={item.sent ? "Already sent" : "Send emails to all candidates in this sheet"}
                >
                  {item.sent ? "Sent" : (sending === item.date ? "Sending..." : "Send Emails")}
                </button>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr><td colSpan="3">No history yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
