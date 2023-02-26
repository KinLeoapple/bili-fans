<template>
  <div class="menu-bar">
    <div class="menu-title">
      🙀
      <div class="line"></div>
      <em class="menu-text">Bili-Fans</em>
    </div>
    <div class="menu-btn-box">
      <div class="min-window">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z"/>
        </svg>
      </div>
      <div class="close-window">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
import $ from 'jquery';

const ipcRenderer = window.require('electron').ipcRenderer;

export default {
  name: "MenuBar",
  mounted() {
    this.$nextTick(() => {
      this.closeWindow()
      this.minWindow()
    })
  },
  methods: {
    closeWindow() {
      $('.close-window').on('click', () => {
        ipcRenderer.send('window-close')
      })
    },
    minWindow() {
      $('.min-window').on('click', () => {
        ipcRenderer.send('window-min')
      })
    }
  }
}
</script>

<style scoped>
.menu-bar {
  width: 100%;
  height: 30px;
  position: relative;
  background: white;
  color: #2c3e50;
  border-bottom: #2c3e50 1px solid;
  display: inline-flex;
  flex-direction: row;
  -webkit-app-region: drag;
  -webkit-user-select: none;
  border-radius: 10px 10px 0 0;
}

.menu-title {
  height: 30px;
  line-height: 30px;
  margin-left: 10px;
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.line {
  height: 20px;
  width: 1px;
  border-radius: 10px;
  background: #2c3e50;
  margin: 10px;
}

.menu-text {
  font-weight: bolder;
  letter-spacing: 1px;
}

.menu-btn-box {
  width: 90px;
  height: 30px;
  position: absolute;
  margin-left: calc(100% - 100px);
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.close-window, .min-window {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  padding: 2px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  -webkit-app-region: no-drag;
  cursor: pointer;
  margin: 10px;
  transition: all .15s linear;
}

.close-window:hover, .min-window:hover {
  background: #2c3e50;
  color: white;
}
</style>