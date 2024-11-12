import React from 'react';
import { walletSvg, poolSvg, profitSvg, lossSvg } from '../../../assets/svg';
import CopyToClipboard from '../../../components/CopyToClipboard';
import { useNavigate } from 'react-router-dom';
import { navigateAndSave } from '../../../utils';

interface NPTCardProps {
  data: any;
}

const NPTCard = (props: NPTCardProps) => {
    const { data } = props;
    const navigate = useNavigate();
  return (
    <div
      className={`npt-card`}
      onClick={() => {
        navigateAndSave(navigate, `/track-process?id=${data.id}`, true);
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
          <span className="icon">{walletSvg}</span>
          <span className="truncate">{data.wallet}</span>
          <span><CopyToClipboard text={data.wallet}/></span>
        </div>
        <div className="row">
          <span className="icon">{poolSvg}</span>
          <span>{data.poolNo} pools tracked</span>
        </div>
        <div className="row">
          <div className="col-6">
            <div className="row center">
              <span>Positions</span>
            </div>
            <div className="row">
              <div className="col-6">
                <div className="row center title">
                  <span>Open</span>
                </div>
                <div className="row center">
                  <span className="info">{data.openPositionNo}</span>
                </div>
              </div>
              <div className="col-6">
                <div className="row center title">
                  <span className="secondary">Closed</span>
                </div>
                <div className="row center">
                  <span className="info">{data.closedPositionNo}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="row center">
              <span>Profit</span>
              <span className={data.profit !== 0 ? (data.profit > 0 ? 'profit' : 'loss') : ''}>
                {data.profit !== 0 ? (data.profit > 0 ? profitSvg : lossSvg) : ''}
              </span>
            </div>
            <div className="row">
              <div className="col-6">
                <div className="row center">
                  <span className={data.profit !== 0 ? (data.profit > 0 ? 'profit' : 'loss') : ''}>
                    {Number(data.profit?.toFixed(4))}<span className='currency'>SOL</span>
                  </span>
                </div>
              </div>
              <div className="col-6">
                <div className="row center">
                  <span className={data.profit !== 0 ? (data.profit > 0 ? 'profit' : 'loss') : ''}>
                    {data.profitPercentage !== null ? Number(data.profitPercentage?.toFixed(2)) : ''}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NPTCard;
