import React, { useState } from 'react';
import Input from '../FormControls/Input';

interface ISwitch {
  value: boolean;
  onChange: () => void;
  label?: JSX.Element | JSX.Element[];
  theme?: string;
}

const Switch = (props: ISwitch) => {

  return (
    <div className="switch-container">
        <div className="label">
            Simulate
        </div>
      <label className={`switch ${props.theme ? `theme-${props.theme}` : ''}`}>
        <input type="checkbox" value={`${props.value}`} onChange={() => {props.onChange()}}/>
        <span className="slider"></span>
      </label>
    </div>
  );
};

export default Switch;
