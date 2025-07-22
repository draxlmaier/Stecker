// src/FileUploader.jsx
import React, { useState } from 'react';
import ExcelJS from 'exceljs';

// color map helper
const colorMap = {
  R: "FF0000", G: "FFFF00", I: "00FF00", H: "808080",
  P: "FFC0CB", C: "A52A2A", B: "0000FF", S: "000000",
  W: "FFFFFF", X: null
};
function getColors(matnr) {
  if (!matnr) return [null, null];
  const s = String(matnr).slice(-3),
        f = s[0], s2 = s[1],
        c1 = colorMap[f],
        c2 = colorMap[s2] || c1;
  return [c1, s2 === "X" ? c1 : c2];
}

export default function FileUploader({ onDataReady }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");

  const onFileChange = e => {
    const f = e.target.files[0];
    setFile(f || null);
    setName(f ? f.name : "");
  };

  const loadAndProcess = async e => {
    e.preventDefault();
    if (!file) return alert("Select an .xlsx first");

    // 1) Load workbook & first sheet
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0];

    // 2) Map headers → column indices
    const H = {};
    ws.getRow(1).eachCell((cell, idx) => {
      const t = (cell.value || "").toString().trim();
      if (t) H[t] = idx;
    });

    // 3) Read raw data rows
    const raw = [];
    ws.eachRow({ includeEmpty: false }, (row, rn) => {
      if (rn === 1) return;
      raw.push({
        FPNR:     row.getCell(H["FPNR"]).value,
        KABEL:    row.getCell(H["KABEL"]).value,
        MATNR:    row.getCell(H["MATNR"]).value,
        MENGE:    row.getCell(H["NMENGE"] || H["MENGE"]).value,
        KSTST:    row.getCell(H["FB"]   || H["KSTST"]).value,
        DPG:      row.getCell(H["DPG"]).value,
        POSITION: row.getCell(H["POSITION"] || H["TEXT1"]).value,
        KAMMERNR: row.getCell(H["KAMMERNR"] || H["BMNR"]).value,
      });
    });

    // 4) Filter where KSTST=3211 and valid
    const byCable = {};
    raw
      .filter(r => Number(r.KSTST) === 3211 && r.MENGE !== 0 && r.MATNR != null)
      .forEach(r => {
        (byCable[r.KABEL] ||= []).push(r);
      });

    // 5) Sort each cable group by POSITION
    Object.values(byCable).forEach(grp =>
      grp.sort((a, b) =>
        (a.POSITION || "").localeCompare(b.POSITION || "")
      )
    );

    // 6) Build out[]
    const out = [];
    Object.entries(byCable).forEach(([cable, grp]) => {
      // main conductor = first row
      const main = grp[0];
      const mainMat = main.MATNR;
      const [c1, c2] = getColors(mainMat);
      const length   = main.MENGE * 1000;       // <-- ×1000
      const dpg      = main.DPG;

      // gather all MATNRs
      const allMats = grp.map(r => r.MATNR);

      // Côté 1:
      //  - cosse1 = last "A…"
      const cos1Mat = allMats.slice().reverse().find(m => m.startsWith("A")) || "";
      //  - tulle1 = first "T…"
      const tul1Mat = allMats.find(m => m.startsWith("T")) || "";
      //  find row for cos1 to get pos1/​kam1
      const cos1Row = grp.find(r => r.MATNR === cos1Mat) || {};
      let pos1 = cos1Row.POSITION || "";
      let kam1 = cos1Row.KAMMERNR || "";

      // Côté 2:
      //  - mat2 = first "G…"
      const mat2   = allMats.find(m => m.startsWith("G")) || "";
      //  - cos2 = first "A…" not used for cos1
      const cos2Mat= allMats.find(m => m.startsWith("A") && m !== cos1Mat) || "";
      //  - tulle2 = same tulle1Mat
      const tul2Mat= tul1Mat;
      //  - pos2/​kam2 = first non-main POSITION row
      const pos2Row= grp.find(r => r.POSITION && r.POSITION !== main.POSITION) || {};
      let pos2 = pos2Row.POSITION || "";
      let kam2 = pos2Row.KAMMERNR || "";

      // Build the row object
      out.push({
        "Pos Nr. (Côté 1)" : pos1,
        "DPG (Côté 1)"     : dpg,
        "Matériel (Côté 1)": "",
        "Kam (Côté 1)"     : kam1,
        "Cosse (Côté 1)"   : cos1Mat,
        "Tulle (Côté 1)"   : tul1Mat,

        "Câble"            : cable,
        "Matériel"         : mainMat,
        "section"          : 0.35,       // <-- default 0.35
        "Longueur (mm)"    : length,

        "Couleur 1"        : c1,
        "Couleur 2"        : c2,

        "Pos Nr. (Côté 2)": pos2,
        "Matériel (Côté 2)": mat2,
        "Kam (Côté 2)"    : kam2,
        "Cosse (Côté 2)"  : cos2Mat,
        "Tulle (Côté 2)"  : tul2Mat,
      });
    });

    if (!out.length) {
      return alert("No data matched your filters.");
    }

    // 7) Build "remarque" = comma-joined all Matériel (Côté 2)
    const allMat2 = out.map(r => r["Matériel (Côté 2)"]).filter(v => v);
    const remarque = allMat2.join(", ");

    // 8) Swap logic for certain Pos Nr. (Côté 2) codes
    const swapKeys = ["A3205701","A3212504","A3212503"];
    const rowsFixed = out.map(r => {
      if (swapKeys.includes(r["Pos Nr. (Côté 2)"])) {
        // swap Pos Nr.
        [r["Pos Nr. (Côté 1)"], r["Pos Nr. (Côté 2)"]] =
          [r["Pos Nr. (Côté 2)"], r["Pos Nr. (Côté 1)"]];
        // swap Cosse
        [r["Cosse (Côté 1)"], r["Cosse (Côté 2)"]] =
          [r["Cosse (Côté 2)"], r["Cosse (Côté 1)"]];
      }
      return r;
    });

    // 9) Derive module & stand
    const fp = raw[0].FPNR.toString();
    const moduleCode = fp.slice(0, -3);
    const stand      = fp.slice(-3);

    // 10) Notify parent with everything
    onDataReady({
      module: moduleCode,
      stand,
      rows: rowsFixed,
      remarque,
      sectionRows: [
        { code: "", length: "3.20 (+0.20 / -0.20)" }
      ]
    });
  };

  return (
    <form onSubmit={loadAndProcess}>
      <input type="file" accept=".xlsx" onChange={onFileChange}/>
      {name && <span style={{ marginLeft: 8 }}>{name}</span>}
      <button type="submit" style={{ marginLeft: 12 }}>
        Load & Preview
      </button>
    </form>
  );
}
