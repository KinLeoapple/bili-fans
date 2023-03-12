import {callback} from "@/services/process-callback";

const path = require('path');
const child_process = require('child_process');
const fs = require('fs');

const lockFile = './venv.lock'
const recorder = './BililiveRecorder/BililiveRecorder.Cli.exe'

let workerProcess = undefined

function findWorkSpace() {
    return new Promise(resolve => {
        let workspace = path.join(__filename)
        console.log(workspace)
        workspace = workspace
            .replaceAll('dist_electron', '')
            .replaceAll('index.js', 'Records')
            .replaceAll('\\', '/')
            .replaceAll('//', '/')
        if (!fs.existsSync('./config.json')) {
            fs.writeFile('./config.json', `{"workspace": "${workspace}"}`, () => {
                resolve(workspace)
            })
        } else {
            fs.readFile('./config.json', (err, data) => {
                let str = data.toString()
                try {
                    let json = JSON.parse(str)
                    resolve(json.workspace)
                } catch (err) {
                    resolve(workspace)
                }
            })
        }
    })
}

export function runBiliiveRecorder(REC_PORT, BindPort) {
    return new Promise(resolve => {
        findWorkSpace().then(workspace => {
            // https://rec.danmuji.org/user/install/cli/
            // https://rec.danmuji.org/dev/sdk.js/

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

                    BindPort.close()

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
    })
}