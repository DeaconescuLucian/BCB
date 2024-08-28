import React from 'react';

interface ITabstrip {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

const Tabstrip = ({ tabs, activeTab, onChange }: ITabstrip) => {
  return (
    <div className="tab-strip">
      {tabs.map((tab) => (
        <div
          className={`tab-item ${tab === activeTab ? 'active-tab' : ''}`}
          onClick={() => onChange(tab)}
          key={`tab-${tab}`}
        >
          {tab}
        </div>
      ))}
    </div>
  );
};

export default Tabstrip;
