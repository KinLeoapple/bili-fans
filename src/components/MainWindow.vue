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
      <perfect-scrollbar class="chart-scroll">
        <div class="fans-chart"></div>
      </perfect-scrollbar>
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
        this.renderFollowerChart()
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
      for (let i = 0; i < 7; i++) {
        let template = `<div class="fans-card" date="${this.initDateTime(i)}">
          <div class="fans-card-date">${this.initDateTime(i)}</div>
          <svg class="fans-card-date-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
               viewBox="0 0 16 16">
            <path fill-rule="evenodd"
                  d="M4.854 14.854a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V3.5A2.5 2.5 0 0 1 6.5 1h8a.5.5 0 0 1 0 1h-8A1.5 1.5 0 0 0 5 3.5v9.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4z"/>
          </svg>
          <div style="clear: both"></div>
          <p class="fans-card-number loading"></p>
          <div class="match-line"></div>
          <p class="fans-card-compare loading"></p>
          <div style="clear: both"></div>
        </div>`

        $('.fans-chart').append(template)
      }
    },
    initDateTime: function (day) {
      let nowDate = new Date()
      let agoDate = new Date(nowDate)
      let nowDay = nowDate.getDate()

      day = -day + nowDay
      agoDate.setDate(day)

      let agoDay = agoDate.getDate()
      let agoMonth = agoDate.getMonth() + 1
      let agoYear = agoDate.getFullYear()

      return (agoYear.toString() + '-' + agoMonth.toString().padStart(2, '0') + '-' + agoDay.toString().padStart(2, '0'))
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
  min-height: calc(100% - 10px - 50px - 2px - 1px);
  max-height: calc(100% - 10px - 50px - 2px - 1px);
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

.chart-scroll {
  width: 100%;
  min-height: calc(100% - 50px - 10px - 20px);
  max-height: calc(100% - 50px - 10px - 20px);
  overflow: hidden;
  margin-top: 10px;
  margin-bottom: 10px;
}

.fans-chart {
  width: 96%;
  max-width: 96%;
  min-height: calc(100% - 50px - 10px);
  height: auto;
  border-radius: 6px;
  display: inline-flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}
</style>

<style>
.chart-top-btn-active {
  background: #2c3e50;
  color: white;
}

.fans-card {
  min-width: 90%;
  max-width: 90%;
  min-height: 70px;
  max-height: 70px;
  border-radius: 10px;
  border: #2c3e50 1px solid;
  transition: all .2s linear;
}

.fans-card:hover {
  box-shadow: 0 0 10px 1px rgba(40, 40, 40, 0.51);
}

.fans-card-date {
  width: 100px;
  height: 25px;
  border-radius: 6px;
  background: #2c3e50;
  color: white;
  text-align: center;
  line-height: 25px;
  margin: 5px 3px;
  user-select: none;
  display: inline-block;
  float: left;
}

.fans-card-date-icon {
  width: 16px;
  height: 16px;
  transform: rotateY(180deg);
  margin: 15px 0 2px 0;
  display: inline-block;
  float: left;
}

.fans-card-number {
  min-width: 140px;
  width: 100px;
  height: 30px;
  margin: 0 45px;
  display: inline-block;
  float: left;
}

.match-line {
  width: 320px;
  height: 1px;
  border-bottom: #2c3e50 1px dashed;
  /*display: inline-block;*/
  /*float: left;*/
  margin-top: 15px;
  margin-left: 150px;
}

.fans-card-compare {
  min-width: 100px;
  width: 100px;
  height: 30px;
  display: inline-block;
  float: right;
  margin: -16px 10px;
}
</style>