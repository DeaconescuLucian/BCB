import React, { useEffect, useRef, useState } from 'react';
import Input from '../FormControls/Input';

interface ISwitch {
  value: boolean;
  onChange: () => void;
  label?: JSX.Element | JSX.Element[];
  theme?: string;
}

const Switch = (props: ISwitch) => {
  const inputRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);
  useEffect(() => {
    if (props.value === true && !isDirty) {
      if (inputRef.current) {
        inputRef.current.click();
      }
    }
    if(props.value === false && !isDirty)
    {
      setIsDirty(true);
    }
  }, [props.value]);

  return (
    <div className="switch-container">
      <div className="label">Simulate</div>
      <label className={`switch ${props.theme ? `theme-${props.theme}` : ''}`}>
        <input
          ref={inputRef}
          type="checkbox"
          value={`${props.value}`}
          onChange={() => {
            if (isDirty) props.onChange();
            setIsDirty(true);
          }}
        />
        <span className="slider"></span>
      </label>
    </div>
  );
};

export default Switch;
