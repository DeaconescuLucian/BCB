import React, { useState, useEffect, useRef } from 'react';
import { downSvg } from '../../assets/svg';
import ClickOutside from '../ClickOutside';

interface IDropdown {
  onChange?: (value: any) => void;
  value?: any;
  options: {
    label: string;
    [key: string]: any;
  }[];
}

function Dropdown(props: IDropdown) {
  const [value, setValue] = useState(props.value ?? props.options[0]);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="dropdown-container">
      <div
        className="dropdown-button"
        onClick={(e) => {
          setShowDropdown(!showDropdown);
        }}
      >
        <div style={{ pointerEvents: 'none' }}>{value.label}</div>
        <span style={{ pointerEvents: 'none' }}> {downSvg}</span>
      </div>
      {showDropdown && (
        <ClickOutside
          onClickOutside={() => {
            setShowDropdown(false);
          }}
          exclude="dropdown-button"
        >
          <div className="dropdown">
            {props.options.map((option, index) => (
              <div
                key={index}
                className="dropdown-option truncate"
                onClick={() => {
                  setValue(option);
                  if (props.onChange) {
                    props.onChange(option);
                  }
                  setShowDropdown(false);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </ClickOutside>
      )}
    </div>
  );
}

export default Dropdown;
