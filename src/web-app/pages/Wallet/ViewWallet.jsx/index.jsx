import React, { useEffect, useState } from 'react';
import Table from '../../../components/Table/index.tsx';
import { viewSvg } from '../../../assets/svg/index.jsx';
import Loading from '../../../components/Loading/index.tsx';
import { useSelector, useDispatch } from 'react-redux';
import { deselectWallet, updateSelectedWallet, getWalletDetails, fetchWallets, updateWallets } from '../../../store//reducers/wallets.js';
import CopyToClipboard from '../../../components/CopyToClipboard/index.tsx';
import SearchBar from '../../../components/SearchBar/index.tsx';
import Button from '../../../components/FormControls/Button.tsx';
import { CustomEvents } from '../../../../ts/events.ts';
import { useToast } from '../../../contexts/ToastContext.tsx';

function ViewWallet() {
  const { selectedWalletDetails, selectedWalletAccounts, wallets, status } = useSelector((state) => state.wallets);
  const [tokenType, setTokenType] = useState('token');
  const dispatch = useDispatch();
  const [tableData, setTableData] = useState(
    tokenType === 'token'
      ? selectedWalletAccounts?.filter((e) => e.isNft === 0) || []
      : selectedWalletAccounts?.filter((e) => e.isNft === 1) || []
  );
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      name: 'Account',
      propertyName: 'accountAddress',
      percentWidth: 40,
      canCopy: true,
    },
    {
      name: 'Token',
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

  useEffect(() => {
    return () => {
      dispatch(deselectWallet());
    };
  }, []);

  useEffect(() => {
    console.log("Updated wallet details")
  }, [selectedWalletDetails]);

  useEffect(() => {
    setTableData(
      tokenType === 'token'
        ? selectedWalletAccounts?.filter((e) => e.isNft === 0) || []
        : selectedWalletAccounts?.filter((e) => e.isNft === 1) || []
    );
  }, [selectedWalletAccounts]);

  const handleUpdateWallet = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.updateWalletEvent, selectedWalletDetails.publicKey);
    if (result.success) {
      dispatch(getWalletDetails(selectedWalletDetails.publicKey));
      dispatch(fetchWallets());
      showToast("Wallet updated successfully", 'success');
      setLoading(false);
    } else {
      showToast(result.error, 'fail');
    }
  };

  return (
    <div className="view-wallet-page">
      {selectedWalletAccounts === null ? (
        <>
          <SearchBar
            searchArray={wallets}
            displayTemplate={(wallet) => `alias: ${wallet.alias} (${wallet.publicKey})`}
            matchProperties={[
              { name: 'alias', fullMatch: false },
              { name: 'publicKey', fullMatch: true },
            ]}
            onSearch={(wallet) => {
              dispatch(deselectWallet());
              dispatch(updateSelectedWallet(wallet.publicKey));
              dispatch(getWalletDetails(wallet.publicKey));
            }}
          ></SearchBar>
          {loading && <Loading></Loading>}
        </>
      ) : (
        <>
          <SearchBar
            searchArray={wallets}
            displayTemplate={(wallet) => `alias: ${wallet.alias} (${wallet.publicKey})`}
            matchProperties={[
              { name: 'alias', fullMatch: false },
              { name: 'publicKey', fullMatch: true },
            ]}
            onSearch={(wallet) => {
              dispatch(deselectWallet());
              dispatch(updateSelectedWallet(wallet.publicKey));
              dispatch(getWalletDetails(wallet.publicKey));
            }}
          ></SearchBar>
          {loading ? (
            <Loading></Loading>
          ) : (
            <>
              {' '}
              {selectedWalletDetails && (
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
                    <span className="label">SOL Balance</span>
                    <span className="value">{selectedWalletDetails.balance}</span>
                  </div>
                  <div className="overview-item">
                    <span className="label">Token Balance</span>
                    <span className="value">{selectedWalletAccounts.filter((a) => a.isNft === 0).length}</span>
                  </div>
                </div>
              )}
              <div className="token-type-selector">
                <div
                  className={`token-type ${tokenType === 'token' ? 'selected' : ''}`}
                  onClick={() => setTokenType('token')}
                >
                  Tokens
                </div>
                <div
                  className={`token-type ${tokenType === 'nft' ? 'selected' : ''}`}
                  onClick={() => setTokenType('nft')}
                >
                  NFTs
                </div>
              </div>
              {tableData.length > 0 ? (
                <>
                  <div className="total">
                    <span>{`Total ${tableData.length} ${tokenType} account(s)`}</span>
                    <Button
                      onClick={() => {
                        handleUpdateWallet();
                      }}
                      theme="primary"
                      type="reload"
                      text="Refresh wallet data"
                    ></Button>
                  </div>
                  <Table
                    columns={columns}
                    rows={tableData}
                    actions={[
                      {
                        name: 'View',
                        icon: viewSvg,
                        action: (r) => {
                          //window.electron.invoke(CustomEvents.watchWalletEvent, r.publicKey);
                          console.log(r.accountAddress);
                        },
                      },
                    ]}
                    pagination={{ pageSizes: [10, 20, 30, 40] }}
                  ></Table>
                </>
              ) : (
                <div className="empty-page">{`No ${tokenType} Accounts found.`}</div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default ViewWallet;
