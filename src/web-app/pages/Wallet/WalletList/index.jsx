import React, { useState } from 'react';
import Table from '../../../components/Table/index.tsx';
import { viewSvg, deleteSvg } from '../../../assets/svg/index.jsx';
import Loading from '../../../components/Loading/index.tsx';
import { useSelector } from 'react-redux';

function WalletList() {
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
      canCopy: true
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
                    //window.electron.invoke(CustomEvents.watchWalletEvent, r.publicKey);
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
            ></Table>
          ) : (
            <p>No wallets found.</p>
          )}
        </>
      )}
    </div>
  );
}

export default WalletList;
