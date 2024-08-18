let interval: NodeJS.Timeout;

function startBackgroundProcess() {
  interval = setInterval(() => {
    const message = `Background update at ${new Date().toLocaleTimeString()}`;
    if (process.send) {
      process.send(message);
    }
  }, 5000);
}

function stopBackgroundProcess() {
  if (interval) {
    clearInterval(interval);
  }
  process.exit(0);
}

process.on('message', (msg) => {
  if (msg === 'start') {
    startBackgroundProcess();
  } else if (msg === 'stop') {
    stopBackgroundProcess();
  }
});

if (process.send) {
    process.send('ready');
}