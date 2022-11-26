import React, { useState } from 'react';
import { Input, Select, message, Form, Button, Checkbox } from 'antd';
const { Option } = Select;
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import { downImg } from '../../fetch/fetch.js';
import { API, uploadAvatar, walletSign } from '../../fetch/fetch';
import './generateLayer.less';
declare const window: any;

const S = require('../../assets/images/s.png').default

export class generateLayer extends React.Component {
  static contextType = ThemeContext;
  constructor(props: any) {
    super(props);
    this.down = this.down.bind(this);
    this.modelC = this.modelC.bind(this);
    this.adwnImg = this.adwnImg.bind(this);
    this.state = {
      model: '1',
      text: '',
      url: require('../../assets/images/imgDef.png').default
    };
  }
  state: {
    model: string;
    text: string;
    url: string;
  };
  down() {
    let _this = this;
    downImg(this.context.address, this.state.text)
      .then((res) => _this.setState({ url: res }))
      .catch((err) => message.error('error'));
  }
  adwnImg() {
    const link = document.createElement('a');
    link.href = this.state.url;
    link.download = 'file';
    link.click();
    window.URL.revokeObjectURL(link.href);
  }
  modelC(n) {
    this.setState({model: n})
  }
  render() {
    return (
      <ThemeContext.Consumer>
        {(value) => (
          <div id="generateLayer">
            <div className="content">
              <h1>{json[value.lan].title}</h1>

              <h4>{json[value.lan].chance}</h4>
              <div className='modelC'>
                <div className={this.state.model == '1' ? 'active' : ''}  onClick={() => {this.modelC('1')}}>
                  <img src={S} alt=""/>
                  <p>
                    {json[value.lan].model1}
                  </p>
                </div>
              </div>
              <h4>{json[value.lan].dis}</h4>  
              <div className="text">
                <Input maxLength={25} onChange={(v) => this.setState({ text: v.target.value })} ></Input>
                <Button
                  disabled={this.state.text.length === 0}
                  onClick={this.down}
                >
                  {json[value.lan].generate}
                </Button>
              </div>
              <div className='show'>
                <img src={this.state.url} alt="" />
                <Button disabled={!this.state.url} onClick={this.adwnImg}>
                  {json[value.lan].down}
                </Button>
              </div>
            </div>
          </div>
        )}
      </ThemeContext.Consumer>
    );
  }
}
