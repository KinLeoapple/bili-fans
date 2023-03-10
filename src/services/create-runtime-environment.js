import {Py_app} from "@/services/py_app"
import {Py_requirements} from "@/services/Py_requirements"
import {callback} from "@/services/process-callback"
import {Py_pth} from "@/services/Py_pth"

const download = require('download')
const fs = require('fs')
const fse = require('fs-extra')
const compressing = require('compressing')
const child_process = require('child_process')

const venvPath = './venv'
const pyPath = venvPath + '/python.exe'
const getPipPath = venvPath + '/get-pip.py'
const python310_pth = venvPath + '/python310._pth'
const py = './app.py'
const requirements = './requirements.txt'
const bililiveRecorder = './BililiveRecorder'

export function RuntimeEnvironment() {
    return run()
}

function run() {
    return new Promise(resolve => {
        let lockFile = './venv.lock'
        if (!fs.existsSync(lockFile)) {
            fs.writeFileSync(lockFile, '')
        }
        Promise.all([createPy(), createRequirements(), createPyEnvironment(), downloadBililiveRecorder()])
            .then(resolveChain => {
                console.log(resolveChain)
                if (resolveChain[0] && resolveChain[1] && resolveChain[2] && resolveChain[3]) {
                    try {
                        fse.unlinkSync(requirements)
                    } catch (err) {
                        console.log(err)
                    }
                    fse.unlinkSync(lockFile)
                    resolve('OK')
                } else {
                    fse.emptyDirSync(venvPath)
                    fse.rmdirSync(venvPath)
                    fse.unlinkSync(requirements)
                    fse.unlinkSync(py)
                    fse.unlinkSync(bililiveRecorder)
                    fse.unlinkSync(lockFile)
                    resolve('BAD')
                }
            })
    })
}

function createPy() {
    return new Promise(resolve => {
        fs.access(py, fs.constants.F_OK, (err) => {
            if (err) {
                fs.writeFile(py, Py_app(), (err) => {
                    if (err) {
                        resolve(false)
                    } else {
                        resolve(true)
                    }
                })
            } else {
                resolve(true)
            }
        })
    })
}

function createRequirements() {
    return new Promise(resolve => {
        if (!fs.existsSync(venvPath)) {
            fs.access(requirements, fs.constants.F_OK, (err) => {
                if (err) {
                    fs.writeFile(requirements, Py_requirements(), (err) => {
                        if (err) {
                            resolve(false)
                        } else {
                            resolve(true)
                        }
                    })
                } else {
                    resolve(true)
                }
            })
        } else {
            resolve(true)
        }
    })
}

function createPyEnvironment() {
    // https://docs.python.org/zh-cn/3.10/using/windows.html#installing-without-ui
    // https://www.python.org/downloads/release/python-31010/

    const url = 'https://www.python.org/ftp/python/3.10.10/python-3.10.10-embed-amd64.zip'
    const pythonEmbed = './python-3.10.10-embed-amd64.zip'

    return new Promise(resolve => {
        if (!fs.existsSync(venvPath)) {
            if (fs.existsSync(pythonEmbed)) {
                fs.unlink(pythonEmbed, (err) => {
                    if (!err) {
                        downloadPy(url, pythonEmbed).then(download => {
                            if (download) {
                                resolve(true)
                            } else {
                                resolve(false)
                            }
                        })
                    } else {
                        resolve(false)
                    }
                })
            } else {
                downloadPy(url, pythonEmbed).then(download => {
                    if (download) {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                })
            }
        } else {
            resolve(true)
        }
    })
}

function downloadPy(url, pythonEmbed) {
    return new Promise(resolve => {
        (async () => {
            fs.writeFile(pythonEmbed, await download(url), err => {
                if (err) {
                    resolve(false)
                } else {
                    unzipFile(pythonEmbed, venvPath).then(r => {
                        if (r) {
                            (async () => {
                                fs.writeFile(getPipPath, await download('https://bootstrap.pypa.io/get-pip.py'), err => {
                                    if (err) {
                                        resolve(false)
                                    } else {
                                        let process = child_process.spawn(pyPath,
                                            [getPipPath])
                                        callback(process)
                                        process.on('close', code => {
                                            if (code.toString() !== '0') {
                                                resolve(false)
                                            } else {
                                                fs.writeFile(python310_pth, Py_pth(), err => {
                                                    if (err) {
                                                        resolve(false)
                                                    } else {
                                                        let install = child_process.spawn(pyPath,
                                                            ['-m', 'pip', 'install', '-r', requirements]
                                                        )
                                                        callback(install)
                                                        install.on('close', code => {
                                                            if (code.toString() !== '0') {
                                                                resolve(false)
                                                            } else {
                                                                fs.unlinkSync(requirements)
                                                                resolve(true)
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            })()
                        } else {
                            resolve(false)
                        }
                    })
                }
            })
        })()
    })
}

function downloadBililiveRecorder() {
    // https://rec.danmuji.org/user/install/cli/
    // https://rec.danmuji.org/user/install/cli/#%E4%BE%BF%E6%90%BA%E6%A8%A1%E5%BC%8F%E8%BF%90%E8%A1%8C

    const url = 'https://github.com/BililiveRecorder/BililiveRecorder/releases/latest/download/BililiveRecorder-CLI-win-x64.zip'
    const recorderZip = './python-3.10.10-embed-amd64.zip'

    return new Promise(resolve => {
        if (!fs.existsSync(bililiveRecorder)) {
            (async () => {
                fs.writeFile(recorderZip, await download(url), err => {
                    if (err) {
                        resolve(false)
                    } else {
                        unzipFile(recorderZip, bililiveRecorder).then(r => {
                            resolve(r)
                        })
                    }
                })
            })()
        } else {
            resolve(true)
        }
    })
}

function unzipFile(zipFile, targetPath) {
    return new Promise(resolve => {
        compressing.zip.uncompress(zipFile, targetPath)
            // eslint-disable-next-line no-unused-vars
            .then(_ => {
                fs.unlinkSync(zipFile)
                resolve(true)
            })
            .catch(err => {
                console.log(err)
                resolve(false)
            })
    })
}