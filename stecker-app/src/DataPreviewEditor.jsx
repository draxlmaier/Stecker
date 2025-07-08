import React from 'react';

export default function DataPreviewEditor({ data, onChange }) {
  const cols = Object.keys(data[0] || {});

  const updateCell = (rowIdx, colKey, value) => {
    const newData = data.map((row, i) =>
      i === rowIdx ? { ...row, [colKey]: value } : row
    );
    onChange(newData);
  };

  return (
    <div style={{ overflowX: 'auto', marginTop: 20 }}>
      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          minWidth: 800
        }}
        border="1"
        cellPadding="4"
      >
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c} style={{ background: '#eee' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, r) => (
            <tr key={r}>
              {cols.map(c => (
                <td key={c}>
                  <input
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={row[c] ?? ''}
                    onChange={e => updateCell(r, c, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
