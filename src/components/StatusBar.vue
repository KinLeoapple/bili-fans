<template>
  <div class="status-bar">
    <div class="version"><em v-text="'v' + getAppVersion()"></em></div>
    <div class="new-version"><em></em></div>
  </div>
</template>

<script>
import '@/assets/css/status-bar.css';

import $ from 'jquery';
import {Tooltip} from "@/assets/js/tooltip";
import {getAppVersion} from "@/assets/js/version.js";

const ipcRenderer = window.require('electron').ipcRenderer;

export default {
  name: "StatusBar",
  mounted() {
    ipcRenderer.on('go-update', () => {
      this.checkForUpdate().then(result => {
        ipcRenderer.send('update-result', result)
      })
    })
    this.checkForUpdate().then(result => {
      ipcRenderer.send('update-result', result)
    })
    setInterval(() => {
      this.checkForUpdate().then(result => {
        ipcRenderer.send('update-result', result)
      })
    }, 1000 * 60 * 30)
  },
  methods: {
    getAppVersion,
    checkForUpdate: async function () {
      return new Promise(resolve => {
        let currentVersion = $('.version em').html().toString().replace('v', '')
        let result = ipcRenderer.sendSync('update-app', currentVersion)
        let newVersion = $('.new-version')
        let toolTip = Tooltip(newVersion[0], `New Version Found v${result.version}`)
        if (result.res) {
          $('.new-version em').html(`Update Available`)
          newVersion.on('mouseover', () => {
            newVersion.css({
              'background': '#17222a',
              'cursor': 'pointer'
            })
          })
          toolTip.enable()
          resolve(true)
        } else {
          $('.new-version em').html(``)
          newVersion.off('mouseover')
          toolTip.disable()
          resolve(false)
        }
      })
    }
  }
}
</script>