import React, { useState, useEffect, useRef } from 'react';
import { successSvg } from '../../assets/svg';

interface ICheckbox {
  onChange?: (value: boolean) => void;
  value?: boolean;
}

function Checkbox(props: ICheckbox) {
  const [value, setValue] = useState(props.value ? true : false);

  useEffect(() => {
    setValue(props.value ? true : false);
  }, [props.value]);
  return (
    <div
      className={`checkbox`}
      onClick={() => {
        setValue(!value);
        if (props.onChange) props.onChange(!value);
      }}
    >
      {value && <>{successSvg}</>}
    </div>
  );
}

export default Checkbox;
