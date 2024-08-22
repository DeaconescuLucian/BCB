import React, { useState } from 'react';
import ErrorMessage from '../ErrorMessage';

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
}

function Input(props: IInput) {
  const [value, setValue] = useState(undefined as any);
  const [touched, setTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null as string | null);

  const handleBlur = () => {
    if (touched) {
      let error;
      if(props.validate)
        error = props.validate(value)
      setErrorMessage(error);
      if(props.onChange)
      {
        if(!error)
          props.onChange(value);
        else
          props.onChange(null)
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue((e.target as any).value);
    if (!touched) {
      setTouched(true);
    }
  };

  return <div className={`input-container`}>
    <input className={`${props.theme ? `theme-${props.theme}` : null}`} type={props.type} value={value || props.readOnlyValue} onChange={handleChange} onBlur={handleBlur} readOnly={props.readonly ?? false}/>
    {
        errorMessage && <ErrorMessage text={errorMessage}></ErrorMessage>
    }
  </div>;
}

export default Input;
