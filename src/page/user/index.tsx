import React, { useState } from 'react';
import { Tabs, Button, Spin, message } from 'antd';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../index';
import { EditOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import './user.less';
import { Content } from 'antd/lib/layout/layout';
const { TabPane } = Tabs;
import { ListTypeshow, TradingList } from './tabsDom';
import { API } from '../../fetch/fetch.js';
import { ipfsAdd, ipfsGet } from '../../fetch/ipfs.js';
import moment from 'moment';
import { web3Object } from '../../interface/contract.js';
const primaryAv = require('../../assets/images/primaryAv.png').default;
const userBC = require('../../assets/images/userbc.jpg').default;
// 默认的画布图片
const MockImg = window.defaultImg;
declare const window: any;

// 下半部分列表内容
class Listshow extends React.Component {
  static contextType = ThemeContext;
  constructor(props: object) {
    super(props);
    this.tabChange = this.tabChange.bind(this);
    this.state = {
      auction: 0, // 0:全部，1拍卖中，2即将拍卖，3：售卖（一口价的物品， 4：不卖的物品,5 全部
      publicAddress: window.publicAddress, // 这个页面不需要登录，但是合约需要地址
      allList: [],
      useList: [], // 传给下方列表组件展示的数据
      ownList: [], // 我的收藏品列表
      creatList: [], // 我创建的艺术品列表
      loading: false,
      reacordList: [] // 用户交易记录
    };
  }
  props: {
    address: string;
  };
  state: {
    auction: number, // 0:全部，1拍卖中，2即将拍卖，3：售卖（一口价的物品， 4：不卖的物品,5 全部
    publicAddress: string;
    allList: Array<any>;
    useList: Array<any>;
    loading: boolean;
    ownList: Array<any>;
    creatList: Array<any>;
    reacordList: Array<any>;
  };
  async componentDidMount() {
    let _this = this;
    let  num = await web3Object.wallet_web3.eth.getBlockNumber()
    web3Object.managerContract
      .getPastEvents('Transfer', {
        fromBlock: num - 4900,
        filter: { from: this.props.address }
      })
      .then((res) => {
        _this.setState({
          reacordList: res.map((item) => {
            return {
              name: '',
              price: item.price,
              time: null,
              tx: item.transactionHash,
              from: item.returnValues.from,
              to: item.returnValues.to
            };
          })
        });
      });
  }
  tabChange(key) {
    if (key == 2) {
      this.setState({
        useList: this.state.ownList
      });
    }
    if (key == 3) {
      this.setState({
        useList: this.state.creatList
      });
    }
  }
  render() {
    return (
      <ThemeContext.Consumer>
        {(value) => (
          <div className="bottomBox">
            <div className="bottomContent">
              <Spin spinning={this.state.loading}>
                <Tabs defaultActiveKey="1" onChange={this.tabChange}>
                  {new Array( 3, 8,  4).map((item, index) => (
                    <TabPane tab={json[value.lan][`list${item}`]} key={item}>
                      {item == 3 && (
                        <ListTypeshow created={false} address={this.props.address} isPersonal={this.context.address.toUpperCase() == this.props.address.toUpperCase()}></ListTypeshow>
                      )}
                      {item == 8 && (
                        <ListTypeshow created={true} address={this.props.address} isPersonal={this.context.address.toUpperCase() == this.props.address.toUpperCase()}></ListTypeshow>
                      )}
                      {item == 4 && (
                        <TradingList
                          reacordList={this.state.reacordList}
                        ></TradingList>
                      )}
                    </TabPane>
                  ))}
                </Tabs>
              </Spin>
            </div>
          </div>
        )}
      </ThemeContext.Consumer>
    );
  }
}

// 上半部分用户信息
class Info extends React.Component {
  static contextType = ThemeContext;
  constructor(props: any) {
    super(props);

    this.state = {
      user: {
        img: '',
        name: '',
        address: '',
        introduce: '',
        imgHash: ''
      }
    };
  }
  state: {
    user: {
      img: string;
      name: string;
      address: string;
      introduce: string;
      imgHash: string;
    };
  };
  props: {
    userid: string;
  };

  componentDidMount() {
    const _this = this;
    fetch(`${window.ftachUrl}/get_info?user_address=${this.props.userid}`)
    .then(res => res.json())
    .then(json => {
      if (json.avatar == undefined || json.avatar == '') {
        json.avatar = primaryAv
      }
      _this.setState({user: {
        img: json.avatar,
        ...json
      }})
    })
  }

  render() {
    let is = false;
    if (
      this.context.address &&
      this.context.address.toUpperCase() == this.props.userid.toUpperCase()
    ) {
      is = true;
    }
    return (
      <ThemeContext.Consumer>
        {(value) => (
          <div className="userinfoBox" style={{position: 'relative'}}>
            <img src={userBC} style={{position: "absolute", width:'100%', height:'calc(100% - 80px)', top: '80px',objectFit:'cover'}} alt=""/>
            <div className="userinfo">
              <div className="userLeft">
                <div className={is ? 'is imgbox' : 'imgbox'}>
                  <div className="shadowBox"></div>
                  <Link className="edit" to={'/userEdit'}>
                    {json[value.lan].editt}
                  </Link>
                  <img src={this.state.user.img} alt="" />
                </div>
                {/* <Button>{json[value.lan].attention}</Button> */}
              </div>
              <div className="userRight">
                <h3>{this.state.user.name}</h3>
                <p>
                  {this.props.userid}
                  <EditOutlined
                    onClick={() => {
                      const oInput = document.createElement('input');
                      oInput.value = this.props.userid;
                      document.body.appendChild(oInput);
                      oInput.select();
                      const res = document.execCommand('copy');
                      document.body.removeChild(oInput);
                      res && message.success('success');
                      !res && message.error('error');
                    }}
                  />
                </p>
                <div className="dis">{this.state.user.introduce}</div>
              </div>
              <div className="clear"></div>
              <div className="fansBox">
                {/* <div className="fans">
                  <span>{json[value.lan].attention}</span>
                  <span>{Math.ceil(Math.random() * 10000)}</span>
                </div>
                <div className="fans">
                  <span>{json[value.lan].list7}</span>
                  <span>{Math.ceil(Math.random() * 10000)}</span>
                </div> */}
              </div>
            </div>
          </div>
        )}
      </ThemeContext.Consumer>
    );
  }
}

export class User extends React.Component {
  constructor(props: any) {
    super(props);
  }
  props: any;
  // 路由参数变化
  componentWillReceiveProps(newProps) {
    this.forceUpdate()
  }
  render() {
    return (
      <div id="User" key={this.props.match.params.userid}>
        <Info userid={this.props.match.params.userid}></Info>
        <Listshow  address={this.props.match.params.userid}></Listshow>
      </div>
    );
  }
}
