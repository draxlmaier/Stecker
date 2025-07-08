import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const colorMap = {
  R: "FF0000", G: "FFFF00", I: "00FF00", H: "808080",
  P: "FFC0CB", C: "A52A2A", B: "0000FF", S: "000000",
  W: "FFFFFF", X: null
};

export default function ExcelExporter({ data }) {
  const download = async () => {
    if (!data || data.length === 0) {
      alert('Nothing to export');
      return;
    }

    const wb = new ExcelJS.Workbook();

    // --- All Groups sheet ---
    const all = wb.addWorksheet('All Groups');
    all.columns = Object.keys(data[0]).map(key => ({
      header: key, key
    }));

    data.forEach((row, i) => {
      all.addRow(row);
      const excelRow = all.getRow(i + 2);
      const mat = row['Matériel'];
      if (mat) {
        const s = String(mat).slice(-3);
        const hex1 = colorMap[s[0]], hex2 = colorMap[s[1]] || hex1;
        if (hex1) excelRow.getCell('Couleur1').fill = {
          type: 'pattern', pattern:'solid', fgColor:{ argb:hex1 }
        };
        if (hex2) excelRow.getCell('Couleur2').fill = {
          type: 'pattern', pattern:'solid', fgColor:{ argb:hex2 }
        };
      }
    });

    // --- Per-DPG sheets ---
    ['1006','4030','4031'].forEach(dpgVal => {
      const subset = data.filter(r => String(r['DPG (Côté 1)']) === dpgVal);
      if (!subset.length) return;
      const ws = wb.addWorksheet(`DPG ${dpgVal}`);
      ws.columns = all.columns;
      subset.forEach((row, i) => {
        ws.addRow(row);
        const excelRow = ws.getRow(i + 2);
        const mat = row['Matériel'];
        if (mat) {
          const s = String(mat).slice(-3);
          const hex1 = colorMap[s[0]], hex2 = colorMap[s[1]] || hex1;
          if (hex1) excelRow.getCell('Couleur1').fill = {
            type:'pattern', pattern:'solid', fgColor:{ argb:hex1 }
          };
          if (hex2) excelRow.getCell('Couleur2').fill = {
            type:'pattern', pattern:'solid', fgColor:{ argb:hex2 }
          };
        }
      });
    });

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `processed_${Date.now()}.xlsx`);
  };

  return (
    <button
      onClick={download}
      disabled={!data || data.length === 0}
      style={{ marginTop: 20 }}
    >
      Download Final Excel
    </button>
  );
}
