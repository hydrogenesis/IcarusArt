import React, { useState } from 'react';
import {
  InputNumber,
  Tooltip,
  message,
  Table,
  Button,
  Spin,
  Modal,
  Skeleton,
  notification
} from 'antd';
import { EyeOutlined, HeartOutlined, SyncOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import { Link } from 'react-router-dom';
import { API, uploadAvatar, walletSign, getRecoverid } from '../../fetch/fetch';
import { ipfsAdd, ipfsGet } from '../../fetch/ipfs.js';
import moment from 'moment';
import { sendTransactionInCtxwallet } from './../../interface/sendTransaction.js';
import './auction.less';
declare const window: any;
const Web3Utils = require('web3-utils');
const primaryAv = require('../../assets/images/primaryAv.png').default;

import Web3 from 'web3';
import Item from 'antd/lib/list/Item';
const minterfaceOld = require('./../../interface/CortexArtAbi.json');
const minterface = require('./../../interface/CortexArtAbiV2.json');
const hecoinfo = require('./../../assets/images/hecoinfo.png');
const mainAddress = window.mainAddress; // publicJs中统一设置
const mainAddressOld = window.mainAddress2; // publicJs中统一设置



function getday(s: number) {
  const day = Math.floor(s / (1000 * 60 * 60 * 24));
  return day > 9 ? day : '0' + day;
}
function geth(s: number) {
  const day = Math.floor(s / (1000 * 60 * 60));
  return day > 9 ? day : '0' + day;
}
function getm(s: number) {
  const day = Math.floor(s / (1000 * 60));
  return day > 9 ? day : '0' + day;
}
function gets(s: number) {
  const day = Math.floor(s / 1000);
  return day > 9 ? day : '0' + day;
}


function ax(string:string) {
  return string.substring(0, 4) + '......' + string.substring(string.length - 5, string.length)
}


export class Auction extends React.Component {
  static contextType = ThemeContext;
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
      showImg: false,
      info: {
        image_url:'',
        metadata_url: '',
        contractVersion: location.hash.split('=')[1],
        edition: '',
        edition_count: '',
        isImg: false,
        single: location.hash.split('=')[1] == 'v2',  
        canvas_token_id: 0,
        creator: {
          name: '',
          img: '',
          address: ''
        },
        hasor: {
          name: '',
          img: '',
          address: ''
        },
        like: 0,
        look: 0,
        name: '',
        canvas: {
          token: '',
          img: ''
        },
        width: 0,
        height: 0,
        tokenId: '',
        startPrice: 0,
        price: 0,
        countTime: 0,
        createTime: '',
        EXIFinfo: '',
        describe: '',
        canvas_name: '',
        details: '',
        imgUrl: '',
        amount: '', //  最高出价
        auction: 0, //，1拍卖中，2即将拍卖，3：售卖（一口价的物品， 4：不卖的物品
        imgType: 0 //1主画布， 2图层
      },
      balance: 0,
      auctionRecord: [],
      layers: [],
      layerStates: [],
      isModalVisible: false,
      offerPrice: 0,
      exists: false // 是否为owner
    };
    this.handleOk = this.handleOk.bind(this);
    this.changeShowImg = this.changeShowImg.bind(this);
    this.acceptBid = this.acceptBid.bind(this);
    this.offer = this.offer.bind(this);
    this.offer2 = this.offer2.bind(this);
    this.timeGetPrice = this.timeGetPrice.bind(this);
    this.timeCount = this.timeCount.bind(this);
    this.getAuctionRecord = this.getAuctionRecord.bind(this);
  }
  state: {
    showImg: boolean;
    info: {
      image_url:any,
      metadata_url: any,
      contractVersion:any;
      edition: any,
      edition_count: any,
      isImg: boolean;
      single: any;
      canvas_token_id: number;
      // 画布或者图层信息
      creator: {
        name: string;
        img: string;
        address: string;
      };
      hasor: {
        name: string;
        img: string;
        address: string;
      };
      like: number;
      look: number;
      name: string;
      canvas: {
        token: string;
        img: string;
      };
      width: number;
      height: number;
      tokenId: string;
      startPrice: number;
      price: number;
      countTime: number;
      createTime: string;
      EXIFinfo: string;
      describe: string;
      details: string;
      imgUrl: string;
      amount: any;
      canvas_name: string;
      auction: number; //，1拍卖中，2即将拍卖，3：售卖（一口价的物品， 4：不卖的物品
      imgType: number; //1主画布， 2图层
    };
    balance: number;
    auctionRecord: Array<{
      name: string;
      address: string;
      price: number;
      time: any;
    }>;
    layers: Array<string>;
    layerStates: Array<string>;
    loading: boolean;
    exists: boolean;
    offerPrice: number;
    isModalVisible: boolean; // 出价弹窗
  };
  async offer2(messages) {
    if (!this.context.address) this.context.userLogin()
    const wallet_web3 = new Web3(window.web3.currentProvider);
    const managerContract = new wallet_web3.eth.Contract(minterface,  window.mainAddressU)
    let web3Object = { wallet_web3, managerContract };
    let arr = [this.state.info.tokenId]
    web3Object.managerContract.methods
    .takeBuyPrice(...arr)
    .send({
      from: this.context.address,
      value: window.BigInt(this.state.info.price * window.defaultUnit).toString()
    })
    .then((res) => {
      fetch(`${window.ftachUrl}/update_coll`, {
        method: 'post',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          "token_id": this.props.match.params.token - 0,
          "address_from": this.state.info.hasor.address,
          "contractVersion": this.state.info.contractVersion,
          "address_to": this.context.address
        })
      })
      message.success('success')
      // window.location.reload();
    })
    .catch((err) => console.log(err));
  }
  async offer(messages) {
    if (!this.context.address) this.context.userLogin()
    if (window.web3 && window.cutrueChainId.indexOf(window.web3.currentProvider.chainId) == -1) {
      notification.error({message: json[this.context.lan].check1,duration: 0,className:'checkMainnet'});
      return
    }
    if (!this.context.address) {
      message.error(messages);
      return;
    }
    if (this.state.info.auction == 1) {
      this.setState({
        isModalVisible: true,
        offerPrice: Math.max(this.state.info.price, this.state.info.startPrice)
      });
    }
  }
  // 路由参数变化
  componentWillReceiveProps(newProps) {
    this.getInfo(newProps);
  }
  // 每过3秒拿一次最高出价
  timeGetPrice(token) {
    const wallet_web3 = new Web3(window.mainHttp);
    const managerContract = this.state.info.contractVersion == 'v2'
          ?
          new wallet_web3.eth.Contract(minterface, mainAddress)
          :
          new wallet_web3.eth.Contract(minterfaceOld, mainAddressOld) 
    let web3Object = { wallet_web3, managerContract };

    timeGetPriceFn();
    if (this.state.info.auction == 1) {
      clearInterval(window.getPriceH);
      window.getPriceH = setInterval(timeGetPriceFn, 3000);
    }
    let _this = this;
    function timeGetPriceFn() {
      web3Object.managerContract.methods
        .pendingBids(token)
        .call({ gas: 1000000 })
        .then((res) => {
          let num = (res.amount / window.defaultUnit).toFixed(window.priceNumS) 
          if (_this.state.info.auction == 5 &&  new Number(num) == 0) {
            _this.state.info.price ? _this.state.info.auction = 3 :  _this.state.info.auction = 4
          }
          _this.setState({
            info: { ..._this.state.info, amount:num},
            exists:
              res.bidder.toUpperCase() == _this.context.address.toUpperCase()
          });
        });
    }
  }
  // 更新倒计时
  timeCount() {
    clearInterval(window.timeCount);
    let _this = this;
    window.timeCount = setInterval(() => {
      if (_this.state.info.auction == 1 || _this.state.info.auction == 2) {
        const time = this.state.info.countTime - 1000;
        if (time < 0) {
          window.location.reload();
        } else {
          _this.setState({
            info: { ..._this.state.info, countTime: time }
          });
        }
      }
    }, 1000);
  }
  // 确认交易
  acceptBid() {
    const wallet_web3 = new Web3(window.web3.currentProvider);
    const managerContract = new wallet_web3.eth.Contract(minterface,  window.mainAddressU)
    let web3Object = { wallet_web3, managerContract };


    if (window.web3 && window.cutrueChainId.indexOf(window.web3.currentProvider.chainId) == -1) {
      notification.error({message: json[this.context.lan].check1,duration: 0,className:'checkMainnet'});
      return
    }
    web3Object.managerContract.methods
      .acceptBid(this.state.info.tokenId)
      .send({ from: this.context.address })
      .then((res) => {
        message.success('success')
        fetch(`${window.ftachUrl}/update_coll`, {
          method: 'post',
          headers: new Headers({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            "token_id": this.props.match.params.token - 0,
            "address_from": this.state.info.hasor.address,
            "contractVersion": this.state.info.contractVersion,
            "address_to": this.context.address
          })
        })
      })
      .catch((err) => message.error('error'));
  }
  componentWillUnmount() {
    clearInterval(window.getPriceH);
    clearInterval(window.timeCount);
  }
  // 获取最新的出价记录
  async getAuctionRecord() {

  
    const wallet_web3 = new Web3(window.mainHttp);
    const managerContract = this.state.info.contractVersion == 'v2'
          ?
          new wallet_web3.eth.Contract(minterface, mainAddress)
          :
          new wallet_web3.eth.Contract(minterfaceOld, mainAddressOld) 
    let web3Object = { wallet_web3, managerContract };


    let  num = await web3Object.wallet_web3.eth.getBlockNumber()
    // 获取拍卖纪录
    let res = await web3Object.managerContract
      .getPastEvents('BidProposed', {
        fromBlock: num - 4900
      })
    res = res.filter(
      (item) => item.returnValues.tokenId == this.state.info.tokenId
    );
    res = res.slice(res.length - 5, res.length)
    for (let i = 0; i < res.length;  i++) {
      let item:any = res[i]
      let data:any = await web3Object.wallet_web3.eth.getBlock(item.blockNumber)
      item.time = window.formatDateTime(data.timestamp * 1000)
    }
    this.setState({
      auctionRecord: res.map((todo:any) => {
        return {
          address: ax(todo.returnValues.bidder),
          price: (todo.returnValues.bidAmount / window.defaultUnit).toFixed(window.priceNumS) + window.unitlC,
          time: todo.time
        };
      })
    });
    // 获取用户余额
    web3Object.wallet_web3.eth.getBalance(this.context.address).then((res:any) => {
      this.setState({ balance: (res / window.defaultUnit).toFixed(window.priceNumS) });
    });
  }
  // 用户确认出价
  handleOk() {
    const wallet_web3 = new Web3(window.web3.currentProvider);
    const managerContract = new wallet_web3.eth.Contract(minterface,  window.mainAddressU)
    let web3Object = { wallet_web3, managerContract };
    let _this = this
    if (window.web3 && window.cutrueChainId.indexOf(window.web3.currentProvider.chainId) == -1) {
      notification.error({message: json[this.context.lan].check1,duration: 0,className:'checkMainnet'});
      return
    }
    web3Object.managerContract.methods
      .bid(this.state.info.tokenId)
      .send({
        from: this.context.address,
        value: window.BigInt(this.state.offerPrice * window.defaultUnit).toString()
      })
      .then((res) => {
        _this.setState({isModalVisible: false})
        message.success('success')
      })
      .catch((err) => message.error('error'));
  }
  componentDidMount() {
    this.getInfo(this.props);
  }
  props: any;
  // 点击图片区域放大展示
  changeShowImg () {
    if (this.state.showImg) {
      this.setState({showImg: false})
    }else {
      if (!this.state.info.single || this.state.info.isImg) { // 筛选多图层艺术品或者图片类型的单图层艺术品
        this.setState({showImg: true})
      }
    }
  }
  async getInfo(props) {
    const wallet_web3 = new Web3(window.mainHttp);
    const managerContract = this.state.info.contractVersion == 'v2'
          ?
          new wallet_web3.eth.Contract(minterface, mainAddress)
          :
          new wallet_web3.eth.Contract(minterfaceOld, mainAddressOld) 
    let web3Object = { wallet_web3, managerContract };

    const deteNow = moment().unix();
    const wallet2_web3 = new Web3(window.web3.currentProvider);
    const managerContractPatch = new wallet2_web3.eth.Contract(minterface, window.mainAddressU);
    const Price = await managerContractPatch.methods
    .sellingState(props.match.params.token)
    .call({ gas: 1000000 });
    Price.buyPrice = Price.buyPrice / window.defaultUnit
    Price.reservePrice = Price.reservePrice / window.defaultUnit
    // 后端数据有延迟，价格相关信息要试试从链上拿。8月24
    this.setState({ loading: true });
    fetch(`${window.ftachUrl}/get_works?token_id=${props.match.params.token}&contractVersion=${location.hash.split('=')[1]}`)
    .then(res => res.json())
    .then(json => {
    json.isImg = false
    if (json.single) {
      let x = json.single.split('.')
      json.isImg = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'].indexOf(x[x.length - 1]) > -1
    }
    const data = json
      // 获取画布/图层信息
    let type = data.layers && data.layers.length > 0 ? 1 : 2;
    if(data.single) type = 3
   
    if (data.creator_avatar == undefined || data.creator_avatar == '' ) data.creator_avatar = primaryAv
    if (data.owner_avatar == undefined || data.owner_avatar == '' ) data.owner_avatar = primaryAv

    const infoC = {
      ...data,
      edition: data.edition,
      edition_count: data.edition_count,
      creator: {
        img: data.creator_avatar,
        name: data.creator_name,
        address: data.creator_address
      },
      isImg: json.isImg,
      hasor: {
        img: data.owner_avatar,
        name: data.owner_name,
        address: data.owner_address
      },
      like: Math.ceil(Math.random() * 1000),
      look: Math.ceil(Math.random() * 1000),
      name: data.name,
      canvas_name: data.canvas_name,
      canvas: {
        token: data.canvasTokenId,
        img: window.defaultImg
      },
      single: data.single,
      canvas_token_id: data.canvas_token_id,
      width: data.width,
      height: data.height,
      startPrice: Price.reservePrice , // 如果起拍价一样，合约会报错
      price: Price.buyPrice,
      countTime:
        deteNow > Price.auctionStartTime
          ? (Price.auctionEndTime - deteNow) * 1000
          : (Price.auctionStartTime - deteNow) * 1000,
      details: data.introduce,
      describe: data.introduce,
      createTime: window.formatDateTime(data.create_time),
      tokenId: props.match.params.token,
      EXIFinfo: '不知道这里应该放什么',
      // auction: 1,
      auction:
        Price.reservePrice != '0'
          ? deteNow > Price.auctionStartTime
            ? '1'
            : '2'
          : Price.buyPrice == '0'
          ? '4'
          : '3', //，1拍卖中，2即将拍卖，3：售卖（一口价的物品， 4：不卖的物品 5拍卖结束
      imgType: type //1主画布， 2图层， 3单图层
    };
    if (Price.reservePrice != '0' && deteNow > Price.auctionEndTime) {
      infoC.auction = '5';
    }
    let fn = () => {
      this.setState({
        info: infoC,
        loading: false
      });
      // 拍卖状态则，每过几秒去拿一次当前最高出价
      (this.state.info.auction == 1 || this.state.info.auction == 5) &&
        this.timeGetPrice(data.token_id);
      // 拍卖或者等待拍卖的倒计时
      (this.state.info.auction == 1 || this.state.info.auction == 2) &&
        this.timeCount();
      this.state.info.imgType == 1 && this.setState({ layers: data.layers });
      this.state.info.imgType == 2 && this.setState({ layerStates: data.layer });
      (this.state.info.auction == 1 || this.state.info.auction == 5) &&
        this.getAuctionRecord();
    }
    if (data.layer && data.layer.length > 0) {
      web3Object.managerContract.methods
        .getControlToken( props.match.params.token)
        .call({ gas: 1000000 })
        .then(res => {
          let arr =  data.layer.splice(res[2], 1)
          data.layer = [...arr, ...data.layer]
          fn()
        })
    } 
    else if (data.layers && data.layers.length > 0) {
      Promise.all(data.layers.map((item, index)=> 
        web3Object.managerContract.methods
        .getControlToken( props.match.params.token - 0 + index + 1)
        .call({ gas: 1000000 })
      )).then(res => {
        data.layers = data.layers.map((o, j) => {
          return [o[res[j][2] - 0]]
        })
        fn()
      })
    } else {
      fn()
    }
    
    })
    
    
    
  }
  render() {
    const columns = [
      {
        dataIndex: 'address',
        key: 'price'
      },
      {
        dataIndex: 'price',
        key: 'price'
      },
      {
        dataIndex: 'time',
        key: 'price'
      }
    ];
    return (
      <ThemeContext.Consumer>
        {(value) => (
            <div id="auction">

            {
              this.state.showImg &&
              <div className={' clickH'} onClick={this.changeShowImg}>
                {this.state.info.imgType == 1 && this.state.layers.map((todo,j) =>
                    <img
                    src={todo[0]}
                    key={j}
                    className={'flur'}
                    alt=""
                  /> 
                )}
                {
                  this.state.info.imgType == 2 && <img
                  src={this.state.layerStates[0]}
                  className={'flur'}
                  alt=""
                /> 
                }
                {
                  this.state.info.single && !this.state.info.isImg && (
                  <video autoPlay loop controls  src={this.state.info.single} />
                  )
                }
                {
                  this.state.info.isImg && (
                  <img src={this.state.info.single} alt=""/>
                  )
                }
              </div>
            }
            {
              this.state.loading ? 
              <div className="info flex">
                <div className={'img'} >
                  <Skeleton.Button active style={{ width: 400,height: 400,marginLeft: 100 }}/>
                </div>
                <div className='userInfo'>
                  <p><Skeleton.Button active shape='round' size='small' style={{ width: 200 }}/></p>
                  <h2><Skeleton.Button active shape='round' size='small' style={{ width: 200 }} /></h2>
                  <div>
                    <div className='imgBox'>
                      <Skeleton.Avatar active size='large'/>&nbsp;&nbsp;
                      <div>
                        <p><Skeleton.Button active shape='round' size='small' style={{ width: 100 }} /></p>
                        <h3><Skeleton.Button active shape='round' size='small' style={{ width: 100 }} /></h3>
                      </div>
                    </div>
                    <div className='imgBox'>
                      <Skeleton.Avatar active size='large'/>&nbsp;&nbsp;
                      <div>
                        <p><Skeleton.Button active shape='round' size='small' style={{ width: 100 }} /></p>
                        <h3><Skeleton.Button active shape='round' size='small' style={{ width: 100 }} /></h3>
                      </div>
                    </div>
                  <p className='clear'></p>
                  </div>
                  <p className='lineB'></p>
                  <p style={{marginBottom: '20px'}}><Skeleton.Button active shape='round' size='small' style={{ width: 100 }} />&nbsp;&nbsp;&nbsp;&nbsp;<Skeleton.Button shape='round' size='small' style={{ width: 200 }} /></p>
                  <p style={{marginBottom: '20px'}}><Skeleton.Button active shape='round' size='small' style={{ width: 100 }} />&nbsp;&nbsp;&nbsp;&nbsp;<Skeleton.Button shape='round' size='small' style={{ width: 200 }} /></p>
                  <p style={{marginBottom: '20px'}}><Skeleton.Button active shape='round' size='small' style={{ width: 100 }} />&nbsp;&nbsp;&nbsp;&nbsp;<Skeleton.Button shape='round' size='small' style={{ width: 200 }} /></p>
                  <p style={{marginBottom: '20px'}}><Skeleton.Button active shape='round' size='small' style={{ width: 100 }} />&nbsp;&nbsp;&nbsp;&nbsp;<Skeleton.Button shape='round' size='small' style={{ width: 200 }} /></p>
                  <p style={{marginBottom: '20px'}}><Skeleton.Button active shape='round' size='small' style={{ width: 100 }} />&nbsp;&nbsp;&nbsp;&nbsp;<Skeleton.Button shape='round' size='small' style={{ width: 200 }} /></p>
                  <p className='lineB'></p>
                  <Skeleton active/>
                </div>
              </div>
               :
              <div className="info flex">
                <div className={'img'} onClick={this.changeShowImg}>
                  {this.state.info.imgType == 1 && this.state.layers.map((todo,j) =>
                      <img
                      src={todo[0]}
                      key={j}
                      className={'flur'}
                      alt=""
                    /> 
                  )}
                  {
                    this.state.info.imgType == 2 && <img
                    src={this.state.layerStates[0]}
                    className={'flur'}
                    alt=""
                  /> 
                  }
                  {
                    this.state.info.single && !this.state.info.isImg && (
                    <video autoPlay loop controls  src={this.state.info.single} />
                    )
                  }
                  {
                    this.state.info.isImg && (
                    <img src={this.state.info.single} alt=""/>
                    )
                  }
                </div>
                <div className='userInfo'>
                  <p>{[0, json[value.lan].canvas, json[value.lan].layer, json[value.lan].ddd][this.state.info.imgType]}</p>
                  <h2>{this.state.info.name}</h2>
                  <div>
                      <Link to={`/user/${this.state.info.creator.address}`}>
                        <div className='imgBox'>
                            <img src={this.state.info.creator.img} alt=""/>
                          <div>
                            <p>{json[value.lan].artist}</p>
                            <h3>{this.state.info.creator.name}</h3>
                          </div>
                        </div>
                      </Link>
                      <Link to={`/user/${this.state.info.hasor.address}`}>
                        <div className='imgBox'>
                            <img src={this.state.info.hasor.img} alt=""/>
                          <div>
                            <p>{json[value.lan].collector}</p>
                            <h3>{this.state.info.hasor.name}</h3>
                          </div>
                        </div>
                      </Link>
                      <p className='clear'></p>
                  </div>
                  <p className='lineB'></p>
                    {
                      this.state.info.imgType == 2 &&
                      <h4>
                        <Link style={{color: '#1890ff'}} to={`/auction/${this.state.info.canvas_token_id}?contractVersion=v1`}>
                          <div>
                            {json[value.lan].canvas}: {this.state.info.canvas_name}
                          </div>
                        </Link>
                      </h4>
                    }
                  {
                    this.state.info.edition &&
                    <p className='describeBox'><span style={{fontSize:'16px',color:'black'}}>{json[value.lan].vnumber}:</span>{this.state.info.edition} / {this.state.info.edition_count}</p>
                  }
                  <p className='describeBox' style={{whiteSpace: "pre-wrap", overflow:'auto',maxHeight: '200px'}}><span style={{fontSize:'16px',color:'black'}}>{json[value.lan].describe}:</span>{this.state.info.details}</p>

                  <p className='describeBox' style={{whiteSpace: "pre-wrap", overflow:'auto',maxHeight: '200px'}}><span style={{fontSize:'16px',color:'black'}}>{json[value.lan].details}:</span>
                    {
                      window.chainName == 'Heco' &&<p> <i><img src={hecoinfo.default} alt="" /></i>
                      <a target='_blank' href={`https://hecoinfo.com/token/${this.state.info.contractVersion == 'v2' ? window.mainAddress : window.mainAddress2}?a=${this.props.match.params.token}`}>{json[value.lan].view11}</a></p>
                    }
                    {
                      window.chainName == 'Ethereum' &&<p> <i><svg width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.364 9.999a.89.89 0 0 1 .895-.89l1.482.004a.891.891 0 0 1 .891.892v5.607c.167-.05.381-.102.616-.157a.743.743 0 0 0 .572-.723V7.776a.892.892 0 0 1 .892-.892h1.485a.891.891 0 0 1 .891.892v6.456s.372-.15.734-.304a.744.744 0 0 0 .454-.685V5.547a.891.891 0 0 1 .892-.891h1.485a.891.891 0 0 1 .891.891v6.337c1.288-.933 2.593-2.056 3.628-3.406A1.496 1.496 0 0 0 20.4 7.08 10.483 10.483 0 0 0 10.632 0C4.811-.077 0 4.677 0 10.501a10.47 10.47 0 0 0 1.394 5.252 1.327 1.327 0 0 0 1.266.656c.28-.024.63-.06 1.046-.108a.742.742 0 0 0 .659-.737V9.999M4.332 18.991a10.493 10.493 0 0 0 16.641-9.21c-3.834 5.721-10.915 8.396-16.64 9.21" fill="currentColor"></path></svg></i>
                      <a target='_blank' href={`https://etherscan.io/token/${this.state.info.contractVersion == 'v2' ? window.mainAddress : window.mainAddress2}?a=${this.props.match.params.token}`}>{json[value.lan].view1}</a></p>
                    }
                    {
                      <p> <i><svg width="22" height="22" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.21 5.222 10.639.936a1.428 1.428 0 0 0-1.279 0L.789 5.222A1.431 1.431 0 0 0 0 6.5v10c0 .54.306 1.035.79 1.278l8.571 4.286a1.43 1.43 0 0 0 1.278 0l8.571-4.286A1.43 1.43 0 0 0 20 16.5v-10a1.43 1.43 0 0 0-.79-1.278ZM10 3.812 15.377 6.5 10 9.189 4.623 6.501 10 3.81Zm-7.143 5 5.714 2.857v6.806l-5.714-2.857V8.812Zm8.572 9.663v-6.806l5.714-2.857v6.806l-5.714 2.857Z" fill="currentColor"></path></svg></i>
                      <a target='_blank'  href={this.state.info.metadata_url}>{json[value.lan].view2}</a></p>
                    }
                    {
                      <p> <i><svg viewBox="0 0 26 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="22" height="22"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.396 9.535a.814.814 0 0 0 0 .93c.749 1.06 2.03 2.657 3.71 3.98C8.791 15.77 10.788 16.75 13 16.75c2.211 0 4.208-.98 5.893-2.306 1.681-1.322 2.962-2.92 3.71-3.98a.814.814 0 0 0 0-.929c-.748-1.06-2.029-2.657-3.71-3.98C17.208 4.23 15.211 3.25 13 3.25c-2.212 0-4.209.98-5.894 2.306-1.68 1.322-2.961 2.92-3.71 3.98ZM5.56 3.591C7.5 2.065 10.03.75 13 .75c2.97 0 5.499 1.315 7.439 2.84 1.943 1.53 3.384 3.339 4.209 4.506l.003.005a3.315 3.315 0 0 1 0 3.798l-.003.005c-.825 1.167-2.266 2.977-4.209 4.505-1.94 1.526-4.47 2.841-7.44 2.841-2.969 0-5.499-1.315-7.439-2.84-1.942-1.53-3.384-3.339-4.208-4.506l-.004-.005a3.314 3.314 0 0 1 0-3.798l.004-.005C2.176 6.929 3.618 5.119 5.56 3.59Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M13 7.25a2.75 2.75 0 1 0 0 5.5 2.75 2.75 0 0 0 0-5.5ZM7.75 10a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z" fill="currentColor"></path></svg></i>
                      <a target='_blank' href={this.state.info.image_url}>{json[value.lan].view3}</a></p>
                    }
                  </p>
                  {
                    this.state.info.imgType != 3 &&
                    <p className='describeBox'><span style={{fontSize:'16px',color:'black'}}>{json[value.lan].size}:</span>{this.state.info.width + 'px  x  ' + this.state.info.height + 'px'}</p>
                  }
                  
                  <p className='describeBox'><span style={{fontSize:'16px',color:'black'}}>{json[value.lan].createTime}: </span>{this.state.info.createTime}</p>
                  <p className='lineB'></p>
                  {(this.state.info.auction == 1 ||
                      (this.state.info.auction == 5 && this.state.info.amount)) && (
                      <div className="price price1">
                        <h3 className="priceType">
                          {this.state.info.auction == 1
                            ? json[value.lan].inAuction
                            : json[value.lan].outAuction}
                        </h3>
                        <p>
                          {json[value.lan].startPrice}:
                          <span className="priceNum">
                            {this.state.info.startPrice + ' ' + window.unitlC}
                          </span>
                        </p>
                        {
                          json[value.lan].amount != undefined && 
                          <p>
                          {json[value.lan].amount}:
                          <span className="priceNum">
                            {this.state.info.amount + ' ' + window.unitlC}
                          </span>
                          {this.state.info.auction == 5 &&
                            this.state.exists}
                        </p>
                        }
                        
                        {this.state.info.auction < 3  && (
                          <p
                            style={{
                              backgroundColor: ['#57b27a', '#eb973f'][
                                this.state.info.auction - 1
                              ],
                              color: 'white',
                              marginTop: '20px'
                            }}
                          >
                          &nbsp;&nbsp;
                          {
                              this.state.info.auction == 1  && json[value.lan].end
                          }
                            ：&nbsp;&nbsp; &nbsp; &nbsp; &nbsp;
                            {getday(this.state.info.countTime)}
                            : 
                            {geth(this.state.info.countTime % (1000 * 60 * 60 * 24))}
                            : 
                            {getm(this.state.info.countTime % (1000 * 60 * 60))}
                            :
                            {gets(this.state.info.countTime % (1000 * 60))}
                            {/* {json[value.lan].seconds} */}
                          </p>
                        )}
                        {this.state.info.auction == 1 && (
                          <Button
                            disabled={
                              this.context.address &&
                              this.context.address.toUpperCase() ==
                                this.state.info.hasor.address.toUpperCase()
                            }
                            onClick={() =>
                              this.offer(json[value.lan].login)
                            }
                          >
                            {json[value.lan].bid}
                          </Button>
                        )}
                        {this.state.info.auction == 5 &&
                          this.context.address.toUpperCase() == this.state.info.hasor.address.toUpperCase() && (
                            <Button onClick={this.acceptBid}>
                              {json[value.lan].confirmation}
                            </Button>
                          )}
                        <Modal
                          className="auctionModel"
                          title={json[value.lan].offer}
                          visible={this.state.isModalVisible}
                          onOk={this.handleOk}
                          onCancel={() =>
                            this.setState({ isModalVisible: false })
                          }
                        >
                          <InputNumber
                            value={this.state.offerPrice}
                            onChange={(v:any) =>
                              this.setState({ offerPrice: v.toFixed(window.priceNumS) })
                            }
                          ></InputNumber>
                          &nbsp;&nbsp;&nbsp;
                          <strong>
                            {window.unitlC}
                          </strong>
                          <p
                            className={`noticeModel ${
                              this.state.offerPrice <
                                this.state.info.startPrice ||
                              this.state.offerPrice < Number(this.state.info.amount) + 0.01
                                ? 'red'
                                : ''
                            }`}
                          >
                            {json[value.lan].least +
                              ':' +
                              Math.max(
                                this.state.info.startPrice,
                                Number(this.state.info.amount) + 0.01
                              )}
                          </p>
                          <div className="formItem">
                            <span className="left">
                              {json[value.lan].balance}:
                            </span>
                            <span className="right">
                              {this.state.balance} <strong>{window.unitlC}</strong>
                            </span>
                          </div>
                        </Modal>
                      </div>
                    )}

                    {this.state.info.auction == 2 && (
                      <div className="price price2">
                        <h3 className="priceType">
                          {json[value.lan].upcomingAuction}
                        </h3>
                        <p>
                          {json[value.lan].startPrice}:
                          <span className="priceNum">
                            {this.state.info.startPrice + ' ' + window.unitlC}
                          </span>
                        </p>
                        {this.state.info.auction < 3  && (
                          <p
                            style={{
                              backgroundColor: ['#57b27a', '#eb973f'][
                                this.state.info.auction - 1
                              ],
                              color: 'white',
                              marginTop: '20px'
                            }}
                          >
                          &nbsp;&nbsp;
                          {
                            json[value.lan].upcomingAuction
                          }
                            ：&nbsp;&nbsp; &nbsp; &nbsp; &nbsp;
                            {getday(this.state.info.countTime)}
                            : 
                            {geth(this.state.info.countTime % (1000 * 60 * 60 * 24))}
                            : 
                            {getm(this.state.info.countTime % (1000 * 60 * 60))}
                            :
                            {gets(this.state.info.countTime % (1000 * 60))}
                            {/* {json[value.lan].seconds} */}
                          </p>
                        )}
                      </div>
                    )}
                    {(this.state.info.price && this.state.info.auction != 5) && (
                      <div className="price price3">
                        <h3 className="priceType">
                          {json[value.lan].fixedPrice}
                        </h3>
                        <p>
                          {/* {json[value.lan].price}:  */}
                          <span className="priceNum">
                            {this.state.info.price  + ' ' + window.unitlC}
                          </span>
                        </p>
                        <Button
                          disabled={
                            this.context.address &&
                            this.context.address.toUpperCase() ==
                              this.state.info.hasor.address.toUpperCase()
                          }
                          onClick={() => this.offer2(json[value.lan].login)}
                        >
                          {json[value.lan].offer}
                        </Button>
                      </div>
                    )}
                    {this.state.info.auction == 4 && (
                      <div className="price price4">
                        <h3 style={{color: '#888'}} className="priceType">
                          {json[value.lan].Notsale}
                        </h3>
                      </div>
                    )}

                    {(this.state.info.auction == 1 ||
                    this.state.info.auction == 5) && (
                    <div className="left-bottom auctionRecord">
                      <p className='lineB'></p>
                      <h2>
                        {json[value.lan].auctionRecord}{' '}
                        <SyncOutlined onClick={this.getAuctionRecord} />
                      </h2>
                      <Table
                        size="small"
                        dataSource={this.state.auctionRecord}
                        columns={columns}
                      />
                    </div>
                  )}
                </div>
              </div>
            }
             
               {
                 this.state.info.imgType != 3 &&
                 <div className="layer">
                  <h2>
                    {this.state.info.imgType == 1
                      ? json[value.lan].layer
                      : json[value.lan].states}
                  </h2>
                  <div className="imgList">
                    <div className="listBox" key={this.state.info.imgType}>
                      {this.state.info.imgType == 1 &&
                        this.state.layers.map((item, index) => (
                          <Link key={index} to={`/auction/${parseInt(this.state.info.tokenId) + index + 1}?contractVersion=v1`}>
                            <img  src={item[0]} alt="" />
                          </Link>
                        ))}
                      {this.state.info.imgType == 2 &&
                        this.state.layerStates.map((item, index) => (
                          <img  key={index} src={item} alt="" />
                        ))}
                    </div>
                  </div>
                </div>
               }
              
            </div>
        )}
      </ThemeContext.Consumer>
    );
  }
}
