import React, { useState } from 'react';
import { Input, InputNumber, Select, message, Button, Upload, Spin ,notification} from 'antd';
const { Option } = Select;
import { Link } from 'react-router-dom';
import { InboxOutlined, PlusOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import { web3Object } from '../../interface/contract.js';
import { downImg } from '../../fetch/fetch.js';
import { API, uploadAvatar, walletSign } from '../../fetch/fetch';
import './createArtD.less';
declare const window: any;
import {
  CloseCircleOutlined,
  CheckCircleOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { RcFile } from 'antd/lib/upload';

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

export class createArtD extends React.Component {
  static contextType = ThemeContext;
  constructor(props: any) {
    super(props);
    this.handleChange = this.handleChange.bind(this)
    this.coin = this.coin.bind(this)
    this.state = {
      name: '',
      dis: '',
      img: '',
      loading: false,
      canvasCoin: false,
      tokenId: '',
      percent: 0,
      coinError: false,
      vnumber: 1,
    };
  }
  state: {
    name: string;
    dis: string;
    img: any,
    loading: boolean,
    canvasCoin: boolean,
    tokenId: string,
    percent: number,
    coinError: boolean,
    vnumber: number
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
  coin() {
    let that = this
    var formData = new FormData();
    formData.append("user_address", this.context.address);
    formData.append("type", 'single');
    formData.append("name", this.state.name);
    formData.append("introduce", this.state.dis);
    formData.append("create_time", new Date().getTime() + '');
    formData.append("str", window.uploadImg_create);
    this.setState({loading: true, coinError: false})
    fetch(`${window.ftachUrl}/single_token`, {
      method: 'post',
      body: formData
    }).then(res => res.json())
    .then(json => {
      that.state.tokenId = json.token_id
      that.setState({percent: 1})
      let arr = new Array(that.state.vnumber)
      for (let i = 0; i < arr.length; i ++ ) {
        arr[i] = json.single_metadata_hash
      }
      web3Object.managerContract.methods.mintArtwork(arr)
      .send({ from: that.context.address })
      .then((res) => {
        that.setState({percent: 2})
        notification.success({message: 'success',duration: 10,});
        that.setState({
          canvasCoin: true,
        })
      })
      .catch((err) =>  {
        that.setState({loading: false,coinError: true})
        if (err.message) {
          notification.open({message: err.message ,duration: 0,});
        }
      });
      
    })
    .catch(err => {
      console.log(err)
      that.setState({loading: false,coinError: true})
      message.error('network error')
    })
  }
  handleChange = (info) => {
    if (info.file.status === 'removed') {
      this.state.img = ''
    }
    // if (info.file.status === 'error') {
    //   item.list = item.list.filter(todo => todo.name !== info.file.name)
    // }
    if (info.file.status === 'done') {
      getBase64(window.uploadImg_create, (data) => {
        this.setState({img: data.replace('quicktime', 'MP4')})
      })
    }
  };
  render() {
    return (
      <ThemeContext.Consumer>
        {(value) => (
            <div id="createArtD">
              <div className="content">
              <h1>{json[value.lan].upload}</h1>
              <p  className='title2'>{json[value.lan].title2}</p>
              <h3>{json[value.lan].name}</h3>
              <Input value={this.state.name} onChange={(e) => {this.setState({name: e.target.value})}}></Input>
              <h3>{json[value.lan].dis}</h3>
              <Input.TextArea value={this.state.dis} onChange={(e) => {this.setState({dis: e.target.value})}} rows={5}></Input.TextArea>
              <h3>{json[value.lan].upload2}</h3>
              <Upload.Dragger
                listType="picture-card"
                accept=".jpeg,.png,.jpg,.gif,.mp4,.mov,.m4v"
                name='file'
                showUploadList={false}
                beforeUpload={(file, fileList) => {
                  return new Promise((resolve, reject) => {
                    const isLt2M = file.size / 1024 / 1024 <= 25; //图片大小不超过2MB
                    if (!isLt2M) {
                      message.error(json[value.lan].error9);
                      return reject(false);
                    }
                    window.uploadImg_create = file
                    return resolve();
                  });
                }}
                customRequest={(v) => {
                  v.onSuccess({}, v.file);
                }}
                onChange={(v) => {
                  this.handleChange(v);
                }}
              >
                <img src={this.state.img}></img>
                <video autoPlay loop muted src={this.state.img}></video>
                <InboxOutlined />
              </Upload.Dragger>
              <p className='lineB'></p>

              <h3>{json[value.lan].vnumber}</h3>
              <p  className='title2'>{json[value.lan].title3}</p>
              <p  className='title2'>{json[value.lan].title4}</p>
              <InputNumber  min={1} max={10} value={this.state.vnumber} onChange={(e) => {this.setState({vnumber: e})}}  ></InputNumber>
              <p> 
                {!this.state.canvasCoin && <Button disabled={!this.state.name || !this.state.dis || !this.state.img} onClick={this.coin}>{json[value.lan].step3}</Button>}
                
                {
                  this.state.canvasCoin && 
                  <Button>
                    <Link to={`/user/${value.address}`}>
                      {json[value.lan].step4}
                    </Link>
                  </Button>
                }
              </p>
             </div>


             <div
                className={`progressS ${this.state.loading ? 'show' : ''}`}
              >
                <div>
                  <p>
                    <span>{json[value.lan].message2}</span> {
                      this.state.percent > 0 ? <CheckCircleOutlined /> : (this.state.coinError ? <CloseCircleOutlined  /> : <Spin  className={this.state.percent == 0 && 'is'}/> )
                  }</p>
                  <p>
                    <span>{json[value.lan].canvas + json[value.lan].step3}</span> {
                      this.state.percent > 1 ? <CheckCircleOutlined /> : (this.state.coinError && this.state.percent == 1 ? <CloseCircleOutlined  /> : <Spin className={this.state.percent == 1 && 'is'}/> )
                  }</p>
                  <Button type='primary' disabled={this.state.percent <  2}>
                    <Link to={`/user/${value.address}`}>
                      {json[value.lan].step4}
                    </Link>
                  </Button>
                </div>
              </div>
          </div>
          )}
      </ThemeContext.Consumer>
    );
  }
}
