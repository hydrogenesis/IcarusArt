import { Home } from './page/home/index';
import { User } from './page/user/index';
import { Gallery } from './page/gallery/index';
import { Auction } from './page/auction/index';
import { userEdit } from './page/userEdit/index';
import { createArt } from './page/createArt';
import { generateLayer } from './page/generateLayer/index';
import { priceSet } from './page/priceSet/index';
import { LayersEdit } from './page/layersEdit/index';
import { Term } from './page/Term/index';
import React, { useState } from 'react';
import { message } from 'antd';
import { AdminAddPer } from './page/admin/adminAddPer';
import {createArtF}  from './page/createArtF';
import {createArtD}  from './page/createArtD';
const logo2 = require('./assets/images/404.svg').default
declare const window: any;

export function NoPerDom() {
  const lan = window.localStorage.language;
  const lans = {
    zn: '您没有操作权限',
    en:
      'Your Request Has Been Denied',
    hn:
      '사용자가 지갑을 다운로드하지 않았거나 로그인하지 않았습니다. 로그인 후 새로고침'
  };
  message.error(lans[lan], 5);
  return (
    <div
      style={{
        width:'100vw',
        height: '100vh',
        background: 'white'
      }}
    >
      <img style={{
        color: 'red',
        fontSize: '40px',
        position: 'absolute',
        top: 'calc(50% + 100px)',
        left: '50%',
        width: '600px',
        transform: 'translate(-50%, -50%)'
      }} src={logo2} alt=""/>
      {/* download:{' '}
      <a
        style={{ fontSize: '24px' }}
        href="https://metamask.io/download"
        target="_blank"
      >
        {' '}
        Metamask
      </a> */}
    </div>
  );
}

// 不需要登录钱包能进的页面
export const whiteRoutes = [
  {
    name: '首页',
    path: '/',
    component: Home
  },
  {
    name: '艺术家主页',
    path: '/user/:userid',
    component: User
  },
  {
    name: '画廊',
    path: '/gallery',
    component: Gallery
  },
  {
    name: '拍卖界面',
    path: '/auction/:token',
    component: Auction
  },
  {
    name: '介绍',
    path: '/term',
    component: Term
  }
];
// 需要登录钱包
export const perRoutes = [
  {
    name: '编辑个人信息',
    path: '/userEdit',
    component: userEdit
  },
  {
    name: '创建艺术品',
    path: '/createArtF',
    component: createArtF
  },
  {
    name: '创建单幅艺术品',
    path: '/createArtD',
    component: createArtD
  },
  {
    name: '创建多图层艺术品',
    path: '/createArt',
    component: createArt
  },
  {
    name: '艺术品生成',
    path: '/generateLayer',
    component: generateLayer
  },
  // {
  //   name: '艺术品定价',
  //   path: '/priceSet/:token',
  //   component: priceSet
  // },
  {
    name: '画布或者图层编辑',
    path: '/layersEdit/:token',
    component: LayersEdit
  },
  {
    name: '管理员页面',
    path: '/adminAddPer',
    component: AdminAddPer
  }
];
