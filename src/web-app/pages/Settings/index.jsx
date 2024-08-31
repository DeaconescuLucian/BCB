import React, { useState, useEffect } from 'react';
import Page from '../../components/Page';
import LicenseSettings from './LicenseSettings/index.jsx';
import ConnectionSettings from './ConnectionSettings';
import Tabstrip from '../../components/Tabstrip/index.tsx';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const [tabs] = useState([
    { name: 'License', url: '/license' },
    { name: 'Connection', url: '/connection' },
  ]);
  const [activeTab, setActiveTab] = useState({ name: 'License', url: '/license' });

  const getActiveTab = () => {
    let t = window.location.href.split('/');
    switch (t[t.length - 1]) {
      case 'license':
        setActiveTab({ name: 'License', url: '/license' });
        break;
      case 'connection':
        setActiveTab({ name: 'Connection', url: '/connection' });
        break;
      default:
        setActiveTab({ name: 'License', url: '/license' });
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
        {window.location.href.includes('license') && <LicenseSettings></LicenseSettings>}
        {window.location.href.includes('connection') && <ConnectionSettings></ConnectionSettings>}
      </div>
    </Page>
  );
}

export default Settings;
