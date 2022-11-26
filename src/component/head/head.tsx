import React, { useState } from 'react';
import { Input, message, Popover,Menu,Dropdown } from 'antd';
import { SearchOutlined,CaretDownOutlined } from '@ant-design/icons';
import { LanChance } from '../../page/home/component/languageChance';
import { ThemeContext } from '../../index';
const json = require('./lan.json');
import { Link } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons';
import { API } from '../../fetch/fetch';
import { ipfsAdd, ipfsGet } from '../../fetch/ipfs.js';
const { web3Object,  web3ObjectOld} = require('../../interface/contract.js');
const logo = require('../../assets/images/logo.svg');
const logo2 = require('../../assets/images/hecologo.svg');
const logo3 = require('../../assets/images/ethlogo.svg');
const logo4 = require('../../assets/images/Rinkeby.png');
const primaryAv = require('../../assets/images/primaryAv.png').default;
const metamaskLogo = require('../../assets/images/metamaskLogo.png').default;
function HeadRight() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const showModal = () => {
    setIsModalVisible(!isModalVisible);
  };
  const onPressEnter = (value) => {
    message.info('该功能完善中');
    setIsModalVisible(false);
  };
  return (
    <ThemeContext.Consumer>
      {(value) => (
        <div className="headRight">
          {/* <Link to="" className="homeLink">
            {json[value.lan].link0}
          </Link> */}
          <Link to="/gallery">{json[value.lan].link1}</Link>
          {/* <Link to="">{json[value.lan].link2}</Link>
          <Link to="">{json[value.lan].link3}</Link> */}
          <LanChance></LanChance>
          <SearchOutlined onClick={showModal}></SearchOutlined>
          <div className={`head-search ${isModalVisible && 'show'}`}>
            <Input
              onBlur={() => {
                setIsModalVisible(false);
              }}
              onPressEnter={onPressEnter}
            />
          </div>
        </div>
      )}
    </ThemeContext.Consumer>
  );
}

declare const window: any;
// 头像和hover显示的dom
export class GetUserInfoDom extends React.Component {
  static contextType = ThemeContext;
  constructor(props: any) {
    super(props);
    this.state = {
      userInfo: {},
      canCreatArt: false
    };
  }
  state: {
    userInfo: any;
    canCreatArt: boolean;
  };
  async componentDidMount() {
    const _this = this;
    this.setState({ address: this.context.address });
    fetch(`${window.ftachUrl}/get_info?user_address=${this.context.address}`)
    .then(res => res.json())
    .then(json => {
      if (json.avatar == undefined || json.avatar == '') {
        json.avatar = primaryAv
      }
      _this.setState({
        userInfo: {
          ...json
        }
      })
    })

    web3Object.managerContract.methods
      .artistWhitelist(this.context.address)
      .call({ gas: 1000000 })
      .then((res) => {
        console.log(res)
        if (res == false) {
          this.setState({ canCreatArt: res });
          return
        }
        web3ObjectOld.managerContract.methods
        .artistWhitelist(this.context.address)
        .call({ gas: 1000000 })
        .then((res) => {
          console.log('地址  :' + this.context.address);
          console.log('是否拥有艺术家权限：' + res);
          // 用户有没有创建艺术品的权限
          this.setState({ canCreatArt: res });
        });
      });
  }
  render() {
    const content = (
      <ThemeContext.Consumer>
        {(value) => (
          <div className="userPop">
            <Link to={'/userEdit'}>{json[value.lan].edit}</Link>
            <Link to={`/user/${this.context.address}`}>
              {json[value.lan].personal}
            </Link>
            {this.state.canCreatArt ? (
              <Link to={'/createArtF'}>{json[value.lan].creat}</Link>
            ) : (
              <a target='_blank' href={window.ssssss}>{json[value.lan].apply}</a>
            )}
            {/* <Link to={'/generateLayer'}>{json[value.lan].generate}</Link> */}
            <a target='_blank' href={window.issueReport}>{json[value.lan].issueReport}</a>
            <a onClick={() => value.userUnLogin()}>{json[value.lan].loginOut}</a>
            {/* {
              this.context.address.toUpperCase() == window.adminAddress.toUpperCase() &&
              <Link to={'/adminAddPer'}>管理白名单</Link>
            } */}
          </div>
        )}
      </ThemeContext.Consumer>
    );
    return (
      <ThemeContext.Consumer>
        {(value) => (
          <Popover
            placement="bottomRight"
            title={`Hello ${
              this.state.userInfo.name ||
              (this.context.address &&
                this.context.address.substring(0, 6) + '...')
            }`}
            content={content}
          >
            <img src={this.state.userInfo.avatar} alt="" />
          </Popover>
        )}
      </ThemeContext.Consumer>
    );
  }
}

// 头部
export class HEADC extends React.Component {
  static contextType = ThemeContext;
  constructor(props: object) {
    super(props);
    this.onSearch = this.onSearch.bind(this);
  }
  onSearch(value: object) {
    console.log(value);
  }

  render() {

  const logoImg = 
        window.chainName == 'heco' ?
        <img className='logo2'  src={logo2.default} alt="" />
        : (
          window.chainName == 'Ethereum' ?
          <img className='logo2'  src={logo3.default} alt="" />
          : <img className='logo2'  src={logo4.default} alt="" />
        )

    return (
      <ThemeContext.Consumer>
        {(value) => (
          <div id="head">
            <div className="head-content">
              <div className="head-logo">
                <Link to="" className="homeLink">
                  <img  src={logo.default} alt="" />
                </Link>
                <div className='chainChance'>
                  {
                    window.urlList.map(item => (
                      <p key={item.name}  className={window.chainName == item.name && 'active'}
                        style={
                          {
                            backgroundColor:window.chainName == item.name  ? item.bcColor : item.bcColor2,
                            borderColor: window.chainName == item.name  ? item.borderColor : item.borderColor2
                          }
                        }
                      >
                        <a rel="noopener noreferrer" href={item.url}>
                          {item.name}
                        </a>
                      </p>
                    ))
                  }
                </div>
              </div>
              <HeadRight></HeadRight>
            </div>
            {value.hasLoginWallet ? (
              <div className="userImg">
                <GetUserInfoDom />
              </div>
            ) : (
              <div className="nologin">
                <img src={metamaskLogo} onClick={() => {value.userLogin()}}>

                </img>
              </div>
            )}
          </div>
        )}
      </ThemeContext.Consumer>
    );
  }
}
