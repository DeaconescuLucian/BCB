import React, { useState, useEffect } from 'react';
import { successSvg, warningSvg, infoSvg } from '../../assets/svg/index.jsx';
import { ToastType } from '../../contexts/ToastContext.js';


interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, type }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setTimeout(() => {
        setVisible(false);
        onClose();
      }, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [message]);

  if (!visible) return null;

  const renderView = () => {
    switch (type) {
      case 'success':
        return successSvg;
      case 'fail':
        return warningSvg;
      case 'informative':
        return infoSvg;
      default:
        return null;
    }
  };

  return (
    <div className={`toast toast-${type} truncate`}>
      {renderView()}
      <span className='truncate'>{message}</span>
    </div>
  );
};

export default Toast;
