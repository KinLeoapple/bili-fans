<template>
  <div class="main-window">
    <div class="top-bar">
      <div class="current-fans">
        <img class="current-avatar" src="../assets/img/avatar.png" alt="" crossorigin="anonymous">
        <em class="fans-title">Followers</em>
        <div class="fans-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd"
                  d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
          </svg>
        </div>
        <span class="fans-number">0</span>
      </div>
      <div class="refresh-window-btn-box">
        <svg class="refresh-window-btn" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
             viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path
              d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
      </div>
    </div>
<!--    <div class="line"></div>-->
    <div class="chart-box">
      <!-- 实现录播、查看粉丝数等功能 -->
      <div class="chart-top-bar">
        <span class="follower-btn"><em>Fans</em></span>
        <span class="live-btn"><em>Live</em></span>
      </div>
      <div class="line"></div>
      <div class="fans-chart">
        <div class="fans-card">
          <div class="fans-card-date"></div>
          <div class="fans-card-number loading"></div>
          <div class="fans-card-compare loading"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import {sleep} from "@/assets/js/sleep";
import {CountUp} from "countup.js";
import $ from 'jquery';

const ipcRenderer = window.require('electron').ipcRenderer;

let PORT
let isDisable = true
let UID = ''

export default {
  name: "MainWindow",
  methods: {
    run() {
      this.$nextTick(() => {
        PORT = ipcRenderer.sendSync('port')

        this.switchUID()
        this.refreshWindow()
      })
    },
    // switch current uid
    switchUID() {
      ipcRenderer.on('switch-signal', (event, uid, avatar) => {
        // if new uid not equal to the old uid
        if (UID.toString() !== uid.toString()) {
          isDisable = true
          UID = uid
          this.renderWindow(avatar)
          isDisable = false
        }
      })
    },
    // render this window
    renderWindow(avatar) {
      let countUp = new CountUp($('.fans-number')[0], 0)
      if (avatar !== undefined) {
        $('.current-avatar').attr('src', avatar)
      }
      // sleep for 200ms
      sleep(200).then(() => {
        this.getAllInfo(UID).then(resolve => {
          let data = resolve.data
          console.log(data)

          this.scrollNumber(countUp, data.follower)
        })
      })
    },
    // render pass 7 days fans number
    renderFollowerChart() {

    },
    // get all user info from server
    getAllInfo(uid) {
      return axios({
        method: 'post',
        baseURL: 'http://localhost:' + PORT + '/relation-info/',
        data: {
          uid: uid
        }
      })
    },
    scrollNumber(countUp, num) {
      countUp.update(num)
      countUp.start()
    },
    // refresh window
    refreshWindow() {
      $('.refresh-window-btn').on('click', () => {
        if (!isDisable) {
          let btn = $('.refresh-window-btn')
          btn.css('transform', 'rotate(-360deg)')
          btn.css('transition', 'all 0s linear')
          isDisable = true

          this.renderWindow()

          btn.off('click')
          $('.refresh-window-btn-box').css('cursor', 'not-allowed')
          setTimeout(() => {
            btn.css('transform', 'none')
            btn.css('transition', 'all .5s linear')
          }, 550)
          setTimeout(() => {
            isDisable = false
            $('.refresh-window-btn-box').css('cursor', 'pointer')
            this.refreshWindow()
          }, 5000)
        }
      })
    },
  }
}
</script>

<style scoped>
.main-window {
  height: 100%;
  flex: 1;
  display: inline-flex;
  background: white;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.top-bar {
  width: 100%;
  height: 50px;
  position: relative;
  display: inline-flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
}

.current-fans {
  height: 50px;
  line-height: 50px;
  display: inline-flex;
  font-size: 20px;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  -webkit-user-select: none;
}

.current-avatar {
  width: 40px;
  height: 40px;
  margin: 10px;
}

.fans-title {
  height: 30px;
  line-height: 30px;
  margin: 10px 5px 10px 0;
  font-size: 16px;
  font-weight: bold;
  border-top: #2c3e50 1px dashed;
  border-bottom: #2c3e50 1px dashed;
}

.fans-pointer {
  width: 20px;
  height: 20px;
  display: inline-flex;
  justify-content: flex-start;
  align-items: center;
}

.fans-number {
  font-family: LCD, serif;
  font-size: 22px;
  min-width: 50px;
  height: 30px;
  line-height: 50px;
  margin: 10px 10px 10px 5px;
  border-radius: 6px;
  background: #2c3e50;
  color: white;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 2px 5px;
  letter-spacing: 2px;
  text-align: center;
}

.refresh-window-btn-box {
  width: 20px;
  height: 20px;
  padding: 5px;
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  margin-left: calc(100% - 45px);
  border-radius: 8px;
  border: #2c3e50 1px solid;
  transition: all .2s linear;
}

.refresh-window-btn-box:hover {
  color: white;
  background: #2c3e50;
}

.refresh-window-btn {
  width: 20px;
  height: 20px;
  transition: all .2s linear;
}

/*.line {*/
/*  width: 80%;*/
/*  height: 1px;*/
/*  border-radius: 10px;*/
/*  background: #2c3e50;*/
/*  margin-top: 10px;*/
/*  margin-bottom: 10px;*/
/*}*/

.chart-box {
  min-width: 98%;
  width: 98%;
  max-width: 98%;
  min-height: calc(100% - 10px - 50px - 5px - 1px);
  max-height: calc(100% - 10px - 50px - 5px - 1px);
  border-radius: 6px;
  display: inline-flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  border: #2c3e50 1px solid;
}

.chart-top-bar {
  width: 98%;
  max-width: 98%;
  height: 50px;
  display: inline-flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.follower-btn, .live-btn {
  min-width: 50px;
  width: auto;
  max-height: 70px;
  height: 30px;
  line-height: 30px;
  border-radius: 50px;
  text-align: center;
  font-weight: bold;
  border: #2c3e50 1px solid;
  padding: 0 5px;
  user-select: none;
  cursor: pointer;
  transition: all .2s linear;
}

.follower-btn:hover, .live-btn:hover {
  background: #2c3e50;
  color: white;
}

.line {
  width: 100px;
  height: 1px;
  border-bottom: #2c3e50 1px dashed;
  margin: 10px 10px 10px calc((100% - 50% + 160px) * -1);
}

.fans-chart {
  width: 96%;
  max-width: 96%;
  height: calc(100% - 50px - 10px);
  border-radius: 6px;
  /*box-shadow: 0 0 5px 1px rgba(40, 40, 40, 0.51);*/
}

.fans-card {

}
</style>

<style>
.chart-top-btn-active {
  background: #2c3e50;
  color: white;
}
</style>