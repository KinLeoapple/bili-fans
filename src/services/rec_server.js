import {ipcMain} from "electron";


let REC_PORT

export class RecServer {

    constructor(port) {
        REC_PORT = port
    }

    start() {
        recPort()
    }
}

function recPort() {
    ipcMain.on('rec-port', event => {
        event.returnValue = REC_PORT
    })
}