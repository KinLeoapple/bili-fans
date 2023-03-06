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
    <div class="side-bar-line"></div>
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
import '@/assets/css/side-bar.css';

import axios from "axios";
import $ from "jquery";
import {sleep} from "@/assets/js/sleep";
import {Sort} from "@/assets/js/quicksort";
import {convertImgToBase64} from "@/assets/js/conver-img";
import {Tooltip} from "@/assets/js/tooltip";

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
      Sort(list)
      console.log(list.length)
      listUp = list

      list.forEach(id => {
        sleep(200).then(() => {

          this.appendToList(id)
          this.getInfo(id)
          if (clickedUID !== undefined && clickedUID.toString() === id.toString()) {
            $(`[uid=${id}]`).click()
          } else {
            let chil = $('.list').children()
            if (chil.length > 0) {
              chil[0].click()
            }
          }
        })
      })
      isDisable = false
    },
    // refresh up list
    refreshList() {
      $('.refresh-list-btn-box').on('click', () => {
        if (!isDisable) {
          let btn = $('.refresh-list-btn')
          let btnBox = $('.refresh-list-btn-box')
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
          btnBox.off('click')
          btnBox.css('cursor', 'not-allowed')
          setTimeout(() => {
            btn.css('transform', 'none')
            btn.css('transition', 'all .5s linear')
          }, 550)
          setTimeout(() => {
            isDisable = false
            btnBox.css('cursor', 'pointer')
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
                <span class="name"></span>
                <svg xmlns="http://www.w3.org/2000/svg" class="delete-up" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
                </li>`

      if (isSort === undefined) {
        list.append(html)
      } else if (isSort === true) {
        // sort
        listUp[listUp.length] = id
        Sort(listUp)
        let insertIndex = listUp.indexOf(id)

        if (insertIndex !== -1) {
          if (insertIndex !== list.children().length) {
            list.children().each((index, el) => {
              if (index === insertIndex) {
                $(el).before(html)
              }
            })
          } else {
            list.append(html)
          }
        } else {
          list.prepend(html)
        }
      }

      this.getInfo(id)
          .then(resolve => {
            let data = resolve.data

            let avatar = `https://wsrv.nl/?url=${data.face}&w=300&h=300&fit=cover&mask=circle`
            convertImgToBase64(avatar, function (base64) {
              $(`[uid=${id}] .avatar`).attr('src', base64)
            })
            let el = $(`[uid=${id}] .name`)
            let name = data.name
            Tooltip($(`[uid=${id}]`)[0], name)
            el.html(name)
          })
          .catch(err => {
            console.log(err)
          })

      $(`[uid=${id}]`).on('click', () => {
        let up = $(`[uid=${id}]`)
        ipcRenderer.sendSync('switch', id)
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