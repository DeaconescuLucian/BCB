import React, { useEffect, useState } from 'react';
import { CustomEvents } from '../../../../ts/events.ts';
import Table from '../../../components/Table/index.tsx';
import { viewSvg, deleteSvg } from '../../../assets/svg/index.jsx';

function WalletList() {
  const [wallets, setWallets] = useState([]);
  const columns = [
    {
      name: 'Alias',
      propertyName: 'alias',
      percentWidth: 40,
    },
    {
      name: 'Public Key',
      propertyName: 'publicKey',
      percentWidth: 40,
    },
    {
      name: 'Actions',
      propertyName: null,
      percentWidth: 20,
    },
  ];
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const result = await window.electron.invoke(CustomEvents.getWalletsEvent);
        if (result) {
          if (result.success) {
            setWallets(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching wallets:', error);
      }
    };

    fetchWallets();
  }, []);

  return (
    <div className="wallet-list-page">
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
    </div>
  );
}

export default WalletList;
