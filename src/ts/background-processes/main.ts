var interval: NodeJS.Timeout;

function startMainProcess() {
  interval = setInterval(() => {
    const message = `Background update at ${new Date().toLocaleTimeString()}`;
    if (process.send) {
      process.send(message);
    }
  }, 5000);
}

function stopMainProcess() {
  if (interval) {
    clearInterval(interval);
  }
  process.exit(0);
}

process.on('message', (msg) => {
  if (msg === 'start') {
    startMainProcess();
  } else if (msg === 'stop') {
    stopMainProcess();
  }
});

if (process.send) {
    process.send('ready');
}