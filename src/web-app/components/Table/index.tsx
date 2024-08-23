import React, { useState } from 'react';

interface IColumn {
  name: string;
  propertyName: string;
  percentWidth: number;
}

interface IAction {
  name: string;
  icon?: React.JSX.Element;
  action: Function;
}

interface IRow {
  [key: string]: any;
}

interface ITable {
  columns: IColumn[];
  rows: IRow[];
  actions?: IAction[];
}

const Table = ({ columns, rows, actions }: ITable) => {
  console.log(rows);
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th style={{ width: `${column.percentWidth}%`, minWidth: `${column.percentWidth}%` }} key={`col-${index}`}>
              {column.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`row-${index}`}>
            {columns.map(
              (column, index1) =>
                column.propertyName && (
                  <td
                    style={{ width: `${column.percentWidth}%`, minWidth: `${column.percentWidth}%` }}
                    key={`cell-${index}-${index1}`}
                  >
                    {row[column.propertyName]}
                  </td>
                )
            )}
            {actions ? (
              <td key={`action-cell-${index}`} className="action-cell">
                {actions.map((action) => (
                  <span
                    title={action.name}
                    onClick={() => {
                        action.action(row);
                    }}
                  >
                    {action.icon}
                  </span>
                ))}
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
