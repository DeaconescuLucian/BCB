import React, { useState} from 'react';

interface ITabstrip {
  tabs: string[];
  onChange: (tab: string) => void;
}

const Tabstrip = ({ tabs, onChange }: ITabstrip) => {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <>
      <div className="tab-strip">
        {tabs.map((tab) => (
          <div
            className={`tab-item ${tab === activeTab ? 'active-tab' : ''}`}
            onClick={() => {
              setActiveTab(tab);
              onChange(tab);
            }}
            key={`tab-${tab}`}
          >
            {tab}
          </div>
        ))}
      </div>
    </>
  );
};

export default Tabstrip;
