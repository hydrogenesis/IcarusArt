// const Interface = 'http://share.cortexlabs.ai:8081';
// const ipfsAPI = require('ipfs-api');

const Interface = '/ai';
let myHeaders = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'text/plain'
});

function strToBinary(str) {
  console.log(str);
  let result = [];
  let list = str.split('');
  console.log(list);
  for (let i = 0; i < list.length; i++) {
    let item = list[i];
    let binartStr = item.charCodeAt().toString(2);
    result.push(binartStr);
  }
  return result;
}

export function downImg(address, text) {
  let formData = new FormData();
  formData.append('message', text);
  return new Promise(function (resolve, reject) {
    fetch(`/Creat/picmaker?id=${address}`, {
      method: 'POST',
      body: formData
    })
      .then((res) => {
        return res.blob();
      })
      .then((res) => {
        let blob = new Blob([res], { type: 'image/png' });
        let url = URL.createObjectURL(blob);
        resolve(url);
      })
      .catch((err) => console.log(err));
  });
}

export const API = {
  // 获取用户信息
  getuserInfo: (address) => {
    return new Promise(function (resolve, reject) {
      fetch(`/ai/user/${address}`, {
        method: 'GET'
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          resolve(res);
        })
        .catch((err) => resolve({}));
    });
  },
  // 注册用户信息
  postuserInfo: (data, address, sig) => {
    return new Promise(function (resolve, reject) {
      fetch(`/ai/user/${address}?sig=${sig}`, {
        method: 'POST',
        body: data
      })
        .then((res) => {
          return res.statusText;
        })
        .then((res) => {
          resolve(res);
        })
        .catch((err) => reject(err));
    });
  }
};

// 钱包给数据签名
export const walletSign = (address, data) => {
  let lan = window.localStorage.language || 'en';
  let json = {
    zn: '请确认操作',
    en: 'Please confirm the operation.',
    hn: '동작 확인'
  };
  return new Promise((resolve, reject) => {
    window.walletModel === 1 &&
      ctxWeb3.personal.sign(data, address, (err, signature) => {
        if (err) return reject(err);
        return resolve({ signature });
      });
    window.walletModel === 2 &&
      ethereum
        .request({
          method: 'personal_sign',
          params: [data, address]
        })
        .then((signature) => {
          return resolve({ signature });
        })
        .catch((err) => reject(err));
  });
};
// 从签名获得recoverid
// export const getRecoverid = (signature, data) => {
//   let lan = window.localStorage.language || 'en'
//   let json = {
//     zn: '请确认操作',
//     en: 'Please confirm the operation.',
//     hn: '동작 확인'
//   }
//   return new Promise((resolve, reject) =>
//   ctxWeb3.personal.ecRecover(
//     data,
//     signature,
//       (err, recoverid) => {
//           if (err) return reject(err);
//           return resolve({recoverid });
//       }
//     )
//   )
// }
