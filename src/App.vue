<script setup>
import SideBar from "@/components/SideBar.vue";
import MainWindow from "@/components/MainWindow.vue";
import StatusBar from "@/components/StatusBar.vue";
import MenuBar from "@/components/MenuBar.vue";
</script>

<template>
  <menu-bar/>
  <div class="frame">
    <side-bar ref="side-bar"/>
    <main-window ref="main-window"/>
  </div>
  <status-bar/>
</template>

<script>
import {BililiveRec} from "@bililive/rec-sdk";

const ipcRenderer = window.require('electron').ipcRenderer;

let REC_PORT
// eslint-disable-next-line no-unused-vars
let bRecInstance

export default {
  name: 'App',
  mounted() {
    let runLoop = setInterval(() => {
      let isRun = ipcRenderer.sendSync('window-run')
      if (isRun) {
        clearInterval(runLoop)
        REC_PORT = ipcRenderer.sendSync('rec-port')
        bRecInstance = new BililiveRec({httpUrl: `http://localhost:${REC_PORT}`})
        console.log(REC_PORT)

        this.$refs["side-bar"].run()
        this.$refs["main-window"].run()
      }
    }, 200)
  }
}
</script>

<style>
@font-face {
  font-family: LCD;
  src: url("@/assets/font/Technology-BoldItalic.ttf");
}

html, body, #app {
  width: 100%;
  height: 100%;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  justify-items: center;
  align-content: center;
  align-items: center;
  padding: 0;
  margin: 0;
  background: transparent;
}

#app {
  width: 800px;
  height: 600px;
  border-radius: 10px;
  box-shadow: 0 0 10px 1px rgba(0, 0, 0, 0.7);
}

.frame {
  width: 100%;
  height: calc(100% - 61px);
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  justify-items: center;
  align-content: center;
  align-items: center;
}

.loading {
  background: linear-gradient(90deg, #f2f2f2 25%, #d1d1d1 40%, #f2f2f2 50%);
  background-size: 400% 400%;
  border-radius: 3px;
  animation: loading 1.8s ease infinite;
}

@keyframes loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
