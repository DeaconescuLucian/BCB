import React, { useEffect} from 'react';
import Page from '../../components/Page';
import { useSelector } from 'react-redux';
import TrackingCard from './TrackingCard';

function Tracking() {
  const { trackProcesses } = useSelector((state) => state.trackProcess);
  return (
    <Page>
      <div className="tracking-page">
        <div className="content">
          <TrackingCard type="default"></TrackingCard>
          {
            trackProcesses.map(tp => {
              return (
                <TrackingCard type={tp.processType} data={tp}></TrackingCard>
              )
            })
          }
        </div>
      </div>
    </Page>
  );
}

export default Tracking;
