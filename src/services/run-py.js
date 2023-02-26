const child_process = require('child_process');

// Your Python path
const pythonPath = 'D:\\Bili-Fans\\bili-fans\\venv\\Scripts\\python.exe'
let workerProcess = undefined

export function runPython(PORT) {
    return new Promise(resolve => {
        let environment = child_process.exec('set FLASK_APP=app.py', (error, stdout, stderr) => {
            if (error) {
                console.log(error.stack);
                console.log('Error code: ' + error.code);
                console.log('Signal received: ' + error.signal);
            }
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
        })
        environment.on('exit', (code) => {
            console.log('Subprocess stops, exit code ' + code);
        })
        console.log(`Python Server is Running, using port ${PORT}`)
        workerProcess = child_process.spawn(pythonPath,
            [
                `-m`, `flask`, `run`, `-h`, `127.0.0.1`, `-p`, `${PORT}`
            ]);
        callback(workerProcess)

        resolve(workerProcess)
    })
}

function callback(Process) {
    if (Process !== undefined) {
        Process.stdout.on('data', data => {
            console.log('stdout: ' + data);
        });

        Process.stderr.on('data', data => {
            console.log('stderr: ' + data);
        });

        Process.on('close', code => {
            console.log('Subprocess stops, exit code ' + code);
        });

        Process.on('unhandledRejection', error => {
            console.log('unhandledRejection', error.message);
        });
    }
}