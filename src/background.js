'use strict'

import {app, BrowserWindow, Menu, protocol, ipcMain } from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS3_DEVTOOLS} from 'electron-devtools-installer'
import {Server} from "@/services/server";
import {scanPort} from "@/services/scan-port";
import {runPython} from "@/services/run-py";
import axios from "axios";
import path from "path";

const isDevelopment = process.env.NODE_ENV !== 'production'

let PORT

// Scan usable port
scanPort(8888, function (port) {
    PORT = port
}).then(() => {
    console.log('Usable Port Found: ' + PORT)

    // Start Python
    runPython(PORT)
        .then(PROCESS => {
            // Stop Python server
            function quit() {
                axios({
                    method: 'post',
                    baseURL: 'http://localhost:' + PORT + '/stop/'
                }).then(() => {
                    // Shutdown Python Process
                    if (PROCESS !== undefined) {
                        PROCESS.kill('SIGINT')
                    }
                    app.quit()
                }).catch(err => {
                    console.log('app exit error: ' + err)
                })
            }

            // Scheme must be registered before the app is ready
            protocol.registerSchemesAsPrivileged([
                {scheme: 'app', privileges: {secure: true, standard: true}}
            ])

            let win
            async function createWindow() {
                // Create the browser window.
                win = new BrowserWindow({
                    width: 820,
                    height: 620,
                    resizable: false,
                    frame: false,
                    transparent: true,
                    webPreferences: {

                        // Use pluginOptions.nodeIntegration, leave this alone
                        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
                        // nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
                        // contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
                        nodeIntegration: true,
                        enableRemoteModule: true,
                        contextIsolation: false,
                        webSecurity: false
                    }
                })

                Menu.setApplicationMenu(null)
                win.setIcon(path.join(__dirname, 'logo.png'))
                win.center()

                if (process.env.WEBPACK_DEV_SERVER_URL) {
                    // Load the url of the dev server if in development mode
                    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
                    if (!process.env.IS_TEST) win.webContents.openDevTools()
                } else {
                    createProtocol('app')
                    // Load the index.html when not in development
                    win.loadURL('app://./index.html')
                }
            }

            // Menu button event
            ipcMain.on('window-close', () => win.destroy())
            ipcMain.on('window-min', () => win.minimize())

            // Quit when all windows are closed.
            app.on('window-all-closed', () => {
                // On macOS it is common for applications and their menu bar
                // to stay active until the user quits explicitly with Cmd + Q
                if (process.platform !== 'darwin') {
                    quit()
                }
            })

            app.on('activate', () => {
                // On macOS it's common to re-create a window in the app when the
                // dock icon is clicked and there are no other windows open.
                if (BrowserWindow.getAllWindows().length === 0) createWindow()
            })

            // This method will be called when Electron has finished
            // initialization and is ready to create browser windows.
            // Some APIs can only be used after this event occurs.
            app.on('ready', async () => {
                if (isDevelopment && !process.env.IS_TEST) {
                    // Install Vue Devtools
                    try {
                        await installExtension(VUEJS3_DEVTOOLS)
                    } catch (e) {
                        console.error('Vue Devtools failed to install:', e.toString())
                    }
                }
                createWindow()
            })

            // Exit cleanly on request from parent process in development mode.
            if (isDevelopment) {
                if (process.platform === 'win32') {
                    process.on('message', (data) => {
                        if (data === 'graceful-exit') {
                            quit()
                        }
                    })
                } else {
                    process.on('SIGTERM', () => {
                        quit()
                    })
                }
            }

            // Start Server
            const server = new Server(PORT)
            server.start()
        })

    process.on('unhandledRejection', error => {
        console.log('unhandledRejection', error.message);
    })
})