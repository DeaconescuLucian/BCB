import React, {useState} from 'react';
import Page from '../../components/Page';
import AccountSettings from './AccountSettings';
import ConnectionSettings from './ConnectionSettings';
import Tabstrip from '../../components/Tabstrip/index.tsx';

function Settings() {
  const [tabs] = useState(['Account', 'Connection']);
  const [activeTab, setActiveTab] = useState('Account');
  return (
    <Page hasTabstrip={true}>
      <Tabstrip tabs={tabs} onChange={(tab) => setActiveTab(tab)}></Tabstrip>
      <div className="settings-page">
      {activeTab === 'Account' && <AccountSettings></AccountSettings>}
      {activeTab === 'Connection' && <ConnectionSettings></ConnectionSettings>}
      </div>
    </Page>
  );
}

export default Settings;