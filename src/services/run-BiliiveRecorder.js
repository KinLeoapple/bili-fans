import {callback} from "@/services/process-callback";


const child_process = require('child_process');
const fs = require('fs');

const lockFile = './venv.lock'
const recorder = './BililiveRecorder/BililiveRecorder.Cli.exe'

let workerProcess = undefined

export function runBiliiveRecorder(REC_PORT, workspace = './Records') {
    // https://rec.danmuji.org/user/install/cli/
    // https://rec.danmuji.org/dev/sdk.js/

    return new Promise(resolve => {
        let recorderLock = './recorder.lock'
        let url = `http://localhost:${REC_PORT}`

        if (!fs.existsSync(recorderLock)) {
            fs.writeFileSync(recorderLock, '')
        }

        let runLoop = setInterval(() => {
            if (!fs.existsSync(lockFile)) {
                clearInterval(runLoop)

                if (!fs.existsSync(workspace)) {
                    fs.mkdirSync(workspace)
                }

                workerProcess = child_process.spawn(recorder,
                    [
                        'run', '--bind', `${url}`, `${workspace}`
                    ]);
                console.log('BiliiveRecorder Running on ' + url)
                callback(workerProcess)

                fs.unlinkSync(recorderLock)

                resolve(workerProcess)
            }
        }, 500)
    })
}