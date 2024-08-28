import React, { useState } from 'react';
import Page from '../../components/Page/index.tsx';
import Tabstrip from '../../components/Tabstrip/index.tsx';
import WalletList from './WalletList/index.jsx';
import ImportWallet from './ImportWallet/index.jsx';
import GenerateWallet from './GenerateWallet/index.jsx';
import ViewWallet from './ViewWallet.jsx/index.jsx';
import { useSelector, useDispatch } from 'react-redux';
import { updateSelectedWallet, getWalletDetails } from '../../store/reducers/wallets.js';

function WalletPage() {
  const [tabs] = useState(['List', 'Generate', 'Import', 'View']);
  const [activeTab, setActiveTab] = useState('List');
  const { selectedWallet } = useSelector((state) => state.wallets);
  const dispatch = useDispatch();

  const changeToViewWallet = (publicKey) => {
    setActiveTab('View');
    dispatch(updateSelectedWallet(publicKey));
    dispatch(getWalletDetails(publicKey));
  };

  return (
    <Page hasTabstrip={true}>
      <Tabstrip 
        tabs={tabs} 
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab)} 
      />
      <div className="wallets-page">
        {activeTab === 'List' && <WalletList onView={changeToViewWallet}></WalletList>}
        {activeTab === 'Generate' && <GenerateWallet></GenerateWallet>}
        {activeTab === 'Import' && <ImportWallet></ImportWallet>}
        {activeTab === 'View' && <ViewWallet publicKey={selectedWallet}></ViewWallet>}
      </div>
    </Page>
  );
}

export default WalletPage;