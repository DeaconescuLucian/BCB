import React, { useEffect, useState } from 'react';
import { ProcessType } from '../../../ts/events';

function Home() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [pid, setPid] = useState(undefined);

  const walletProcess = ProcessType.WALLET;

  useEffect(() => {
    const unsubscribe = window.electron.on(walletProcess.updateEvent, (msg) => {
      setMessage(msg);
    });

    return unsubscribe;
  }, []);

  const handleStartBackgroundProcess = async () => {
    const response = await window.electron.invoke(walletProcess.startEvent, pid);
    setStatus(response.success ? response.data.message : 'Failed to start process');
    setPid(response.success ? response.data.pid : undefined);
  };
  
  const handleStopBackgroundProcess = async () => {
    const response = await window.electron.invoke(walletProcess.stopEvent);
    setStatus(response.success ? response.data : 'Failed to stop process');
    setPid(undefined);
  };

  return (
    <div className='main-container'>
      <h2>Home Page</h2>
      <p>Background Message: {message}</p>
      <p>Status: {status}</p>
      <p>PID: {pid}</p>
      <button onClick={handleStartBackgroundProcess}>Start Background Process</button>
      <button onClick={handleStopBackgroundProcess}>Stop Background Process</button>
    </div>
  );
}

export default Home;