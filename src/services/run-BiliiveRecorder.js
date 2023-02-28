import {callback} from "@/services/process-callback";

const child_process = require('child_process');
const fs = require('fs');

const lockFile = './venv.lock'
const recorder = './BililiveRecorder/BililiveRecorder.Cli.exe'

let workerProcess = undefined

export function runBiliiveRecorder(workspace = './Records', rooms = []) {
    return new Promise(resolve =>  {
        let recorderLock = './recorder.lock'

        let runLoop = setInterval(() => {
            if (!fs.existsSync(lockFile)) {
                clearInterval(runLoop)

                workerProcess = child_process.spawn(recorder,
                    [
                        `p`, workspace, rooms
                    ]);
                callback(workerProcess)
                fs.unlinkSync(recorderLock)

                resolve(runLoop)
            }
        }, 500)
    })
}