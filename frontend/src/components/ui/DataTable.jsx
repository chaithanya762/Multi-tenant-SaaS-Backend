import React from 'react';
import { SkeletonLines } from './Skeleton';
import { Inbox } from 'lucide-react';

export function DataTable({ columns, data, loading, emptyMessage = "No records found" }) {
  if (loading) {
    return <SkeletonLines count={5} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Inbox size={24} />
        </div>
        <div className="empty-state-text">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={row.id || rowIdx}>
              {columns.map((col, colIdx) => (
                <td key={colIdx}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
