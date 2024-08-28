import React, { useEffect, useState } from 'react';
import CopyToClipboard from '../CopyToClipboard';
import { rightSvg, leftSvg, stepForwardSvg, stepBackwardSvg, downSvg } from '../../assets/svg';
import ClickOutside from '../ClickOutside';

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

interface IPagination {
  pageSizes: number[];
}

interface ITable {
  columns: IColumn[];
  rows: IRow[];
  actions?: IAction[];
  pagination?: IPagination;
}

const Table = ({ columns, rows, actions, pagination }: ITable) => {
  const [paginationOptionsHidden, setPaginationOptionsHidden] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pagination?.pageSizes ? pagination.pageSizes[0] : 0);
  const [totalPages, setTotalPages] = useState(pagination?.pageSizes ? Math.ceil(rows.length / pagination.pageSizes[0]) : 0);
  
  useEffect(() => {
    setCurrentPageSize(pagination?.pageSizes ? pagination.pageSizes[0] : 0);
    setCurrentPage(1)
    setTotalPages(pagination?.pageSizes ? Math.ceil(rows.length / pagination.pageSizes[0]) : 0)
  }, rows)
  return (
    <>
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
          {rows.slice((currentPage - 1) * currentPageSize, currentPage * currentPageSize).map((row, index) => (
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
      {pagination && (
        <div className="pagination-container">
          <div className="controls">
            {' '}
            <span>Show</span>
            <div className="pagination-select">
              <div className="pagination-select-button" onClick={() => setPaginationOptionsHidden(false)}>
                <span>{currentPageSize}</span>
                {downSvg}
              </div>
              <ClickOutside onClickOutside={() => setPaginationOptionsHidden(true)}>
                <div className="pagination-select-dropdown" hidden={paginationOptionsHidden}>
                  {pagination.pageSizes?.map((s) => {
                    const pageSizeIndex = pagination.pageSizes.findIndex((p) => p === s);
                    let previousPageSize = 0;
                    if (pageSizeIndex > 0) previousPageSize = pagination.pageSizes[pageSizeIndex - 1];
                    const disabled = previousPageSize > rows.length;
                    return (
                      <div
                        key={`pagesize-option-${s}`}
                        className={`pagination-select-dropdown-option ${disabled ? 'disabled' : ''}`}
                        onClick={() => {
                          if (!disabled) {
                            const newTotalPages = Math.ceil(rows.length / s);
                            const newCurrentPage = Math.ceil(Math.ceil(currentPage * currentPageSize) / s);
                            setPaginationOptionsHidden(true);
                            setCurrentPageSize(s);
                            setCurrentPage(newCurrentPage);
                            setTotalPages(newTotalPages);
                          }
                        }}
                      >
                        {s}
                      </div>
                    );
                  })}
                </div>
              </ClickOutside>
            </div>
            <span>per page</span>
            <div
              className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => {
                setCurrentPage(1);
              }}
            >
              {stepBackwardSvg}
            </div>
            <div
              className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => {
                if (currentPage > 1) setCurrentPage(currentPage - 1);
              }}
            >
              {leftSvg}
            </div>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div
              className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
              onClick={() => {
                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
              }}
            >
              {rightSvg}
            </div>
            <div
              className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
              onClick={() => {
                setCurrentPage(totalPages);
              }}
            >
              {stepForwardSvg}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Table;
