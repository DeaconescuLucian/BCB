import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ClickOutside from '../ClickOutside';
interface IDialog {
  children: JSX.Element | JSX.Element[];
  className?: string;
  onClose: Function;
}

function Dialog(props: IDialog) {
  const { terminalHeight } = useSelector((state) => state.terminal);
  const [dialogWrapperHeight, setDialogWrapperHeight] = useState(`calc(100vh - ${terminalHeight}px - 30px)`);
  useEffect(() => {
    setDialogWrapperHeight(`calc(100vh - ${terminalHeight}px - 30px)`);
  }, [terminalHeight]);
  return (
    <div className="dialog-wrapper" style={{ height: dialogWrapperHeight }}>
      <ClickOutside onClickOutside={() => {props.onClose()}} className='click-outside-dialog'>
        <div className={`dialog ${props.className ? props.className : ''}`}>{props.children}</div>
      </ClickOutside>
    </div>
  );
}

export default Dialog;
