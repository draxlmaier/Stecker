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

    // 1) load workbook & sheet
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0];

    // 2) header → col map
    const H = {};
    ws.getRow(1).eachCell((cell, idx) => {
      const t = (cell.value || "").toString().trim();
      if (t) H[t] = idx;
    });

    // 3) read raw rows
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

    // 4) filter + group by cable
    const byCable = {};
    raw
      .filter(r => Number(r.KSTST) === 3211 && r.MENGE !== 0 && r.MATNR != null)
      .forEach(r => {
        (byCable[r.KABEL] ||= []).push(r);
      });

    // 5) sort each group by POSITION (so the main conductor is first)
    Object.values(byCable).forEach(grp => {
      grp.sort((a, b) =>
        (a.POSITION || "").localeCompare(b.POSITION || "")
      );
    });

    // 6) build final out array
    const out = [];
    Object.entries(byCable).forEach(([cable, grp]) => {
      // --- main conductor info ---
      const main = grp[0];
      const mainMat = main.MATNR;
      const [c1, c2] = getColors(mainMat);
      const length   = main.MENGE;
      const dpg      = main.DPG;

      // --- find by prefix in entire group ---
      // side‐1 cosse = last "A…" entry
      const allMats = grp.map(r => r.MATNR);
      const cos1Mat = allMats.slice().reverse().find(m => m.startsWith("A")) || "";
      // side‐1 tulle = first "T…" entry
      const tul1Mat = allMats.find(m => m.startsWith("T")) || "";
      // find the row where cos1 lives, to get Pos1/Kam1
      const cos1Row = grp.find(r => r.MATNR === cos1Mat) || {};
      const pos1    = cos1Row.POSITION  || "";
      const kam1    = cos1Row.KAMMERNR  || "";

      // side‐2 matériel = first "G…" entry
      const mat2 = allMats.find(m => m.startsWith("G")) || "";
      // side‐2 cosse = first "A…" after mainMat
      const cos2Mat = allMats.find(m => m.startsWith("A") && m !== cos1Mat) || "";
      // side‐2 tulle = first "T…" entry (same rule as 1)
      const tul2Mat = tul1Mat;
      // side‐2 Pos/Kam = the first non‐empty POSITION row that isn't main
      const pos2Row = grp.find(r => r.POSITION && r.POSITION !== main.POSITION) || {};
      const pos2    = pos2Row.POSITION  || "";
      const kam2    = pos2Row.KAMMERNR  || "";

      out.push({
        "Pos Nr. (Côté 1)" : pos1,
        "DPG (Côté 1)"     : dpg,
        "Matériel (Côté 1)": "",
        "Kam (Côté 1)"     : kam1,
        "Cosse (Côté 1)"   : cos1Mat,
        "Tulle (Côté 1)"   : tul1Mat,

        "Câble"            : cable,
        "Matériel"         : mainMat,
        "section"          : "",
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

    // 7) derive module & stand
    const fp = raw[0].FPNR.toString();
    const moduleCode = fp.slice(0, -3);
    const stand      = fp.slice(-3);

    onDataReady({ module: moduleCode, stand, rows: out });
  };

  return (
    <form onSubmit={loadAndProcess}>
      <input type="file" accept=".xlsx" onChange={onFileChange}/>
      {name && <span style={{ marginLeft:8 }}>{name}</span>}
      <button type="submit" style={{ marginLeft:12 }}>
        Load &amp; Preview
      </button>
    </form>
  );
}
