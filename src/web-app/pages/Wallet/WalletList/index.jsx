import React, { useState } from 'react';
import Table from '../../../components/Table/index.tsx';
import { viewSvg, deleteSvg } from '../../../assets/svg/index.jsx';
import Loading from '../../../components/Loading/index.tsx';
import { useSelector } from 'react-redux';

function WalletList(props) {
  const { wallets, status } = useSelector((state) => state.wallets);
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

  return (
    <div className="wallet-list-page">
      {status === 'idle' ? (
        <Loading></Loading>
      ) : (
        <>
          {wallets.length > 0 ? (
            <Table
              columns={columns}
              rows={wallets}
              actions={[
                {
                  name: 'View',
                  icon: viewSvg,
                  action: (r) => {
                    props.onView(r.publicKey);
                    console.log(r.publicKey);
                  },
                },
                {
                  name: 'Delete',
                  icon: deleteSvg,
                  action: (r) => {
                    //window.electron.invoke(CustomEvents.watchWalletEvent, r.publicKey);
                    console.log(`Delete ${r.publicKey}`);
                  },
                },
              ]}
              pagination={{ pageSizes: [10, 20, 30, 40] }}
            ></Table>
          ) : (
            <div className="empty-page">No wallets found.</div>
          )}
        </>
      )}
    </div>
  );
}

export default WalletList;
