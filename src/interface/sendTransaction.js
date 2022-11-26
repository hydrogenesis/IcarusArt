const Tx = require('ethereumjs-tx');
const Web3Utils = require('web3-utils');

import { web3Object } from './contract';
const adminAddress = window.adminAddress
// const adminAddress = '0x4e363ec5DE554cC5F3b930211C61716fbaCA240c'


export async function sendCoin(extraData, from) {
  let nonce = await web3Object.wallet_web3.eth.getTransactionCount(
    adminAddress,
    'pending'
  );
  let price = await web3Object.wallet_web3.eth.getGasPrice()
  const txObj = {
    nonce: Web3Utils.toHex(nonce),
    gasPrice:  Web3Utils.toHex(price), 
    gasLimit: Web3Utils.toHex(1000000), 
    to: window.mainAddress,
    value: Web3Utils.toHex('0'),
    data: extraData
  };
  let tx = new Tx(txObj);
  tx.sign(adminPvtKey);
  let serializedTx = '0x' + tx.serialize().toString('hex');

  return await web3Object.wallet_web3.eth.sendSignedTransaction(serializedTx);
}
// 向我们的钱包发送交易
export async function sendTransactionInCtxwallet(
  extraData,
  address,
  value,
  fn
) {
  let nonce = await web3Object.wallet_web3.eth.getTransactionCount(
    adminAddress,
    'pending'
  );
  window.ctxWeb3.eth.sendTransaction(
    {
      from: address,
      to: window.mainAddress,
      value: Web3Utils.toHex(value * window.defaultUnit),
      gas: Web3Utils.toHex(1000000),
      gasPrice: Web3Utils.toHex(1000000000),
      nonce: Web3Utils.toHex(nonce),
      data: extraData
    },
    setIn
  );
  // 监听交易结果
  async function setIn(err, hashTx) {
    if (err != null) {
      fn(err, null);
    }
    window.ctxWeb3.eth.getTransactionReceipt(hashTx, (err2, res) => {
      if (err2 != null || res != null) {
        fn(err2, res);
      } else {
        setTimeout(() => {
          setIn(null, hashTx);
        }, 50);
      }
    });
  }
  // return await web3Object.wallet_web3.eth.sendSignedTransaction(serializedTx)
}
