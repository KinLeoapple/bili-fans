<template>
  <div class="side-bar">
    <div class="title">🐱<em class="title-text">ADD</em></div>
    <div class="append-box">
      <input type="text" class="append-input" placeholder="Enter UID here" new-accounts>
      <svg class="append-btn" xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor"
           viewBox="0 0 16 16">
        <path
            d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
      </svg>
      <div class="msg"></div>
    </div>
    <div class="line"></div>
    <div class="title">
      😼<em class="title-text">LIST</em>
      <div class="refresh-list-btn-box">
        <svg class="refresh-list-btn" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
             viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path
              d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
      </div>
    </div>
    <perfect-scrollbar class="list-scroll">
      <ul class="list"></ul>
    </perfect-scrollbar>
  </div>
</template>

<script>
import axios from "axios";
import $ from "jquery";
import {sleep} from "@/assets/js/sleep";
import {quickSort} from "@/assets/js/quicksort";

const ipcRenderer = window.require('electron').ipcRenderer;

let PORT
let isDisable = true
let listUp = []

export default {
  name: "SideBar",
  methods: {
    run() {
      this.$nextTick(() => {
        PORT = ipcRenderer.sendSync('port')

        this.updateList()
        this.refreshList()
        this.appendUID()
      })
    },
    // update up list
    updateList(clickedUID) {
      isDisable = true
      let list = ipcRenderer.sendSync('up-list')
      list = quickSort(list)
      console.log(list.length)
      listUp = list

      list.forEach(id => {
        sleep(200).then(() => {

          this.appendToList(id)
          this.getInfo(id)
          if (clickedUID !== undefined && clickedUID.toString() === id.toString()) {
            $(`[uid=${id}]`).addClass('up-active')
          }
        })
      })
      isDisable = false
    },
    // refresh up list
    refreshList() {
      $('.refresh-list-btn').on('click', () => {
        if (!isDisable) {
          let btn = $('.refresh-list-btn')
          btn.css('transform', 'rotate(-360deg)')
          btn.css('transition', 'all 0s linear')
          isDisable = true
          let clickedUID = ''
          $('.list').children().each((index, el) => {
            if ($(el).hasClass('up-active')) {
              clickedUID = $(el).attr('uid')
            }
            $(el).css('opacity', 0)
            setTimeout(() => {
              $(el).remove()
            }, 250)
          })
          this.updateList(clickedUID)
          btn.off('click')
          $('.refresh-list-btn-box').css('cursor', 'not-allowed')
          setTimeout(() => {
            btn.css('transform', 'none')
            btn.css('transition', 'all .5s linear')
          }, 550)
          setTimeout(() => {
            isDisable = false
            $('.refresh-list-btn-box').css('cursor', 'pointer')
            this.refreshList()
          }, 5000)
        }
      })
    },
    // get user info from server
    getInfo(id) {
      return axios({
        method: 'post',
        baseURL: 'http://localhost:' + PORT + '/info/',
        data: {
          uid: id
        }
      })
    },
    // append up to list
    appendToList(id, isSort) {
      let list = $('.list')

      let html =
          `<li class="up" uid="${id}">
                <img class="avatar" src="${require('@/assets/img/avatar.png')}" alt="" crossOrigin="anonymous"/>
                <span class="name" title=""></span>
                <svg xmlns="http://www.w3.org/2000/svg" class="delete-up" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
                </li>`

      if (isSort === undefined) {
        list.append(html)
      } else if (isSort === true) {
        // sort
        listUp[listUp.length] = id
        listUp = quickSort(listUp)
        let insertIndex = listUp.indexOf(id)

        if (insertIndex !== -1) {
          list.children().each((index, el) => {
            if (index === insertIndex) {
              $(el).before(html)
            }
          })
        } else {
          list.prepend(html)
        }
      }

      this.getInfo(id)
          .then(resolve => {
            let data = resolve.data

            let avatar = `//wsrv.nl/?url=${data.face}&w=300&h=300&fit=cover&mask=circle`
            $(`[uid=${id}] .avatar`).attr('src', avatar)
            let el = $(`[uid=${id}] .name`)
            let name = data.name
            el.attr('title', name)
            el.html(name)
          })
          .catch(err => {
            console.log(err)
          })

      $(`[uid=${id}]`).on('click', () => {
        let up = $(`[uid=${id}]`)
        ipcRenderer.sendSync('switch', id, $(up)[0].querySelector('img').src)
        up.siblings().each((index, el) => {
          $(el).removeClass('up-active')
        })
        up.addClass('up-active')
      })

      $(`[uid=${id}] .delete-up`).on('click', event => {
        event.stopPropagation()
        let isDelete = ipcRenderer.sendSync('delete', id)
        if (isDelete) {
          let el = $(`[uid=${id}]`)
          el.css('opacity', 0)
          setTimeout(() => {
            el.remove()
          }, 250)
        }
      })
    },
    // append uid function
    appendUID() {
      $('.append-input').bind("keydown", function (e) {
        let theEvent = e || window.event;
        let keyCode = theEvent.keyCode || theEvent.which || theEvent.charCode;
        if (keyCode === 13) {
          if ($('.append-input')[0] === document.activeElement) {
            $('.append-btn').click()
          }
          //theEvent.keyCode = 0;
          //theEvent.returnValue = false;
        }
      })
      $('.append-btn').on('click', () => {
        let msg = $('.msg')
        let input = $('.append-input')
        let val = input.val()
        if (val.length > 0) {
          let result = ipcRenderer.sendSync('append', val)
          console.log(result)
          if (result.res === true) {
            msg.html('Added')
            this.appendToList(val, true)
          } else {
            msg.html(result.msg)
          }
          msg.css('margin-left', 0)
          setTimeout(() => {
            msg.css('margin-left', '500px')
            msg.html('')
          }, 1500)
          input.val('')
        }
      })
    },
  }
}
</script>

<style scoped>
.side-bar {
  height: 100%;
  width: 200px;
  display: inline-flex;
  flex-direction: column;
  background: white;
  /*justify-content: center;*/
  align-items: center;
  border-right: 1px #2c3e50 solid;
}

.title {
  width: 100%;
  height: 30px;
  position: relative;
  text-align: left;
  text-indent: 10px;
  display: inline-flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  margin: 5px;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 1px;
  -webkit-user-select: none;
}

.title .title-text {
  height: 30px;
  line-height: 30px;
  text-align: left;
  text-indent: -5px;
  font-size: 14px;
  border-top: #2c3e50 1px dashed;
  border-bottom: #2c3e50 1px dashed;
}

.append-box {
  height: 50px;
  width: 100%;
  position: relative;
  display: inline-flex;
  flex-direction: row;
  background: white;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.append-input {
  height: 30px;
  width: 110px;
  border: #2c3e50 1px solid;
  border-radius: 30px;
  margin: 5px;
  padding-left: 10px;
  padding-right: 10px;
  outline: none;
  transition: all .2s linear;
}

.append-input::placeholder {
  text-align: center;
}

.append-input:focus {
  box-shadow: #2c3e50 0 0 5px 2px;
}

.append-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: #2c3e50 1px solid;
  cursor: pointer;
  margin: 10px;
  transition: all .2s linear;
}

.append-btn:hover {
  color: white;
  background: #2c3e50;
}

.msg {
  width: 185px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  position: absolute;
  border-radius: 10px;
  background: #2c3e50;
  margin-left: 500px;
  color: white;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: all .2s linear;
}

.line {
  height: 1px;
  width: 80%;
  border-radius: 10px;
  background: #2c3e50;
  margin-top: 10px;
  margin-bottom: 20px;
}

.refresh-list-btn-box {
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

.refresh-list-btn-box:hover {
  color: white;
  background: #2c3e50;
}

.refresh-list-btn {
  width: 20px;
  height: 20px;
  transition: all .2s linear;
}

.list-scroll {
  min-height: calc(100% - 80px - 50px - 10px - 10px - 20px - 1px);
  height: calc(100% - 80px - 50px - 10px - 10px - 20px - 1px);
  max-height: calc(100% - 80px - 50px - 10px - 10px - 20px - 1px);
  width: 100%;
  overflow: hidden;
  margin-bottom: 10px;
}

.list {
  min-height: 200px;
  height: auto;
  width: 100%;
  position: relative;
  list-style-type: none;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  padding: 0;
  gap: 5px;
}
</style>

<style>
.up {
  height: 50px;
  width: 90%;
  border-radius: 50px;
  position: relative;
  list-style: none;
  border: #2c3e50 1px solid;
  display: inline-flex;
  justify-content: space-evenly;
  align-items: center;
  cursor: pointer;
  transition: all .2s linear;
  animation-name: fadeIn;
  animation-duration: .5s;
  animation-timing-function: linear;
  animation-delay: 0s;
  animation-iteration-count: 1;
  animation-direction: normal;
  overflow: hidden;
}

.up:hover, .up-active {
  color: white;
  background: #2c3e50;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 100%;
  }
}

.delete-up {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  opacity: 0;
  z-index: -999;
  transition: opacity .2s linear, z-index .2s, background .1s linear;
}

.up:hover .delete-up {
  opacity: 100%;
  z-index: 0;
}

.delete-up:hover {
  background: #fa4a4a;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
}

.name {
  min-width: 80px;
  max-width: 80px;
  height: 20px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>