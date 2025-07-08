import React, { useState } from 'react';
import ExcelJS from 'exceljs';

// same color‐map & helper as before
const colorMap = {
  R: "FF0000", G: "FFFF00", I: "00FF00", H: "808080",
  P: "FFC0CB", C: "A52A2A", B: "0000FF", S: "000000",
  W: "FFFFFF", X: null
};
function getColors(matnr) {
  if (!matnr) return [null, null];
  const s = String(matnr).slice(-3);
  const [f, s2] = [s[0], s[1]];
  const c1 = colorMap[f], c2 = colorMap[s2] || c1;
  return [c1, s2 === "X" ? c1 : c2];
}

export default function FileUploader({ onDataReady }) {
  const [file, setFile]       = useState(null);
  const [fileName, setFileName] = useState('');

  const onFileChange = e => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
    }
  };

  const loadAndProcess = async e => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file first.');
      return;
    }

    // 1) Load workbook
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0];

    // 2) Build header→colIndex map
    const headerMap = {};
    ws.getRow(1).eachCell((cell, colNumber) => {
      const h = cell.value && cell.value.toString().trim();
      if (h) headerMap[h] = colNumber;
    });

    // 3) Extract rows into JS objects
    const raw = [];
    ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (rowNum === 1) return; // skip header
      raw.push({
        FPNR:      row.getCell(headerMap['FPNR']).value,
        KABEL:     row.getCell(headerMap['KABEL']).value,
        MATNR:     row.getCell(headerMap['MATNR']).value,
        MENGE:     row.getCell(headerMap['NMENGE'] || headerMap['MENGE']).value,
        KSTST:     row.getCell(headerMap['FB']    || headerMap['KSTST']).value,
        DPG:       row.getCell(headerMap['DPG']).value,
        POSITION:  row.getCell(headerMap['POSITION'] || headerMap['TEXT1']).value,
        KAMMERNR:  row.getCell(headerMap['KAMMERNR'] || headerMap['BMNR']).value,
      });
    });

    // 4) Filter + group
    const filtered = raw.filter(r => Number(r.KSTST) === 3211);
    if (filtered.length === 0) {
      alert('No rows matched KSTST = 3211');
      return;
    }
    const groups = {};
    filtered.forEach(r => {
      if (r.MENGE !== 0 && r.MATNR != null) {
        (groups[r.KABEL] = groups[r.KABEL] || []).push(r);
      }
    });

    // 5) Build outData
    const outData = [];
    Object.entries(groups).forEach(([cable, grp]) => {
      const pos   = [...new Set(grp.map(r=>r.POSITION))].filter(v=>v!=null);
      const kam   = [...new Set(grp.map(r=>r.KAMMERNR))].filter(v=>v!=null).map(String);
      const mat   = [...new Set(grp.map(r=>r.MATNR))].filter(v=>v!=null);
      const men   = [...new Set(grp.map(r=>String(r.MENGE)))].filter(v=>v!=null);
      const dpg   = grp[0].DPG || '';
      const [c1,c2] = getColors(mat[0]);
      const extra  = mat.slice(4);

      outData.push({
        "Pos Nr. (Côté 1)":  pos[1]||'',
        "DPG (Côté 1)":       +dpg  || '',
        "Matériel (Côté 1)":  '',
        "Kam (Côté 1)":       kam[1]|| '',
        "Cosse (Côté 1)":     mat[mat.length-1]|| '',
        "Tulle (Côté 1)":     '',
        "Câble":              cable,
        "Matériel":           mat[0]|| '',
        "section":            '',
        "Longueur (mm)":      men[0]|| '',
        "Couleur1":           c1,
        "Couleur2":           c2,
        "Pos Nr. (Côté 2)":   pos[0]|| '',
        "Matériel (Côté 2)":  extra[0]|| '',
        "Kam (Côté 2)":       kam[0]|| '',
        "Cosse (Côté 2)":     mat[2]|| '',
        "Tulle (Côté 2)":     mat[1]|| ''
      });
    });

    // 6) Hand back to parent
    onDataReady(outData);
  };

  return (
    <form onSubmit={loadAndProcess}>
      <input type="file" accept=".xlsx" onChange={onFileChange} />
      {fileName && <span style={{ marginLeft: 8 }}>{fileName}</span>}
      <button type="submit" style={{ marginLeft: 12 }}>
        Load &amp; Preview
      </button>
    </form>
  );
}
