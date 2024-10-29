import React, { useState, useEffect } from 'react';
import DefaultTrackingCard from './CardTypes/DefaultCard';
import NPTCard from './CardTypes/NPTCard';
import { navigateAndSave } from '../../utils';
import { useNavigate } from 'react-router-dom';

type TrackingCardType = 'default' | 'NPT ( New Pools Track )';

interface TrackingCardProps {
  type: TrackingCardType;
  data?: any;
}

const TrackingCard: React.FC<TrackingCardProps> = ({ type, data }) => {

  const navigate = useNavigate();

  const renderView = () => {
    switch (type) {
      case 'default':
        return <DefaultTrackingCard></DefaultTrackingCard>;
        case 'NPT ( New Pools Track )':
          return <NPTCard data={data}></NPTCard>;
      default:
        return null;
    }
  };

  return (
    <div className={`tracking-card`} key={data?.id} onClick={() => {
      navigateAndSave(navigate, `/track-process?id=${data.id}`, true);
    }}>
      {renderView()}
    </div>
  );
};

export default TrackingCard;
