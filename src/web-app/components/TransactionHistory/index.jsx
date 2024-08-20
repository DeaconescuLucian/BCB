import React, { useEffect, useState } from 'react';
import { ProcessType } from '../../../ts/events';
import { rightArrowSvg, leftArrowSvg} from '../../assets/svg';
import TransactionItem from './TransactionItem';

function TransactionHistory() {
  const [hidden, setHidden] = useState(false);
  const [transactionList, setTransactionList] = useState([]);

  const transactionProcess = ProcessType.TRANSACTION;

  useEffect(() => {
    const unsubscribe = window.electron.on(transactionProcess.updateEvent, (msg) => {
      if(!Array.isArray(msg))
        {
          setTransactionList((prevList) => [msg, ...prevList]);
        }
        else
        {
          setTransactionList(msg);
        }
    });

    return () => {
      unsubscribe();
    }
  }, []);

  useEffect(() => {
    handleStartBackgroundProcess();
  }, []);

  const handleStartBackgroundProcess = async () => {
    const response = await window.electron.invoke(transactionProcess.startEvent, undefined);
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
              tr &&
              <TransactionItem
                key={tr.signature}
                status={tr.status}
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
