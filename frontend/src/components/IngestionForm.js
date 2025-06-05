import React, { useState } from 'react';
import axios from 'axios';

const IngestionForm = ({ onIngestionSuccess }) => {
  const [ids, setIds] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const idArray = ids.split(',').map(id => parseInt(id.trim()));
      
      // Validate IDs
      if (!idArray.every(id => Number.isInteger(id) && id > 0 && id <= 1000000007)) {
        throw new Error('IDs must be integers between 1 and 1000000007');
      }

      const response = await axios.post('http://localhost:4000/ingest', {
        ids: idArray,
        priority
      });

      onIngestionSuccess(response.data.ingestion_id);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="ingestion-form">
      <h2>Submit Data Ingestion Request</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="ids">IDs (comma-separated):</label>
          <textarea
            id="ids"
            value={ids}
            onChange={(e) => setIds(e.target.value)}
            placeholder="Enter IDs (e.g., 1,2,3,4,5)"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="priority">Priority:</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            required
          >
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
};

export default IngestionForm;
