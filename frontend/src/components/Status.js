import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Status = ({ ingestionId }) => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/status/${ingestionId}`);
        setStatus(response.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [ingestionId]);

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!status) {
    return <div className="status-loading">Loading status...</div>;
  }

  return (
    <div className="status-container">
      <h3>Ingestion Status</h3>
      <div className="status-overview">
        <p>Status: <span className={`status-${status.status.toLowerCase()}`}>{status.status}</span></p>
        <p>Total Batches: {status.batches.length}</p>
      </div>
      <div className="batches-list">
        <h4>Batches</h4>
        {status.batches.map((batch, index) => (
          <div key={batch.batch_id} className="batch-item">
            <div className="batch-header">
              <span>Batch {index + 1}</span>
              <span className={`batch-status-${batch.status.toLowerCase()}`}>
                {batch.status}
              </span>
            </div>
            <div className="batch-ids">
              {batch.ids.map(id => (
                <span key={id} className="id-item">{id}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Status;
