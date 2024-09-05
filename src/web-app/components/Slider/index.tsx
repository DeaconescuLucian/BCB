import React, { useState } from 'react';
import { formatNumber } from '../../utils';

interface ISlider {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: JSX.Element | JSX.Element[];
  theme: string;
  step: string;
}

const Slider = (props: ISlider) => {
  const [value, setValue] = useState(props.value);
  const [displayedValue, setDisplayedValue] = useState(formatNumber(props.value || 0));

  return (
    <div className="slider-container">
      {props.label}
      <div className="range-input-wrapper">
        <span
          className="range-input-min-label"
          onClick={() => {
            setValue(props.min);
            setDisplayedValue(formatNumber(props.min));
            props.onChange(props.min);
          }}
        >
          MIN
        </span>
        <input
          type="range"
          step={props.step}
          min={props.min}
          max={props.max}
          value={value}
          className={`slider ${props.theme ? `theme-${props.theme}` : ''}`}
          onChange={(e) => {
            let newVal = e.target.value;
            let empty = !!(e.target.value === '');
            let newVal1 = Number(formatNumber(newVal, empty)) || props.min;
            setDisplayedValue(formatNumber(newVal, empty));
            setValue(newVal1);
            props.onChange(newVal1);
          }}
        />
        <span
          className="range-input-max-label"
          onClick={() => {
            setValue(props.max);
            setDisplayedValue(formatNumber(props.max));
            props.onChange(props.max);
          }}
        >
          MAX
        </span>
      </div>
      <input
        type="text"
        className={`${props.theme ? `theme-${props.theme}` : ''}`}
        value={displayedValue}
        onChange={(e) => {
          let newVal = e.target.value;
          let empty = !!(e.target.value === '');
          if (!empty) {
            if (Number(newVal) > props.max) newVal = props.max.toString();
            if (Number(newVal) < props.min) newVal = props.min.toString();
          }
          setDisplayedValue(formatNumber(newVal, empty));
          let newVal1 = Number(formatNumber(newVal, empty)) || props.min;
          if (newVal1 > props.max) newVal1 = props.max;
          if (newVal1 < props.min) newVal1 = props.min;
          setValue(newVal1);
          props.onChange(newVal1);
        }}
      />
    </div>
  );
};

export default Slider;
