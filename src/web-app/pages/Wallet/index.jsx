import React, { useEffect, useState } from 'react';
import Page from '../../components/Page/index.tsx';
import Tabstrip from '../../components/Tabstrip/index.tsx';
import WalletList from './WalletList/index.jsx';
import NewWallet from './NewWallet/index.jsx';
import ViewWallet from './ViewWallet/index.jsx';
import { useSelector, useDispatch } from 'react-redux';
import { updateSelectedWallet, getWalletDetails } from '../../store/reducers/wallets.js';
import { useNavigate } from 'react-router-dom';
import { navigateAndSave } from '../../utils.js';

function WalletPage() {
  const [tabs] = useState([
    { name: 'List', url: '/list' },
    { name: 'View', url: '/view' },
    { name: 'New', url: '/new' },
  ]);

  const getActiveTab = () => {
    let t = window.location.href.split('?')[0].split('/');
    switch (t[t.length - 1]) {
      case 'list':
        setActiveTab({ name: 'List', url: '/list' });
        break;
      case 'new':
        setActiveTab({ name: 'New', url: '/new' });
        break;
      case 'view':
        setActiveTab({ name: 'View', url: '/view' });
        break;
      default:
        setActiveTab({ name: 'List', url: '/list' });
        break;
    }
  }

  const [activeTab, setActiveTab] = useState({ name: 'List', url: '/list' });
  const { selectedWallet } = useSelector((state) => state.wallets);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const changeToViewWallet = (publicKey) => {
    setActiveTab({ name: 'View', url: '/view' });
    navigateAndSave(navigate, `/wallet-page/view?pub=${publicKey}`);
    dispatch(updateSelectedWallet(publicKey));
    dispatch(getWalletDetails(publicKey));
  };

  useEffect(() => {
    getActiveTab();
  }, []);

  return (
    <Page hasTabstrip={true}>
      <Tabstrip
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => {
          window.localStorage.setItem('url', `/wallet-page${tab.url}`);
          setActiveTab(tab)
          navigate(`/wallet-page${tab.url}`)
        }}
      />
      <div className="wallets-page">
        {window.location.href.includes('list') && <WalletList onView={changeToViewWallet}></WalletList>}
        {window.location.href.includes('new') && <NewWallet></NewWallet>}
        {window.location.href.includes('view') && <ViewWallet publicKey={selectedWallet}></ViewWallet>}
      </div>
    </Page>
  );
}

export default WalletPage;
