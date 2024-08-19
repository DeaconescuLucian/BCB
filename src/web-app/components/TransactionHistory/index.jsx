import React, { useEffect, useState } from 'react';
import { ProcessType } from '../../../ts/events';
import { rightArrowSvg, leftArrowSvg, successSvg, warningSvg, pendingSvg } from '../../assets/svg';
import CopyToClipboard from '../CopyToClipboard/index.tsx';
import TransactionItem from './TransactionItem';

function TransactionHistory() {
  const [pid, setPid] = useState(undefined);
  const [hidden, setHidden] = useState(false);
  const [transactionList, setTransactionList] = useState([]);

  const transactionProcess = ProcessType.TRANSACTION;

  useEffect(() => {
    const unsubscribe = window.electron.on(transactionProcess.updateEvent, (msg) => {
      setTransactionList((prevList) => [msg, ...prevList]);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    handleStartBackgroundProcess();
  }, []);

  const handleStartBackgroundProcess = async () => {
    const response = await window.electron.invoke(transactionProcess.startEvent, pid);
    setPid(response.success ? response.data.pid : undefined);
  };

  const hideTransactionHistory = () => {
    setHidden(!hidden);
    if (!hidden) document.querySelector('.main-container').classList.add('hidden-right-section');
    else document.querySelector('.main-container').classList.remove('hidden-right-section');
  };

  return (
    <>
      {hidden ? (
        <div className="right-section-hidden">
          <div className="header">
            <div className="arrow-button" onClick={hideTransactionHistory}>
              {leftArrowSvg}
            </div>
            <span>Transaction history</span>
          </div>
        </div>
      ) : (
        <div className="right-section">
          <div className="header">
            <div className="arrow-button" onClick={hideTransactionHistory}>
              {rightArrowSvg}
            </div>
            <span>Transaction history</span>
          </div>
          <div className="content">
            {transactionList.map((tr) => (
              <TransactionItem
                type={tr.type}
                value={tr.value}
                signature={tr.signature}
                date={tr.date}
              ></TransactionItem>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default TransactionHistory;
