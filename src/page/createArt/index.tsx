import React, { useState } from 'react';
import {
  Input,
  Upload,
  message,
  Form,
  Button,
  Spin,
  Steps,
  Collapse,
  InputNumber,
  Modal,
  Progress,
  notification
} from 'antd';
const { Step } = Steps;
const { Panel } = Collapse;
import {
  CloseCircleOutlined,
  CheckCircleOutlined,
  CheckOutlined
} from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import { Link } from 'react-router-dom';
import { API, uploadAvatar, walletSign } from '../../fetch/fetch';
import './createArt.less';
import { web3ObjectOld } from '../../interface/contract.js';
declare const window: any;
import Web3 from 'web3';
import { ipfsAdd } from '../../fetch/ipfs.js';
import {
  sendCoin,
  sendTransactionInCtxwallet
} from '../../interface/sendTransaction.js';
import Item from 'antd/lib/list/Item';
const primaryAv = require('../../assets/images/primaryAv.png').default;

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

function checkSize(data:any) {
  return new Promise((resolve, reject) => {
    var img = new Image()
    img.src = data
    img.onload = function(){
      resolve({width: img.width,height: img.height})
    }
  })
}

function dataURLtoFile(dataurl, filename) { //将base64转换为文件
  var arr = dataurl.split(','),
  mime = arr[0].match(/:(.*?);/)[1],
  bstr = atob(arr[1]),
  n = bstr.length,
  u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {
  type: mime
  });
}

export class createArt extends React.Component {
  static contextType = ThemeContext;
  constructor(props: any) {
    super(props);
    this.COINS2 = this.COINS2.bind(this);
    this.startCOINS = this.startCOINS.bind(this);
    this.clearData = this.clearData.bind(this);
    this.state = {
      current: 0,
      uploadData: window.localStorage.uploadData ? JSON.parse(window.localStorage.uploadData) :{
        canvasName: '',
        // 画布有多个图层
        layers: [
          {
            name: '',
            introduce: '',
            showIndex: 0,
            // 每个图层有多个状态
            list: []
          }
        ],
        width: 0,
        height: 0,
        isComplete: false,
        tokenId: null,
        canvasDis: null
      },
      loading: false,
      loadingM: '',
      coinEnd: false,
      canvasCoin: false,
      coins: [],
      canvasTokenId: '',
      previewVisible: false,
      previewImage: '',
      previewTitle: '',
      ButtonShow: 0,
      previewVisible2: false,
      percent: 0,
      coinError: false,
      userInfo: {
        
      }
    };
  }
  state: {
    current: number;
    previewVisible: boolean,
    previewImage: string,
    previewTitle: string,
    uploadData: {
      canvasName: string;
      canvasDis: string;
      layers: Array<{
        name: string;
        introduce: string;
        list: any;
        showIndex: number;
      }>;
      width: any;
      height: any;
      isComplete: boolean;
      tokenId: any;
    };
    userInfo: any;
    loading: boolean;
    loadingM: string;
    coinEnd: boolean;
    ButtonShow: number;
    previewVisible2: boolean;
    percent: number;
    coinError: boolean;
    canvasCoin: boolean; // 主画布是否铸币完成
    coins: Array<number>; // 完成铸币的图层下标
    canvasTokenId: string; // 画布的token，
  };
  startCOINS () {
    let that = this
    this.setState({ previewVisible2: true, percent: 0})
    let  time = new Date().getTime()
    var formData = new FormData();
    formData.append("address",JSON.stringify({
      "user_address": this.context.address,
      width: this.state.uploadData.width,
      height: this.state.uploadData.height,
      create_time: time,
    }));
    formData.append("canvas",JSON.stringify({
      "name": this.state.uploadData.canvasName,
      introduce: this.state.uploadData.canvasDis,
    }))
    formData.append("layer",JSON.stringify(this.state.uploadData.layers.map(item => {
      return {
        "name": item.name,
        "introduce": item.introduce,
        "count": item.list.length
      }
    })))
    this.state.uploadData.layers.forEach((item, index) => {
      item.list.map((todo,j) => {
        formData.append(`str_${index}_${j}`, todo.originFileObj)
      })
    })
    fetch(`${window.ftachUrl}/get_token`, {
      method: 'post',
      body: formData
    }).then(res => res.json())
    .then(response => {
      this.setState({ previewVisible2: true, percent: 1})
      let tokenId = response[response.length  - 1].token_id
      let address = that.context.address
      this.state.uploadData.tokenId = tokenId
      
      web3ObjectOld.managerContract.methods
      .mintArtwork(tokenId,response[response.length  - 1].canvas_metadata_hash, that.state.uploadData.layers.map(() => address))
      .send({ from: address })
      .then((res) => {
        that.setState({
          percent: 2 ,
          canvasCoin: true,
        });
        that.COINS2(response)
      })
      .catch((err) =>  {
        this.setState({coinError: true})
        if (err.message) {
          notification.open({message: err.message ,duration: 0,});
        }
      });
      // const obj = [
      //   address,
      //   tokenId,
      //   that.state.uploadData.layers.length,
      //   window.artSalesProceeds[0],
      //   window.artSalesProceeds[1]
      // ];
      // const whitelistTokenForCreator = web3ObjectOld.managerContract.methods
      // .whitelistTokenForCreator(...obj)
      //   .encodeABI();
      // sendCoin(whitelistTokenForCreator, address)
      //   .then((res) => {
      // }).catch((err) =>  {
      //   this.setState({coinError: true})
      //   if (err.message) {
      //     notification.open({message: err.message ,duration: 0,});
      //   }
      // });
    })
    
  }
  async COINS2(data) {
    let address = this.context.address;
    try {
      for (let i = 0; i < this.state.uploadData.layers.length; i ++) {
        let layerTokenId = data[i].token_id;
        const obj = [
          layerTokenId,
          data[i].layer_metadata_hash,
          [0],
          [this.state.uploadData.layers[i].list.length],
          -1,
          []
        ];
        await web3ObjectOld.managerContract.methods.setupControlToken(...obj).send({ from: address })
        
        this.setState({percent:  3 + i});
      }
      this.setState({
        canvasCoin: true,coinEnd: true
      });
    }
    catch(err) {
      if (err.message) {
        notification.open({message: err.message ,duration: 0,});
      }
      this.setState({coinError: true})
    }
    
  }
  async componentDidMount() {
    web3ObjectOld.managerContract.methods
      .artistWhitelist(this.context.address)
      .call({ gas: 1000000 })
      .then((res) => {
        if (!res) {
          notification.open({message: 'No permissions' ,duration: 0,});
          window.history.go(-1)
          return
        }
      });
    // 注册为艺术家白名单
    // var  address = this.context.address
    // const whitelistTokenForCreator = web3ObjectOld.managerContract.methods.whitelistUser(address).encodeABI()
    // sendCoin(whitelistTokenForCreator, address).then(res => {
    //   }).catch(err => console.log(err))
    window.onbeforeunload = function (e) {
      var e = window.event || e;
      e.returnValue = json[window.localStorage.language].error7;
    };
    fetch(`${window.ftachUrl}/get_info?user_address=${this.context.address}`)
    .then(res => res.json())
    .then(json => {
      if (json.avatar == undefined) {
        json.avatar = primaryAv
      }
      this.setState({userInfo: json})
    })
    web3ObjectOld.managerContract.methods
      .artistWhitelist(this.context.address)
      .call({ gas: 1000000 })
      .then((res) => {
        // 用户没有创建艺术品的权限
        if (!res) {
          message.error('no permissions');
        }
      });
    // 缓存在localstorage的数据，不保存file格式，要把base64转回来
    for(let i = 0; i < this.state.uploadData.layers.length; i ++) {
      let item = this.state.uploadData.layers[i]
      item.list.forEach(todo => {
        todo.originFileObj = dataURLtoFile(todo.uploadImg_create, todo.name)
      })
    }
  }
  componentWillUnmount() {
    // 如果没有完成就退出，存在本地
    if (!this.state.uploadData.isComplete) {
      window.localStorage.uploadData = JSON.stringify(this.state.uploadData);
      // window.localStorage.stepCurrent = this.state.current
    }
    window.onbeforeunload = null;
  }
  clearData() {
    this.state.uploadData.isComplete = true;
    window.localStorage.uploadData = '';
  }
  handleChange = (info, item) => {
    // if (info.file.status === 'uploading') {
    //   this.setState({ loading: true });
    //   return;
    // }
    if (info.file.status === 'removed') {
      item.list = info.fileList;
    }
    // if (info.file.status === 'error') {
    //   item.list = item.list.filter(todo => todo.name !== info.file.name)
    // }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      info.fileList[info.fileList.length - 1].uploadImg_create = window.uploadImg_create
      item.list = info.fileList;
    }
  };
  handleCancel = () => this.setState({ previewVisible: false });
  handlePreview = file => {
    this.setState({
      previewImage: file.thumbUrl,
      previewVisible: true,
      previewTitle: file.name || file.url.substring(file.url.lastIndexOf('/') + 1),
    })
  }
  render() {
    const next = (lan) => {
      const uploadData = this.state.uploadData;
      if (this.state.current === 0) {
        if (!uploadData.canvasName) {
          message.error(json[lan].error1);
          return;
        }
        if (!uploadData.width || !uploadData.height) {
          message.error(json[lan].error2);
          return;
        }
        if (uploadData.layers.length === 0) {
          message.error(json[lan].error3);
          return;
        }
        if (uploadData.layers.find((item) => !item.name)) {
          message.error(json[lan].error5);
          return;
        }
        if (uploadData.layers.find((item) => item.list.length === 0)) {
          message.error(json[lan].error4);
          return;
        }
      }
      this.setState({ current: this.state.current + 1 });
    };
    const prev = (lan) => {
      this.setState({ current: this.state.current - 1 });
    };
    return (
      <ThemeContext.Consumer>
        {(value) => (
          <div id="createArt">
            <Modal
              visible={this.state.previewVisible}
              title={this.state.previewTitle}
              footer={null}
              onCancel={this.handleCancel}
            >
              <img alt="example" style={{ width: '100%' }} src={this.state.previewImage} />
            </Modal>
            <div
              className={`progressS ${this.state.previewVisible2 ? 'show' : ''}`}
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
                {
                  this.state.uploadData.layers.map((item, index) => (
                  <p key={index}>
                    <span>{json[value.lan].layer + (index + 1) + json[value.lan].step3}</span> {
                      this.state.percent > (index + 2) ? <CheckCircleOutlined /> : (this.state.coinError && this.state.percent == (index + 2) ? <CloseCircleOutlined  /> : <Spin className={this.state.percent == index + 2 && 'is'}/> )
                  }</p>
                  ))
                }
                <Button type='primary' onClick={() => {
                  this.setState({previewVisible2: false})
                }} disabled={this.state.percent < this.state.uploadData.layers.length + 2}>
                  <Link to={`/user/${value.address}`}>
                    {json[value.lan].step4}
                  </Link>
                </Button>
              </div>
            </div>
            <div className="contentBox">
              <h1>{json[value.lan].upload}</h1>
              <p className='title2'>{json[value.lan].title2}</p>
              <div className="stepContent">
                {this.state.current === 0 && (
                  // step1 上传
                  <div className="step1Content">
                    <h2>
                      {json[value.lan].canvas}
                      {' '}
                      {json[value.lan].name}
                    </h2>
                    <Input
                      value={this.state.uploadData.canvasName}
                      onChange={(e) => {
                        this.setState({
                          uploadData: {
                            ...this.state.uploadData,
                            canvasName: e.target.value
                          }
                        });
                      }}
                    ></Input>
                    <p className='lineB'></p>
                    <h2>
                      {json[value.lan].canvas}
                      {' '}
                      {json[value.lan].dis}
                    </h2>
                    <Input.TextArea
                      value={this.state.uploadData.canvasDis}
                      onChange={(e) => {
                        this.setState({
                          uploadData: {
                            ...this.state.uploadData,
                            canvasDis: e.target.value
                          }
                        });
                      }}
                    ></Input.TextArea>
                    <p className='lineB'></p>
                    <h2>
                      {json[value.lan].canvas}
                      {' '}
                      {json[value.lan].size}
                    </h2>
                    <InputNumber
                      value={this.state.uploadData.width}
                      min={0}
                      max={2160}
                      onChange={(e) => {
                        this.setState({
                          uploadData: { ...this.state.uploadData, width: e }
                        });
                      }}
                    ></InputNumber>
                    &nbsp;&nbsp;X&nbsp;&nbsp;
                    <InputNumber
                      value={this.state.uploadData.height}
                      min={0}
                      max={2160}
                      onChange={(e) => {
                        this.setState({
                          uploadData: { ...this.state.uploadData, height: e }
                        });
                      }}
                    ></InputNumber>
                    <p className='lineB'></p>
                    {this.state.uploadData.layers.map((item, index) => (
                      <div className='layerBox' key={index}>
                        <h2>
                          <p>
                            { item.name || `${json[value.lan].layer}${index + 1}`}
                          </p>
                          <Button onClick={(event) => {
                            event.stopPropagation();
                            if (confirm(json[value.lan].confirm)) {
                              const data = {
                                canvasName: this.state.uploadData.canvasName,
                                layers: this.state.uploadData.layers.filter(
                                  (todo, I) => I != index
                                )
                              };
                              this.setState({
                                uploadData: { ...this.state.uploadData, ...data }
                              });
                            }
                          }}>
                            {json[value.lan].deletelayer}
                          </Button>
                        </h2>
                        <h4>{json[value.lan].layer + ' ' + json[value.lan].name}</h4>
                        <Input
                          value={item.name}
                          onChange={(e) => {
                            let data = this.state.uploadData;
                            data.layers[index].name = e.target.value;
                            this.setState({ uploadData: data });
                          }}
                        ></Input>
                        <h4>{json[value.lan].layer  + ' ' + json[value.lan].dis}</h4>
                        <Input.TextArea
                          value={item.introduce}
                          onChange={(e) => {
                            let data = this.state.uploadData;
                            data.layers[index].introduce = e.target.value;
                            this.setState({ uploadData: data });
                          }}
                          rows={5}
                        ></Input.TextArea>
                        <p className='lineB'></p>
                        <p style={{color: 'red', fontSize: '12px'}}>{json[value.lan].message1}</p>
                          <div>
                            <Upload
                              listType="picture-card"
                              accept="image/png"
                              defaultFileList={item.list}
                              onPreview={this.handlePreview}
                              beforeUpload={(file, fileList) => {
                                return new Promise((resolve, reject) => {
                                  const isLt2M = file.size / 1024 / 1024 <= 5; //图片大小不超过2MB
                                  if (!isLt2M) {
                                    message.error(json[value.lan].error9);
                                    return
                                  }
                                  if (
                                    item.list.find(
                                      (todo) => todo.name === file.name
                                    ) !== undefined
                                  ) {
                                    message.error(json[value.lan].error6);
                                    return reject(false);
                                  }
                                  getBase64(file, (data) => {
                                    checkSize(data).then((res:any) => {
                                      if (!this.state.uploadData.width || !this.state.uploadData.height) {
                                        this.setState({
                                          uploadData: {...this.state.uploadData, width:res.width, height: res.height}
                                        })
                                      }
                                      if (res.width != this.state.uploadData.width || res.height != this.state.uploadData.height) {
                                        message.error(json[value.lan].error10);
                                        return reject(false);
                                      }else {
                                        window.uploadImg_create = data
                                        return resolve(file);
                                      }
                                    })
                                  })
                                });
                              }}
                              customRequest={(v) => {
                                v.onSuccess({}, v.file);
                              }}
                              onChange={(v) => {
                                this.handleChange(v, item);
                              }}
                            >
                              {json[value.lan].addimg}
                            </Upload>
                          </div>
                          <p className='lineB'></p>
                      </div>
                    ))}
                    <Button
                      className="add"
                      onClick={() => {
                        const data = {
                          ...this.state.uploadData,
                          layers: this.state.uploadData.layers.concat({
                            name: '',
                            introduce: '',
                            list: [],
                            showIndex: 0
                          })
                        };
                        this.setState({ uploadData: data });
                      }}
                    >
                      <div>+</div>
                      <p> {json[value.lan].addlayer}</p>
                    </Button>
                  </div>
                )}
                {this.state.current === 1 && (
                    <div className="step2Content step3Content">
                      <div className='canvasBoxF'>
                        <div
                          className="canvasBox"
                          style={{
                            width: '400px',
                            overflow: 'hidden',
                            height:
                              400 *
                                (this.state.uploadData.height /
                                  this.state.uploadData.width) +
                              'px'
                          }}
                        >
                          {this.state.uploadData.layers.map((item) => (
                            <img
                              src={item.list[item.showIndex].uploadImg_create}
                              key={item.name}
                              alt=""
                            />
                          ))}
                        </div>
                        <div className='sss'>
                          <p>{json[value.lan].canvas + json[value.lan].step2}</p>
                          <h2>{this.state.uploadData.canvasName}</h2>
                          <div>
                            <img src={this.state.userInfo.avatar} alt=""/>
                            <div>
                              <h3>{this.state.userInfo.name}</h3>
                              <p>{this.state.userInfo.introduce}</p>
                            </div>
                          </div>
                          <p className='lineB'></p>
                          <h3>{json[value.lan].dis}</h3>
                          <p  style={{whiteSpace: "pre-wrap", overflow:'auto',maxHeight: '200px'}}>{this.state.uploadData.canvasDis}</p>
                        </div>
                      </div>
                      
                      <div className='buttonList'>
                        {
                          this.state.uploadData.layers.map((item,index) => (
                            <Button key={item.name} className={this.state.ButtonShow == index ? 'active' : ''} onClick={() => {this.setState({ButtonShow: index, imgShow: 0})}}>{item.name}</Button>
                          ))
                        }
                      </div>
                      <div className='layerImgList'>
                        {
                          this.state.uploadData.layers.find((item,index) => index == this.state.ButtonShow ).list.map((item,index) => (
                            <img key={item.name} className={ this.state.uploadData.layers.find((item,index) => index == this.state.ButtonShow ).showIndex == index ? 'active' : ''} onClick={() => {
                              this.state.uploadData.layers.find((item,index) => index == this.state.ButtonShow ).showIndex = index;
                              this.setState({
                                uploadData: { ...this.state.uploadData }
                              });
                            }} src={item.thumbUrl}></img>
                          ))
                        }
                      </div>
                    </div>
                )}
              </div>
              <div className="nextButton">
                <Button
                  onClick={() => {
                    prev(value.lan);
                  }}
                  disabled={this.state.current === 0 || this.state.canvasCoin}
                >
                  {json[value.lan].prev}
                </Button>
                {
                this.state.current < 1 ? (
                  <Button
                    onClick={() => {
                      next(value.lan);
                    }}
                  >
                    {json[value.lan].next}
                  </Button>
                ) : (
                  <Button
                    onClick={this.clearData}
                    disabled={!this.state.coinEnd}
                  >
                    <Link to={`/user/${value.address}`}>
                      {json[value.lan].step4}
                    </Link>
                  </Button>
                )
                
                }
                 {
                   (
                    this.state.current == 1 &&
                    <Button
                      disabled={this.state.canvasCoin}
                      onClick={() => this.startCOINS()}
                      className="step3Canvas"
                    >
                      {json[value.lan].step3}
                      {this.state.canvasCoin && <CheckOutlined />}
                    </Button>
                   )
                 }
              </div>
            </div>
          </div>
        )}
      </ThemeContext.Consumer>
    );
  }
}
