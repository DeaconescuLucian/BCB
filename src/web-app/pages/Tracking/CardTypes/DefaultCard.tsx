import React, { useState, useEffect } from 'react';
import { addSvg, crossSvg } from '../../../assets/svg';
import Dialog from '../../../components/Dialog';
import Dropdown from '../../../components/FormControls/Dropdown';
import NewPoolsTrackingSettings from '../CustomSettings/NewPoolsTrackerSettings';

interface DefaultCardProps {}

interface TrackingType {
  id: number;
  name: string;
}

const DefaultTrackingCard: React.FC<DefaultCardProps> = () => {
  const [showDialog, setShowDialog] = useState(false);

  const trackingTypeOptions = [
    { id: 0, label: 'NPT (New Pools Tracker)' },
    { id: 1, label: 'TT (Token Tracker)' },
  ];
  const [trackingType, setTrackingType] = useState({ id: 0, label: 'NPT (New Pools Tracker)' });

  const renderCustomSettings = () => {
    switch (trackingType.id) {
      case 0:
        return <NewPoolsTrackingSettings filters={[]} onChange={() => {}} />;
      default:
        return <></>;
    }
  };

  return (
    <div
      className={`default-card`}
      onClick={() => {
        setShowDialog(true);
      }}
    >
      {addSvg}
      <span>New</span>
      {showDialog && (
        <Dialog
          className="new-process-dialog"
          onClose={() => {
            setShowDialog(false);
          }}
        >
          <div className="new-process-dialog-header">
            <div className="title">
              {' '}
              <span>New track process</span>
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDialog(false);
                }}
              >
                {crossSvg}
              </span>
            </div>
            <div className="subtitle">
              {' '}
              <span>Setup your bot for success</span>
            </div>
          </div>
          <div className="new-process-dialog-content">
            <div className="setting-label">Process Type</div>
            <Dropdown
              onChange={(opt) => {
                setTrackingType(opt);
              }}
              options={trackingTypeOptions}
            />
            {renderCustomSettings()}
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default DefaultTrackingCard;
