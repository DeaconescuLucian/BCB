import React, { useState, useEffect } from 'react';
import DefaultCard from './CardTypes/DefaultCard';

type TrackingCardType = 'default' | 'newPoolsTrack';

interface TrackingCardProps {
  type: TrackingCardType;
  data?: any;
}

const TrackingCard: React.FC<TrackingCardProps> = ({ type, data }) => {

  const renderView = () => {
    switch (type) {
      case 'default':
        return <DefaultCard></DefaultCard>;
      default:
        return null;
    }
  };

  return (
    <div className={`tracking-card`}>
      {renderView()}
    </div>
  );
};

export default TrackingCard;
