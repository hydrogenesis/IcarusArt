
import React, { useState } from 'react';
import { Button, Menu, Dropdown, Skeleton, Spin, Table, Modal, Input, notification } from 'antd';
import { ThemeContext } from '../../index';
import { CheckCircleOutlined, CloseCircleOutlined, DownOutlined } from '@ant-design/icons';
const json = require('../gallery/lan.json');
const json2 = require('./lan.json');
import { Link } from 'react-router-dom';
import { ipfsGet } from '../../fetch/ipfs.js';
import moment from 'moment';
import { API } from '../../fetch/fetch.js';
const primaryAv = require('../../assets/images/primaryAv.png').default;
import { web3Object, web3ObjectOld } from '../../interface/contract.js';

import Web3 from 'web3';
const minterfaceOld = require('./../../interface/CortexArtAbi.json');
const minterface = require('./../../interface/CortexArtAbiV2.json');
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
declare const window: any;
const MockImg = window.defaultImg;

async function getPrice(data, fn){
  let  momentT = moment().unix()
  for (let i = 0; i < data.length; i ++) {
    let item = data[i]
    // 查询售价
    let web3Obj = item.contractVersion == 'v2' ? window.web3Object2 : window.web3ObjectOld2
    const wallet2_web3 = new Web3(window.web3.currentProvider);
    const managerContractPatch = new wallet2_web3.eth.Contract(minterface, window.mainAddressU);
    const Price = await managerContractPatch.methods
    .sellingState(item.token_id)
    .call({ gas: 1000000 });
    if (momentT > Price.auctionEndTime) {
      Price.reservePrice = 0
    }
    Price.buyPrice = Price.buyPrice / window.defaultUnit
    Price.reservePrice = Price.reservePrice / window.defaultUnit
    item.state1 = 0
    if (Price.buyPrice) {
      item.state1 = 1
    }
    item.state2 = 3
    if (Price.reservePrice) {
      if (Price.auctionStartTime > momentT) {
        item.state2 = 1
      }
      if (Price.auctionStartTime < momentT) {
        item.state2 = 2
      }
    }
    item.auction_start_time = Price.auctionStartTime
    item.auction_end_time = Price.auctionEndTime
    item.buy_price = Price.buyPrice
    item.start_price = Price.reservePrice
    item.max_price = ''
    if (item.state2 == 2) {
      // 如果是拍卖状态，获取当前最高出价
      await getAuctionRecord(item)
    }
    if (item.layers && item.layers.length > 0) {
      for (let i = 0; i < item.layers.length; i ++){
        let x = await web3Obj.managerContract.methods
          .getControlToken( item.token_id - 0 + i + 1)
          .call({ gas: 1000000 })
        item.layers[i] = [item.layers[i][x[2] - 0]]
      }
    }
    if (item.layer && item.layer.length > 0) {
      let x = await web3Obj.managerContract.methods
          .getControlToken( item.token_id)
          .call({ gas: 1000000 })
        item.layer = [item.layer[x[2] - 0]]
    }
  }
  fn()
}
  // 获取最新的出价记录
  async function  getAuctionRecord(data) {
    let web3Obj = data.contractVersion == 'v2' ? window.web3Object2 : window.web3ObjectOld2
    // 获取拍卖纪录
    let  num = await web3Obj.wallet2_web3.eth.getBlockNumber()
    let res = await web3Obj.managerContract.getPastEvents('BidProposed', {fromBlock: num - 4900})

    res = res.filter(
      (item) => item.returnValues.tokenId == data.token_id
    );
    if (res.length > 0) {
      data.start_price =  (res[res.length - 1].returnValues.bidAmount / window.defaultUnit)
    }
    
  }

export class ListTypeshow extends React.Component {
  static contextType = ThemeContext;
  constructor(props: object) {
    super(props);
    this.getArtList = this.getArtList.bind(this);
    this.scrollHand = this.scrollHand.bind(this);
    this.sortClick = this.sortClick.bind(this);
    this.setTypeList = this.setTypeList.bind(this);
    this.transferToken = this.transferToken.bind(this);
    this.burn = this.burn.bind(this);
    this.state = {
      loadingList: [],
      auction: 0, // 0:全部，1拍卖中，2即将拍卖，3：售卖（一口价的物品， 4：不卖的物品,5 全部
      imgType: 0, // 0: 全部， -1主画布， -2图层
      collation: 0, // 搜索结果排序规则
      list: [],
      total_page: 1, // 总共有多少页搜索结果
      noMore: false,
      sort: 'old',
      allList: [], // 所有的艺术品
      typeList: [], // allList按照当前筛选条件筛选的所有艺术品，主要是分页保存数据用
      loading: false,
      current: 1,
      isModalVisible: false,
      isModalVisible2: false,
      transferTokenId: '',
      defaultAddress: '',
      showiItem: {},
      burnTokenId: '',
      process: false,
      trading: 0,
      publicAddress: window.publicAddress // 这个页面不需要登录，但是合约需要地址
    };
  }
  props: {
    address: string,
    created: boolean,
    isPersonal: boolean
  }
  scrollHand(e)  {
    //scrollTop是滚动条滚动时，距离顶部的距离
    var scrollTop = document.documentElement.scrollTop||document.body.scrollTop;
    //windowHeight是可视区的高度
    var windowHeight = document.documentElement.clientHeight || document.body.clientHeight;
    //scrollHeight是滚动条的总高度
    var scrollHeight = document.documentElement.scrollHeight||document.body.scrollHeight;
      //滚动条到底部的条件
    let x = (scrollTop+windowHeight - scrollHeight)
    if(-1 < x && x < 1){
      if (this.state.current  < this.state.total_page) {
        this.state.current = this.state.current + 1
        this.getArtList();
      }else {
        this.setState({ 
          noMore: true,
        });
      }
    } 
  }
  componentWillUnmount() {
    window.removeEventListener('scroll', this.scrollHand)
    clearInterval(window.imgLoadingS)
  }
  componentDidMount() {
    this.getArtList();
    setTimeout(() => {
      window.addEventListener('scroll', this.scrollHand)
    }, 500) 
    // 轮询监听页面图片加载状态，如果图片加载完毕  就去掉图片加载样式
    window.imgLoadingS = setInterval(() => {
      let x = document.getElementsByClassName('listA')
      
      for (let i = 0; i < x.length; i ++) {
        let y = x[i].getElementsByTagName('img')
        for(let j = 0; j < y.length; j ++) {
          if (!y[j].complete) {
            break
          }
          x[i].className = 'listA complete'
        }
      }
    }, 200)
  }
  state: {
    auction: number;
    imgType: number;
    collation: number; // 搜索结果排序规则
    list: Array<any>;
    sort: string;
    loading: boolean;
    publicAddress: string;
    allList: Array<any>;
    typeList: Array<any>;
    loadingList: Array<any>;
    current: number;
    isModalVisible: boolean;
    transferTokenId: string;
    showiItem: any;
    defaultAddress: string;
    isModalVisible2: boolean;
    burnTokenId: string;
    total_page: number;
    noMore: boolean;
    process: boolean; // 展示交易进度弹窗
    trading: number; // 交易状态，0：交易进行中，1，交易成功，2：交易失败
  };
  // 赠送token
  async transferToken(){
    let _this = this

    let web3Obj =  this.state.showiItem.contractVersion == 'v2' ? web3Object : web3ObjectOld
    let isAppro = await web3Obj.managerContract.methods.isApprovedForAll(this.context.address, window.mainAddressU).call({ gas: 1000000 })
    if (!isAppro) {
      await web3Obj.managerContract.methods.setApprovalForAll(window.mainAddressU, true).send({ from: this.context.address })
    }
    const wallet_web3 = new Web3(window.web3.currentProvider);
    const managerContract = new wallet_web3.eth.Contract(minterface,  window.mainAddressU)
    _this.setState({process: true})
    managerContract.methods
    .transferFrom(this.context.address, this.state.defaultAddress, this.state.transferTokenId)
    .send({
      from: this.context.address
    }).then(res => {
      fetch(`${window.ftachUrl}/update_coll`, {
        method: 'post',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          "token_id": Number(this.state.transferTokenId),
          "contractVersion": this.state.showiItem.contractVersion,
          "address_from": this.context.address,
          "address_to": this.state.defaultAddress
        })
      })
      _this.setState({ trading: 1})
      notification.success({message: 'transfer success' ,duration: 10,});
    }).catch(err => {
      _this.setState({trading: 2})
      notification.error({message: err.message  || 'transfer error',duration: 10,});
    })
    
  }
  // 销毁token
  async burn() {
    let web3Obj =  this.state.showiItem.contractVersion == 'v2' ? web3Object : web3ObjectOld
    let isAppro = await web3Obj.managerContract.methods.isApprovedForAll(this.context.address, window.mainAddressU).call({ gas: 1000000 })
    if (!isAppro) {
      await web3Obj.managerContract.methods.setApprovalForAll(window.mainAddressU, true).send({ from: this.context.address })
    }
    let _this = this
    const wallet2_web3 = new Web3(window.web3.currentProvider);
    const managerContractPatch = new wallet2_web3.eth.Contract(minterface, window.mainAddressU);

    _this.setState({process: true})
    console.log(this.context.address, window.tokenBurnAddress, this.state.burnTokenId)
    managerContractPatch.methods
    .transferFrom(this.context.address, window.tokenBurnAddress, this.state.burnTokenId)
    .send({
      from: this.context.address
    }).then(res => {
      fetch(`${window.ftachUrl}/burn_nft`, {
        method: 'post',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          "token_id": Number(this.state.burnTokenId),
          "contractVersion": this.state.showiItem.contractVersion,
        })
      })
      _this.setState({trading: 1})
      notification.success({message: 'burn success' ,duration: 10,});
    }).catch(err => {
      _this.setState({trading: 2})
      notification.error({message: err.message  || 'burn error',duration: 10,});
    })
  }
  // 从所有的艺术品里筛选出列表typeList
  setTypeList(num) {
    this.setState({list: []})
    this.state.current = 1
    if(this.state.auction == num ) {
      this.state.auction = 0
    } else {
      this.state.auction = num
    }
    this.getArtList()
  }
  setTypeList2(num) {
    this.setState({list: []})
    this.state.current = 1
    if(this.state.imgType == num ) {
      this.state.imgType = 0
    } else {
      this.state.imgType = num
    }
    this.getArtList()
  }
  // 从所有的艺术品里筛选出列表typeList
  setTypeList3(num) {
    window.playSs = false
    this.setState({list: []})
    this.state.current = 1
    if(this.state.sort == num ) {
      this.state.sort = ''
    } else {
      this.state.sort = num
    }
    this.getArtList()
  }
  async getArtList() {
    if (window.playSs) return
    window.playSs = true
    this.setState({ noMore: false,loading: true });
    let that = this
    let api = this.props.created  ? 'get_created' : 'get_pic'
    fetch(`${window.ftachUrl}/${api}?page=${this.state.current}${this.state.auction == 0 ? '' : '&state=' + ['auction', 'auctioned', 'purchase', 'enjoy', ''][this.state.auction - 1]}&user_address=${this.props.address}${this.state.imgType != 0 ? '&pic=' + ['', 'canvas', 'layer', 'single'][this.state.imgType] : ''}${this.state.sort ? '&sort=' + this.state.sort: ''}`)
    .then(res => res.json())
    .then(json => {
      if (json.data.length == 0) {
        window.playSs = false
        this.setState({ 
          loading: false,
          noMore: true,
         });
        return 
      }
      let num = json.data.length
      this.setState({
        current: json.page,
        loadingList: this.state.loadingList.concat(json.data)
       });
      that.state.total_page =  json.total_page
      // 防止用户切换主网，合约挂掉，离谱的bug
      json.data.forEach(item => {
        item.buy_price = item.buy_price / window.defaultUnit
        item.start_price = item.start_price / window.defaultUnit
        if (item.single) {
          let x = item.single.split('.')
          item.isImg = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'].indexOf(x[x.length - 1]) > -1
        }
      })
      // 后端数据有延迟，价格相关信息要试试从链上拿。8月24
      getPrice(json.data, () => {
        json.data.forEach(item => {
          if (item.state1 == 0) item.state = 3
          if (item.state1 == 1) item.state = 2
          // if (item.state2 == 0) 
          if (item.state2 == 1) {
            item.state = 1
            item.countdown = item.auction_start_time -  parseInt(new Date().getTime() / 1000 + '') 
            item.countdown = item.countdown * 1000
          }
          if (item.state2 == 2) {
            item.state = 0
            item.countdown = item.auction_end_time -  parseInt(new Date().getTime() / 1000 + '') 
            item.countdown = item.countdown * 1000
          }
          if (item.state2 == 3 && item.state1 != 1) item.state = 4
          if (item.creator_avatar == undefined || item.creator_avatar == '' ) item.creator_avatar = primaryAv
          if (item.owner_avatar == undefined || item.owner_avatar == '' ) item.owner_avatar = primaryAv
        })
        window.playSs = false
        this.setState({ 
          loading:false,
          list: this.state.list.concat(json.data),
          loadingList: new Array(this.state.loadingList.length - num)
         });
      })
    })
  }
  sortClick(obj) {
    this.setState({ loading: true });
    if (obj.key == '0') {
      this.state.typeList.sort((x, y) => x.countdown - y.countdown);
    }
    if (obj.key == '1') {
      this.state.typeList.sort((x, y) => y.countdown - x.countdown);
    }
    if (obj.key == '2') {
      this.state.typeList.sort((x, y) => parseInt(x.price) - parseInt(y.price));
    }
    if (obj.key == '3') {
      this.state.typeList.sort((x, y) => parseInt(y.price) - parseInt(x.price));
    }
    this.setState({
      loading: false,
      typeList: [...this.state.typeList],
      list: this.state.typeList.slice(
        this.state.current * 12 - 12,
        this.state.current * 12
      )
    });
  }
  render() {
    const search1Content = [
      {
        name: 'auction0',
        auction: 0
      },
      {
        name: 'auction1',
        auction: 1
      },
      {
        name: 'auction2',
        auction: 2
      },
      {
        name: 'auction3',
        auction: 3
      },
      {
        name: 'auction4',
        auction: 4
      },
    ]
    const search1Menu: any = 
      <ThemeContext.Consumer>
      {value => (
        <Menu>
          {
            search1Content.map(item => (
              <Menu.Item
                key={item.auction}
                disabled={this.state.loading}
                className={this.state.auction === item.auction ? 'is' : ''}
                onClick={() => {
                  this.setTypeList(item.auction);
                }}
              >
                {json[value.lan][item.name]}
              </Menu.Item>
            ))
          }
          </Menu>
      )}
      </ThemeContext.Consumer>
    return (
      <ThemeContext.Consumer>
        {(value) => (
          <div className="box">
            <div className="search">
            <div className="searchButton">
                <div className="left">
                  <h4>{json[value.lan].search1}</h4>
                  <Dropdown overlayClassName='sortRule' overlay={search1Menu}>
                    <a className="ant-dropdown-link">
                      {json[value.lan]['auction'+ this.state.auction]}
                      &nbsp;&nbsp;&nbsp;
                      <DownOutlined />
                    </a>
                  </Dropdown>
                </div>
                <div className="center">
                  <h4>{json[value.lan].search2}</h4>
                  <Dropdown overlayClassName='sortRule' overlay={(
                    <Menu>
                      <Menu.Item
                        disabled={this.state.loading}
                        className={this.state.imgType == 0 ? 'is' : ''}
                        onClick={() => {
                          this.setTypeList2(0)
                        }}
                      >
                        {json[value.lan].imgType0}  
                      </Menu.Item>
                      <Menu.Item
                        disabled={this.state.loading}
                        className={this.state.imgType === 1 ? 'is' : ''}
                        onClick={() => {
                          this.setTypeList2(1)
                        }}
                      >
                        {json[value.lan].imgType1}
                      </Menu.Item>
                      <Menu.Item
                        disabled={this.state.loading}
                        className={this.state.imgType === 2 ? 'is' : ''}
                        onClick={() => {
                          this.setTypeList2(2)
                        }}
                      >
                        {json[value.lan].imgType2}
                      </Menu.Item>
                      <Menu.Item
                        disabled={this.state.loading}
                        className={this.state.imgType === 3 ? 'is' : ''}
                        onClick={() => {
                          this.setTypeList2(3)
                        }}
                      >
                        {json[value.lan].imgType3}
                      </Menu.Item>
                    </Menu>
                  )}>
                    <a className="ant-dropdown-link">
                      {json[value.lan]['imgType'+ this.state.imgType]}
                      &nbsp;&nbsp;&nbsp;
                      <DownOutlined />
                    </a>
                  </Dropdown>
                </div>
                <div className="right">
                  <h4>&nbsp;</h4>
                  <Dropdown overlayClassName='sortRule' overlay={(
                    <Menu>
                      <Menu.Item
                        disabled={this.state.loading}
                        className={this.state.sort === 'new' ? 'is' : ''}
                        onClick={() => {
                          this.setTypeList3('new')
                        }}
                      >
                        {json[value.lan].sort1}
                      </Menu.Item>
                      <Menu.Item
                        disabled={this.state.loading}
                        className={this.state.sort === 'old' ? 'is' : ''}
                        onClick={() => {
                          this.setTypeList3('old')
                        }}
                      >
                        {json[value.lan].sort2}
                      </Menu.Item>
                    </Menu>
                  )}>
                    <a className="ant-dropdown-link">
                      {this.state.sort === 'old' ? json[value.lan].sort2 : json[value.lan].sort1}
                      &nbsp;&nbsp;&nbsp;
                      <DownOutlined />
                    </a>
                  </Dropdown>
                </div>
              </div>
            </div>
            <div className="pagBox">
              {this.state.list.map((item, index) => (
                <div className={`list auction${item.state}`} id={"list" + index} key={index}>
                  <Link className='listA' to={`/auction/${item.token_id}?contractVersion=${item.contractVersion}`}>
                    {
                      item.isImg &&
                      <img className={'flur'} src={item.single}></img> 
                    }
                    {
                      item.single ?
                      <video autoPlay loop muted className={'flur'} src={item.single}></video> 
                      :(
                        item.layer ? <img
                        src={item.layer[0]}
                        className={'flur'}
                        alt=""
                      /> :  item.layers.map((todo,j) =>(
                          <img
                          src={todo[0]}
                          key={j}
                          className={'flur'}
                          alt=""
                        /> 
                      ))
                      )
                    }
                  </Link>
                  <h3 className="name">
                    {item.name}
                    {
                      item.edition &&
                      <span  className='edition'>{json[value.lan].vnumber} &nbsp;&nbsp; {item.edition} / {item.edition_count}</span>
                    }
                    {
                      item.contractVersion == 'v1' &&
                      <span  className='edition'>{item.layers ? json[value.lan].imgType1 : json[value.lan].imgType2}</span>
                    }
                  </h3>
                  {
                    item.state < 3 ?
                    <h4 className='sellPrice'>
                    {
                      // 不卖的不展示售价
                      item.state < 2 &&
                        <span className="priceSpan">
                          <span className="pricename">
                            {json[value.lan].price[item.state]}:
                          </span>
                          <span title={(item.max_price || item.start_price || item.buy_price)  + ' ' + window.unitlC} className="price">{(item.max_price || item.start_price || item.buy_price)  + ' ' + window.unitlC}</span>
                        </span>
                    }
                        <span className="priceSpan2">
                          <span className="pricename">
                            {json[value.lan].price[2]}：
                          </span>
                          <span className="price">{( item.buy_price)  + ' ' + window.unitlC}</span>
                        </span>
                    </h4>
                    : <h4  className='sellPrice'></h4>
                  }
                  
                  <h3 className="hasor">
                    <span>
                      <Link to={`/user/${item.creator_address}`}>
                        <img src={item.creator_avatar} alt="" />
                        {json[value.lan].artist}
                      </Link>
                      <Link to={`/user/${item.owner_address}`}>
                        <img src={item.owner_avatar} alt="" />
                        {json[value.lan].holders}
                      </Link>
                    </span>
                    {/* <HeartOutlined
                      title={json[value.lan].collection}
                      style={{ color: item.collection ? 'green' : 'red' }}
                    /> */}
                  </h3>
                  <p
                    className='type'
                    style={{
                      backgroundColor: ['#57b27a', '#eb973f', '#5087bb', '#c5315c', '#c5315c'][
                        item.state
                      ]
                    }}
                  >
                    <span>
                    {json[value.lan].show[item.state]}
                    &nbsp;
                    {(item.state ==1 || item.state == 0) && json[value.lan].countdown}
                    </span>
                      {
                        (item.state ==1 || item.state == 0) &&
                        (
                          <span>
                            {getday(item.countdown)}
                            {json[value.lan].day} &nbsp;
                            {geth(item.countdown % (1000 * 60 * 60 * 24))}
                            {json[value.lan].hour} &nbsp;
                            {getm(item.countdown % (1000 * 60 * 60))}
                            {json[value.lan].minutes} &nbsp;
                            {gets(item.countdown % (1000 * 60))}
                            {json[value.lan].seconds}
                          </span>
                        )
                      }
                      
                  </p>
                  {
                    this.props.isPersonal && !this.props.created &&
                    <Dropdown overlay={
                      <Menu>
                        <Menu.Item>
                          <Link to={`/layersEdit/${item.token_id}?contractVersion=${item.contractVersion}`}>{json2[value.lan].edit}</Link>
                        </Menu.Item>
                        
                        {
                          item.state > 1  &&
                          <Menu.Item>
                            <div  onClick={ () => {
                              this.setState({
                                isModalVisible: true,
                                transferTokenId: item.token_id,
                                showiItem: item
                              })
                            }}>
                              {json2[value.lan].transfer}
                            </div>
                          </Menu.Item>
                        }
                        {
                          item.state > 1  &&
                          <Menu.Item>
                            <div  onClick={ () => {
                              this.setState({
                                isModalVisible2: true,
                                burnTokenId: item.token_id,
                                showiItem: item
                              })
                            }} style={{color: 'red'}}>
                              {json2[value.lan].burn}
                            </div>
                          </Menu.Item>
                        }
                      </Menu>
                    } getPopupContainer={() => document.getElementById('list' + index)} placement="bottomCenter">
                      <Button className='editButton'>
                        {json2[value.lan].operation}
                      </Button>
                    </Dropdown>
                    
                  }
                  
                  
                  
                  
                </div>
              ))}
              {this.state.loadingList.map((item, index) => (
                  <div className={`list  auction${item.state}`} key={index}>
                    <Link className='listA' to={`/auction/${item.token_id}?contractVersion=${item.contractVersion}`}>
                      
                    </Link>
                    <h3 className="name" style={{marginTop: '10px'}}>
                      <Skeleton.Button shape='round' size='small' style={{ width: 200 }} active />
                    </h3>
                    <h3 className="name">
                      <Skeleton.Button shape='round' size='small' style={{ width: 200 }} active />
                    </h3>
                    <h3 className="hasor">
                      <span>
                        <a href="">
                          <Skeleton.Avatar size='small' active />
                          &nbsp;&nbsp;
                          <Skeleton.Button shape='round' size='small' style={{ width: 100 }} active />
                        </a>
                        <a href="">
                          <Skeleton.Avatar size='small' active />
                          &nbsp;&nbsp;
                          <Skeleton.Button shape='round' size='small' style={{ width: 100 }} active />
                        </a>
                      </span>
                    </h3>
                    <p
                      className='type'
                      style={{
                        backgroundColor: ['#57b27a', '#eb973f', '#5087bb', '#c5315c', '#c5315c'][
                          item.state
                        ]
                      }}
                    >
                      <Skeleton.Input  active />
                    </p>
                  </div>
                ))}
              <div className="clear"></div>
              <div className='noMore'><Spin spinning={this.state.loading}></Spin></div>
              {
                this.state.noMore &&
                <p className='noMore'>{json[value.lan].noMore}</p>
              }
            </div>
            

            <Modal
              title={json2[value.lan].transfer}
              visible={this.state.isModalVisible}
              onCancel={() =>
                this.setState({ isModalVisible: false })
              }
              onOk={this.transferToken}
              className='transfer'
            >
              <div className='imgShow2'>
                {
                  this.state.showiItem.single &&
                  <img className={'flur'} src={this.state.showiItem.single}></img> 
                }
                {
                  this.state.showiItem.single ?
                  <video autoPlay loop muted className={'flur'} src={this.state.showiItem.single}></video> 
                  :(
                    this.state.showiItem.layer ? <img
                    src={this.state.showiItem.layer[0]}
                    className={'flur'}
                    alt=""
                  /> :   this.state.showiItem.layers && this.state.showiItem.layers.map((todo,j) =>(
                      <img
                      src={todo[0]}
                      key={j}
                      className={'flur'}
                      alt=""
                    /> 
                  ))
                  )
                }
                <p>{this.state.showiItem.name}</p>
              </div>
              <Input 
                onChange={(e) => {
                  this.setState({defaultAddress: e.target.value})
                }}
                placeholder={json2[value.lan].targetAddress}
                value = {this.state.defaultAddress}
                onPressEnter={this.burn}
                defaultValue={this.state.defaultAddress}>
                 
              </Input>
            </Modal>
            <Modal
              title={json2[value.lan].burn}
              visible={this.state.isModalVisible2}
              onCancel={() =>
                this.setState({ isModalVisible2: false })
              }
              onOk={this.burn}
              className='transfer'
            >
              <div className='imgShow2'>
                {
                  this.state.showiItem.single &&
                  <img className={'flur'} src={this.state.showiItem.single}></img> 
                }
                {
                  this.state.showiItem.single ?
                  <video autoPlay loop muted className={'flur'} src={this.state.showiItem.single}></video> 
                  :(
                    this.state.showiItem.layer ? <img
                    src={this.state.showiItem.layer[0]}
                    className={'flur'}
                    alt=""
                  /> :   this.state.showiItem.layers && this.state.showiItem.layers.map((todo,j) =>(
                      <img
                      src={todo[0]}
                      key={j}
                      className={'flur'}
                      alt=""
                    /> 
                  ))
                  )
                }
                <p>{this.state.showiItem.name}</p>
              </div>
              <p>{json2[value.lan].burnMessage}</p>
            </Modal>

            <div
              className={`progressS ${this.state.process ? 'show' : ''}`}
            >
              <div>
                <p>
                  <span>{json2[value.lan].edit}</span> {
                    this.state.trading == 1 ? <CheckCircleOutlined /> : (this.state.trading == 2 ? <CloseCircleOutlined  /> : <Spin  className='is'/> )
                }</p>
                <Button type='primary' onClick={() => {
                  this.setState({trading: 0, process: false})
                }} disabled={this.state.trading == 0}>
                  {json2[value.lan].step4}
                </Button>
              </div>
            </div>
          </div>
          
        )}
      </ThemeContext.Consumer>
    );
  }
}
export function TradingList(props) {
  return (
    <ThemeContext.Consumer>
      {(value) => {
        const columns = [
          {
            title: json2[value.lan].recordName,
            ellipsis: true,
            dataIndex: 'name'
          },
          {
            title: json2[value.lan].price,
            ellipsis: true,
            dataIndex: 'price'
          },
          {
            title: 'From',
            ellipsis: true,
            dataIndex: 'from'
          },
          {
            title: 'To',
            ellipsis: true,
            dataIndex: 'to'
          },
          {
            title: json[value.lan].time,
            ellipsis: true,
            dataIndex: 'time'
          },
          {
            title: 'Tx',
            ellipsis: true,
            dataIndex: 'tx'
          }
        ];
        return <Table dataSource={props.reacordList} columns={columns} />;
      }}
    </ThemeContext.Consumer>
  );
}
