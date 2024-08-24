import React, { useState } from 'react';
import CopyToClipboard from '../CopyToClipboard';

interface IColumn {
  name: string;
  propertyName: string;
  percentWidth: number;
  canCopy?: boolean;
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
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th
              style={{
                width: `calc(${column.percentWidth}% - 10px)`,
                minWidth: `calc(${column.percentWidth}% - 10px)`,
              }}
              key={`col-${index}`}
            >
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
                  <>
                    {column.canCopy ? (
                      <td
                        style={{
                          width: `calc(${column.percentWidth}% - 10px)`,
                          minWidth: `calc(${column.percentWidth}% - 10px)`,
                        }}
                        key={`cell-${index}-${index1}`}
                        className="copy-column"
                      >
                        <span>{row[column.propertyName]}</span>
                        <CopyToClipboard text={row[column.propertyName]}></CopyToClipboard>
                      </td>
                    ) : (
                      <td
                        style={{
                          width: `calc(${column.percentWidth}% - 10px)`,
                          minWidth: `calc(${column.percentWidth}% - 10px)`,
                        }}
                        key={`cell-${index}-${index1}`}
                      >
                        {row[column.propertyName]}
                      </td>
                    )}
                  </>
                )
            )}
            {actions ? (
              <td
                key={`action-cell-${index}`}
                className="action-cell"
                style={{
                  width: `calc(${columns[columns.length - 1].percentWidth}% - 10px)`,
                  minWidth: `calc(${columns[columns.length - 1].percentWidth}% - 10px)`,
                }}
              >
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
