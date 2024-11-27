import React from 'react';
import NPTProcess from './NPTProcess';
import Page from '../../../components/Page';
import { useSelector } from 'react-redux';

const TrackProcess = () => {
  const { trackProcesses } = useSelector((state) => state.trackProcess);
  const trackProcess = trackProcesses.find(tp => tp.id === window.location.search.split('=')[1]);
  
  const renderView = () => {
    switch (trackProcess?.processType) {
      case 'NPT ( New Pools Track )':
        return <NPTProcess data={trackProcess}></NPTProcess>;
      default:
        return null;
    }
  };

  return (
    <Page>
      <div className="track-process-page">{renderView()}</div>
    </Page>
  );
};

export default TrackProcess;
