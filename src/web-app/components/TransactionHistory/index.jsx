import React, { useEffect, useState, useRef } from 'react';
import { ProcessType } from '../../../ts/events';
import { rightArrowSvg, leftArrowSvg } from '../../assets/svg';
import TransactionItem from './TransactionItem';
import Tabstrip from '../Tabstrip';
import Empty from '../Empty';
import { useSelector, useDispatch } from 'react-redux';
import {updateTerminalHeight} from '../../store/reducers/terminal'

function TransactionHistory(props) {
  const { terminalHeight } = useSelector((state) => state.terminal);
  const dispatch = useDispatch();
  const [transactionList, setTransactionList] = useState([]);
  const [messageList, setMessageList] = useState([]);
  const [tabs] = useState([{ name: 'Transactions' }, { name: 'Messages' }]);
  const [activeTab, setActiveTab] = useState({ name: 'Transactions' });
  const componentRef = useRef(null);
  const [startY, setStartY] = useState(0);
  const [height, setHeight] = useState(150);
  const minHeight = 38;
  const maxHeight = 690;

  const transactionProcess = ProcessType.TRANSACTION;

  useEffect(() => {
    const unsubscribe = window.electron.on(transactionProcess.updateEvent, (msg) => {
      if (!Array.isArray(msg)) {
        let index = transactionList.findIndex((e) => e.signature === msg.signature);
        if (index === -1) {
          setTransactionList((prevList) => [msg, ...prevList]);
        } else {
          let newList = [...transactionList];
          newList.splice(index, 1);
          setTransactionList([msg, ...newList]);
        }
      } else {
        setTransactionList(msg);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [transactionList]);

  useEffect(() => {
    const handleResize = () => {
      props.onWindowResize(height);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [height]);

  const handleDragStart = (event) => {
    setStartY(event.clientY);
    const img = new Image();
    img.src = '';
    event.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDrag = (event) => {
    const distanceDragged = event.clientY - startY;
    if (height - distanceDragged > minHeight && height - distanceDragged < maxHeight) {
      if (componentRef.current) {
        props.onResize(distanceDragged);
        dispatch(updateTerminalHeight(height - distanceDragged))
        componentRef.current.style.height = `${height - distanceDragged}px`;
        componentRef.current.style.maxHeight = `${height - distanceDragged}px`;
      }
    }
  };

  const handleDragEnd = (event) => {
    const distanceDragged = event.clientY - startY;
    if (height - distanceDragged > minHeight && height - distanceDragged < maxHeight) {
      props.onResizeEnd(distanceDragged);
      dispatch(updateTerminalHeight(height - distanceDragged))
      setHeight((prev) => prev - distanceDragged);
    }
    if (height - distanceDragged < minHeight) {
      props.onResizeEnd(height - minHeight);
      dispatch(updateTerminalHeight(minHeight))
      setHeight(minHeight);
    }
    if (height - distanceDragged > maxHeight) {
      props.onResizeEnd(height - maxHeight);
      dispatch(updateTerminalHeight(maxHeight))
      setHeight(maxHeight);
    }
  };

  return (
    <div className="right-section" style={{ height: `${height}px`, maxHeight: `${height}px` }} ref={componentRef}>
      <div
        className="topper"
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDrag={handleDrag}
      ></div>
      <Tabstrip
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
        }}
      ></Tabstrip>
      <div className="content">
        {activeTab.name === 'Transactions' && (
          <>
            <div className={`transaction-item header`}>
              <div className="status">Status</div>
              <div className="time">Time</div>
              <div className="signature truncate">Signature</div>
              <div className="signature truncate">From</div>
              <div className="value">Value (SOL)</div>
              <div className="view">View</div>
            </div>
            {transactionList.length > 0 ? (
              transactionList.map(
                (tr) =>
                  tr && (
                    <TransactionItem
                      key={tr.signature}
                      status={tr.status}
                      value={tr.value}
                      signature={tr.signature}
                      date={tr.date}
                    ></TransactionItem>
                  )
              )
            ) : (
              <Empty text="No transactions"></Empty>
            )}
          </>
        )}
        {activeTab.name === 'Messages' && (
          <>
            <div className={`transaction-item header`}>
              <div className="status">Status</div>
              <div className="time">Time</div>
              <div className="signature truncate">Signature</div>
              <div className="signature truncate">From</div>
              <div className="value">Value (SOL)</div>
              <div className="view">View</div>
            </div>
            {messageList.length > 0 ? (
              messageList.map(
                (tr) =>
                  tr && (
                    <TransactionItem
                      key={tr.signature}
                      status={tr.status}
                      value={tr.value}
                      signature={tr.signature}
                      date={tr.date}
                    ></TransactionItem>
                  )
              )
            ) : (
              <Empty text="No messages"></Empty>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TransactionHistory;
