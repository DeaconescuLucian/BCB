import React, { useEffect, useState } from 'react';
import { successSvg, warningSvg, pendingSvg, viewSvg } from '../../assets/svg';
import CopyToClipboard from '../CopyToClipboard/index.tsx';
import { timeAgo } from '../../utils.js';

function TransactionItem(props) {
  const [time, setTime] = useState(timeAgo(props.date));
  const renderIcon = () => {
    switch (props.type) {
      case 'success':
        return successSvg;
      case 'fail':
        return warningSvg;
      case 'pending':
        return pendingSvg;
      default:
        return null;
    }
  };

  setInterval(() => {
    setTime(timeAgo(props.date));
  }, 60000);

  return (
    <div className={`transaction-item ${props.type}`}>
        <div className="view">
            {viewSvg}
        </div>
      <div className="item-content">
        {' '}
        <div className={`status ${props.type}`}>
          <div className="time">{time}</div>
          {renderIcon()}
        </div>
        <div className="info">
          <div className="signature">
            <span className="truncate">{props.signature}</span>
            <CopyToClipboard text={props.signature}></CopyToClipboard>
          </div>
          <div className="value">
            <span>{props.value} SOL</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionItem;
