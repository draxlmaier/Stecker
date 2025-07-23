// src/ExcelPreviewEditor.jsx
import React from 'react';

export default function ExcelPreviewEditor({
  header,
  rows,
  sectionRows,
  onHeaderChange,
  onRowsChange,
  onSectionChange
}) {
  // fixed 17-column order
  const cols = [
    "Pos Nr. (Côté 1)",
    "DPG (Côté 1)",
    "Matériel (Côté 1)",
    "Kam (Côté 1)",
    "Cosse (Côté 1)",
    "Tulle (Côté 1)",    // ← always blank
    "Câble",
    "Matériel",
    "section",           // ← always 0.35
    "Longueur (mm)",
    "Couleur 1",
    "Couleur 2",
    "Pos Nr. (Côté 2)",
    "Matériel (Côté 2)",
    "Kam (Côté 2)",
    "Cosse (Côté 2)",
    "Tulle (Côté 2)"
  ];

  // header handlers
  const hChange = field => e =>
    onHeaderChange({ ...header, [field]: e.target.value });

  // data row handlers
  const rowChange = (rowIdx, colKey) => e => {
    const updated = rows.map((r, i) =>
      i === rowIdx ? { ...r, [colKey]: e.target.value } : r
    );
    onRowsChange(updated);
  };

  // section handlers
  const secChange = (idx, field) => e => {
    const updated = sectionRows.map((s, i) =>
      i === idx ? { ...s, [field]: e.target.value } : s
    );
    onSectionChange(updated);
  };

  return (
    <div style={{ padding: 10 }}>
      <table border="1" cellPadding="4" cellSpacing="0" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          {/* Row 1 */}
          <tr>
            <th colSpan="5">Module</th>
            <th rowSpan="2" />
            <th colSpan="2">Stand</th>
            <th rowSpan="2" />
            <th colSpan="2">QS</th>
            <th rowSpan="2" />
            <th colSpan="5">Remarque</th>
          </tr>
          {/* Row 2 */}
          <tr>
            <th colSpan="5">
              <input
                style={{ width: '100%' }}
                value={header.module}
                onChange={hChange("module")}
              />
            </th>
            <th colSpan="2">
              <input
                style={{ width: '100%' }}
                value={header.stand}
                onChange={hChange("stand")}
              />
            </th>
            <th colSpan="2">
              <textarea
                rows={3}
                style={{ width: '100%' }}
                value={header.remarque}
                onChange={hChange("remarque")}
              />
            </th>
            <th colSpan="5" />
          </tr>
          {/* Row 3 */}
          <tr>
            <th colSpan="6">Côté 1</th>
            <th>Câble</th>
            <th>Matériel</th>
            <th>section</th>
            <th>Longueur (mm)</th>
            <th>Couleur 1</th>
            <th>Couleur 2</th>
            <th colSpan="5">Côté 2</th>
          </tr>
          {/* Row 4 (column titles) */}
          <tr>
            {cols.map(c => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {cols.map(c => {
                // always‐blank Tulle (Côté 1)
                if (c === "Tulle (Côté 1)") {
                  return (
                    <td key={c}>
                      <input value="" readOnly style={{ width: '100%' }}/>
                    </td>
                  );
                }
                // always‐0.35 section
                if (c === "section") {
                  return (
                    <td key={c}>
                      <input value="0.35" readOnly style={{ width: '100%' }}/>
                    </td>
                  );
                }
                // everything else editable
                return (
                  <td key={c}>
                    <input
                      value={row[c] ?? ""}
                      onChange={rowChange(ri, c)}
                      style={{ width: '100%' }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Section editor */}
      <div style={{ marginTop: '1rem' }}>
        <h3>Longueur de dénudage</h3>
        <button
          onClick={() =>
            onSectionChange([
              ...sectionRows,
              { code: '', length: '3.20 (+0.20 / -0.20)' }
            ])
          }
        >
          + Add Row
        </button>
        <table border="1" cellPadding="4" cellSpacing="0" style={{ borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Length (+/-)</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {sectionRows.map((s, i) => (
              <tr key={i}>
                <td>
                  <input
                    value={s.code}
                    onChange={secChange(i, 'code')}
                    style={{ width: '100%' }}
                  />
                </td>
                <td>
                  <input
                    value={s.length}
                    readOnly
                    style={{ width: '100%' }}
                  />
                </td>
                <td>
                  <button
                    onClick={() =>
                      onSectionChange(sectionRows.filter((_, j) => j !== i))
                    }
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
