import asyncio
import os
import sys

import nest_asyncio

nest_asyncio.apply()

from flask import Flask, request, make_response
from bilibili_api import user

app = Flask(__name__)


class BUser:
    __slots__ = "buser"

    def __init__(self, uid):
        self.buser = user.User(uid)

    # 获取用户
    # 更多方法参考 https://nemo2011.github.io/bilibili-api/#/modules/user
    def get_user(self):
        return self.buser

    # 获取用户所有信息
    def get_user_info(self):
        return self.buser.get_user_info()

    # 获取用户相关信息
    def get_relation_info(self):
        return self.buser.get_relation_info()

    # 获取用户 uid
    def get_uid(self):
        return self.buser.get_uid()

    # 获取头像
    async def get_avatar(self):
        info = await self.buser.get_user_info()
        return info["face"]

    # 获取所有动态
    async def get_dynamics(self):
        offset = 0
        dynamics = []
        # 无限循环，直到 has_more != 1
        while True:
            # 获取该页动态
            page = await self.buser.get_dynamics(offset)
            if "cards" in page:
                # 若存在 cards 字段（即动态数据），则将该字段列表扩展到 dynamics
                dynamics.extend(page["cards"])
            if page["has_more"] != 1:
                # 如果没有更多动态，跳出循环
                break
            # 设置 offset，用于下一轮循环
            offset = page["next_offset"]
        return dynamics


# 强制退出程序
@app.route('/stop/', methods=['POST'])
def stop():
    try:
        sys.exit()
    except SystemExit as e:
        print(f'process exit! Cleaning up!')
        return make_response({})


# 获取用户信息
@app.route('/info/', methods=['POST'])
def avatar():
    request_json = request.get_json()
    uid = request_json['uid']

    info = []

    async def fn():
        info.append(await BUser(uid).get_user_info())

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    task = loop.create_task(fn())
    loop.run_until_complete(task)
    response = make_response(info[0])
    return response


if __name__ == '__main__':
    app.run()
