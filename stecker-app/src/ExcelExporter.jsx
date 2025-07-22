// src/ExcelExporter.jsx
import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function ExcelExporter({ data }) {
  const { header, rows, sectionRows } = data;

  const download = async () => {
    if (!rows.length) { alert("No data"); return; }

    // 1) Workbook & sheet
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`DPG ${header.stand}`, {
      views: [{ showGridLines: false }]
    });

    // 2) Common styles
    const greyFill = { type:'pattern',pattern:'solid',fgColor:{argb:'FFD3D3D3'} };
    const bold     = { bold:true };
    const center   = { horizontal:'center', vertical:'middle' };
    const thin     = { style:'thin' };

    // 3) Header Row 1
    ws.mergeCells('A1:E1');
    Object.assign(ws.getCell('A1'), {
      value: 'Module', fill: greyFill, font: bold, alignment: center
    });
    ws.mergeCells('F1:F2');
    Object.assign(ws.getCell('F1'), {
      fill: greyFill, font: bold, alignment: center
    });
    ws.mergeCells('G1:H1');
    Object.assign(ws.getCell('G1'), {
      value: 'Stand', fill: greyFill, font: bold, alignment: center
    });
    ws.mergeCells('I1:I2');
    Object.assign(ws.getCell('I1'), {
      value: 'QS', fill: greyFill, font: bold, alignment: center
    });
    ws.mergeCells('J1:L1');
    Object.assign(ws.getCell('J1'), {
      fill: greyFill, font: bold, alignment: center
    });
    ws.mergeCells('M1:Q1');
    Object.assign(ws.getCell('M1'), {
      value: 'Remarque', fill: greyFill, font: bold, alignment: center
    });

    // 4) Header Row 2
    ws.mergeCells('A2:E2');
    ws.getCell('A2').value = header.module;
    ws.mergeCells('G2:H2');
    ws.getCell('G2').value = header.stand;
    ws.getCell('I2').value = header.qs;
    ws.mergeCells('M2:Q2');
    Object.assign(ws.getCell('M2'), {
      value: header.remarque,
      alignment: { wrapText:true, horizontal:'left', vertical:'top' }
    });

    // 5) Header Row 3
    ws.mergeCells('A3:F3');
    Object.assign(ws.getCell('A3'), {
      value: 'Côté 1', fill: greyFill, font: bold, alignment: center
    });
    ['Câble','Matériel','section','Longueur (mm)']
      .forEach((txt,i) =>
        Object.assign(ws.getCell(3, 7 + i), {
          value: txt, fill: greyFill, font: bold, alignment: center
        })
      );
    Object.assign(ws.getCell('K3'), {
      value: 'Couleur 1', fill: greyFill, font: bold, alignment: center
    });
    Object.assign(ws.getCell('L3'), {
      value: 'Couleur 2', fill: greyFill, font: bold, alignment: center
    });
    ws.mergeCells('M3:Q3');
    Object.assign(ws.getCell('M3'), {
      value: 'Côté 2', fill: greyFill, font: bold, alignment: center
    });

    // 6) Header Row 4 — Titles A→Q
    const titles = [
      'Pos Nr. (Côté 1)','DPG (Côté 1)','Matériel (Côté 1)','Kam (Côté 1)','Cosse (Côté 1)','Tulle (Côté 1)',
      'Câble','Matériel','section','Longueur (mm)',
      'Couleur 1','Couleur 2',
      'Pos Nr. (Côté 2)','Matériel (Côté 2)','Kam (Côté 2)','Cosse (Côté 2)','Tulle (Côté 2)'
    ];
    titles.forEach((t,i)=>{
      const c = ws.getRow(4).getCell(i+1);
      c.value = t;
      c.font  = bold;
      c.alignment = center;
    });

    // 7) Column widths & header heights
    [10,6,14,6,8,8, 12,12,10,14, 8,8, 12,12,6,10,12]
      .forEach((w,i)=> ws.getColumn(i+1).width = w);
    [1,2,3,4].forEach(r=> ws.getRow(r).height = 20);

    // 8) Data rows
    rows.forEach((rowData,ri) => {
      const r = ws.getRow(5 + ri);

      titles.forEach((t,i) => {
        const cell = r.getCell(i+1);
        const val  = rowData[t] || "";

        if (t === 'Couleur 1' || t === 'Couleur 2') {
          // fill the color cell
          cell.fill = {
            type:'pattern', pattern:'solid',
            fgColor:{ argb: val || 'FFFFFFFF' }
          };
        } else if (t === 'Longueur (mm)') {
          // number or text
          const n = Number(val);
          cell.value = isNaN(n) ? val : n;
        } else {
          // everything else as straight value
          cell.value = val;
        }
      });
    });

    // 9) Thin borders around the header+data
    const last = 4 + rows.length;
    for (let R = 1; R <= last; R++) {
      for (let C = 1; C <= 17; C++) {
        ws.getCell(R,C).border = { top:thin, left:thin, bottom:thin, right:thin };
      }
    }

    // 10) Section block (Longueur de dénudage)
    const start = last + 3;
    const end   = start + sectionRows.length - 1;
    ws.mergeCells(`A${start}:A${end}`);
    Object.assign(ws.getCell(`A${start}`), {
      value: 'Longueur de\ndénudage',
      font: bold,
      alignment: { wrapText:true, horizontal:'center', vertical:'top' }
    });
    sectionRows.forEach((s,i) => {
      const R = start + i;
      ws.getCell(`B${R}`).value = s.code;
      ws.mergeCells(`C${R}:D${R}`);
      ws.getCell(`C${R}`).value = s.length;
      [1,2,3,4].forEach(c => {
        ws.getCell(R,c).border = { top:thin, left:thin, bottom:thin, right:thin };
      });
    });

    // 11) Export
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `final_${Date.now()}.xlsx`);
  };

  return (
    <button onClick={download} disabled={!rows.length} style={{marginTop:20}}>
      Download Final Excel
    </button>
  );
}
