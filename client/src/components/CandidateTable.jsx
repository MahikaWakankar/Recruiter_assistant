import React, { useState } from 'react';
import './CandidateTable.css';

const CandidateTable = ({ candidates, onSendEmail, onUpdateCandidate, loading }) => {
  const [editingNotes, setEditingNotes] = useState({});

  const handleNotesChange = (candidateId, notes) => {
    setEditingNotes(prev => ({ ...prev, [candidateId]: notes }));
  };

  const handleNotesSubmit = async (candidateId) => {
    const notes = editingNotes[candidateId] || '';
    await onUpdateCandidate(candidateId, { notes });
    setEditingNotes(prev => {
      const newState = { ...prev };
      delete newState[candidateId];
      return newState;
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { color: '#007bff', label: 'New' },
      emailed: { color: '#28a745', label: 'Emailed' },
      responded: { color: '#ffc107', label: 'Responded' },
      invalid: { color: '#dc3545', label: 'Invalid' }
    };
    
    const config = statusConfig[status] || { color: '#6c757d', label: status };
    
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    );
  };

  const formatFileName = (filePath) => {
    if (!filePath) return '';
    return filePath.split('\\').pop() || filePath.split('/').pop() || filePath;
  };

  if (loading) {
    return <div className="loading">Loading candidates...</div>;
  }

  if (!candidates.length) {
    return (
      <div className="empty-state">
        <h3>No candidates found</h3>
        <p>Add a Google Drive link and click "Scan Resumes from Drive" to get started</p>
      </div>
    );
  }

  return (
     <div className="candidate-table-container">
      <table className="candidate-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Date</th>

            <th>Phone</th>
            <th>Status</th>
            <th>Source File</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate._id}>
              <td className="name-cell">
                {candidate.name || <span className="missing">—</span>}
              </td>
              
              <td className="email-cell">
                {candidate.email ? (
                  <a href={`mailto:${candidate.email}`} className="email-link">
                    {candidate.email}
                  </a>
                ) : (
                  <span className="missing">—</span>
                )}
              </td>
              <td>{candidate.date ? new Date(candidate.date).toLocaleDateString() : "-"}</td>

              
              <td className="phone-cell">
                {candidate.phone ? (
                  <a href={`tel:${candidate.phone}`} className="phone-link">
                    {candidate.phone}
                  </a>
                ) : (
                  <span className="missing">—</span>
                )}
              </td>
              
              <td className="status-cell">
                {getStatusBadge(candidate.status)}
              </td>
              
              <td className="file-cell" title={candidate.sourceFile}>
                {formatFileName(candidate.sourceFile)}
              </td>
              
              <td className="notes-cell">
                <div className="notes-container">
                  <textarea
                    placeholder="Add notes..."
                    defaultValue={candidate.notes || ''}
                    onChange={(e) => handleNotesChange(candidate._id, e.target.value)}
                    onBlur={() => handleNotesSubmit(candidate._id)}
                    className="notes-input"
                  ></textarea>
                </div>
              </td>
              
              <td className="actions-cell">
                <div className="button-group">
                  <button
                    onClick={() => onSendEmail(candidate._id)}
                    disabled={
                      !candidate.email || 
                      candidate.status === 'emailed' || 
                      loading
                    }
                    className="email-button"
                    title={
                      !candidate.email 
                        ? 'No email address' 
                        : candidate.status === 'emailed' 
                        ? 'Email already sent' 
                        : 'Send recruitment email'
                    }
                  >
                    {candidate.status === 'emailed' ? '✓ Sent' : 'Send Email'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CandidateTable;