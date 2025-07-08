import React, { useState } from 'react';
import FileUploader      from './FileUploader';
import DataPreviewEditor from './DataPreviewEditor';
import ExcelExporter     from './ExcelExporter';
import './App.css';

export default function App() {
  const [previewData, setPreviewData] = useState(null);

  return (
    <div className="App" style={{ padding: 20 }}>
      <h1>Stecker Cable Processor</h1>

      {!previewData ? (
        <FileUploader onDataReady={setPreviewData} />
      ) : (
        <>
          <h2>Preview &amp; Edit</h2>
          <DataPreviewEditor
            data={previewData}
            onChange={setPreviewData}
          />
          <ExcelExporter data={previewData} />
        </>
      )}
    </div>
  );
}
