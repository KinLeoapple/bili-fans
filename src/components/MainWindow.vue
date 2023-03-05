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
        <div class="current-compare"></div>
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
    <div class="chart-box">
      <!-- 实现录播、查看粉丝数等功能 -->
      <div class="chart-top-bar">
        <span class="live-btn"><em>Live</em></span>
        <span class="follower-btn"><em>Fans</em></span>
      </div>
      <div class="line"></div>
      <perfect-scrollbar class="chart-scroll">
        <div class="fans-chart"></div>
        <div class="live-chart">
          <div class="live-chart-top">
            <div class="rec-btn-container">
              <div class="rec-btn">
                <div class="rec-btn-dot"></div>
              </div>
              <em>Recording</em>
            </div>
            <img src="" class="live-cover" alt="" crossorigin="anonymous"/>
          </div>
          <div class="live-chart-bottom">
            <div class="live-title-box">
              <div class="live-is-stream"></div>
              <span class="live-title"></span>
            </div>
            <div class="live-area"></div>
          </div>
        </div>
      </perfect-scrollbar>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import {sleep} from "@/assets/js/sleep";
import {CountUp} from "countup.js";
import $ from 'jquery';
import {BililiveRec} from "@bililive/rec-sdk";

const ipcRenderer = window.require('electron').ipcRenderer;

let PORT
let isDisable = true
let UID = ''
let current = 0
let REC_PORT
let bRecInstance
let liveRooms = {}
let liveCover = {}
let liveStat = {}
let currentLoop

export default {
  name: "MainWindow",
  methods: {
    run() {
      this.$nextTick(() => {
        PORT = ipcRenderer.sendSync('port')

        this.runBililiveRecorder()

        // append current all live room
        let rooms = ipcRenderer.sendSync('live-room')
        rooms.forEach(r => {
          this.appendLiveRoom(r.uid, r.liveid)
        })

        // append live room
        ipcRenderer.on('append-room', (event, uid, liveid) => {
          this.appendLiveRoom(uid, liveid)
        })

        // remove live room
        ipcRenderer.on('remove-room', (event, uid) => {
          this.removeLiveRoom(uid)
        })
      })

      this.fansBtn()
      this.liveBtn()
      this.switchUID()
      this.refreshWindow()
    },
    // switch current uid
    switchUID() {
      ipcRenderer.on('switch-signal', (event, uid) => {
        // if new uid not equal to the old uid
        if (UID.toString() !== uid.toString()) {
          isDisable = true
          UID = uid
          $('.live-cover').attr('src', `${require('@/assets/img/cover.png')}`)
          $('.live-btn').click()
          if (currentLoop !== undefined) {
            clearInterval(currentLoop)
          }
          $('.live-is-stream').css('background', '#d04748')
          let liveTitle = $('.live-title')
          liveTitle.html('')
          liveTitle.addClass('loading')
          let liveArea = $('.live-area')
          liveArea.html('')
          liveArea.addClass('loading')
          this.renderWindow(uid)
          isDisable = false
        }
      })
    },
    // render this window
    renderWindow(uid) {
      let src = $(`[uid=${uid}] .avatar`).attr('src')
      let avatar
      console.log(src)
      if (src !== undefined) {
        avatar = src
      } else {
        avatar = `${require('@/assets/img/avatar.png')}`
      }
      let countUp = new CountUp($('.fans-number')[0], 0)
      $('.current-avatar').attr('src', avatar)
      // sleep for 200ms
      sleep(200).then(() => {
        this.getAllInfo(UID).then(resolve => {
          let data = resolve.data
          console.log(data)

          current = data.follower
          this.scrollNumber(countUp, data.follower)

          this.updateLiveCover(UID).then(cover => {
            liveCover[UID] = cover
          })

          this.renderFollowerChart()
          this.renderLiveChart()
          this.resetLiveSwitch()
          this.recordLiveSwitch()
        })
      })
    },
    // render pass 5 days fans number
    renderFollowerChart() {
      let resultList = []

      let chart = $('.fans-chart')
      chart.html('')

      for (let i = 0; i < 5; i++) {

        let date = this.initDateTime(i)

        let template = `<div class="fans-card" date="${date}">
            <div class="fans-card-date">${date}</div>
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

        chart.append(template)

        sleep(200).then(() => {
          let result = ipcRenderer.sendSync('followers', UID, date)

          let number = $(`[date=${date}] .fans-card-number`)
          if (result.res) {
            number.removeClass('loading')
            number.html(result.msg.toLocaleString())
            resultList[i] = result.msg
          } else {
            number.removeClass('loading')
            number.html('NO DATA')
            console.log(result.msg)
            resultList[i] = -1
          }
          number.css('min-width', '100px')
        })
      }

      new Promise(resolve => {
        let waitLoop = setInterval(() => {
          if (resultList.length === 5) {
            clearInterval(waitLoop)
            resolve(resultList)
          }
        }, 200)
      }).then(list => {
        let template = `<svg class="compare-pointer" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                </svg>`
        let countable = 0
        for (let i = 0; i < list.length; i++) {
          if (list[i] !== -1) {
            let perCountable = countable
            countable = i
            let compare = list[perCountable] - list[countable]
            if (compare >= 0) {
              chart.children()[perCountable].querySelector('.fans-card-compare').innerHTML = template + Math.abs(compare)
              $(chart.children()[perCountable].querySelector('.fans-card-compare .compare-pointer')).css('transform', 'rotateX(180deg)')
              $(chart.children()[perCountable].querySelector('.fans-card-compare')).css('color', '#6eb025')
            } else if (compare < 0) {
              chart.children()[perCountable].querySelector('.fans-card-compare').innerHTML = template + Math.abs(compare)
              $(chart.children()[perCountable].querySelector('.fans-card-compare')).css('color', '#d04748')
            }
            $(chart.children()[countable].querySelector('.fans-card-compare')).removeClass('loading')
            $(chart.children()[i].querySelector('.fans-card-compare')).removeClass('loading')
          } else {
            chart.children()[i].querySelector('.fans-card-compare').innerHTML = 'NO DATA'
          }
          $(chart.children()[countable].querySelector('.fans-card-compare')).removeClass('loading')
          $(chart.children()[i].querySelector('.fans-card-compare')).removeClass('loading')
        }
        chart.children()[list.length - 1].querySelector('.fans-card-compare').innerHTML = 'NO DATA'
        $(chart.children()[list.length - 1].querySelector('.fans-card-compare')).removeClass('loading')
        this.compareCurrent()
      })
    },
    // compare to current fans number
    compareCurrent() {
      let template = `<svg class="compare-pointer" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                </svg>`

      let chart = $('.fans-chart')
      let latest = chart.children()[0].querySelector('.fans-card-number').innerHTML
      if (latest !== undefined && latest !== null && latest !== 'NO DATA') {
        latest = parseInt(latest.toString().replaceAll(',', ''))
        let compare = current - latest
        let compareElement = $('.current-compare')
        if (current < 0) {
          compareElement.html(template + Math.abs(compare))
          compareElement.css('color', '#d04748')
        } else if (current >= 0) {
          compareElement.html(template + Math.abs(compare))
          $(compareElement[0].querySelector('.compare-pointer')).css('transform', 'rotateX(180deg)')
          compareElement.css('color', '#6eb025')
        }
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
    // scroll number animation
    scrollNumber(countUp, num) {
      countUp.update(num)
      countUp.start()
    },
    // render live chart
    renderLiveChart() {
      let cover = $('.live-cover')
      cover.attr('src', liveCover[UID])
      currentLoop = setInterval(() => {
        this.refreshRoomInfo(liveRooms[UID])
      }, 6000)
    },
    // refresh window
    refreshWindow() {
      $('.refresh-window-btn-box').on('click', () => {
        if (!isDisable) {
          let btn = $('.refresh-window-btn')
          let btnBox = $('.refresh-window-btn-box')
          btn.css('transform', 'rotate(-360deg)')
          btn.css('transition', 'all 0s linear')
          isDisable = true

          this.renderWindow(UID)

          btnBox.off('click')
          btnBox.css('cursor', 'not-allowed')
          setTimeout(() => {
            btn.css('transform', 'none')
            btn.css('transition', 'all .5s linear')
          }, 550)
          setTimeout(() => {
            isDisable = false
            btnBox.css('cursor', 'pointer')
            this.refreshWindow()
          }, 5000)
        }
      })
    },
    // run recorder instance
    runBililiveRecorder() {
      REC_PORT = ipcRenderer.sendSync('rec-port')
      bRecInstance = new BililiveRec({httpUrl: `http://localhost:${REC_PORT}`})
      bRecInstance.getConfig().then(config => {
        config.optionalSaveStreamCover = {hasValue: true, Value: true}
        bRecInstance.setConfig(config)
      })
    },
    // append live room
    appendLiveRoom: function (uid, liveid) {
      if (liveid !== undefined) {
        bRecInstance.addRoom({roomId: Number(liveid), autoRecord: true}).then(() => {
          liveRooms[uid] = Number(liveid)
          let autoRec = ipcRenderer.sendSync('get-auto-rec', Number(liveid))
          console.log(autoRec)
          if (autoRec === false) {
            let dot = $('.rec-btn-dot')
            let recBtn = $('.rec-btn')
            recBtn.css('background-color', '#d04748')
            dot.css('margin-left', '18px')
            this.stopRec(liveRooms[UID])
            $('.rec-btn-container em').html('NOT Recording')
            this.stopRec(Number(liveid))
          }
          this.updateLiveCover(uid).then(cover => {
            liveCover[uid] = cover
          })
        })
      } else {
        liveRooms[uid] = undefined
      }
    },
    // remove live room
    removeLiveRoom: function (uid) {
      if (liveRooms[uid] !== undefined) {
        let liveid = liveRooms[uid]
        bRecInstance.fetchRoom(liveid).then(room => {
          room.stop().then(() => {
            room.remove().then(() => {
              delete liveRooms[uid]
              delete liveCover[uid]
              delete liveStat[uid]
            })
          })
        })
      }
    },
    // refresh room info (better refresh in 6s, which is 6000ms)
    refreshRoomInfo(liveid) {
      bRecInstance.refreshRooms().then(() => {
        bRecInstance.fetchRoom(liveid).then(info => {
          let data = info.roomInfo

          let liveArea = $('.live-area')
          liveArea.removeClass('loading')
          liveArea.html(data.areaNameParent + ' - ' + data.areaNameChild)
          let liveTitle = $('.live-title')
          liveTitle.removeClass('loading')
          liveTitle.html(data.title)
          if (data.streaming) {
            $('.live-is-stream').css('background', '#6eb025')
          } else {
            $('.live-is-stream').css('background', '#d04748')
          }
        })
      })
    },
    // record live switcher
    recordLiveSwitch() {
      $('.rec-btn-dot').on('click', () => {
        let dot = $('.rec-btn-dot')
        // #6eb025
        let recBtn = $('.rec-btn')
        let recColor = this.colorHex(recBtn.css('background-color'))
        console.log(recColor)
        if (recColor === '#6eb025') {
          recBtn.css('background-color', '#d04748')
          dot.css('margin-left', '18px')
          this.stopRec(liveRooms[UID])
          $('.rec-btn-container em').html('NOT Recording')
        } else {
          recBtn.css('background-color', '#6eb025')
          dot.css('margin-left', '0')
          this.startRec(liveRooms[UID])
          $('.rec-btn-container em').html('Recording')
        }
      })
    },
    // reset live switcher
    resetLiveSwitch() {
      let isRecording = true
      if (liveStat[UID] === undefined) {
        isRecording = true
      } else {
        isRecording = liveStat[UID]
      }
      let dot = $('.rec-btn-dot')
      dot.off('click')
      let recBtn = $('.rec-btn')
      if (isRecording) {
        recBtn.css('background', '#6eb025')
        dot.css('margin-left', '0')
        $('.rec-btn-container em').html('Recording')
      } else {
        recBtn.css('background', '#d04748')
        dot.css('margin-left', '18px')
        $('.rec-btn-container em').html('NOT Recording')
      }
    },
    // stop current room recording
    stopRec: async function (liveid) {
      bRecInstance.fetchRoom(liveid).then(room => {
        room.stop()
        ipcRenderer.sendSync('set-auto-rec', liveid, false)
        liveStat[UID] = false
        console.log(liveStat)
      })
    },
    // start current room recoding
    startRec: async function (liveid) {
      bRecInstance.fetchRoom(liveid).then(room => {
        room.start()
        ipcRenderer.sendSync('set-auto-rec', liveid, true)
        liveStat[UID] = true
        console.log(liveStat)
      })
    },
    // update live room info
    updateLiveInfo(uid) {
      return axios({
        method: 'post',
        baseURL: 'http://localhost:' + PORT + '/live-info/',
        data: {
          uid: uid
        }
      })
    },
    // update live room cover
    updateLiveCover(uid) {
      return new Promise(resolve => {
        this.updateLiveInfo(uid).then(info => {
          let cover = info.data.live_room.cover
          let url = `https://wsrv.nl/?url=${cover}`
          this.convertImgToBase64(url, base64Img => {
            resolve(base64Img)
          })
        })
      })
    },
    // convert image url to Base64
    convertImgToBase64(url, callback) {
      let canvas = document.createElement('CANVAS'),
          ctx = canvas.getContext('2d'),
          img = new Image;
      img.crossOrigin = 'Anonymous';
      img.onload = function () {
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img, 0, 0);
        let dataURL = canvas.toDataURL('image/jpeg');
        callback.call(this, dataURL);
        canvas = null;
      };
      img.src = url;
    },
    colorHex: function (color) {
      let reg = /^(rgb|RGB)/;

      if (reg.test(color)) {
        let strHex = "#";

        let colorArr = color.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");

        for (let i = 0; i < colorArr.length; i++) {
          let hex = Number(colorArr[i]).toString(16);
          if (hex === "0") {
            hex += hex;
          }
          strHex += hex;
        }
        return strHex;
      } else {
        return color.toString();
      }
    },
    // fans button
    fansBtn() {
      $('.follower-btn').on('click', () => {
        let btn = $('.follower-btn')
        btn.siblings().each((index, el) => {
          $(el).removeClass('chart-top-btn-active')
        })
        btn.addClass('chart-top-btn-active')
        $('.live-chart').css('opacity', 0)
        setTimeout(() => {
          $('.live-chart').hide()
          let fansChart = $('.fans-chart')
          fansChart.show()
          fansChart.css('opacity', 1)
        }, 200)
      })
    },
    // live button
    liveBtn() {
      $('.live-btn').on('click', () => {
        let btn = $('.live-btn')
        btn.siblings().each((index, el) => {
          $(el).removeClass('chart-top-btn-active')
        })
        btn.addClass('chart-top-btn-active')
        $('.fans-chart').css('opacity', 0)
        setTimeout(() => {
          $('.fans-chart').hide()
          let liveChart = $('.live-chart')
          liveChart.show()
          liveChart.css('opacity', 1)
        }, 200)
      })
    }
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

.current-compare {
  font-family: LCD, serif;
  min-width: 100px;
  width: auto;
  height: 30px;
  text-align: left;
  line-height: 30px;
  font-weight: bold;
  font-size: 20px;
  overflow: hidden;
  background: white;
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
  gap: 8px;
  overflow: hidden;
  opacity: 0;
}

.live-chart {
  width: 96%;
  max-width: 96%;
  min-height: calc(100% - 50px - 10px);
  height: auto;
  border-radius: 6px;
  display: inline-flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
  overflow: hidden;
  opacity: 0;
}

.live-chart-top, .live-chart-bottom {
  width: 100%;
  height: 50%;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.live-cover {
  width: 90%;
  height: auto;
  border-radius: 10px;
  object-fit: contain;
  object-position: center;
  transition: src .2s linear;
}

.live-title-box {
  width: 100%;
  height: 30px;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
}

.live-is-stream {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin: calc((30px - 8px) * .5);
  display: inline-block;
  float: left;
  background: #d04748;
  transition: all .2s linear;
}

.live-title {
  min-width: 150px;
  max-width: 230px;
  height: 30px;
  line-height: 30px;
  text-align: left;
  display: inline-block;
  float: left;
  font-weight: bold;
}

.live-area {
  width: 100%;
  height: 30px;
  line-height: 30px;
  text-align: left;
  font-weight: bold;
  margin-top: 10px;
}

.rec-btn-container {
  width: 100%;
  height: 20px;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  margin-top: 5px;
  margin-bottom: 5px;
  font-weight: bolder;
  user-select: none;
}

.rec-btn {
  width: 40px;
  height: 16px;
  border-radius: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  background-color: #6eb025;
  margin: 10px;
  transition: all .2s linear;
}

.rec-btn-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: #2c3e50 1px solid;
  transition: all .2s linear;
}

.rec-btn-dot:hover {
  box-shadow: rgba(44, 62, 80, 0.8) 0 0 3px 1px;
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
  font-family: LCD, serif;
  min-width: 140px;
  width: auto;
  height: 30px;
  text-align: center;
  line-height: 30px;
  font-size: 25px;
  font-weight: bold;
  margin: 0 0 0 70px;
  padding: 0 10px;
  display: inline-block;
  float: left;
  background: white;
  letter-spacing: 1px;
}

.match-line {
  width: 320px;
  height: 1px;
  border-bottom: #2c3e50 1px dashed;
  margin-top: 15px;
  margin-left: 150px;
}

.fans-card-compare {
  font-family: LCD, serif;
  min-width: 100px;
  width: auto;
  height: 30px;
  text-align: left;
  line-height: 30px;
  font-weight: bold;
  font-size: 20px;
  display: inline-block;
  float: right;
  margin: -16px 10px;
  padding: 0 10px;
  overflow: hidden;
  background: white;
}

.compare-pointer {
  width: 16px;
  height: 16px;
  margin: 7px;
  display: inline-block;
  float: left;
}
</style>