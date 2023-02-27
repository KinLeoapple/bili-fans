import {callback} from "@/services/process-callback";

const child_process = require('child_process');
const fs = require('fs');

// Python path for windows
const pythonPath = './venv/python.exe'
const lockFile = './venv.lock'
let workerProcess = undefined

export function runPython(PORT) {
    return new Promise(resolve => {
        let serverLock = './server.lock'
        if (!fs.existsSync(serverLock)) {
            fs.writeFileSync(serverLock, '')
        }
        let runLoop = setInterval(() => {
            if (!fs.existsSync(lockFile)) {
                clearInterval(runLoop)

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
                fs.unlinkSync(serverLock)

                resolve(workerProcess)
            }
        }, 500)
    })
}