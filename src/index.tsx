import React from 'react';
import ReactDOM from 'react-dom';
const minterface = require('./interface/CortexArtAbi.json');

import Web3 from 'web3';
import {Button, notification} from 'antd'
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import { uninstall, unlogin } from './notice/notice';

const tw1 = require('./assets/images/tw1.png').default
const tw2 = require('./assets/images/tw2.png').default
const tw3 = require('./assets/images/tw3.png').default
// 帮助用户切换metamask主网，如果没有该主网，帮他加上
async function switchChain() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: window.cutrueChainId[1] }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{ chainId: window.cutrueChainId[1], rpcUrls: [window.mainHttp],chainName: window.chainName }],
        });
      } catch (addError) {
        // handle "add" error
      }
    }
    // handle other "switch" errors
  }
}
// 获取浏览器语言
function getLanguageKey () {
  var lang = (navigator.language || navigator.userLanguage).toLowerCase();
  if (lang.indexOf('zh') == -1) {
    lang = 'en';
  }
  else{
    lang = 'zn';
  }
  return lang;
}

const obj = {
  // lan: window.localStorage.language ||  getLanguageKey(),
  lan: window.localStorage.language || 'en',
  ChangeLan: (value) => {
    obj.lan = value;
  },
  hasLoginWallet: false,
  address: '',
  userLogin: () => {},
  userUnLogin: () => {}
};
// 这里要先export ThemeContext才行，下面的组件用得着
export const ThemeContext = React.createContext(obj);

import { HEADC } from './component/head/head';
import { NoPerDom } from './routeconfig';
import './index.less';

declare const window: any;
declare const navigator: any;
window.localStorage.language = window.localStorage.language || 'zn';

import 'antd/dist/antd.css';
class APP extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      lan: localStorage.language || 'zn',
      ChangeLan: (value) => {
        // 切换语言过场动画
        document.querySelector('body').style.opacity = '0';
        setTimeout(() => {
          this.setState((state) => {
            window.localStorage.language = value;
            return { lan: value };
          });
        }, 1000);
        setTimeout(() => {
          document.querySelector('body').style.opacity = '1';
        }, 1500);
      },
      hasLoginWallet: false,
      address: '',
      mobile: false,
      userLogin: this.userLogin.bind(this),
      userUnLogin: this.userUnLogin.bind(this)
    };
  }
  state: {
    lan: 'zn';
    ChangeLan: any;
    hasLoginWallet: boolean;
    address: string;
    mobile: boolean;
    userLogin: any;
    userUnLogin: any;
  };
  componentWillMount() {
  }
  async userLogin() {
    const _this = this;
    if (!window.web3) {
      notification.error({message: 'Please install MetaMask to log in',duration: 0, className:'checkMainnet',
        description: <a target='_blank' href="https://metamask.io/download">download metamsk</a>
      });
      return
    }
    await window.window.ethereum.request({ method: 'eth_requestAccounts' });
    // 监听用户切换公链
    if (window.cutrueChainId.indexOf(window.web3.currentProvider.chainId) == -1) {
      notification.error({message: 'Wallet mainnet error',duration: 0, className:'checkMainnet',
      description: <Button type="primary" onClick={() => {
        switchChain()
      }}>switch or add</Button>});
    }  else {
      // 轮询检测钱包状态
      getwallet()
      window.liginInter = setInterval(getwallet, 1000);
    }
    window.ethereum && window.ethereum.on('networkChanged', function (networkIDstring) {
      if (window.cutrueChainId.indexOf(window.web3.currentProvider.chainId) == -1) {
        notification.error({message: 'Wallet mainnet error',duration: 0, className:'checkMainnet',
          description: <Button type="primary" onClick={() => {
            switchChain()
          }}>switch or add
          </Button>
        })
        clearInterval(window.liginInter)
        _this.setState({hasLoginWallet: false, address: ''})
      } else {
        let doms = document.querySelectorAll('.checkMainnet')
        doms.forEach(item => {
          let i = item.querySelector('.ant-notification-notice-close') as HTMLElement
          i.click()
        })
        window.web3Object.wallet_web3 = new Web3(window.web3.currentProvider);
        window.web3Object.managerContract = new window.web3Object.wallet_web3.eth.Contract(minterface,  window.mainAddress);
          // 轮询检测钱包状态
          getwallet()
          window.liginInter = setInterval(getwallet, 1000);
      }
    })
    async function getwallet() {
      if (window.window.ethereum) {
        if ( window.cutrueChainId.indexOf(window.web3.currentProvider.chainId) == -1) {
          _this.setState({ hasLoginWallet: false, address: '' });
          return
        }
        const addresss = await window.window.ethereum.request({
          method: 'eth_accounts'
        });
        if (!_this.state.hasLoginWallet && addresss[0]) {
          _this.setState({ hasLoginWallet: true, address: addresss[0] });
        }
        if (
          _this.state.hasLoginWallet &&
          addresss[0].toUpperCase() != _this.state.address.toUpperCase()
        )
          _this.setState({ address: addresss[0] });
        if (_this.state.hasLoginWallet && !addresss[0])
          _this.setState({ hasLoginWallet: false });
      } else {
        if (_this.state.hasLoginWallet)
          _this.setState({ hasLoginWallet: false });
      }
    } 
  }
  userUnLogin() {
    clearInterval(window.liginInter);
    this.setState({ hasLoginWallet: false, address: '' });
  }
  componentWillUnmount() {
    clearInterval(window.liginInter);
  }
  render() {
    const { whiteRoutes, perRoutes } = require('./routeconfig');
    return (
      <div id="app" key={this.state.address}>
        <ThemeContext.Provider value={this.state}>
          {
            this.state.mobile ? <div id='mobilePage'>
              <img className='tw1' src={tw1}></img>
              <img className='tw2' src={tw2}></img>
              <a className='tw3'  target='_blank' href='https://twitter.com/icarusart_ai'>
                <img src={tw3}  alt=""/>
              </a>
            </div> : 
            <Router>
              <HEADC></HEADC>
              <Switch>
                {whiteRoutes.map((item) => (
                  <Route
                    path={item.path}
                    component={item.component}
                    key={item.name}
                    exact
                  />
                ))}
                {perRoutes.map((item) => (
                  <Route
                    path={item.path}
                    component={
                      this.state.hasLoginWallet ? item.component : NoPerDom
                    }
                    key={item.name}
                    exact
                  />
                ))}
              </Switch>
            </Router>
          }
          
        </ThemeContext.Provider>
      </div>
    );
  }
}
// 确保在渲染页面时，ctxWeb3（钱包）已经初始化完毕
window.onload = async () => {
  // if (window.ethereum) {
  //   let addresss = await window.ethereum.request({
  //     method: 'eth_accounts'
  //   });
  //   if (addresss[0] && window.cutrueChainId.indexOf(window.web3.currentProvider.chainId) > -1) {
  //     window.hasLoginWallet = true
  //     window.loginAddress = addresss[0]
  //   }
  // }
  
  ReactDOM.render(<APP />, document.getElementById('root'));
};
