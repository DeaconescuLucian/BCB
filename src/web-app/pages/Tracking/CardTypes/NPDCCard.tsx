import React from 'react';
import { poolSvg } from '../../../assets/svg';
import { useNavigate } from 'react-router-dom';
import { navigateAndSave } from '../../../utils';

interface NPDCCardProps {
  data: any;
}

const NPDCCard = (props: NPDCCardProps) => {
    const { data } = props;
    const navigate = useNavigate();
  return (
    <div
      className={`npt-card`}
      onClick={() => {
        navigateAndSave(navigate, `/data-collector?id=${data.id}`, true);
      }}
    >
      <div className="row space-between title">
        <div className="process-type">
          <span className="secondary">{data.processType}</span>
        </div>
        <div className={`process-status ${data.isActive ? 'running' : 'idle'}`}>
          {data.isActive ? 'Running' : 'Idle'}
        </div>
      </div>
      <div className="npt-card-content">
        <div className="row">
          <span className="icon">{poolSvg}</span>
          <span>{data.poolNo} pools tracked</span>
        </div>
      </div>
    </div>
  );
};

export default NPDCCard;
