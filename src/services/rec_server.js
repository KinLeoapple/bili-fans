import {ipcMain} from "electron";

export class RecServer {

    constructor(port) {
        this.REC_PORT = port
    }

    start() {
        let REC_PORT = this.REC_PORT

        // get rec port
        ipcMain.on('rec-port', event => {
            event.returnValue = REC_PORT
        })
    }
}