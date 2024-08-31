import React from 'react';

interface IDialog {
  children: JSX.Element | JSX.Element[];
  className?: string;
}

function Dialog(props: IDialog) {
  return (
    <div className="dialog-wrapper">
      <div className={`dialog ${props.className ? props.className : ''}`}>{props.children}</div>
    </div>
  );
}

export default Dialog;
