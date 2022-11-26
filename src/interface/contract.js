import { from } from 'core-js/fn/array';
import Web3 from 'web3';
import {notification} from 'antd'
const minterfaceOld = require('./CortexArtAbi.json');
const minterface = require('./CortexArtAbiV2.json');
const mainAddress = window.mainAddress; // publicJs中统一设置
const mainAddress2 = window.mainAddress2; // publicJs中统一设置
window.minterface = minterface

let obj = {
  web3: {},
  managerContract: {},
  address: ''
};
let obj2 = {}
let obj3 = {}
let obj4 = {}

if (window.web3) {
  const wallet_web3 = new Web3(window.web3.currentProvider);

  const wallet2_web3 = new Web3(window.mainHttp);

  window.wallet_web3 = wallet_web3

  const managerContract = new wallet_web3.eth.Contract(minterface, mainAddress);
  const managerContract2 = new wallet2_web3.eth.Contract(minterface, mainAddress);

  const managerContractOld = new wallet_web3.eth.Contract(minterfaceOld, mainAddress2);
  const managerContractOld2 = new wallet2_web3.eth.Contract(minterfaceOld, mainAddress2);


  // const managerContract2 = new wallet_web3.eth.Contract(testAbi, testAddress)
  obj = { wallet_web3, managerContract };
  obj2 = { wallet2_web3: wallet_web3, managerContract:managerContract2 };

  obj3 = { wallet_web3, managerContract: managerContractOld };// 老版本合约
  obj4 = { wallet2_web3, managerContract: managerContractOld2 };// 老版本合约,
}

window.web3Object = obj;
window.web3ObjectOld = obj3;


window.web3Object2 = obj2 // 在钱包主网错误的情况下，用这个获取信息
window.web3ObjectOld2 = obj4;


export const web3Object = { ...obj };
export const web3ObjectOld = { ...obj3 };
