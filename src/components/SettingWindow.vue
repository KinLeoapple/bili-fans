<template>
  <div class="setting-window">
    <div class="setting-title">
      <span>⚙️<em>SETTINGS</em></span>
    </div>
    <div class="setting-title-line"></div>
    <p class="setting-sub-title"><em>Record Path</em></p>
    <div class="setting-block">
      <div class="record-path" v-text="showRecPath()"></div>
      <div class="select-record-path-btn btn-hover" @click="openDirectory()">Browse</div>
    </div>
    <p class="setting-sub-title"><em>Updates</em></p>
    <div class="setting-block">
      <div class="update-btn btn-hover">Check for Updates</div>
      <div class="current-version" v-text="'v' + getAppVersion()"></div>
    </div>
    <p class="setting-sub-title"><em>About</em></p>
    <div class="setting-block">
      <div class="github-btn">
        <svg @click="openGithub()" xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor"
             class="btn-hover" viewBox="0 0 16 16">
          <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        <div class="github-text">View More on Github</div>
      </div>
    </div>
    <div class="close-setting btn-hover" @click="confirm()">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path
            d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
      </svg>
      CONFIRM
    </div>
  </div>
</template>

<script>
import '@/assets/css/setting-window.css';

import $ from "jquery";
import {getAppVersion} from "@/assets/js/version.js";

const ipcRenderer = window.require('electron').ipcRenderer;
const shell = window.require('electron').shell;

let isDisable = false

export default {
  name: "SettingWindow",
  mounted() {
    this.$nextTick(() => {
      this.checkForUpdate()

      ipcRenderer.on('go-update-result', (event, updateResult) => {
        let btn = $('.update-btn')
        if (updateResult) {
          isDisable = true
          btn.html('New Version Found')
          btn.off('click')
          btn.addClass('new-version-message')
          btn.removeClass('btn-hover')
          this.downloadLatestVersion()
        } else {
          if ($('.setting-window').css('display') !== 'none') {
            btn.html('App is Up to Date')
            setTimeout(() => {
              btn.html('Check for Updates')
            }, 5000)
          }
        }
      })
    })
  },
  methods: {
    getAppVersion,
    hide() {
      $('.setting-window').hide()
    },
    show() {
      $('.setting-window').show()
    },
    showRecPath() {
      return ipcRenderer.sendSync('get-rec-path')
    },
    // open directory
    openDirectory() {
      let folder = ipcRenderer.sendSync('open-dialog', 'openDirectory')
      let path = folder.filePaths[0]
      if (path !== undefined) {
        $('.record-path').html(path)
        ipcRenderer.send('set-rec-path', path)
      }
    },
    // check for the latest version
    checkForUpdate() {
      $('.update-btn').on('click', () => {
        if (!isDisable) {
          let btn = $('.update-btn')

          isDisable = true
          ipcRenderer.send('check-update')
          btn.off('click')
          btn.css('cursor', 'no-drop')

          setTimeout(() => {
            this.checkForUpdate()
            isDisable = false
            btn.css('cursor', 'pointer')
          }, 5000)
        }
      })
    },
    // download the latest version
    downloadLatestVersion() {
      let currentVersion = $('.current-version')
      currentVersion.html('Download')
      currentVersion.on('click', () => {

      })
      currentVersion.css('cursor', 'pointer')
      currentVersion.addClass('download-btn')
      currentVersion.addClass('btn-hover')
    },
    // open project on GitHub
    openGithub() {
      shell.openExternal('https://github.com/KinLeoapple/bili-fans')
    },
    confirm() {
      ipcRenderer.send('setting', false)
    }
  }
}
</script>