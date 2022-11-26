import React, { ReactElement, useState } from 'react';
import { Button, Menu, Dropdown, Skeleton, Spin } from 'antd';
import { ThemeContext } from '../../index';
import { EditOutlined, DownOutlined, HeartOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import { Link } from 'react-router-dom';
import { ipfsGet } from '../../fetch/ipfs.js';
import './gallery.less';
import moment from 'moment';
import { API } from '../../fetch/fetch.js';
import { Divider } from 'rc-menu';
const primaryAv = require('../../assets/images/primaryAv.png').default;
import Web3 from 'web3';
const minterface = require('../../interface/CortexArtAbiV2.json');

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

  const wallet_web3 = new Web3(window.web3.currentProvider);
  const managerContract = new wallet_web3.eth.Contract(minterface,  window.mainAddressU)
  try {
    let  momentT = moment().unix()
    for (let i = 0; i < data.length; i ++) {
    let item = data[i]
    // 查询售价
    let web3Obj = item.contractVersion == 'v2' ? window.web3Object2 : window.web3ObjectOld2
    const Price = await managerContract.methods
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
  }catch(err){console.log(err)}
  fn()
}

  // 获取最新的出价记录
  async function  getAuctionRecord(data) {
    let web3Obj = data.contractVersion == 'v2' ? window.web3Object2 : window.web3ObjectOld2
    try {
          // 获取拍卖纪录
      let  num = await web3Obj.wallet_web3.eth.getBlockNumber()
      let res = await web3Obj.managerContract.getPastEvents('BidProposed', {fromBlock: num - 4900})

      res = res.filter(
        (item) => item.returnValues.tokenId == data.token_id
      );
      if (res.length > 0) {
        data.start_price =  (res[res.length - 1].returnValues.bidAmount / window.defaultUnit)
      }
    }catch {

    }
  
    
  }

class Listshow extends React.Component {
  static contextType = ThemeContext;
  constructor(props: object) {
    super(props);
    this.getArtList = this.getArtList.bind(this);
    this.scrollHand = this.scrollHand.bind(this);
    this.setTypeList = this.setTypeList.bind(this);
    this.setTypeList2 = this.setTypeList2.bind(this);
    this.state = {
      loadingList: [],
      auction: 0, // 0:全部，1拍卖中，2即将拍卖，3：售卖（一口价的物品， 4：不卖的物品,5 全部
      imgType: 0, // 0: 全部， -1主画布， -2图层，3单幅
      collation: 0, // 搜索结果排序规则
      total_page: 1, // 总共有多少页搜索结果
      noMore: false,
      list: [],
      sort: 'old',
      allList: [], // 所有的艺术品
      typeList: [], // allList按照当前筛选条件筛选的所有艺术品，主要是分页保存数据用
      loading: false,
      current:1,
      publicAddress: window.publicAddress // 这个页面不需要登录，但是合约需要地址
    };
  }
  scrollHand(e)  {
    if (window.playSs) return
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
    window.playSs = false
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
    current: number;
    total_page: number;
    noMore: boolean;
    loadingList: Array<any>;
  };
  // 从所有的艺术品里筛选出列表typeList
  setTypeList(num) {
    window.playSs = false
    this.setState({list: []})
    this.state.current = 1
    if(this.state.auction == num ) {
      this.state.auction = 0
    } else {
      this.state.auction = num
    }
    this.getArtList()
  }
  // 从所有的艺术品里筛选出列表typeList
  setTypeList2(num) {
    window.playSs = false
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
    fetch(`${window.ftachUrl}/show_pic?page=${this.state.current}${this.state.auction == 0 ? '' : '&state=' + ['auction', 'auctioned', 'purchase', 'enjoy', ''][this.state.auction - 1]}${this.state.imgType != 0 ? '&pic=' + ['', 'canvas', 'layer', 'single'][this.state.imgType] : ''}${this.state.sort? '&sort=' + this.state.sort: ''}`)
    .then(res => res.json())
    .then(json => {
      if (json.data.length == 0) {
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
      // 防止用户切换主网，合约挂掉
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
          loadingList:  this.state.loadingList.slice(num)
         });
      })
    }).catch(err => {
      console.log(err)
    })
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
              <h1>{json[value.lan].gallery}</h1>
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
                  <div className={`list auction${item.state}`} key={index}>
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
                        <span  className='edition'>
                          {item.type == 'single' && json[value.lan].imgType3}
                          {item.layers && json[value.lan].imgType1}
                          {item.layer && json[value.lan].imgType2}
                        </span>
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
              </div>
                <div className='noMore'><Spin spinning={this.state.loading}></Spin></div>

                {
                  this.state.noMore &&
                  <p className='noMore'>{json[value.lan].noMore}</p>
                }
            
          
          </div>
        )}
      </ThemeContext.Consumer>
    );
  }
}

export function Gallery(props: any) {
  return (
    <div id="gallery">
      <Listshow></Listshow>
    </div>
  );
}
