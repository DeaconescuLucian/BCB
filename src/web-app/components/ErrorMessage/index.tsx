import React from 'react';
import { warningSvg } from '../../assets/svg';

interface IErrorMessage {
  text: string;
}

function ErrorMessage(props: IErrorMessage) {
  return <span className='error-message'>{warningSvg}{props.text}</span>;
}

export default ErrorMessage;
