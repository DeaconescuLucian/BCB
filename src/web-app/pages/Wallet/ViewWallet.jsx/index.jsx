import React, { useEffect, useState, useRef } from 'react';
import Table from '../../../components/Table/index.tsx';
import { dexscreenerSvg, purchaseSvg } from '../../../assets/svg/index.jsx';
import Loading from '../../../components/Loading/index.tsx';
import { useSelector, useDispatch } from 'react-redux';
import {
  deselectWallet,
  updateSelectedWallet,
  getWalletDetails,
  fetchWallets,
} from '../../../store//reducers/wallets.js';
import CopyToClipboard from '../../../components/CopyToClipboard/index.tsx';
import SearchBar from '../../../components/SearchBar/index.tsx';
import Button from '../../../components/FormControls/Button.tsx';
import { CustomEvents } from '../../../../ts/events.ts';
import { useToast } from '../../../contexts/ToastContext.tsx';
import Empty from '../../../components/Empty/index.tsx';
import Solscan from '../../../assets/icons/solscan.png';
import DafaultCoin from '../../../assets/icons/coin.png';
import { searchSvg } from '../../../assets/svg/index.jsx';
import { formatNumber, navigateAndSave } from '../../../utils.js';
import { useNavigate } from 'react-router-dom';

function ViewWallet() {
  const tableTypes = {
    token: {
      name: 'Tokens',
      type: 'token',
      totalTemplate: (value) => `Total ${value} token account(s)`,
      noData: 'No token accounts found',
    },
    nft: {
      name: 'NFTs',
      type: 'nft',
      totalTemplate: (value) => `Total ${value} NFT account(s)`,
      noData: 'No NFT accounts found',
    },
    transaction: {
      name: 'Transactions',
      type: 'transaction',
      totalTemplate: (value) => `Total ${value} transaction(s)`,
      noData: 'No transactions found',
    },
  };

  const filterTableData = () => {
    switch (tableType.type) {
      case 'token':
        return selectedWalletAccounts?.filter((e) => e.isNft === 0).map((r) => ({ ...r, expandedAction: '' })) || [];
      case 'nft':
        return selectedWalletAccounts?.filter((e) => e.isNft === 1).map((r) => ({ ...r, expandedAction: '' })) || [];
      case 'transaction':
        return [];
      default:
        return [];
    }
  };

  const tokenColumns = [
    {
      name: 'Mint',
      propertyName: 'mint',
      percentWidth: 40,
      canCopy: true,
    },
    {
      name: 'Token',
      iconProperty: 'icon',
      iconDefault: DafaultCoin,
      propertyName: 'symbol',
      percentWidth: 20,
    },
    {
      name: 'Token Balance',
      propertyName: 'amount',
      percentWidth: 20,
    },
    {
      name: 'Actions',
      propertyName: null,
      percentWidth: 20,
    },
  ];

  const nftColumns = [
    {
      name: 'Mint',
      propertyName: 'mint',
      percentWidth: 40,
      canCopy: true,
    },
    {
      name: 'NFT',
      iconProperty: 'icon',
      propertyName: 'symbol',
      percentWidth: 20,
    },
    {
      name: 'NFT Balance',
      propertyName: 'amount',
      percentWidth: 20,
    },
    {
      name: 'Actions',
      propertyName: null,
      percentWidth: 20,
    },
  ];

  const { selectedWalletDetails, selectedWalletAccounts, wallets } = useSelector((state) => state.wallets);
  const [tableType, setTableType] = useState(tableTypes.token);
  const dispatch = useDispatch();
  const [tableData, setTableData] = useState(() => filterTableData());
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState(tokenColumns);
  const navigate = useNavigate();
  const loadingParentRef = useRef(null);

  useEffect(() => {
    const publicKey = window.location.search.split('=')[1];
    dispatch(deselectWallet());
    dispatch(updateSelectedWallet(publicKey));
    dispatch(getWalletDetails(publicKey));

    return () => {
      dispatch(deselectWallet());
    };
  }, []);

  useEffect(() => {
    switch (tableType.type) {
      case 'token':
        setColumns(tokenColumns);
        break;
      case 'nft':
        setColumns(nftColumns);
        break;
      case 'transaction':
        setColumns([]);
        break;
      default:
        setColumns([]);
        break;
    }
    setTableData(() => filterTableData());
  }, [selectedWalletAccounts, tableType]);

  const handleUpdateWallet = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.updateWalletEvent, {
      publicKey: selectedWalletDetails.publicKey,
      existingMints: selectedWalletAccounts.map((e) => ({ mint: e.mint, icon: e.icon })),
    });
    if (result) {
      if (result.success) {
        dispatch(getWalletDetails(selectedWalletDetails.publicKey));
        dispatch(fetchWallets());
        showToast('Wallet updated successfully', 'success');
      } else {
        showToast(result.error, 'fail');
      }
      setLoading(false);
    }
  };

  const header = selectedWalletDetails && (
    <>
      <div className="overview-panel">
        <h3>Overview</h3>
        <div className="overview-item">
          <span className="label">Alias</span>
          <span className="value  truncate">{selectedWalletDetails.alias}</span>
        </div>
        <div className="overview-item">
          <span className="label">Address</span>
          <span className="value truncate">{selectedWalletDetails.publicKey}</span>
          <CopyToClipboard text={selectedWalletDetails.publicKey}></CopyToClipboard>
        </div>
        <div className="overview-item">
          <span className="label sol">SOL Balance</span>
          <span className="value">{formatNumber(selectedWalletDetails.balance)}</span>
        </div>
        <div className="overview-item">
          <span className="label wsol">WSOL Balance</span>
          <span className="value">
            {formatNumber(
              selectedWalletAccounts?.find((e) => e.mint === 'So11111111111111111111111111111111111111112')?.amount || 0
            )}
          </span>
        </div>
        <div className="overview-item">
          <span className="label">Token Balance</span>
          <span className="value">
            {formatNumber(selectedWalletAccounts?.filter((a) => a.isNft === 0).length || 0)}
          </span>
        </div>
      </div>
      <div className="controls">
        <div className="token-type-selector">
          {Object.values(tableTypes).map((type) => (
            <div
              key={type.type}
              className={`token-type ${tableType.type === type.type ? 'selected' : ''}`}
              onClick={() => setTableType(type)}
            >
              {type.name}
            </div>
          ))}
        </div>
        <Button
          onClick={() => {
            handleUpdateWallet();
          }}
          theme="primary"
          type="reload"
          text="Refresh"
        ></Button>
      </div>
    </>
  );

  const searchBar = (
    <SearchBar
      searchArray={wallets}
      displayTemplate={(wallet) => `alias: ${wallet.alias} (${wallet.publicKey})`}
      matchProperties={[
        { name: 'alias', fullMatch: false },
        { name: 'publicKey', fullMatch: true },
      ]}
      onSearch={(wallet) => {
        navigateAndSave(navigate, `/wallet-page/view?pub=${wallet.publicKey}`);
        dispatch(deselectWallet());
        dispatch(updateSelectedWallet(wallet.publicKey));
        dispatch(getWalletDetails(wallet.publicKey));
      }}
      placeholder="Search wallets by name or public key"
    ></SearchBar>
  );

  return (
    <div className="view-wallet-page" ref={loadingParentRef}>
      {selectedWalletAccounts === null ? (
        <>
          {searchBar}
          {header}
          {selectedWalletDetails && <Loading parentRef={loadingParentRef}></Loading>}
        </>
      ) : (
        <>
          {searchBar}
          {header}
          {tableData.length > 0 ? (
            <>
              <div className="total">
                <span>{tableType.totalTemplate(tableData.length)}</span>
              </div>
              <Table
                columns={columns}
                rows={tableData}
                actions={[
                  {
                    name: 'View in Solscan',
                    image: Solscan,
                    action: (r) => {
                      window.open(`https://solscan.io/token/${r.mint}`, '_blank');
                    },
                  },
                  {
                    name: 'View in Dex Screener',
                    icon: dexscreenerSvg,
                    action: (r) => {
                      window.open(`https://dexscreener.com/solana/${r.mint}`, '_blank');
                    },
                  },
                  {
                    name: 'Trade',
                    icon: purchaseSvg,
                    expandable: true,
                    actions: [
                      {
                        name: 'Buy',
                        action: (r) => {
                          navigateAndSave(
                            navigate,
                            `/trade/buy?pub=${r.publicKey}&mint=${r.mint}`,
                            true
                          );
                        },
                      },
                      {
                        name: 'Sell',
                        action: (r) => {
                          navigateAndSave(
                            navigate,
                            `/trade/sell?pub=${r.publicKey}&mint=${r.mint}`,
                            true
                          );
                        },
                      },
                    ],
                  },
                ]}
                pagination={{ pageSizes: [10, 20, 30, 40] }}
              ></Table>
            </>
          ) : selectedWalletDetails ? (
            <Empty text={tableType.noData}></Empty>
          ) : (
            <div className="empty-page">
              {searchSvg}
              Search an wallet
            </div>
          )}
          {loading && <Loading parentRef={loadingParentRef}></Loading>}
        </>
      )}
    </div>
  );
}

export default ViewWallet;
