import React, { useState, useEffect, useRef } from 'react';
import { CustomEvents } from '../../../../ts/events';
import Loading from '../../../components/Loading';
import { walletSvg, profitSvg, lossSvg, pendingSvg, successSvg, warningSvg, crossSvg } from '../../../assets/svg';
import Switch from '../../../components/Switch';
import Tabstrip from '../../../components/Tabstrip';
import Table from '../../../components/Table';
import Empty from '../../../components/Empty';
import { timeAgo } from '../../../utils';
import CopyToClipboard from '../../../components/CopyToClipboard';
import { useToast } from '../../../contexts/ToastContext';

const NPTProcess = (props) => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const {showToast} = useToast();
  const { loadingParentRef } = useRef(null);
  const [pools, setPools] = useState([]);
  const [settings, setSettings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [positions, setPositions] = useState([]);
  const [processStatus, setProcessStatus] = useState(!!props.data.isActive);

  const [tabs] = useState([
    { name: 'Tracked Pools', url: '/track-process' },
    { name: 'Positions', url: '/track-process' },
    { name: 'Transactions', url: '/track-process' },
    { name: 'Settings', url: '/track-process' },
  ]);
  const [activeTab, setActiveTab] = useState({ name: 'Tracked Pools', url: '/track-process' });
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [actions, setActions] = useState([]);
  const [tableType, setTableType] = useState({
    name: 'Tracked Pools',
    type: 'tracked-pools',
    noData: 'No tracked pools found',
  });

  const tableTypes = {
    trackedPools: {
      name: 'Tracked Pools',
      type: 'tracked-pools',
      noData: 'No tracked pools found',
    },
    positions: {
      name: 'Positions',
      type: 'positions',
      noData: 'No positions found',
    },
    transactions: {
      name: 'Transactions',
      type: 'transactions',
      noData: 'No transactions found',
    },
    settings: {
      name: 'Settings',
      type: 'settings',
      noData: 'No settingss found',
    },
  };

  const trackedPoolsColumns = [
    {
      name: 'Address',
      propertyName: 'poolId',
      percentWidth: 30,
      canCopy: true,
    },
    {
      name: 'Base Mint',
      propertyName: 'baseMint',
      percentWidth: 30,
      canCopy: true,
    },
    {
      name: 'Quote Mint',
      propertyName: 'quoteMint',
      percentWidth: 30,
      canCopy: true,
    },
    {
      name: 'Actions',
      propertyName: null,
      percentWidth: 10,
    },
  ];

  const positionsColumns = [
    {
      name: 'Address',
      propertyName: 'mint',
      percentWidth: 30,
      canCopy: true,
    },
    {
      name: 'Amount',
      propertyName: 'amount',
      percentWidth: 10,
    },
    {
      name: 'Starting Price',
      propertyName: 'startingPrice',
      percentWidth: 10,
    },
    {
      name: 'Current Price',
      propertyName: 'currentPrice',
      percentWidth: 10,
    },
    {
      name: 'Exit Price',
      propertyName: 'exitPrice',
      percentWidth: 10,
    },
    {
      name: 'Status',
      propertyName: 'status',
      percentWidth: 10,
    },
    {
      name: 'Pct',
      propertyName: 'percentage',
      percentWidth: 10,
      template: (value) => {
        return (
          <span className={value !== 100 ? value > 100 ? 'profit' : 'loss' : ''}>
            {value}%{value !== 100 ? value > 100 ? profitSvg : lossSvg : ''}
          </span>
        )
      } 
    },
    {
      name: 'Actions',
      propertyName: null,
      percentWidth: 10,
    },
  ];
  const transactionsColumns = [
    {
      name: 'Signature',
      propertyName: 'signature',
      percentWidth: 20,
      canCopy: true,
    },
    {
      name: 'From',
      propertyName: 'from',
      percentWidth: 20,
      canCopy: true,
    },
    {
      name: 'Status',
      propertyName: 'status',
      percentWidth: 20,
      template: (value) => {
        return (
          <span className={value !== 'pending' ? value === 'success' ? 'profit' : 'loss' : 'idle'}>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{value !== 'pending' ? value === 'success' ? successSvg : warningSvg : pendingSvg}
          </span>
        )
      } 
    },
    {
      name: 'Value',
      propertyName: 'value',
      percentWidth: 20,
    },
    {
      name: 'Time',
      propertyName: 'time',
      percentWidth: 20,
    },
  ];
  const settingsColumns = [
    {
      name: 'Setting',
      propertyName: 'name',
      percentWidth: 50,
    },
    {
      name: 'Value',
      propertyName: 'value',
      percentWidth: 50,
    },
  ];

  const positionsActions = [
    {
      name: 'Close Position',
      icon: crossSvg,
      action: (r) => {
        //close position
      },
    }
  ];

  const trackedPoolsActions = [
    {
      name: 'Untrack pool',
      icon: crossSvg,
      action: (r) => {
        //close position
      },
    }
  ]

  const updateTableData = () => {
    switch (activeTab.name) {
      case 'Tracked Pools':
        setColumns(trackedPoolsColumns);
        setActions(trackedPoolsActions);
        setTableData(pools);
        setTableType(tableTypes.trackedPools);
        break;
      case 'Positions':
        setColumns(positionsColumns);
        setActions(positionsActions);
        setTableData(positions);
        setTableType(tableTypes.positions);
        break;
      case 'Transactions':
        setColumns(transactionsColumns);
        setActions(null);
        setTableData(transactions);
        setTableType(tableTypes.transactions);
        break;
      case 'Settings':
        setColumns(settingsColumns);
        setActions(null);
        setTableData(settings);
        setTableType(tableTypes.settings);
        break;
      default:
        break;
    }
  };

  const loadData = async () => {
    setLoading(true);
    setLoadingMessage('Retrieving data...')
    const result = await window.electron.invoke(CustomEvents.getTrackProcessDetailsEvent, props.data.id);
    if (result) {
      setPools(result.data.pools);
      setSettings([...result.data.settings, ...result.data.poolFilters]);
      setTransactions(
        result.data.transactions.map((e) => {
          return {
            ...e,
            value: Number(e.value.toFixed(4)),
            time: timeAgo(e.time),
          };
        })
      );
      setPositions(
        result.data.positions.map((e) => {
          return {
            ...e,
            percentage:
              e.status === 'open'
                ? Number(((e.currentPrice / e.startingPrice) * 100).toFixed(2))
                : Number(((e.currentPrice / e.exitPrice) * 100).toFixed(2)),
          };
        })
      );
      switch (activeTab.name) {
        case 'Tracked Pools':
          setColumns(trackedPoolsColumns);
          setActions(trackedPoolsActions);
          setTableData(result.data.pools);
          setTableType(tableTypes.trackedPools);
          break;
        case 'Positions':
          setColumns(positionsColumns);
          setActions(positionsActions);
          setTableData(
            result.data.positions.map((e) => {
              return {
                ...e,
                percentage:
                  e.status === 'open'
                    ? Number(((e.currentPrice / e.startingPrice) * 100).toFixed(2))
                    : Number(((e.currentPrice / e.exitPrice) * 100).toFixed(2)),
              };
            })
          );
          setTableType(tableTypes.positions);
          break;
        case 'Transactions':
          setColumns(transactionsColumns);
          setActions(null);
          setTableData(
            result.data.transactions.map((e) => {
              return {
                ...e,
                value: Number(e.value.toFixed(4)),
                time: timeAgo(e.time),
              };
            })
          );
          setTableType(tableTypes.transactions);
          break;
        case 'Settings':
          setColumns(settingsColumns);
          setActions(null);
          setTableData([...result.data.settings, ...result.data.poolFilters]);
          setTableType(tableTypes.settings);
          break;
        default:
          break;
      }
      setLoading(false);
    }
  };

  const startStopProcess = async (status) => {
    setLoading(true);
    if(status)
    {
      setLoadingMessage('Starting process...');
      const result = await window.electron.invoke(CustomEvents.startTrackProcessEvent, props.data.id);
      if (result) {
        if(result.success)
        {
          setProcessStatus(status);
          showToast('Process started', 'success')
        }
        else
        {
          showToast("Couldn't start process", 'fail')
        }
        setLoading(false);
      }
    }
    else
    {
      setLoadingMessage('Stopping process...');
      const result = await window.electron.invoke(CustomEvents.stopTrackProcessEvent, props.data.id);
      if(result)
      {
        setProcessStatus(status);
        setLoading(false);
      }
    }
    
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    updateTableData();
  }, [activeTab]);

  return (
    <div className={`npt-process`} ref={loadingParentRef}>
      <div className="top-panel">
        <div className="left-side">
          <div className="row">
            <span className="title">
              {props.data.processType}{' '}
              {props.data.profit !== 0 ? (
                props.data.profit > 0 ? (
                  <span className="profit">
                    {profitSvg}
                    {Number(props.data.profitPercentage.toFixed(2))}%
                  </span>
                ) : (
                  <span className="loss">
                    {lossSvg} {Number(props.data.profitPercentage.toFixed(2))}%
                  </span>
                )
              ) : (
                ''
              )}
            </span>
          </div>
          <div className="row">
            {' '}
            <span>{walletSvg}</span>
            <span>{props.data.wallet}<CopyToClipboard text={props.data.wallet}/></span>
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
                startStopProcess(!processStatus)
              }}
              theme="process-status"
              value={processStatus}
            ></Switch>
          </div>
        </div>
      </div>
      <Tabstrip
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
        }}
      ></Tabstrip>
      {tableData?.length > 0 ? (
        <Table columns={columns} rows={tableData} actions={actions} pagination={{ pageSizes: [10, 20, 30, 40] }}></Table>
      ) : (
        <Empty text={tableType?.noData}></Empty>
      )}
      {loading && <Loading text={loadingMessage} parentRef={loadingParentRef}></Loading>}
    </div>
  );
};

export default NPTProcess;
