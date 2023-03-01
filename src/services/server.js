import {ipcMain} from 'electron';
import axios from "axios";

const NeDB = require('nedb');
const schedule = require('node-schedule');

let PORT
// load database
let db = new NeDB({
    filename: './data.db',
    autoload: true,
})
let job

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

    start() {
        port()
        upList()
        appendUID()
        removeUID()
        switchUID()
        followers()
        liveRoom()
    }

    stop() {
        if (job !== undefined) {
            job.cancel()
        }
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
    ipcMain.on('switch', (event, uid, avatar) => {
        event.sender.send('switch-signal', uid, avatar)
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
                    for (let key in fans) {
                        if (FIVE_DAYS.indexOf(key.toString()) === -1) {
                            delete fans[key]
                        }
                    }

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
            })
        })
    })
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