window.artSalesProceeds = [15, 5]; // 艺术家首次和2次出售平台分成
window.publicAddress = '0x0b18c352E7fE19EfEa86A7e545fCE0D30951Af6B'; // 有些页面不需要登录，但是需要地址调用合约
window.defaultImg = 'https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=3600922054,1964265679&fm=26&gp=0.jpg'; // 目前画布没有图片，这是默认图片
window.defaultImgT = ''; // 默认头像
window.defaultUnit =  Math.pow(10, 18); // 默认的交易单位，鉴于前期测试需要，ctxc单位太大， 1ctxc = Math(10, 17)个基本单位
window.ipfsConfig = { host: '223.94.61.114', port: '55001', protocol: 'http' }; // ipfs服务器配置
window.walletModel = 2; // 使用的钱包 1 ctx钱包   2 metamask,这个钱包一直更新，相关代码可能失效
window.priceNumS = 2 // 平台所有价格相关的输入框，精确到小数点后两位
// 申请成为艺术家的链接地址
window.ssssss = 'https://docs.google.com/forms/d/e/1FAIpQLSeAJbmlRWX9VRKOtad7MU5k7Zcddz7_q1FbviaGniCgTfx32g/viewform?usp=sf_link'
window.issueReport = 'https://forms.gle/PVQgjndZzK3qRuEs8'
window.adminAddress = 'xxxxxxx'
window.tokenBurnAddress = '0xe7a5B85218a9F685D89630e7312b5686cdD49175'
// 标准时间格式
function formatDateTime(inputTime) { var date = new Date(inputTime - 0); var y = date.getFullYear(); var m = date.getMonth() + 1; m = m < 10 ? ('0' + m) : m; var d = date.getDate(); d = d < 10 ? ('0' + d) : d; var h = date.getHours(); h = h < 10 ? ('0' + h) : h; var minute = date.getMinutes(); var second = date.getSeconds(); minute = minute < 10 ? ('0' + minute) : minute; second = second < 10 ? ('0' + second) : second; return y + '-' + m + '-' + d+' '+h+':'+minute+':'+second;
};



if (window.environment == 'test') {// 测试环境运行
  window.urlList = [
    {
      name: 'Heco',
      url: 'http://testabi.love614.live/',
      bcColor: '#1c915e',
      bcColor2: '#213738',
      borderColor: '#1c915e transparent transparent transparent',
      borderColor2: '#213738 transparent transparent  transparent',
    },
    {
      name: 'Rinkeby',
      url: 'http://rinkeby.love614.live/',
      bcColor: '#f7931e',
      bcColor2: '#4e381d',
      borderColor: ' transparent transparent #f7931e transparent',
      borderColor2: 'transparent transparent #4e381d transparent',
    }
  ] 

  // window.chainName = 'ctxc'
  // window.ftachUrl= `http://223.94.61.114:38899` // ctxc链接口
  // window.mainAddress = '0x47bFaC915a90d51A4B663f2caCd272Cd5E112067'; // 合约地址
  // window.cutrueChainId = [21, '0x15']
  // window.mainHttp = 'https://security.cortexlabs.ai:30088'
  // window.unitlC = 'CTXC' // 付款单位


  // window.chainName = 'Heco'
  // window.ftachUrl= `http://223.94.61.114:38888` // heco链接口 // 测试接口
  // window.mainAddress = '0xd891e7d163c27eef6ab60755846796f4de082db8'; // 合约地址，单图层合约
  // window.mainAddress2 = '0x791af8Ab218F1566aB68893EC8814059EddF49b8'; // 合约地址，多图层合约
  // window.cutrueChainId = [128, '0x80']
  // window.mainHttp = 'https://http-mainnet-node.defibox.com'
  // window.unitlC = 'HT'


  window.chainName = 'Rinkeby'
  window.ftachUrl= `http://223.94.61.114:38877` 
  window.mainAddress = '0x03feD4Bc26fAAb17C5548C0C3473483cC020CE48'; // 合约地址，单图层合约
  window.mainAddress2 = '0x5Ba151d21B718d2C57e424E2083ed2FBe8596989'; // 合约地址，多图层合约
  window.mainAddressU = '0xb14c5Ae0b1F25bd7B74C3a5d132F865718D0a898'; // 补丁合约，用于被原合约授权交易
  window.cutrueChainId = [4, '0x4']
  window.mainHttp = 'https://rinkeby.infura.io/v3/2e854f11427d4a7392470ade39e2c3ec'
  window.unitlC = 'ETH' // 付款单位
  
  }





else {
  window.urlList = [// 正式环境运行
    {
      name: 'Heco',
      url: 'http://icarusart.ai/',
      bcColor: '#1c915e',
      bcColor2: '#213738',
      borderColor: '#1c915e transparent transparent transparent',
      borderColor2: '#213738 transparent transparent  transparent',

    },
    {
      name: 'Ethereum',
      url: 'https://icarusart.ai/eth/',
      bcColor: 'rgba(122,171,245,1)',
      bcColor2: 'rgba(33,35,90,1)',
      borderColor: ' transparent transparent rgba(122,171,245, 1) transparent',
      borderColor2: 'transparent transparent rgba(33, 35, 90, 1) transparent',
      
    }
  ]

  if (window.environment == 'Heco') {
    window.chainName = 'Heco'
    window.ftachUrl= `https://icarusart.ai/api` // 正式环境接口地址
    window.mainAddress = '0xBba6Df133a83EcE2b6A6c4fce00feBee6ED47feE'; // 合约地址，单图层合约
    window.mainAddress2 = '0xC40cbF7b00Fb2fFaf4e25D12764eb043e494B7B9'; // 合约地址，多图层合约
    window.cutrueChainId = [128, '0x80']
    window.mainHttp = 'https://http-mainnet-node.defibox.com'
    window.unitlC = 'HT'
  }
  else if (window.environment == 'eth') {
    window.chainName = 'Ethereum'
    window.ftachUrl= `http://18.162.114.252:8806`
    window.mainAddress = '0xA4596381EF93434847b9617Ef9834ff71FFC0E3C'; // 合约地址，单图层合约
    window.mainAddress2 = '0xC87e5Faf1E7E827fE0Cb5058B3cda01007027C32'; // 合约地址，多图层合约
    window.cutrueChainId = [1, '0x1']
    window.mainHttp = 'https://mainnet.infura.io/v3/4f236e37fb5f43179890fc3e71a049e7'
    window.unitlC = 'ETH' // 付款单位
  }



  

}






