import React, { useState, useEffect } from "react";
import { candidatesApi } from "../api";
import CandidateTable from "./CandidateTable";
import "./ResumeUpload.css";

export default function ResumeUpload() {
  const [status, setStatus] = useState(null);
  const [driveLink, setDriveLink] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const res = await candidatesApi.getAll();
      setCandidates(res.data.candidates || []);
    } catch (e) {
      setStatus("Failed to load candidates: " + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      if (!driveLink) {
        setStatus("Please enter a Google Drive link");
        return;
      }
      setStatus("Scanning resumes from Google Drive...");
      setLoading(true);
      const res = await candidatesApi.scan({ driveLink });
      await loadCandidates(); // Reload the candidates after scan
      const count = res.data.candidates?.length || 0;
      setStatus(`✓ Processed ${count} resumes`);
    } catch (e) {
      setStatus("Failed: " + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (!status) return '';
    return status.toLowerCase().includes('error') || status.toLowerCase().includes('fail')
      ? 'error'
      : status.startsWith('✓') ? 'success' : 'info';
  };

  return (
    <div className="resume-upload">
      <div className="resume-upload-form">
        <div className="resume-upload-header">
          <h2 className="resume-upload-title">Resume Scanner</h2>
          <p className="resume-upload-description">
            Paste a Google Drive folder link containing resumes to process them automatically.
          </p>
        </div>
        <div className="drive-link-input">
          <label htmlFor="driveLink">Google Drive Folder Link</label>
          <input
            id="driveLink"
            type="text"
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
          />
        </div>
        <button 
          className="scan-button" 
          onClick={handleScan} 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Scanning Resumes...
            </>
          ) : (
            "Scan Resumes from Drive"
          )}
        </button>
        {status && (
          <div className={`status-message ${getStatusClass(status)}`}>
            {status}
          </div>
        )}
      </div>
      <CandidateTable 
        candidates={candidates}
        loading={loading}
        onUpdateCandidate={async (id, data) => {
          try {
            await candidatesApi.update(id, data);
            await loadCandidates(); // Reload after update
          } catch (e) {
            setStatus("Failed to update: " + (e.response?.data?.error || e.message));
          }
        }}
        onSendEmail={async (id) => {
          try {
            await candidatesApi.sendEmail(id);
            await loadCandidates(); // Reload after sending email
          } catch (e) {
            setStatus("Failed to send email: " + (e.response?.data?.error || e.message));
          }
        }}
      />
    </div>
  );
}
