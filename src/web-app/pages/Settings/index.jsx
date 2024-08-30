import React, { useState, useEffect } from 'react';
import Page from '../../components/Page';
import AccountSettings from './AccountSettings';
import ConnectionSettings from './ConnectionSettings';
import Tabstrip from '../../components/Tabstrip/index.tsx';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const [tabs] = useState([
    { name: 'Account', url: '/account' },
    { name: 'Connection', url: '/connection' },
  ]);
  const [activeTab, setActiveTab] = useState({ name: 'Account', url: '/account' });

  const getActiveTab = () => {
    let t = window.location.href.split('/');
    switch (t[t.length - 1]) {
      case 'account':
        setActiveTab({ name: 'Account', url: '/account' });
        break;
      case 'connection':
        setActiveTab({ name: 'Connection', url: '/connection' });
        break;
      default:
        setActiveTab({ name: 'Account', url: '/account' });
        break;
    }
  };

  useEffect(() => {
    getActiveTab();
  }, []);

  const navigate = useNavigate();

  return (
    <Page hasTabstrip={true}>
      <Tabstrip
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => {
          window.localStorage.setItem('url', `/settings${tab.url}`);
          setActiveTab(tab);
          navigate(`/settings${tab.url}`);
        }}
      ></Tabstrip>
      <div className="settings-page">
        {window.location.href.includes('account') && <AccountSettings></AccountSettings>}
        {window.location.href.includes('connection') && <ConnectionSettings></ConnectionSettings>}
      </div>
    </Page>
  );
}

export default Settings;
