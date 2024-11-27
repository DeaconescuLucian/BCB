import React, { useState, useEffect, useRef } from 'react';
import { CustomEvents } from '../../../../ts/events';
import Loading from '../../../components/Loading';
import { poolSvg, crossSvg } from '../../../assets/svg';
import Switch from '../../../components/Switch';
import Table from '../../../components/Table';
import Empty from '../../../components/Empty';
import { useToast } from '../../../contexts/ToastContext';

const NPDCProcess = (props) => {
  const pageSettings = 'npt-process-settings';
  let NPTSettingsString = window.localStorage.getItem(pageSettings);
  let NPTSettings = null;
  if (NPTSettingsString) {
    NPTSettings = JSON.parse(NPTSettingsString);
  }

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const { showToast } = useToast();
  const { loadingParentRef } = useRef(null);
  const [pools, setPools] = useState([]);
  const [processStatus, setProcessStatus] = useState(!!props.data.isActive);

  const trackedPoolsColumns = [
    {
      name: 'Address',
      propertyName: 'poolId',
      percentWidth: 35,
      canCopy: true,
    },
    {
      name: 'Base Mint',
      propertyName: 'baseMint',
      percentWidth: 35,
      canCopy: true,
    },
    {
      name: 'Quote Mint',
      propertyName: 'quoteMint',
      percentWidth: 30,
      canCopy: true,
    },
  ];

  const loadData = async () => {
    setLoading(true);
    setLoadingMessage('Retrieving data...');
    const result = await window.electron.invoke(CustomEvents.getDataCollectProcessDetailsEvent, props.data.id);
    if (result) {
      setPools(result.data.pools);
      setLoading(false);
    }
  };

  const startStopProcess = async (status) => {
    setLoading(true);
    if (status) {
      setLoadingMessage('Starting process...');
      const result = await window.electron.invoke(CustomEvents.startDataCollectProcessEvent, props.data.id);
      if (result) {
        if (result.success) {
          setProcessStatus(status);
          showToast('Process started', 'success');
        } else {
          showToast("Couldn't start process", 'fail');
        }
        setLoading(false);
      }
    } else {
      setLoadingMessage('Stopping process...');
      const result = await window.electron.invoke(CustomEvents.stopDataCollectProcessEvent, props.data.id);
      if (result) {
        showToast('Process stopped', 'success');
        setProcessStatus(status);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    window.electron.invoke(CustomEvents.viewDataCollectProcessEvent, props.data.id);
    loadData();
    const unsubscribeUpdateTrackEvent = window.electron.on(CustomEvents.updateDataCollectProcessEvent, (msg) => {
      if (msg.updateType === 'dataCollectorDataUpdate') {
        setPools(msg.pools);
      }
    });

    return () => {
      window.electron.invoke(CustomEvents.viewDataCollectProcessEvent, '');
      unsubscribeUpdateTrackEvent();
    };
  }, []);

  return (
    <div className={`npt-process`} ref={loadingParentRef}>
      <div className="top-panel">
        <div className="left-side">
          <div className="row">
            <span className="title">{props.data.processType} </span>
          </div>
          <div className="row">
            {' '}
            <span>{poolSvg}</span>
            <span>Pools tracked: {props.data.poolNo}</span>
          </div>
        </div>
        <div className="right-side">
          <div className="row">
            <span className={props.data.isActive ? 'status profit' : 'status idle'}>
              {props.data.isActive ? 'Running' : 'Idle'}
            </span>
          </div>
          <div className="row">
            <Switch
              onChange={() => {
                startStopProcess(!processStatus);
              }}
              theme="process-status"
              value={processStatus}
            ></Switch>
          </div>
        </div>
      </div>
      {pools?.length > 0 ? (
        <Table
          columns={trackedPoolsColumns}
          rows={pools}
          actions={[]}
          pagination={{ pageSizes: [10, 20, 30, 40] }}
          constantlyUpdated={true}
        ></Table>
      ) : (
        <Empty text={'No pools tracked yet.'}></Empty>
      )}
      {loading && <Loading text={loadingMessage} parentRef={loadingParentRef}></Loading>}
    </div>
  );
};

export default NPDCProcess;
