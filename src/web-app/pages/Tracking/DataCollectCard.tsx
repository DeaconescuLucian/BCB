import React, { memo } from 'react';
import NPDCCard from './CardTypes/NPDCCard';

type DataCollectCardType = 'NPT ( New Pools Track )';

interface DataCollectCardProps {
  type: DataCollectCardType;
  data?: any;
}

const DataCollectCard: React.FC<DataCollectCardProps> = ({ type, data }) => {

  const renderView = () => {
    switch (type) {
        case 'NPT ( New Pools Track )':
          return <NPDCCard data={data}></NPDCCard>;
      default:
        return null;
    }
  };

  return (
    <div className={`tracking-card`} key={data?.id}>
      {renderView()}
    </div>
  );
};

export default memo(DataCollectCard);