import React from 'react';

interface ITabstrip {
  tabs: { name: string; url: string }[];
  activeTab: { name: string; url: string };
  onChange: (tab: { name: string; url: string }) => void;
}

const Tabstrip = ({ tabs, activeTab, onChange }: ITabstrip) => {
  return (
    <div className="tab-strip">
      {tabs.map((tab) => (
        <div
          className={`tab-item ${tab.name === activeTab.name ? 'active-tab' : ''}`}
          onClick={() => onChange(tab)}
          key={`tab-${tab.name}`}
        >
          {tab.name}
        </div>
      ))}
    </div>
  );
};

export default Tabstrip;
