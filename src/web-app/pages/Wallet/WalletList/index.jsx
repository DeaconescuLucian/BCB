import React, { useEffect, useState } from 'react';
import Table from '../../../components/Table/index.tsx';
import { viewSvg, deleteSvg } from '../../../assets/svg/index.jsx';
import Loading from '../../../components/Loading/index.tsx';
import { useSelector, useDispatch } from 'react-redux';
import SearchBar from '../../../components/SearchBar/index.tsx';
import { deselectWallet } from '../../../store//reducers/wallets.js';
import { CustomEvents } from '../../../../ts/events.ts';
import { useToast } from '../../../contexts/ToastContext.tsx';
import { fetchWallets } from '../../../store//reducers/wallets.js';

function WalletList(props) {
  const { wallets, status } = useSelector((state) => state.wallets);
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      name: 'Alias',
      propertyName: 'alias',
      percentWidth: 30,
    },
    {
      name: 'Public Key',
      propertyName: 'publicKey',
      percentWidth: 30,
      canCopy: true,
    },
    {
      name: 'Balance',
      propertyName: 'balance',
      percentWidth: 20,
    },
    {
      name: 'Actions',
      propertyName: null,
      percentWidth: 20,
    },
  ];

  const deleteWallet = async (wallet) => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.deleteWalletEvent, wallet.publicKey);
    if (result) {
      setLoading(false);
      if (result.data.message) {
        showToast(result.data.message, 'success');
      } else {
        if (result.data.error) {
          showToast(result.data.error, 'fail');
        }
      }
      dispatch(fetchWallets());
    }
  };

  return (
    <div className="wallet-list-page">
      <>
        <SearchBar
          searchArray={wallets}
          displayTemplate={(wallet) => `alias: ${wallet.alias} (${wallet.publicKey})`}
          matchProperties={[
            { name: 'alias', fullMatch: false },
            { name: 'publicKey', fullMatch: true },
          ]}
          onSearch={(wallet) => {
            window.localStorage.setItem('url', `wallet-page/view?pub=${wallet.publicKey}`);
            dispatch(deselectWallet());
            props.onView(wallet.publicKey);
          }}
        ></SearchBar>
        {wallets.length > 0 ? (
          <Table
            columns={columns}
            rows={wallets}
            actions={[
              {
                name: 'View',
                icon: viewSvg,
                action: (r) => {
                  window.localStorage.setItem('url', `wallet-page/view?pub=${r.publicKey}`);
                  props.onView(r.publicKey);
                },
              },
              {
                name: 'Delete',
                icon: deleteSvg,
                action: (r) => {
                  deleteWallet(r);
                },
              },
            ]}
            pagination={{ pageSizes: [10, 20, 30, 40] }}
          ></Table>
        ) : (
          <div className="empty-page">No wallets found.</div>
        )}
        {
          loading && <Loading></Loading>
        }
      </>
    </div>
  );
}

export default WalletList;
