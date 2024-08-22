import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast from '../components/Toast';

interface ToastContextProps {
  showToast: (message: string, type: ToastType) => void;
}

export type ToastType = 'success' | 'fail' | 'informative'

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string, type: ToastType} | null>(null);

  /**
   * Toast props:
   * - type ( 'success' | 'fail' | 'informative' )
   * - message
  */
  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type});
  };

  const handleClose = () => {
    setToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} onClose={handleClose} type={toast.type}/>}
    </ToastContext.Provider>
  );
};
