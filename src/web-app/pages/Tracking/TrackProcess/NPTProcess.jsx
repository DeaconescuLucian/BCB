import React, { useState, useEffect, useRef } from 'react';
import { CustomEvents } from '../../../../ts/events';
import Loading from '../../../components/Loading';
import {
  walletSvg,
  profitSvg,
  lossSvg,
  pendingSvg,
  successSvg,
  warningSvg,
  crossSvg,
  saveSvg,
} from '../../../assets/svg';
import Switch from '../../../components/Switch';
import Tabstrip from '../../../components/Tabstrip';
import Table from '../../../components/Table';
import Empty from '../../../components/Empty';
import { timeAgo } from '../../../utils';
import CopyToClipboard from '../../../components/CopyToClipboard';
import { useToast } from '../../../contexts/ToastContext';
import { updatePageSettings } from '../../../utils';
import { formatTinyNumber, tinyNumber } from '../../../utils';
import Dialog from '../../../components/Dialog';
import Input from '../../../components/FormControls/Input';
import Button from '../../../components/FormControls/Button';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallets } from '../../../store/reducers/wallets';

const NPTProcess = (props) => {
  const pageSettings = 'npt-process-settings';
  let NPTSettingsString = window.localStorage.getItem(pageSettings);
  let NPTSettings = null;
  if (NPTSettingsString) {
    NPTSettings = JSON.parse(NPTSettingsString);
  }

  const dispatch = useDispatch();
  const { wallets } = useSelector((state) => state.wallets);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const { showToast } = useToast();
  const { loadingParentRef } = useRef(null);
  const [pools, setPools] = useState([]);
  const [settings, setSettings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [positions, setPositions] = useState([]);
  const [processStatus, setProcessStatus] = useState(!!props.data.isActive);
  const [totalPct, setTotalPct] = useState(props.data.profitPercentage);
  const [netProfit, setNetProfit] = useState(props.data.profit);
  const [showSaveWalletDialog, setShowSaveWalletDialog] = useState(false);
  const [walletAlias, setWalletAlias] = useState('');
  const [walletAliasError, setWalletAliasError] = useState('Wallet alias must be between 3 and 20 characters long.');

  const [tabs] = useState([
    { name: 'Tracked Pools', url: '/track-process' },
    { name: 'Positions', url: '/track-process' },
    { name: 'Transactions', url: '/track-process' },
    { name: 'Settings', url: '/track-process' },
  ]);
  const [activeTab, setActiveTab] = useState({
    name: NPTSettings?.activeTab || 'Tracked Pools',
    url: '/track-process',
  });
  const [tableData, setTableData] = useState([]);
  const [tableKey, setTableKey] = useState(NPTSettings?.activeTab || 'Tracked Pools');
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
      template: (value) => {
        return (
          <span className={'truncate'}>
            {value ? (value < tinyNumber ? formatTinyNumber(value) : value.toFixed(9)) : '-'}
          </span>
        );
      },
    },
    {
      name: 'Starting Price',
      propertyName: 'startingPrice',
      percentWidth: 10,
      template: (value) => {
        return (
          <span className={'truncate'}>
            {value ? (value < tinyNumber ? formatTinyNumber(value) : value.toFixed(9)) : '-'}
          </span>
        );
      },
    },
    {
      name: 'Current Price',
      propertyName: 'currentPrice',
      percentWidth: 10,
      template: (value) => {
        return (
          <span className={'truncate'}>
            {value ? (value < tinyNumber ? formatTinyNumber(value) : value.toFixed(9)) : '-'}
          </span>
        );
      },
    },
    {
      name: 'Exit Price',
      propertyName: 'exitPrice',
      percentWidth: 10,
      template: (value) => {
        return (
          <span className={'truncate'}>
            {value ? (value < tinyNumber ? formatTinyNumber(value) : value.toFixed(9)) : '-'}
          </span>
        );
      },
    },
    {
      name: 'Status',
      propertyName: 'status',
      percentWidth: 10,
      template: (value) => {
        return (
          <span
            className={
              value === 'open' || value === 'closed'
                ? 'profit'
                : value === 'open fail' || value === 'close fail'
                ? 'loss'
                : 'idle'
            }
          >
            {value}
          </span>
        );
      },
    },
    {
      name: 'Pct',
      propertyName: 'percentage',
      percentWidth: 10,
      template: (value) => {
        return (
          <span className={value && value !== 100 ? (value > 100 ? 'profit' : 'loss') : ''}>
            {value || '-'}
            {value ? '%' : ''}
            {value ? (value !== 100 ? (value > 100 ? profitSvg : lossSvg) : '') : ''}
          </span>
        );
      },
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
      percentWidth: 30,
      canCopy: true,
    },
    {
      name: 'From',
      propertyName: 'from',
      percentWidth: 30,
      canCopy: true,
    },
    {
      name: 'Status',
      propertyName: 'status',
      percentWidth: 10,
      template: (value) => {
        return (
          <span className={value !== 'pending' ? (value === 'success' ? 'profit' : 'loss') : 'idle'}>
            {value} &nbsp;&nbsp;
            {value !== 'pending' ? (value === 'success' ? successSvg : warningSvg) : pendingSvg}
          </span>
        );
      },
    },
    {
      name: 'Value',
      propertyName: 'value',
      percentWidth: 10,
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
    },
  ];

  const trackedPoolsActions = [
    {
      name: 'Untrack pool',
      icon: crossSvg,
      action: (r) => {
        //close position
      },
    },
  ];

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
    setLoadingMessage('Retrieving data...');
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
              e.status === 'open' || e.status === 'close pending' || e.status === 'close fail'
                ? Number(((e.currentPrice / e.startingPrice) * 100).toFixed(2))
                : e.status === 'closed'
                ? Number(((e.exitPrice / e.startingPrice) * 100).toFixed(2))
                : '',
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
                  e.status === 'open' || e.status === 'close pending' || e.status === 'close fail'
                    ? Number(((e.currentPrice / e.startingPrice) * 100).toFixed(2))
                    : e.status === 'closed'
                    ? Number(((e.exitPrice / e.startingPrice) * 100).toFixed(2))
                    : '',
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
    if (status) {
      setLoadingMessage('Starting process...');
      const result = await window.electron.invoke(CustomEvents.startTrackProcessEvent, props.data.id);
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
      const result = await window.electron.invoke(CustomEvents.stopTrackProcessEvent, props.data.id);
      if (result) {
        showToast('Process stopped', 'success');
        setProcessStatus(status);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    window.electron.invoke(CustomEvents.viewTrackProcessEvent, props.data.id);
    loadData();
    const unsubscribeUpdateTrackEvent = window.electron.on(CustomEvents.updateTrackProcessEvent, (msg) => {
      if (msg.updateType === 'processDataUpdate') {
        setPositions(
          msg.positions.map((e) => {
            return {
              ...e,
              percentage:
                e.status === 'open' || e.status === 'close pending' || e.status === 'close fail'
                  ? Number(((e.currentPrice / e.startingPrice) * 100).toFixed(2))
                  : e.status === 'closed'
                  ? Number(((e.exitPrice / e.startingPrice) * 100).toFixed(2))
                  : '',
            };
          })
        );
        setPools(msg.pools);
        setTransactions(
          msg.transactions.map((e) => {
            return {
              ...e,
              value: Number(e.value.toFixed(4)),
              time: timeAgo(e.time),
            };
          })
        );
        setTotalPct(msg.totalPct);
        setNetProfit(msg.netProfit);
        switch (activeTab.name) {
          case 'Tracked Pools':
            setTableData(msg.pools);
            break;
          case 'Positions':
            setTableData(
              msg.positions.map((e) => {
                return {
                  ...e,
                  percentage:
                    e.status === 'open' || e.status === 'close pending' || e.status === 'close fail'
                      ? Number(((e.currentPrice / e.startingPrice) * 100).toFixed(2))
                      : e.status === 'closed'
                      ? Number(((e.exitPrice / e.startingPrice) * 100).toFixed(2))
                      : '',
                };
              })
            );
            break;
          case 'Transactions':
            setTableData(
              msg.transactions.map((e) => {
                return {
                  ...e,
                  value: Number(e.value.toFixed(4)),
                  time: timeAgo(e.time),
                };
              })
            );
            break;
          default:
            break;
        }
      }
    });

    return () => {
      window.electron.invoke(CustomEvents.viewTrackProcessEvent, '');
      unsubscribeUpdateTrackEvent();
    };
  }, [activeTab]);

  useEffect(() => {
    updatePageSettings('activeTab', activeTab.name, pageSettings);
    setTableKey(activeTab.name);
    updateTableData();
  }, [activeTab]);

  const saveWallet = async () => {
    setLoading(true);
    const wallet = await window.electron.invoke(CustomEvents.saveWalletFromTrackProcessEvent, {
      trackProcessId: props.data.id,
      alias: walletAlias,
    });
    if (wallet) {
      showToast('Wallet saved successfully', 'success');
    } else {
      showToast('Error saving wallet', 'fail');
    }
    dispatch(fetchWallets());
    setShowSaveWalletDialog(false);
    setLoading(false);
  };

  const validateWalletAlias = (value) => {
    const errorMessage = 'Wallet alias must be between 3 and 20 characters long.';
    if (value.length < 3 || value.length > 20) {
      setWalletAliasError(errorMessage);
      return errorMessage;
    }
    setWalletAliasError(null);
    return null;
  };

  return (
    <div className={`npt-process`} ref={loadingParentRef}>
      <div className="top-panel">
        <div className="left-side">
          <div className="row">
            <span className="title">
              {props.data.processType}{' '}
              {totalPct !== 0 ? (
                totalPct > 100 ? (
                  <span className="profit">
                    {totalPct ? profitSvg : ''}
                    {totalPct ? `${Number(totalPct?.toFixed(2))} %` : ''}
                  </span>
                ) : (
                  <span className="loss">
                    {totalPct ? lossSvg : ''} {totalPct ? `${Number(totalPct?.toFixed(2))} %` : ''}
                  </span>
                )
              ) : (
                ''
              )}
              {netProfit !== 0 ? (
                netProfit > 0 ? (
                  <span className="profit">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {netProfit ? `+ ${Number(netProfit?.toFixed(9))} SOL` : ''}
                  </span>
                ) : (
                  <span className="loss">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {netProfit ? `${Number(netProfit?.toFixed(9))} SOL` : ''}
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
            <span>
              {props.data.wallet}
              <CopyToClipboard text={props.data.wallet} />
            </span>
            {!wallets.find((w) => w.publicKey === props.data.wallet) && (
              <span
                title="Save wallet"
                className="save-wallet-icon"
                onClick={() => {
                  setShowSaveWalletDialog(true);
                }}
              >
                {saveSvg}
              </span>
            )}
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
      <Tabstrip
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
        }}
      ></Tabstrip>
      {tableData?.length > 0 ? (
        <Table
          key={tableKey}
          columns={columns}
          rows={tableData}
          actions={actions}
          pagination={{ pageSizes: [10, 20, 30, 40] }}
          constantlyUpdated={true}
        ></Table>
      ) : (
        <Empty text={tableType?.noData}></Empty>
      )}
      {loading && <Loading text={loadingMessage} parentRef={loadingParentRef}></Loading>}
      {showSaveWalletDialog && (
        <Dialog className="track-process-save-wallet-dialog" onClose={() => setShowSaveWalletDialog(false)}>
          <div className="track-process-save-wallet-dialog-header">
            <div className="title">
              {' '}
              <span>Save wallet</span>
              <span
                onClick={() => {
                  setShowSaveWalletDialog(false);
                }}
              >
                {crossSvg}
              </span>
            </div>
            <div className="subtitle">
              {' '}
              <span>Select an alias for the wallet</span>
            </div>
          </div>
          <Input
            type="text"
            theme="primary"
            validate={validateWalletAlias}
            onChange={(value) => setWalletAlias(value)}
            value={walletAlias}
            placeholder="Alias"
          ></Input>
          <Button
            theme="primary"
            type="save"
            text="Save wallet"
            onClick={() => {
              saveWallet();
            }}
            disabled={!!walletAliasError}
            tooltipDisabled={walletAliasError}
          ></Button>
        </Dialog>
      )}
    </div>
  );
};

export default NPTProcess;
