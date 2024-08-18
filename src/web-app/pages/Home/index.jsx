import React, { useEffect, useState } from 'react';

function Home() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const unsubscribe = window.electron.on('background-update', (msg) => {
      setMessage(msg);
    });

    return unsubscribe;
  }, []);

  const handleStartBackgroundProcess = async () => {
    const response = await window.electron.invoke('start-background-process');
    setStatus(response.success ? response.data : 'Failed to start process');
  };
  
  const handleStopBackgroundProcess = async () => {
    const response = await window.electron.invoke('stop-background-process');
    setStatus(response.success ? response.data : 'Failed to stop process');
  };

  return (
    <div className='main-container'>
      <h2>Home Page</h2>
      <p>Background Message: {message}</p>
      <p>Status: {status}</p>
      <button onClick={handleStartBackgroundProcess}>Start Background Process</button>
      <button onClick={handleStopBackgroundProcess}>Stop Background Process</button>
    </div>
  );
}

export default Home;