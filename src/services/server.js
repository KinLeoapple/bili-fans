import {ipcMain, dialog} from 'electron';
import axios from "axios";
import {checkUpdate} from "@/services/check-update";
import fs from "fs";

const path = require("path")
const schedule = require('node-schedule');
const NeDB = require('nedb')

let PORT
let job

let db

export class Server {

    constructor(port) {
        PORT = port

        let rule = new schedule.RecurrenceRule()
        rule.hour = 0
        rule.minute = 0
        rule.second = 0
        job = schedule.scheduleJob(rule, () => {
            updateFollowerJob()
        })

        console.log('Schedule Job now is running')
    }

    // make sure the size of data file always be smallest
    creatDataBase() {
        fs.readFile('./data.db', (err, buffer) => {
            let data = buffer.toString()
            let lines = data.split('\n')
            let arr = [...new Set(lines)]
            fs.writeFile('./data.db', '', () => {

                let str = ''
                let dataJson = {}
                arr.forEach(item => {
                    if (item !== '\n' && item !== '') {
                        let json = JSON.parse(item)
                        dataJson[json._id] = json
                    }
                })

                for (let i in dataJson) {
                    str += JSON.stringify(dataJson[i]) + '\n'
                }

                fs.writeFile('./data.db', str, () => {
                    db = new NeDB({
                        filename: './data.db',
                        autoload: true,
                    })

                    db.find({}, function (err, docs) {
                        const FIVE_DAYS = [initDateTime(4), initDateTime(3), initDateTime(2), initDateTime(1), initDateTime(0)]
                        docs.forEach(doc => {
                            let fans = doc.fans

                            cleanDate(FIVE_DAYS, doc, fans)
                        })
                    })
                })
            })
        })
    }

    start() {
        this.creatDataBase()

        port()
        upList()
        appendUID()
        removeUID()
        switchUID()
        followers()
        liveRoom()
        setAutoRecord()
        getAutoRecord()
        updateApp()
        settingNotification()
        updateNotification()
        returnUpdateResult()
        openDialog()
        setRecordPath()
        getRecordPath()
    }

    stop() {
        if (job !== undefined) {
            job.cancel()
        }
        this.creatDataBase()
    }
}

function port() {
    // get port
    ipcMain.on('port', event => {
        event.returnValue = PORT
    })
}

function upList() {
    // get up list
    ipcMain.on('up-list', event => {
        let list = []
        db.find({}
            , function (err, docs) {
                docs.forEach(doc => {
                    list[list.length] = doc.uid
                })
                event.returnValue = list
            })
    })
}

function appendUID() {
    // append UID
    ipcMain.on('append', (event, uid) => {
        let regPos = /^[0-9]+?$/;
        if (parseInt(uid).toString() !== "NaN") {
            if (regPos.test(uid)) {
                db.find({
                        'uid': uid
                    },
                    function (err, docs) {
                        if (docs.length === 0) {
                            axios({
                                method: 'post',
                                baseURL: 'http://localhost:' + PORT + '/live-info/',
                                data: {
                                    uid: uid
                                }
                            }).then(resolve => {
                                let data = resolve.data

                                db.insert({
                                    'uid': uid,
                                    'liveid': data.live_room.roomid,
                                    'fans': {}
                                }, function (err) {
                                    if (err === null) {
                                        event.sender.send('append-room', uid, data.live_room.roomid)
                                        event.returnValue = {
                                            res: true,
                                            msg: err
                                        }
                                    } else {
                                        event.returnValue = {
                                            res: false,
                                            msg: err
                                        }
                                    }
                                })
                            })
                        } else {
                            event.returnValue = {
                                res: false,
                                msg: 'Already Added'
                            }
                        }
                    })
            } else {
                event.returnValue = {
                    res: false,
                    msg: 'Invalid UID'
                }
            }
        } else {
            event.returnValue = {
                res: false,
                msg: 'Invalid UID'
            }
        }
    })
}

function removeUID() {
    // remove UID
    ipcMain.on('delete', (event, uid) => {
        db.remove({
            'uid': uid
        }, function (err) {
            event.sender.send('remove-room', uid)
            event.returnValue = (err === null)
        })
    })
}

function switchUID() {
    // send uid to main window
    ipcMain.on('switch', (event, uid) => {
        event.sender.send('switch-signal', uid)
        event.returnValue = ''
    })
}

function followers() {
    // get one day's follower number
    ipcMain.on('followers', (event, uid, date) => {
        let DATE_OBJECT = new Date()

        db.find({
            uid: uid
        }, function (err, docs) {
            if (err === null) {
                let fans = docs[0].fans

                for (let key in fans) {
                    if (key.toString() === date.toString()) {
                        event.returnValue = {
                            res: true,
                            msg: fans[key]
                        }
                        return
                    }
                }

                let currentDate = DATE_OBJECT.getFullYear() + '-'
                    + (DATE_OBJECT.getMonth() + 1).toString().padStart(2, '0') + '-'
                    + (DATE_OBJECT.getDate().toString().padStart(2, '0'))
                if (date.toString() === currentDate.toString()) {
                    getFollowers(uid).then(resolve => {
                        let data = resolve.data

                        if (data.follower !== undefined) {
                            fans[date] = data.follower

                            db.update({
                                uid: uid
                            }, {
                                $set: {
                                    fans: fans,
                                },
                            }, function (err) {
                                if (err === null) {
                                    event.returnValue = {
                                        res: true,
                                        msg: data.follower
                                    }
                                } else {
                                    event.returnValue = {
                                        res: false,
                                        msg: err
                                    }
                                }
                            })
                        } else {
                            event.returnValue = {
                                res: false,
                                msg: null
                            }
                        }
                    })
                } else {
                    event.returnValue = {
                        res: false,
                        msg: null
                    }
                }
            } else {
                event.returnValue = {
                    res: false,
                    msg: err
                }
            }
        })
    })
}

function updateFollowerJob() {
    db.find({}, function (err, docs) {
        const CURRENT_DATE = initDateTime(0)
        const FIVE_DAYS = [initDateTime(4), initDateTime(3), initDateTime(2), initDateTime(1), CURRENT_DATE]
        docs.forEach(doc => {
            getFollowers(doc.uid).then(resolve => {
                let data = resolve.data

                let fans = doc.fans
                fans[CURRENT_DATE] = data.follower

                if (data.follower !== undefined) {
                    cleanDate(FIVE_DAYS, doc, fans)
                }
            })
        })
    })
}

function cleanDate(FIVE_DAYS, doc, fans) {
    let isChange = false
    for (let key in fans) {
        if (FIVE_DAYS.indexOf(key.toString()) === -1) {
            delete fans[key]
            isChange = true
        }
    }

    if (isChange) {
        db.update(
            {uid: doc.uid},
            {
                $set: {
                    fans: fans,
                },
            },
            function (err) {
                if (err !== null) {
                    console.log(err)
                }
            })
    }
}

function initDateTime(day) {
    let nowDate = new Date()
    let agoDate = new Date(nowDate)
    let nowDay = nowDate.getDate()

    day = -day + nowDay
    agoDate.setDate(day)

    let agoDay = agoDate.getDate()
    let agoMonth = agoDate.getMonth() + 1
    let agoYear = agoDate.getFullYear()

    return (agoYear.toString() + '-' + agoMonth.toString().padStart(2, '0') + '-' + agoDay.toString().padStart(2, '0'))
}

function getFollowers(uid) {
    return axios({
        method: 'post',
        baseURL: 'http://localhost:' + PORT + '/relation-info/',
        data: {
            uid: uid
        }
    })
}

function liveRoom() {
    // get all live room ID
    ipcMain.on('live-room', (event) => {
        db.find({}, function (err, docs) {
            let list = []
            docs.forEach(doc => {
                list[list.length] = {
                    uid: doc.uid,
                    liveid: doc.liveid
                }
            })
            event.returnValue = list
        })
    })
}

function setAutoRecord() {
    ipcMain.on('set-auto-rec', (event, liveid, autoRec) => {
        db.update(
            {liveid: liveid},
            {
                $set: {
                    auto: autoRec,
                },
            },
            function (err) {
                event.returnValue = err === null;
            })
    })
}

function getAutoRecord() {
    ipcMain.on('get-auto-rec', (event, liveid) => {
        db.find(
            {liveid: liveid},
            function (err, docs) {
                event.returnValue = docs[0].auto;
            })
    })
}

function updateApp() {
    ipcMain.on('update-app', (event, currentVersion) => {
        checkUpdate().then(version => {
            if (version !== currentVersion) {
                event.returnValue = {
                    res: true,
                    version: version
                }
            } else {
                event.returnValue = {
                    res: false,
                    version: version
                }
            }
        })
    })
}

function settingNotification() {
    ipcMain.on('setting', (event, isShow) => {
        event.sender.send('go-setting', isShow)
        event.returnValue = ''
    })
}

function updateNotification() {
    ipcMain.on('check-update', (event) => {
        event.sender.send('go-update')
    })
}

function returnUpdateResult() {
    ipcMain.on('update-result', (event, updateResult) => {
        event.sender.send('go-update-result', updateResult)
    })
}

function openDialog() {
    ipcMain.on('open-dialog', (event, options) => {
        dialog.showOpenDialog({
            properties: [options, 'browserWindow', 'createDirectory', 'promptToCreate'],
            defaultPath: path.join(__dirname, '/')
        }).then(file => {
            event.returnValue = file
        })
    })
}

function setRecordPath() {
    ipcMain.on('set-rec-path', (event, path) => {
        fs.readFile('./config.json', (err, data) => {
            let str = data.toString()
            let json = JSON.parse(str)
            json.workspace = path
            fs.writeFile('./config.json', JSON.stringify(json), err => {
                event.returnValue = err
            })
        })
    })
}

function getRecordPath() {
    ipcMain.on('get-rec-path', (event) => {
        fs.readFile('./config.json', (err, data) => {
            let str = data.toString()
            let json = JSON.parse(str)
            event.returnValue = json.workspace
        })
    })
}