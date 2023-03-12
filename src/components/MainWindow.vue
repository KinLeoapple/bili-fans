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
      <div class="main-window-line"></div>
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
import '@/assets/css/main-window.css';

import axios from "axios";
import {sleep} from "@/assets/js/sleep";
import {CountUp} from "countup.js";
import $ from 'jquery';
import {convertImgToBase64} from "@/assets/js/conver-img";
import {BililiveRec} from "@bililive/rec-sdk";

const ipcRenderer = window.require('electron').ipcRenderer;

let PORT
let isDisable = true
let UID = ''
let current = 0
let BililiveRecorder
let liveRooms = {}
let liveCover = {}
let liveStat = {}
let avatarLoop
let liveLoop

export default {
  name: "MainWindow",
  methods: {
    hide() {
      $('.main-window').hide()
    },
    show() {
      $('.main-window').show()
    },
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
          if (liveLoop !== undefined) {
            clearInterval(liveLoop)
          }
          if (avatarLoop !== undefined) {
            clearInterval(avatarLoop)
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
      let countUp = new CountUp($('.fans-number')[0], 0)
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

          avatarLoop = setInterval(() => {
            let src = $(`[uid=${uid}] .avatar`).attr('src')
            let avatar
            if (src !== undefined) {
              avatar = src
            } else {
              avatar = `${require('@/assets/img/avatar.png')}`
            }
            $('.current-avatar').attr('src', avatar)
          }, 200)

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
          } else {
            chart.children()[i].querySelector('.fans-card-compare').innerHTML = 'NO DATA'
          }
          $(chart.children()[i].querySelector('.fans-card-compare')).removeClass('loading')
        }
        if (countable !== list.length - 1) {
          chart.children()[countable].querySelector('.fans-card-compare').innerHTML = 'NO DATA'
          $(chart.children()[countable].querySelector('.fans-card-compare')).css('color', '#2c3e50')
        }
        chart.children()[list.length - 1].querySelector('.fans-card-compare').innerHTML = 'NO DATA'
        $(chart.children()[list.length - 1].querySelector('.fans-card-compare')).css('color', '#2c3e50')
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
      liveLoop = setInterval(() => {
        this.refreshRoomInfo(liveRooms[UID])
      }, 5000)
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
    // run recorder
    runBililiveRecorder: function () {
      let rec_port = ipcRenderer.sendSync('rec-port')
      BililiveRecorder = new BililiveRec({httpUrl: `http://localhost:${rec_port}`})
      BililiveRecorder.getConfig().then(config => {
        config.optionalSaveStreamCover = {hasValue: true, Value: true}
        BililiveRecorder.setConfig(config)
      })
    },
    // append live room
    appendLiveRoom: function (uid, liveid) {
      if (liveid !== undefined) {
        let autoRec = ipcRenderer.sendSync('get-auto-rec', liveid)
        autoRec = autoRec !== false;
        liveStat[uid] = autoRec

        BililiveRecorder.addRoom({roomId: Number(liveid), autoRecord: autoRec}).then(() => {
          liveRooms[uid] = Number(liveid)
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
        BililiveRecorder.fetchRoom(liveid).then(room => {
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
      if (liveid !== undefined) {
        BililiveRecorder.refreshRooms().then(() => {
          BililiveRecorder.fetchRoom(liveid).then(info => {
            let data = info.roomInfo

            let cover = $('.live-cover')
            if (cover.attr('src') !== liveCover[UID]) {
              cover.attr('src', liveCover[UID])
              this.updateLiveCover(UID).then(img => {
                liveCover[UID] = img
              })
            }

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
      }
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
      BililiveRecorder.fetchRoom(Number(liveid)).then(room => {
        room.stop()
        ipcRenderer.sendSync('set-auto-rec', Number(liveid), false)
        liveStat[UID] = false
        console.log(liveStat)
      })
    },
    // start current room recoding
    startRec: async function (liveid) {
      BililiveRecorder.fetchRoom(Number(liveid)).then(room => {
        room.start()
        ipcRenderer.sendSync('set-auto-rec', Number(liveid), true)
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
          convertImgToBase64(url, base64Img => {
            resolve(base64Img)
          })
        })
      })
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