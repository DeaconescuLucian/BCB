import React from 'react';
import NPDCProcess from './NPDCProcess';
import Page from '../../../components/Page';
import { useSelector } from 'react-redux';

const DataCollector = () => {
  const { dataCollectors } = useSelector((state) => state.dataCollector);
  const dataCollector = dataCollectors.find(dc => dc.id === window.location.search.split('=')[1]);
  
  const renderView = () => {
    switch (dataCollector?.processType) {
      case 'NPT ( New Pools Track )':
        return <NPDCProcess data={dataCollector}></NPDCProcess>;
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

export default DataCollector;
