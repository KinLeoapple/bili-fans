<template>
  <div class="setting-window">
    <div class="setting-title">
      ⚙️<em>SETTINGS</em>
      <div class="setting-title-line"></div>
    </div>
    <p class="setting-sub-title"><em>Record Path</em></p>
    <div class="setting-block">
      <div class="record-path"></div>
      <div class="select-record-path-btn" @click="openDirectory()">Browse</div>
    </div>
    <p class="setting-sub-title"><em>Updates</em></p>
    <div class="setting-block">
      <div class="update-btn" @click="checkForUpdate()">Check for Updates</div>
      <div class="current-version">v1.0.0</div>
    </div>
  </div>
</template>

<script>
import '@/assets/css/setting-window.css';

import $ from "jquery";

const ipcRenderer = window.require('electron').ipcRenderer;

export default {
  name: "SettingWindow",
  methods: {
    hide() {
      $('.setting-window').hide()
    },
    show() {
      $('.setting-window').show()
    },
    openDirectory() {
      let folder = ipcRenderer.sendSync('open-dialog', 'openDirectory')
      let path = folder.filePaths[0]
      if (path !== undefined) {
        $('.record-path').html(path)
      }
    },
    checkForUpdate() {

    },
  }
}
</script>

<style scoped>

</style>