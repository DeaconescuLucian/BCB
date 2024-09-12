import React, { useState, useEffect } from 'react';
import Page from '../../components/Page';
import Tabstrip from '../../components/Tabstrip/index.tsx';
import { useNavigate } from 'react-router-dom';
import { navigateAndSave } from '../../utils.js';
import WrapOrUnrwap from './WrapOrUnrwap/index.jsx';
import Swap from './Swap/index.jsx';

function Trade() {
  const [tabs] = useState([
    {  name: 'Swap', url: '/swap' } ,
    { name: 'Wrap / Unrwap', url: '/wrap-unwrap' },
  ]);
  const [activeTab, setActiveTab] = useState({ name: 'Swap', url: '/swap' });
  const navigate = useNavigate();

  const getActiveTab = () => {
    let t = window.location.href.split('?')[0].split('/');
    switch (t[t.length - 1]) {
      case 'buy':
        setActiveTab({ name: 'Swap', url: '/swap' });
        break;
      case 'sell':
        setActiveTab({ name: 'Wrap / Unrwap', url: '/wrap-unwrap' });
        break;
      default:
        setActiveTab({ name: 'Swap', url: '/swap' });
        break;
    }
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
          window.localStorage.setItem('url', `/trade${tab.url}`);
          setActiveTab(tab);
          navigateAndSave(navigate, `/trade${tab.url}`)
        }}
      ></Tabstrip>
      <div className="trade-page">
        {window.location.href.includes('swap') && <Swap></Swap>}
        {window.location.href.includes('wrap-unwrap') && <WrapOrUnrwap></WrapOrUnrwap>}
      </div>
    </Page>
  );
}

export default Trade;
