// src/FileUploader.jsx
import React, { useState } from 'react';
import ExcelJS from 'exceljs';

// color‐map helper
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
  const [file, setFile] = useState(null),
        [name, setName] = useState("");

  const onFileChange = e => {
    const f = e.target.files[0];
    setFile(f || null);
    setName(f ? f.name : "");
  };

  const loadAndProcess = async e => {
    e.preventDefault();
    if (!file) {
      alert("Select an .xlsx first");
      return;
    }

    console.log("📥 Loading file:", name);

    // 1) load workbook & sheet
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0];

    // 2) map headers → columns
    const H = {};
    ws.getRow(1).eachCell((cell, idx) => {
      const t = (cell.value||"").toString().trim();
      if (t) H[t] = idx;
    });
    console.log("🔠 Header map:", H);

    // 3) read raw rows
    const raw = [];
    ws.eachRow({ includeEmpty: false }, (row, rn) => {
      if (rn === 1) return;
      raw.push({
        FPNR:     row.getCell(H["FPNR"]).value,
        KABEL:    row.getCell(H["KABEL"]).value,
        MATNR:    row.getCell(H["MATNR"]).value,
        MENGE:    row.getCell(H["NMENGE"]||H["MENGE"]).value,
        KSTST:    row.getCell(H["FB"]   ||H["KSTST"]).value,
        DPG:      row.getCell(H["DPG"]).value,
        POSITION: row.getCell(H["POSITION"]||H["TEXT1"]).value,
        KAMMERNR: row.getCell(H["KAMMERNR"]||H["BMNR"]).value,
      });
    });
    console.log("🔍 Raw rows:", raw);

    // 4) filter & group by cable
    const byCable = {};
    raw
      .filter(r => Number(r.KSTST) === 3211 && r.MENGE !== 0 && r.MATNR != null)
      .forEach(r => {
        (byCable[r.KABEL] ||= []).push(r);
      });
    console.log("📦 Groups by cable:", byCable);

    // 5) sort each group by POSITION
    Object.values(byCable).forEach(grp =>
      grp.sort((a,b)=> (a.POSITION||"").localeCompare(b.POSITION||""))
    );

    // 6) build builtRows
    const builtRows = [];
    Object.entries(byCable).forEach(([cable, grp]) => {
      const main     = grp[0],
            mainMat  = main.MATNR,
            [c1,c2]  = getColors(mainMat),
            length   = Math.round(main.MENGE * 1000),
            dpg      = main.DPG,
            allMats  = grp.map(r=>r.MATNR);

      // side 1
      const cos1Mat = [...allMats].reverse().find(m=>m.startsWith("A"))||"",
            tul1Mat = allMats.find(m=>m.startsWith("T"))||"",
            cos1Row = grp.find(r=>r.MATNR===cos1Mat)||{},
            pos1    = cos1Row.POSITION||"",
            kam1    = cos1Row.KAMMERNR||"";

      // side 2
      const mat2    = allMats.find(m=>m.startsWith("G"))||"",
            cos2Mat = allMats.find(m=>m.startsWith("A") && m!==cos1Mat)||"",
            tul2Mat = tul1Mat,
            pos2Row = grp.find(r=>r.POSITION && r.POSITION!==main.POSITION)||{},
            pos2    = pos2Row.POSITION||"",
            kam2    = pos2Row.KAMMERNR||"";

      builtRows.push({
        "Pos Nr. (Côté 1)":  pos1,
        "DPG (Côté 1)":      dpg,
        "Matériel (Côté 1)": "",
        "Kam (Côté 1)":      kam1,
        "Cosse (Côté 1)":    cos1Mat,
        "Tulle (Côté 1)":    "",

        "Câble":             cable,
        "Matériel":          mainMat,
        "section":           0.35,
        "Longueur (mm)":     length,

        "Couleur 1":         c1,
        "Couleur 2":         c2,

        "Pos Nr. (Côté 2)":  pos2,
        "Matériel (Côté 2)": mat2,
        "Kam (Côté 2)":      kam2,
        "Cosse (Côté 2)":    cos2Mat,
        "Tulle (Côté 2)":    tul2Mat,
      });
    });
    console.log("🚧 builtRows before swap:", builtRows);

    if (!builtRows.length) {
      alert("No data matched your filters.");
      return;
    }

    // 7) build remarque
    const allMat2  = builtRows.map(r=>r["Matériel (Côté 2)"]).filter(v=>v);
    const uniqueMat2 = Array.from(new Set(allMat2));
    const remarque = uniqueMat2.join(", ");
    console.log("📝 header.remarque =", remarque);

    // 8) special swap
    const SWAP_CODES = ["A3205701","A3212504","A3212503"];
    const rowsFixed = builtRows.map(r => {
    const cosse2 = r["Cosse (Côté 2)"]?.trim();
     if (SWAP_CODES.includes(cosse2)) {
       console.log(`🔄 swapping for MATNR ‘${cosse2}’ on cable ${r.Câble}:`);
       console.log("    before →", {
         pos1:  r["Pos Nr. (Côté 1)"].trim(),
         cos1:  r["Cosse (Côté 1)"],
         pos2:  r["Pos Nr. (Côté 2)"].trim(),
         cos2:  r["Cosse (Côté 2)"]
       });
       const nr = { ...r };
       // swap Pos Nr.
       [ nr["Pos Nr. (Côté 1)"], nr["Pos Nr. (Côté 2)"] ] =
         [ r["Pos Nr. (Côté 2)"], r["Pos Nr. (Côté 1)"] ];
       // swap Cosse
       [ nr["Cosse (Côté 1)"], nr["Cosse (Côté 2)"] ] =
         [ r["Cosse (Côté 2)"], r["Cosse (Côté 1)"] ];
       console.log("    after  →", {
         pos1:  nr["Pos Nr. (Côté 1)"].trim(),
         cos1:  nr["Cosse (Côté 1)"],
         pos2:  nr["Pos Nr. (Côté 2)"].trim(),
         cos2:  nr["Cosse (Côté 2)"]
       });
       return nr;
     }
      return r;
    });
    console.log("✅ rowsFixed after swap:", rowsFixed);

    // 9) derive module & stand
    const fp         = raw[0].FPNR.toString(),
          moduleCode = fp.slice(0,-3),
          stand      = fp.slice(-3);

    // 10) callback
    onDataReady({
      header: {
        module:   moduleCode,
        stand:    stand,
        qs:       "",
        remarque
      },
      rows:        rowsFixed,
      sectionRows: [ { code:"", length:"3.20 (+0.20 / -0.20)" } ]
    });
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
