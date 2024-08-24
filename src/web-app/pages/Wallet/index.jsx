import React, { useState } from 'react';
import Page from '../../components/Page/index.tsx';
import Tabstrip from '../../components/Tabstrip/index.tsx';
import WalletList from './WalletList/index.jsx';
import ImportWallet from './ImportWallet/index.jsx';
import GenerateWallet from './GenerateWallet/index.jsx';

function WalletPage() {
  const [tabs] = useState(['Wallets', 'Generate', 'Import']);
  const [activeTab, setActiveTab] = useState('Wallets');

  return (
    <Page hasTabstrip={true}>
      <Tabstrip tabs={tabs} onChange={(tab) => setActiveTab(tab)}></Tabstrip>
      <div className="wallets-page">
        {activeTab === 'Wallets' && <WalletList></WalletList>}
        {activeTab === 'Generate' && <GenerateWallet></GenerateWallet>}
        {activeTab === 'Import' && <ImportWallet></ImportWallet>}
      </div>
    </Page>
  );
}

export default WalletPage;
