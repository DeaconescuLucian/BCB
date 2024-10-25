import React from 'react';
import Page from '../../components/Page';
import { useSelector } from 'react-redux';
import TrackingCard from './TrackingCard';

function Tracking() {
  return (
    <Page>
      <div className="tracking-page">
        <div className="content">
          <TrackingCard type="default"></TrackingCard>
        </div>
      </div>
    </Page>
  );
}

export default Tracking;
