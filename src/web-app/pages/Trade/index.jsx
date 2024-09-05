import React, { useState, useEffect } from 'react';
import Page from '../../components/Page';
import Tabstrip from '../../components/Tabstrip/index.tsx';
import { useNavigate } from 'react-router-dom';
import Buy from './Buy/index.jsx';
import Sell from './Sell/index.jsx';

function Trade() {
  const [tabs] = useState([
    { name: 'Buy', url: '/buy' },
    { name: 'Sell', url: '/sell' },
  ]);
  const [activeTab, setActiveTab] = useState({ name: 'Buy', url: '/buy' });
  const navigate = useNavigate();

  const getActiveTab = () => {
    let t = window.location.href.split('?')[0].split('/');
    switch (t[t.length - 1]) {
      case 'buy':
        setActiveTab({ name: 'Buy', url: '/buy' });
        break;
      case 'sell':
        setActiveTab({ name: 'Sell', url: '/sell' });
        break;
      default:
        setActiveTab({ name: 'Buy', url: '/buy' });
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
          navigate(`/trade${tab.url}`);
        }}
      ></Tabstrip>
      <div className="trade-page">
        {window.location.href.includes('buy') && <Buy></Buy>}
        {window.location.href.includes('sell') && <Sell></Sell>}
      </div>
    </Page>
  );
}

export default Trade;
