import React, { useState } from 'react';
import './App.css';
import IngestionForm from './components/IngestionForm';
import Status from './components/Status';

function App() {
  const [ingestionId, setIngestionId] = useState(null);

  const handleIngestionSuccess = (id) => {
    setIngestionId(id);
  };

  return (
    <div className="app-container">
      <div className="content-container">
        <h1>Data Ingestion System</h1>
        <div className="main-content">
          <IngestionForm onIngestionSuccess={handleIngestionSuccess} />
          {ingestionId && (
            <Status ingestionId={ingestionId} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
