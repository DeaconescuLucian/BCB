const { exec, spawn, execSync } = require('child_process');

execSync('yarn server-build', { stdio: 'inherit' });

const serverProcess = spawn('yarn', ['run', 'open-server-from-terminal'], { stdio: 'inherit', shell: true });

serverProcess.on('close', (code) => {
    if (code === 0) {
        const electronProcess = spawn('yarn', ['electron', '.'], { stdio: 'inherit', shell: true });
        electronProcess.on('close', (code) => {
            if (code === 1) {
                exec('yarn run close-server-from-terminal');
            }
        });
    }
});

