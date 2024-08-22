import React from 'react';
import { infoSvg } from '../../assets/svg/index.jsx';

interface IInfo {
  text: string;
}

function Info(props: IInfo) {
  return (
    <span className='info-message'>
      {infoSvg}
      {props.text}
    </span>
  );
}

export default Info;
