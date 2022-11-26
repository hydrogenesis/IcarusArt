import React, { useState } from 'react';
import { Input, Button, Progress, Carousel } from 'antd';
import { ThemeContext } from '../../index';
import { UpOutlined, DownOutlined, LoginOutlined } from '@ant-design/icons';
const json = require('./lan.json');
const json2 = require('../gallery/lan.json');
import moment from 'moment';
const list = require('./galleries.json');
// const artist = require('./artist.json');
import { Foot } from './../../component/foot/foot';
import { Link } from 'react-router-dom';
import './home.less';
import Web3 from 'web3';
const minterface = require('../../interface/CortexArtAbiV2.json');
const primaryAv = require('../../assets/images/primaryAv.png').default;
import { HomeShow } from './homeShow'
// const videoHome = require('./../../assets/home.mp4').default
const artist = [1, 2, 3, 4, 5].map((item) => {
  return {
    name: '宋婷',
    title: {
      zn: 'AI和区块链艺术家',
      en: 'SongTing AI and Blockchain artist',
      hn: 'Song Ting 블록체인·AI 아티스트'
    },
    id: '0x2a2a0667f9cbf4055e48eaf0d5b40304b8822184',
    imgurl: require('./../../assets/images/avo.png').default,
    dis: {
      zn: '2020年中国区块链艺术品拍卖纪录保持者',
      en: "Record holder of 2020 China's blockchain art auction",
      hn: '2020 중국 블록체인 미술품 경매 기록 보유자'
    }
  };
});
declare const window: any;


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


async function getPrice(item, fn){
  let web3Obj = item.contractVersion == 'v2' ? window.web3Object2 : window.web3ObjectOld2
  let  momentT = moment().unix()

  const wallet_web3 = new Web3(window.web3.currentProvider);
  const managerContract = new wallet_web3.eth.Contract(minterface,  window.mainAddressU)
    // 查询售价
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
  fn()
}

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


export class ArtList extends React.Component {
  constructor(props: object) {
    super(props)
    this.state = {
      list: []
    }
  }
  state: {
    list: Array<any>
  }
  componentWillUnmount() {
    clearInterval(window.imgLoadingS)
  }
  componentWillMount() {
    let list = []
    let _this = this
    window.showHomeArtTokenId != undefined ? window.showHomeArtTokenId.forEach(token => {
      fetch(`${window.ftachUrl}/get_works?token_id=${token}&contractVersion=v2`) 
      .then(res => res.json())
      .then(json => {
        if (json.single) {
          let x = json.single.split('.')
          json.isImg = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'].indexOf(x[x.length - 1]) > -1
        }
        getPrice(json, () => {
          let data = {...json}
          if (json.state1 == 0) data.state = 3
          if (json.state1 == 1) data.state = 2
          // if (item.state2 == 0) 
          if (json.state2 == 1) {
            data.state = 1
            data.countdown = data.auction_start_time -  parseInt(new Date().getTime() / 1000 + '') 
            data.countdown = data.countdown * 1000
          }
          if (json.state2 == 2) {
            data.state = 0
            data.countdown = data.auction_end_time -  parseInt(new Date().getTime() / 1000 + '') 
            data.countdown = data.countdown * 1000
          }
          if (data.state2 == 3 && data.state1 != 1) data.state = 4
          if (data.creator_avatar == undefined || data.creator_avatar == '' ) data.creator_avatar = primaryAv
          if (data.owner_avatar == undefined || data.owner_avatar == '' ) data.owner_avatar = primaryAv
          
          list.push(data)
          if (list.length == window.showHomeArtTokenId.length) {
            _this.setState({list: list})
          }
        })
      })
    }) :
    fetch(`${window.ftachUrl}/get_latest`) 
      .then(res => res.json())
      .then(ress => {
        let num = 0
        ress.forEach((json,i) => {
          if (json.single) {
            let x = json.single.split('.')
            json.isImg = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'].indexOf(x[x.length - 1]) > -1
          }
          getPrice(json, () => {
            let data = {...json}
            if (json.state1 == 0) data.state = 3
            if (json.state1 == 1) data.state = 2
            // if (item.state2 == 0) 
            if (json.state2 == 1) {
              data.state = 1
              data.countdown = data.auction_start_time -  parseInt(new Date().getTime() / 1000 + '') 
              data.countdown = data.countdown * 1000
            }
            if (json.state2 == 2) {
              data.state = 0
              data.countdown = data.auction_end_time -  parseInt(new Date().getTime() / 1000 + '') 
              data.countdown = data.countdown * 1000
            }
            if (data.state2 == 3 && data.state1 != 1) data.state = 4
            if (data.creator_avatar == undefined || data.creator_avatar == '' ) data.creator_avatar = primaryAv
            if (data.owner_avatar == undefined || data.owner_avatar == '' ) data.owner_avatar = primaryAv
            ress[i] = data
            num ++
            if (num == ress.length) {
              _this.setState({list: ress})
            }
          })
        })
      })

     
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
  render() {
    return (
      <ThemeContext.Consumer>
      {(value) => (
         <Carousel autoplay className='artList'>
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
                        {json2[value.lan].price[item.state]}:
                      </span>
                      <span title={(item.max_price || item.start_price || item.buy_price)  + ' ' + window.unitlC} className="price">{(item.max_price || item.start_price || item.buy_price)  + ' ' + window.unitlC}</span>
                    </span>
                }
                    <span className="priceSpan2">
                      <span className="pricename">
                        {json2[value.lan].price[2]}：
                      </span>
                      <span className="price">{( item.buy_price)  + ' ' + window.unitlC}</span>
                    </span>
                </h4>
                : <h4  className='sellPrice'></h4>
              }
              
              <h3 className="hasor">
                <Link to={`/user/${item.creator_address}`}>
                  <img src={item.creator_avatar} alt="" />
                  {item.creator_name}
                </Link>
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
                {json2[value.lan].show[item.state]}
                &nbsp;
                {(item.state ==1 || item.state == 0) && json2[value.lan].countdown}
                </span>
                  {
                    (item.state ==1 || item.state == 0) &&
                    (
                      <span>
                        {getday(item.countdown)}
                        {json2[value.lan].day} &nbsp;
                        {geth(item.countdown % (1000 * 60 * 60 * 24))}
                        {json2[value.lan].hour} &nbsp;
                        {getm(item.countdown % (1000 * 60 * 60))}
                        {json2[value.lan].minutes} &nbsp;
                        {gets(item.countdown % (1000 * 60))}
                        {json2[value.lan].seconds}
                      </span>
                    )
                  }
                  
              </p>
            </div>
          ))}
       </Carousel>
      )}
    </ThemeContext.Consumer>
     
    );
  }
}

// 介绍框
function Introduce() {
  return (
    <ThemeContext.Consumer>
      {(value) => (
        <div id="homeIntroduce">
          <p className='week'>{json[value.lan].week}</p>
          {/* <ArtList></ArtList> */}
          <HomeShow></HomeShow>
          <div className='modelTop'></div>
          <div className='modelBottom'></div>
          <iframe className="homeIMg" src="./homeBc.html"></iframe>
          {/* <video className='homeIMg' autoPlay muted loop src='./home.mp4'></video> */}
          <div className="dis">
            <div className="dis1">{json[value.lan].dis1}</div>
            <div className="dis2">{json[value.lan].dis2}</div>
            {/* <div className="dis3">{json[value.lan].dis3}</div> */}
            <p className="buttonList">
              <Link to="/gallery">
                <Button type="primary" size={'large'}>
                  {json[value.lan].link4}
                </Button>
              </Link>
              {/* <Button size={'large'}>{json[value.lan].link5}</Button> */}
            </p>
          </div>
        </div>
      )}
    </ThemeContext.Consumer>
  );
}
// 画廊
function Carouselpic() {
  const [num, setNum] = useState(0);
  const [countdown, setNum2] = useState(0);
  window.imgtimeout && clearTimeout(window.imgtimeout);
  window.imgtimeout = setTimeout(() => {
    setNum2(countdown + 1);
    if (countdown >= 100) {
      setNum2(0);
      changenum('1');
    }
  }, 100);
  function changenum(n: any) {
    if (typeof n === 'string') {
      let destination: number = num + parseInt(n);
      switch (destination) {
        case list.length:
          setNum(0);
          break;
        case -1:
          setNum(list.length - 1);
          break;
        default:
          setNum(destination);
      }
    } else {
      setNum(n);
    }
    setNum2(0);
  }
  return (
    <ThemeContext.Consumer>
      {(value) => (
        <div id="Carouselpic">
          <h2>{json[value.lan].titie}</h2>
          <div className="imgList">
            <div
              className="imgbox"
              style={{
                width: `${600 * list.length + 200}px`,
                left: `${300 - num * 620}px`
              }}
            >
              {list.map((item, index) => (
                <div
                  onClick={() => {
                    changenum(index);
                  }}
                  key={index}
                  className={` imgShow ${num === index ? 'show' : ''} ${
                    num > index ? 'lag' : ''
                  } ${num < index ? 'min' : ''}`}
                >
                  <img src={item.imgurl} />
                  <p className="dis">{item.dis[value.lan]}</p>
                  <h3 className="name">{item.name}</h3>
                  <p className="artist">{item.artist}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="listNum">
            <UpOutlined
              onClick={() => {
                changenum('-1');
              }}
            />
            {list.map((item, index) => (
              <span
                key={index}
                onClick={() => {
                  changenum(index);
                }}
                className={index === num ? 'show' : ''}
              >
                {index + 1 > 9 ? index + 1 : '0' + (index + 1)}
                <img src={item.imgurl} alt="" />
              </span>
            ))}
            <DownOutlined
              onClick={() => {
                changenum('1');
              }}
            />
          </div>
          <div className="Progress">
            <Progress
              type="circle"
              width={60}
              trailColor={'black'}
              strokeColor={'white'}
              showInfo={false}
              percent={countdown}
            ></Progress>
          </div>
        </div>
      )}
    </ThemeContext.Consumer>
  );
}
// 艺术家介绍
function ArtistList() {
  const [num2, setNum2] = useState(0);
  const [countdown2, setCount] = useState(0);
  window.imgtimeout2 && clearTimeout(window.imgtimeout2);
  window.imgtimeout2 = setTimeout(() => {
    setCount(countdown2 + 1);
    if (countdown2 >= 100) {
      setCount(0);
      changenum('1');
    }
  }, 100);
  function changenum(n: any) {
    if (typeof n === 'string') {
      let destination: number = num2 + parseInt(n);
      switch (destination) {
        case list.length:
          setNum2(0);
          break;
        case -1:
          setNum2(list.length - 1);
          break;
        default:
          setNum2(destination);
      }
    } else {
      setNum2(n);
    }
    setCount(0);
  }
  return (
    <ThemeContext.Consumer>
      {(value) => (
        <div id="ArtistList">
          <h2>{json[value.lan].artist}</h2>
          <div className="imgList">
            <div
              className="imgbox"
              style={{
                height: `${300 * list.length}px`,
                top: `${100 - num2 * 300}px`
              }}
            >
              {artist.map((item: any, index) => (
                <div
                  onClick={() => {
                    changenum(index);
                  }}
                  key={index}
                  className={`imgShow ${num2 === index ? 'show' : ''}`}
                >
                  <p className="bigName">{item.name}</p>
                  <img src={item.imgurl} />
                  <h3 className="name">{item.name}</h3>
                  <p className="title">{item.title[value.lan]}</p>
                  {num2 === index ? (
                    <p className="dis">
                      {item.dis[value.lan].split('').map((item, index) => (
                        <span
                          key={index}
                          style={{
                            animationDelay: index * 0.1 + 0.5 + 's'
                          }}
                        >
                          {item}
                        </span>
                      ))}
                      <Link to={`/user/${item.id}`}>
                        <LoginOutlined title={'前往个人主页'} />
                      </Link>
                    </p>
                  ) : (
                    ''
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="listNum">
            <UpOutlined
              onClick={() => {
                changenum('-1');
              }}
            />
            {artist.map((item, index) => (
              <span
                key={index}
                onClick={() => {
                  changenum(index);
                }}
                className={index === num2 ? 'show' : ''}
              >
                {index + 1 > 9 ? index + 1 : '0' + (index + 1)}
                <span>{item.name}</span>
              </span>
            ))}
            <DownOutlined
              onClick={() => {
                changenum('1');
              }}
            />
          </div>
          <div className="Progress">
            <Progress
              type="circle"
              width={60}
              trailColor={'black'}
              strokeColor={'white'}
              showInfo={false}
              percent={countdown2}
            ></Progress>
          </div>
          {/* <div className="allArtist">
              <Button onClick={() => {

              }}>所有艺术家</Button>
          </div> */}
        </div>
      )}
    </ThemeContext.Consumer>
  );
}
// 加入我们

function Join() {
  return (
    <ThemeContext.Consumer>
      {(value) => (
        <div id="joinus">
          <div className="box">
            <h2>{json[value.lan].join}</h2>
            <p>
              <Button>{json[value.lan].link3}</Button>
            </p>
          </div>
        </div>
      )}
    </ThemeContext.Consumer>
  );
}
export class Home extends React.Component {
  componentDidMount() {
    document.querySelector('html').scrollTop = 0;
    const body = document.querySelector('body'),
      home = document.querySelector('#home') as HTMLElement,
      foot = document.querySelector('#appFoot') as HTMLElement;
    let homeIndex = 0,
      homeboxNum = document.querySelectorAll('#home>div').length - 2;
    let mouselimite: boolean = false;
    body.style.overflow = 'hidden';
    // 首页禁止滚动条，当触发滚动事件，就翻一页
    const onmousewheel = (ev: any) => {
      if (mouselimite) {
        return;
      }
      mouselimite = true;
      setTimeout(() => {
        mouselimite = false;
      }, 2000);
      const down: boolean = ev.wheelDelta ? ev.wheelDelta < 0 : ev.detail > 0,
        height = body.clientHeight,
        width = body.clientWidth;
      if (down) {
        homeIndex = Math.min(homeIndex + 1, homeboxNum);
      } else {
        homeIndex = Math.max(homeIndex - 1, 0);
      }
      home.style.transform = `translateY(-${homeIndex * height}px)`;
      fn(width, height);
    };
    document.addEventListener('DOMMouseScroll', onmousewheel, false);
    window.onmousewheel = onmousewheel;
    // 防止用户自己修改浏览器分辨率，导致页面样式崩盘
    function fn(w, h) {
      const arr = [
        document.querySelector('#homeIntroduce') as HTMLElement,
        document.querySelector('#Carouselpic') as HTMLElement,
        document.querySelector('#ArtistList') as HTMLElement,
        document.querySelector('#joinus') as HTMLElement
      ];
      arr[0].style.width = w;
      arr[0].style.height = h;
      arr[1].style.height = h;
      arr[2].style.height = h;
      arr[3].style.height = ` ${h - 400}px`;
    }
  }
  componentWillUnmount() {
    document.querySelector('body').style.overflow = '';
    window.imgtimeout && clearTimeout(window.imgtimeout);
    window.imgtimeout2 && clearTimeout(window.imgtimeout2);
    document.removeEventListener('DOMMouseScroll', null, false);
    window.onmousewheel = null;
  }
  render() {
    return (
      <div id="home">
        <Introduce></Introduce>
        {/* <Carouselpic></Carouselpic>
        <ArtistList></ArtistList> */}
        {/* <Join></Join> */}
        {/* <Foot></Foot> */}
        <p style={{zIndex: 3}}>2021 IcarusArt.AI
          <Link id='term' to='/Term'>Term of Use</Link>
        </p>
      </div>
    );
  }
}
