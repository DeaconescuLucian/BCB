import React, { useState, useEffect } from 'react';
import Page from '../../components/Page';
import { useSelector } from 'react-redux';
import TrackingCard from './TrackingCard';
import DataCollectCard from './DataCollectCard'
import Tabstrip from '../../components/Tabstrip';
import { useNavigate } from 'react-router-dom';

function Tracking() {
  const navigate = useNavigate();
  const { trackProcesses } = useSelector((state) => state.trackProcess);
  const {dataCollectors} = useSelector((state) => state.dataCollector);

  const [tabs] = useState([
    { name: 'Track Processes', url: '/track-processes' },
    { name: 'Data Collectors', url: '/data-collectors' },
  ]);

  const getActiveTab = () => {
    let t = window.location.pathname.split('/')[2];
    switch (t) {
      case 'track-processes':
        setActiveTab({ name: 'Track Processes', url: '/track-processes' });
        break;
      case 'data-collectors':
        setActiveTab({ name: 'Data Collectors', url: '/data-collectors' });
        break;
      default:
        setActiveTab({ name: 'Track Processes', url: '/track-processes' });
        break;
    }
  };

  const [activeTab, setActiveTab] = useState({ name: 'Track Processes', url: '/track-processes' });

  useEffect(() => {
    getActiveTab();
  }, []);

  return (
    <Page hasTabstrip={true}>
      <Tabstrip
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => {
          window.localStorage.setItem('url', `/track${tab.url}`);
          setActiveTab(tab);
          navigate(`/track${tab.url}`);
        }}
      />

      <div className="tracking-page">
        <div className="content">
          {activeTab.name === 'Track Processes' && (
            <>
              <TrackingCard type="default"></TrackingCard>
              {trackProcesses.map((tp) => {
                return <TrackingCard type={tp.processType} data={tp}></TrackingCard>;
              })}
            </>
          )}
          {activeTab.name === 'Data Collectors' && (
            <>
              {dataCollectors.map((dc) => {
                return <DataCollectCard type={dc.processType} data={dc}></DataCollectCard>;
              })}
            </>
          )}
        </div>
      </div>
    </Page>
  );
}

export default Tracking;
