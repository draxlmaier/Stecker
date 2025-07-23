// src/App.js
import React, { useState } from 'react';
import FileUploader       from './FileUploader';
import ExcelPreviewEditor from './ExcelPreviewEditor';
import ExcelExporter      from './ExcelExporter';
import './App.css';

export default function App() {
  const [previewData, setPreviewData] = useState({
    header:      { module:'', stand:'', qs:'', remarque:'' },
    rows:        [],
    sectionRows: []
  });

  return (
    <div className="App" style={{ padding: 20 }}>
      <h1>Stecker Tool</h1>

      {previewData.rows.length === 0 ? (
        <FileUploader
          onDataReady={({ header, rows, sectionRows }) => {
            setPreviewData({
              // now keep the entire header, including remarque
              header,
              rows,
              // if uploader hasn’t passed sectionRows, give a default
              sectionRows: sectionRows.length
                ? sectionRows
                : [{ code: '', length: '3.20 (+0.20 / -0.20)' }]
            });
          }}
        />
      ) : (
        <>
          <ExcelPreviewEditor
            header={previewData.header}
            rows={previewData.rows}
            sectionRows={previewData.sectionRows}
            onHeaderChange={h   => setPreviewData(pd => ({ ...pd, header: h }))}
            onRowsChange={r     => setPreviewData(pd => ({ ...pd, rows: r }))}
            onSectionChange={sr => setPreviewData(pd => ({ ...pd, sectionRows: sr }))}
          />
          <ExcelExporter data={previewData} />
        </>
      )}
    </div>
  );
}
