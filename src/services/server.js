import {ipcMain} from 'electron';

const NeDB = require('nedb');

export class Server {

    constructor(port) {
        this.PORT = port
    }

    start() {
        let PORT = this.PORT

        // load database
        let db = new NeDB({
            filename: './data.db',
            autoload: true,
        })

        // get port
        ipcMain.on('port', event => {
            event.returnValue = PORT
        })

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
        });

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
                                db.insert({
                                    'uid': uid,
                                    'fans': {}
                                }, function (err) {
                                    event.returnValue = {
                                        res: (err === null),
                                        msg: err
                                    }
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

        // remove UID
        ipcMain.on('delete', (event, uid) => {
            db.remove({
                'uid': uid
            }, function (err) {
                event.returnValue = (err === null)
            })
        })
    }
}