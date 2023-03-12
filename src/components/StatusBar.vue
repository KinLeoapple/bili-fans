<template>
  <div class="status-bar">
    <div class="version"><em>v1.0.0</em></div>
    <div class="new-version"><em></em></div>
  </div>
</template>

<script>
import '@/assets/css/status-bar.css';

import $ from 'jquery';
import {Tooltip} from "@/assets/js/tooltip";

const ipcRenderer = window.require('electron').ipcRenderer;

export default {
  name: "StatusBar",
  mounted() {
    this.checkForUpdate()
    setInterval(() => {
      this.checkForUpdate()
    }, 1000 * 60 * 30)
  },
  methods: {
    checkForUpdate: async function() {
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
      } else {
        $('.new-version em').html(``)
        newVersion.off('mouseover')
        toolTip.disable()
      }
    }
  }
}
</script>