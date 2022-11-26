import React, { useState } from 'react';
import { Input, Select, message, Button, notification } from 'antd';
const { Option } = Select;
import { Link } from 'react-router-dom';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import { web3Object } from '../../interface/contract.js';
import { ThemeContext } from '../../index';
import { downImg } from '../../fetch/fetch.js';
import { API, uploadAvatar, walletSign } from '../../fetch/fetch';
import './createArtF.less';
declare const window: any;

const S = require('../../assets/images/s.png').default

export class createArtF extends React.Component {
  static contextType = ThemeContext;
  constructor(props: any) {
    super(props);
    this.state = {
      model: '1',
      text: '',
      url1: require('../../assets/images/create1.png').default,
      url2: require('../../assets/images/create2.png').default,
    };
  }
  state: {
    model: string;
    text: string;
    url1: string;
    url2: string;
  };
  componentDidMount(){
    web3Object.managerContract.methods
      .artistWhitelist(this.context.address)
      .call({ gas: 1000000 })
      .then((res) => {
        if (!res) {
          notification.open({message: 'No permissions' ,duration: 0,});
          window.history.go(-1)
          return
        }
      });
  }
  render() {
    return (
      <ThemeContext.Consumer>
        {(value) => (
          <div id="createArtF">
            <div className="content">
              <h1>{json[value.lan].title}</h1>
              <div>
                <h2>{json[value.lan].title2}</h2>
                <p>{json[value.lan].title3}</p>
                <p>{json[value.lan].title4}</p>
                <div>
                  <span>
                    <img src={this.state.url1} alt=""/>
                    <Link to={'/createArtD'}><Button>{json[value.lan].button1}</Button></Link>
                  </span>
                  <span>
                    <img src={this.state.url2} alt=""/>
                    <Link to={'/createArt'}><Button>{json[value.lan].button2}</Button></Link>
                  </span>
                </div>
              </div>
             </div>
          </div>
        )}
      </ThemeContext.Consumer>
    );
  }
}
