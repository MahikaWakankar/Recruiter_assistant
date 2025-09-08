import React, { useState } from "react";
import ResumeUpload from "./components/ResumeUpload";
import History from "./components/History";

function App() {
  const [tab, setTab] = useState("upload");

  return (
    <div style={{ padding: 20 }}>
      <h1>Recruiter Assistant</h1>

      {/* Tab Buttons */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button onClick={() => setTab("upload")}>Upload</button>
        <button onClick={() => setTab("history")}>History</button>
      </div>

      {/* Conditional Rendering */}
      {tab === "upload" ? <ResumeUpload /> : <History />}
    </div>
  );
}

export default App;
