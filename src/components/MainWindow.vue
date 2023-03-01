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
        <span class="follower-btn"><em>Fans</em></span>
        <span class="live-btn"><em>Live</em></span>
      </div>
      <div class="line"></div>
      <perfect-scrollbar class="chart-scroll">
        <div class="fans-chart"></div>
        <div class="live-chart">
          <div class="live-chart-left">
            <img src="" class="live-cover" alt=""/>
          </div>
          <div class="live-chart-right">

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

        this.fansBtn()
        this.liveBtn()
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
          $('.follower-btn').click()
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

          current = data.follower
          this.scrollNumber(countUp, data.follower)

          this.renderFollowerChart()
          this.renderLiveChart()
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
        let countable
        for (let i = 0; i < list.length - 1; i++) {
          if (list[i] !== -1) {
            countable = i
            if (list[i + 1] !== -1) {
              let compare = list[countable] - list[i + 1]
              if (compare >= 0) {
                chart.children()[countable].querySelector('.fans-card-compare').innerHTML = template + Math.abs(compare)
                $(chart.children()[countable].querySelector('.fans-card-compare .compare-pointer')).css('transform', 'rotateX(180deg)')
                $(chart.children()[countable].querySelector('.fans-card-compare')).css('color', '#6eb025')
              } else if (compare < 0) {
                chart.children()[countable].querySelector('.fans-card-compare').innerHTML = template + Math.abs(compare)
                $(chart.children()[countable].querySelector('.fans-card-compare')).css('color', '#d04748')
              }
            } else {
              chart.children()[i + 1].querySelector('.fans-card-compare').innerHTML = 'NO DATA'
            }
            $(chart.children()[countable].querySelector('.fans-card-compare')).removeClass('loading')
            $(chart.children()[i + 1].querySelector('.fans-card-compare')).removeClass('loading')
          } else {
            chart.children()[i + 1].querySelector('.fans-card-compare').innerHTML = 'NO DATA'
          }
          $(chart.children()[countable].querySelector('.fans-card-compare')).removeClass('loading')
          $(chart.children()[i + 1].querySelector('.fans-card-compare')).removeClass('loading')
        }
        if (countable !== undefined && countable !== list.length - 1) {
          chart.children()[countable].querySelector('.fans-card-compare').innerHTML = 'NO DATA'
          $(chart.children()[countable].querySelector('.fans-card-compare')).removeClass('loading')
        }
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
      $('.live-cover').attr('src', liveCover[UID])
    },
    // refresh window
    refreshWindow() {
      $('.refresh-window-btn-box').on('click', () => {
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
          this.updateLiveCover(uid).then(cover => {
            liveCover[uid] = cover
          })

          setTimeout(() => {
            this.refreshRoomInfo(Number(liveid))
          }, 6000)
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
            })
          })
        })
      }
    },
    // refresh room info (better refresh in 6s, which is 6000ms)
    refreshRoomInfo(liveid) {
      bRecInstance.refreshRooms().then(() => {
        bRecInstance.fetchRoom(liveid).then(info => {
          console.log(info)
        })
      })
    },
    // stop current room recording
    stopRec: async function (liveid) {
      let room = await bRecInstance.getRoomByRoomId(liveid)
      return room.stop()
    },
    startRec: async function (liveid) {
      let room = await bRecInstance.getRoomByRoomId(liveid)
      return room.start()
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
          let url = `//wsrv.nl/?url=${cover}`
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
        $('.live-chart').css('opacity', 0)
        setTimeout(() => {
          $('.fans-chart').hide()
          let fansChart = $('.live-chart')
          fansChart.show()
          fansChart.css('opacity', 1)
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
}

.live-chart-left, .live-chart-right {
  width: 50%;
  height: 100%;
}

.live-chart {
  width: 96%;
  max-width: 96%;
  min-height: calc(100% - 50px - 10px);
  height: auto;
  border-radius: 6px;
  display: inline-flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
  overflow: hidden;
}

.live-cover {
  width: 100%;
  height: auto;
  border-radius: 10px;

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

/*.fans-card:hover {*/
/*  box-shadow: 0 0 10px 1px rgba(40, 40, 40, 0.51);*/
/*}*/

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