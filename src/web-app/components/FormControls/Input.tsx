import React, { useState, useEffect, useRef } from 'react';
import ErrorMessage from '../ErrorMessage';
import { formatNumber } from '../../utils';

type InputType = 'text' | 'number';
type InputTheme = 'primary' | 'secondary';

interface IInput {
  type: InputType;
  /**
   * A function to validate the input value.
   * It will be called when the input loses focus
   * after the user has interacted with it.
   * It returns an errorMessage: string if there is
   * an issue or null if it isn't any.
   *
   * @param value - The current value of the input.
   */
  validate?: (value: any) => string | null;
  /**
   * Use this to set a value in your component,
   * when the input value changes.
   *
   * @param value - The current value of the input.
   */
  onChange?: (value: any) => void;
  readonly?: boolean;
  /**
   * Theme of the input. Can be one of:
   * - 'primary'
   * - 'secondary'
   */
  theme?: InputTheme;
  /**
   * Set the value only if readonly is set to true
   */
  readOnlyValue?: any;
  placeholder?: string;
  clearFlag?: string;
  value: any;
}

function Input(props: IInput) {
  const [value, setValue] = useState(undefined as any);
  const [touched, setTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null as string | null);
  const ref = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    if (touched) {
      let error;
      if (props.validate) error = props.validate(value);
      setErrorMessage(error);
      if (props.onChange) {
        if (!error) {
          {
            props.onChange(value);
          }
        } else props.onChange(null);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue((e.target as any).value);
    if (props.type === 'number' && ref.current) ref.current.value = formatNumber((e.target as any).value || 0);
    if (!touched) {
      setTouched(true);
    }
  };

  useEffect(() => {
    if (props.clearFlag) if (ref.current) ref.current.value = '';
  }, [props.clearFlag]);

  useEffect(() => {
    if (props.type === 'number') {
      if (ref.current && props.readonly) ref.current.value = formatNumber(props.readOnlyValue || 0);
    } else {
      if (ref.current && props.readonly) ref.current.value = props.readOnlyValue;
    }
  }, [props.readOnlyValue]);

  useEffect(() => {
    if (props.value || props.value === 0) {
      if (props.validate){
        const error = props.validate(props.value);
        setErrorMessage(error);
      } 
      setValue(props.value);
    }
  }, [props.value]);

  return (
    <div className={`input-container`}>
      <input
        ref={ref}
        className={`${props.theme ? `theme-${props.theme}` : null}`}
        type="text"
        value={value || props.readOnlyValue || ''}
        defaultValue={props.readOnlyValue ? props.readOnlyValue : ''}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (props.type === 'number' && e.key === 'Enter') {
            handleBlur();
          }
        }}
        onBlur={handleBlur}
        readOnly={props.readonly ?? false}
        placeholder={props.placeholder}
      ></input>
      {errorMessage && <ErrorMessage text={errorMessage}></ErrorMessage>}
    </div>
  );
}

export default Input;
