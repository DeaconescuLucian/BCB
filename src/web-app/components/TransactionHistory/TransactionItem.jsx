import React, { useEffect, useState, memo } from 'react';
import { successSvg, warningSvg, pendingSvg, viewSvg } from '../../assets/svg';
import CopyToClipboard from '../CopyToClipboard/index.tsx';
import { timeAgo } from '../../utils.js';

const TransactionItem = memo((props) => {
  const [time, setTime] = useState(timeAgo(props.date));
  const [animation, setAnimation] = useState((new Date() - new Date(props.date)) < 15000);

  useEffect(() => {
    const timeIntervalId = setInterval(() => {
      setTime(timeAgo(props.date));
    }, 60000);

    const animationTimeoutId = setTimeout(() => {
      setAnimation(false);
    }, 20000);

    return () => {
      clearInterval(timeIntervalId);
      clearTimeout(animationTimeoutId);
    }
  }, []);

  const renderIcon = () => {
    switch (props.status) {
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

  return (
    <div className={`transaction-item ${props.status} ${animation ? "animation" : ""}`}>
      <div className="view">{viewSvg}</div>
      <div className="item-content">
        {' '}
        <div className={`status ${props.status}`}>
          <div className="time">{time}</div>
          {renderIcon()}
        </div>
        <div className="info">
          <div className="signature">
            <span className="truncate">{props.signature}</span>
            <CopyToClipboard text={props.signature}></CopyToClipboard>
          </div>
          <div className="value">
            <span>{props.value.toFixed(8)} SOL</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TransactionItem;
