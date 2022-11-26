import React from 'react';
import { notification } from 'antd';
const notice = require('../notice.json');
const noticeStyle = {
  top: '0'
};
//没有下载钱包
export function uninstall() {
  notification.open({
    message: 'notice',
    description: notice[window.localStorage.language].uninstall,
    duration: 0,
    style: noticeStyle
  });
}
// 钱包没有登录
export function unlogin() {
  notification.open({
    message: 'notice',
    description: notice[window.localStorage.language].unlogin,
    duration: 0,
    style: noticeStyle
  });
}
