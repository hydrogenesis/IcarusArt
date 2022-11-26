import React, { useState } from 'react';
import Web3 from 'web3';
const minterface = require('../../interface/CortexArtAbiV2.json');
import {
  DatePicker,
  Select,
  message,
  Tooltip,
  Button,
  Tabs,
  Steps,
  Collapse,
  InputNumber,
  Spin
} from 'antd';
const { TabPane } = Tabs;

const { Option } = Select;
const { Step } = Steps;
const { Panel } = Collapse;
import { CheckCircleOutlined,CloseCircleOutlined, UploadOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import { Link } from 'react-router-dom';
import { API, uploadAvatar, walletSign } from '../../fetch/fetch';
import './layersEdit.less';
import { ipfsGet } from '../../fetch/ipfs.js';
import { web3Object, web3ObjectOld } from '../../interface/contract.js';
import { sendTransactionInCtxwallet } from '../../interface/sendTransaction.js';
import moment from 'moment';
declare const window: any;

export class LayersEdit extends React.Component {
  static contextType = ThemeContext;
  constructor(props: any) {
    super(props);
    this.state = {
      canvas: {
        name: '',
        ins: '',
        layers: [],
        type: '',
        introduce: '',
        token: '',
        width: 0,
        height: 0,
        contractVersion: ''
      },
      priceData: {},
      layers: [],
      showLayer: {
        list:[]
      },
      loading: false,
      process: false,
      trading: 0,
    };
    this.stateChange = this.stateChange.bind(this);
    this.changePrice = this.changePrice.bind(this);
    this.stateChange2 = this.stateChange2.bind(this);
    this.canvasRender = this.canvasRender.bind(this);
  }
  state: {
    canvas: {
      name: string;
      ins: string;
      layers: [];
      type: string;
      introduce: string;
      width: any;
      height: any;
      token: any;
      contractVersion: any;
    };
    priceData: any;
    layers: Array<any>;
    showLayer: any;
    loading: boolean;
    process: boolean,
    trading: number,
  };
  props: any;
  async componentDidMount() {
    this.setState({ loading: true });
    let address = this.context.address;
    const token = this.props.match.params.token;
    if (!token || !address) window.history.go(-1);
    try {
      let single = location.hash.split('=')[1]
      let res = await fetch(`${window.ftachUrl}/get_works?token_id=${token}&contractVersion=${single}`)
      let  obj = await res.json()

      let web3Obj = obj.contractVersion == 'v2' ? web3Object : web3ObjectOld
      // 检查用户是否拥有该token
      const ownAddress = await web3Obj.managerContract.methods
        .ownerOf(token)
        .call({ gas: 1000000 });
        console.log(ownAddress)
      if (ownAddress.toUpperCase() !== address.toUpperCase()) {
        window.history.go(-1);
        return;
      }
      const wallet2_web3 = new Web3(window.web3.currentProvider);
      const managerContractPatch = new wallet2_web3.eth.Contract(minterface, window.mainAddressU);
      // 查询售价
      const canvasPrice = await managerContractPatch.methods
        .sellingState(token)
        .call({ gas: 1000000 });

        console.log(canvasPrice)
        canvasPrice.buyPrice = canvasPrice.buyPrice / window.defaultUnit
        canvasPrice.reservePrice = canvasPrice.reservePrice / window.defaultUnit
      let canvasPriceType = '3';
      if (canvasPrice.buyPrice != '0') {
        canvasPriceType = '1';
      }
      if (canvasPrice.reservePrice != '0') {
        canvasPriceType = '2';
      }
      let canvasContent;
      canvasPrice.reservePrice = (canvasPrice.reservePrice < 0.01 ? 0.01 : canvasPrice.reservePrice)
      this.state.priceData = {
        token: token,
        priceType: canvasPriceType,
        ...canvasPrice
      };
      if (obj.type == 'single'){ // 单图层的艺术品
        this.state.showLayer = obj;
        this.state.canvas = obj
        this.state.canvas.token = token;
      } else {
        if (obj.layer) {
          this.state.showLayer = obj;
          let res = await fetch(`${window.ftachUrl}/get_works?token_id=${obj.canvas_token_id}&contractVersion=${single}`)
          let  canvasContent = await res.json()
          canvasContent.token = canvasContent.token_id
          this.state.canvas = canvasContent;
        }else {
          this.state.canvas = obj;
          this.state.canvas.token = token;
        }
        this.state.layers = [];
        // 按照画布的token和图层的length，循环获取各个图层信息
        for (let i = 1; i < this.state.canvas.layers.length + 1; i++) {
          const layerToken = this.state.canvas.token - 0 + i + '';
          let res = await fetch(`${window.ftachUrl}/get_works?token_id=${layerToken}&contractVersion=${single}`)
          let layerContent;
          layerContent = await res.json()
          layerContent.list = layerContent.layer
          layerContent.token = layerContent.token_id
          const showIndex = await web3Obj.managerContract.methods
            .getControlToken(layerToken)
            .call({ gas: 1000000 });
          if (layerToken == token) {
            this.state.showLayer = {
              ...layerContent,
              tokenId: layerToken,
              showIndex: showIndex[2] - 0
            };
          }
          this.state.layers.push({
            ...layerContent,
            tokenId: layerToken,
            showIndex: showIndex[2] - 0
          });
        }
        // console.log(this.state.showLayer)
        // console.log(this.state.layers)
      }
      this.setState({
        canvas: { ...this.state.canvas },
        layers: [...this.state.layers],
        showLayer: { ...this.state.showLayer },
        priceData: { ...this.state.priceData },
        loading: false
      });
      if (!this.state.showLayer.single) {
        this.canvasRender();
      }
    } catch (error) {
      message.error(JSON.stringify(error));
    }
  }

  async changePrice(data, num) {
    const obj = [
      data.token,
      window.BigInt(Math.floor(data.buyPrice * window.defaultUnit)).toString(),// 1ctxc = 10的18次方个基本单位
      '0',
      '0',
      '0'
    ];
    if (num == 2) {
      obj[2] = data.auctionStartTime;
      obj[3] = data.auctionEndTime;
      obj[4] = window.BigInt(Math.floor(data.reservePrice * window.defaultUnit)).toString();
    }
    if (num == 3) {
      obj[1] = '0';
    }
    this.setState({ process: true });
    let web3Obj = this.state.canvas.contractVersion == 'v2' ? web3Object : web3ObjectOld
    let isAppro = await web3Obj.managerContract.methods.isApprovedForAll(this.context.address, window.mainAddressU).call({ gas: 1000000 })
    if (!isAppro) {
      await web3Obj.managerContract.methods.setApprovalForAll(window.mainAddressU, true).send({ from: this.context.address })
    }
    const wallet2_web3 = new Web3(window.web3.currentProvider);
    const managerContractPatch = new wallet2_web3.eth.Contract(minterface, window.mainAddressU);
    managerContractPatch.methods
      .setSellingState(...obj)
      .send({ from: this.context.address })
      .then((res) => {
        this.setState({ trading: 1 });
        data.priceType = num;
        message.success('success');
      })
      .catch((res) => {
        console.log(res)
        message.error('error');
        this.setState({ trading: 2 });
      });
  }
  // 切换预览展示的状态
  stateChange(index) {
    this.setState({ showLayer: { ...this.state.showLayer, showIndex: index } });
    setTimeout(() => {
      this.canvasRender();
    }, 100);
  }
  // 保存设置
  stateChange2() {
    let data = this.state.showLayer;
    this.setState({ loading: true });
    let web3Obj = this.state.canvas.contractVersion == 'v2' ? web3Object : web3ObjectOld
    if (window.walletModel === 1) {
      const ctrData = web3Obj.managerContract.methods
        .useControlToken(data.tokenId, [0], [data.showIndex])
        .encodeABI();
      sendTransactionInCtxwallet(ctrData, this.context.address, 0, (err, b) => {
        this.setState({ loading: false });
        if (err == undefined) {
          message.success('success');
        }
      });
    }
    if (window.walletModel === 2) {
      web3Obj.managerContract.methods
        .useControlToken(data.tokenId, [0], [data.showIndex])
        .send({ from: this.context.address })
        .then((res) => {
          this.setState({ loading: false });
          message.success('success');
        })
        .catch((res) => {
          message.error('error');
          this.setState({ loading: false });
        });
    }
  }
  canvasRender() {
    const canvas: any = document.querySelector('#canvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    let l = 1;
    if (width < this.state.canvas.width || height < this.state.canvas.height) {
      l = Math.min(
        width / this.state.canvas.width,
        height / this.state.canvas.height
      );
    }
    for (let i = 0; i < this.state.layers.length; i++) {
      let item = this.state.layers[i];
      if (item.tokenId == this.state.showLayer.tokenId) {
        item = this.state.showLayer;
      }
      let img = new Image();
      img.src = item.list[item.showIndex];
      img.onload = () => {
        ctx.drawImage(img, 0, 0, img.width * l, img.height * l);
        ctx.stroke();
      };
    }
  }
  render() {
    const canChange = (data) => {
      // 已经开始拍卖的，不能修改
      if (data.priceType == '2' && data.startTime < moment().unix()) {
        return true;
      }
      return false;
    };
    return (
      <ThemeContext.Consumer>
        {(value) => (
          <div id="layersEdit">
            <div className="contentBox">
                {
                  this.state.showLayer.single ? <p className='imgTYpe'>{json[value.lan].ddd}</p>
                  : <p  className='imgTYpe' >{this.state.showLayer.name ? json[value.lan].layer : json[value.lan].canvas}</p>
                }
                <h1 key={this.state.showLayer.name}>
                  {this.state.showLayer.name || this.state.canvas.name}
                </h1>
                <div className="flex">
                  {this.state.showLayer.name && this.state.showLayer.list && (
                    <div className="info">
                      <h3>{json[value.lan].describe}</h3>
                      <p style={{whiteSpace: "pre-wrap", overflow:'auto',maxHeight: '200px'}}>{this.state.showLayer.introduce}</p>
                      <h3>{json[value.lan].states}</h3>
                      <div className="imgListW">
                        {this.state.showLayer.list.map((item, index) => (
                          <img
                            className={
                              index == this.state.showLayer.showIndex
                                ? 'redBorder'
                                : ''
                            }
                            src={item}
                            key={Math.random()}
                            onClick={() => {
                              this.stateChange(index);
                            }}
                            alt=""
                          />
                        ))}
                        <div className="clear"></div>
                      </div>
                      <Button onClick={this.stateChange2}>
                        {json[value.lan].determine}
                      </Button>
                      <p style={{color:'#888'}}>
                        {json[value.lan].ssss}
                      </p>
                    </div>
                  )}
                  <div className="canvas">
                    
                    <div className='flex2'>
                       {
                         <h2>
                          {json[value.lan].preview}
                        </h2>
                       }
                       {
                         this.state.showLayer.single &&
                         <img src={this.state.showLayer.single}></img>
                       }
                       {
                         this.state.showLayer.single ? 
                         <video  autoPlay loop muted src={this.state.showLayer.single}></video>
                         :<canvas id="canvas" width="540" height="540"></canvas>
                       }
                    </div>
                    <div className="price" key={this.state.priceData.priceType}>
                      <h2>{json[value.lan].priceSet}</h2>
                      <Tabs defaultActiveKey={this.state.priceData.priceType}>
                        <TabPane tab={json[value.lan].type1} key="1">
                          <InputNumber
                            min={0}
                            value={this.state.priceData.buyPrice}
                            onChange={(v:any) => {
                              const data = this.state.priceData;
                              data.buyPrice = v.toFixed(window.priceNumS);
                              this.state.priceData = data;

                              this.setState({
                                priceData: { ...this.state.priceData }
                              });
                            }}
                          ></InputNumber>
                          <span className='unitlC'>{window.unitlC}</span>
                          <Button
                            className="ok"
                            onClick={() => {
                              this.changePrice(this.state.priceData, 1);
                            }}
                            disabled={canChange(this.state.priceData) || this.state.priceData.buyPrice <= this.state.priceData.reservePrice}
                          >
                            {json[value.lan].ok}
                          </Button>
                        </TabPane>
                        <TabPane tab={json[value.lan].type2} key="2">
                          <h3>{json[value.lan].price1}</h3>
                          <InputNumber
                            min={0.01}
                            value={this.state.priceData.reservePrice}
                            onChange={(v:any) => {
                              const data = this.state.priceData;
                              data.reservePrice = v.toFixed(window.priceNumS);
                              const timeLim =
                                data.auctionEndTime - data.auctionStartTime;
                              data.canCommit = timeLim > 0 && timeLim < 604800;
                              this.state.priceData = data;

                              this.setState({ data: { ...this.state.priceData } });
                            }}
                          ></InputNumber>
                          <span className='unitlC'>{window.unitlC}</span>
                          <h3>{json[value.lan].time1}</h3>
                          <DatePicker
                            showTime
                            disabledDate={(current) => {
                              return (
                                current <= moment().endOf('seconds')
                              );
                            }}
                            defaultValue={
                              this.state.priceData.auctionStartTime != 0
                                ? moment(
                                    new Date(
                                      this.state.priceData.auctionStartTime * 1000
                                    )
                                  )
                                : moment(new Date())
                            }
                            onChange={(date) => {
                              let dataClone = this.state.priceData;
                              dataClone.auctionStartTime = date.unix();
                              const timeLim =
                                dataClone.auctionEndTime -
                                dataClone.auctionStartTime;
                              dataClone.canCommit = timeLim > 0 && timeLim < 604800;
                              this.state.priceData = dataClone;
                              this.setState({
                                priceData: { ...this.state.priceData }
                              });
                            }}
                          ></DatePicker>
                          <h3>{json[value.lan].time2}</h3>
                          <DatePicker
                            key={new Date().getTime()}
                            disabled={this.state.priceData.auctionStartTime == 0}
                            showTime
                            disabledDate={(current) => {
                              return (
                                current.unix() <
                                  this.state.priceData.auctionStartTime ||
                                current >
                                  moment(
                                    new Date(
                                      this.state.priceData.auctionStartTime * 1000
                                    )
                                  ).add(7, 'day')
                              );
                            }}
                            defaultValue={
                              this.state.priceData.auctionEndTime != '0'
                                ? moment(
                                    new Date(
                                      this.state.priceData.auctionEndTime * 1000
                                    )
                                  )
                                : moment(
                                    new Date(
                                      this.state.priceData.auctionStartTime * 1000
                                    )
                                  ).add(7, 'day')
                            }
                            onChange={(date) => {
                              let dataClone = this.state.priceData;
                              dataClone.auctionEndTime = date.unix();
                              const timeLim =
                                dataClone.auctionEndTime -
                                dataClone.auctionStartTime;
                              dataClone.canCommit = timeLim > 0 && timeLim < 604800;
                              this.state.priceData = dataClone;
                              this.setState({
                                priceData: { ...this.state.priceData }
                              });
                            }}
                          ></DatePicker>
                          {/* <h3>{json[value.lan].price2}</h3>
                            <InputNumber min={0}></InputNumber> */}
                          <h3>{json[value.lan].type1}</h3>
                          <InputNumber
                            min={0}
                            value={this.state.priceData.buyPrice}
                            onChange={(v:any) => {
                              const data = this.state.priceData;
                              data.buyPrice = v.toFixed(window.priceNumS);
                              this.state.priceData = data;

                              this.setState({
                                priceData: { ...this.state.priceData }
                              });
                            }}
                          ></InputNumber>
                          <span className='unitlC'>{window.unitlC}</span>
                          <Button
                            className="ok"
                            onClick={() => {
                              this.changePrice(this.state.priceData, 2);
                            }}
                            disabled={
                              canChange(this.state.priceData)  || this.state.priceData.buyPrice <= this.state.priceData.reservePrice ||
                              !this.state.priceData.canCommit
                            }
                          >
                            {json[value.lan].ok}
                          </Button>
                        </TabPane>
                        <TabPane tab={json[value.lan].type3} key="3">
                          {json[value.lan].dis}
                          <Button
                            className="ok"
                            onClick={() => {
                              this.changePrice(this.state.priceData, 3);
                            }}
                            disabled={canChange(this.state.priceData)}
                          >
                            {json[value.lan].ok}
                          </Button>
                        </TabPane>
                      </Tabs>
                    </div>
                  </div>
                </div>

                {this.state.layers.length > 0 && (
                  <div className="layer">
                    <h2>{json[value.lan].layer}</h2>
                    <div className="imgBox">
                      {this.state.layers.map((item) => (
                        <Tooltip title={item.name} key={Math.random()}>
                          <Link to={`/auction/${item.tokenId}?contractVersion=v1`}>
                            <img
                              key={Math.random()}
                              src={item.list[0]}
                              alt=""
                            />
                          </Link>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
              <div
                className={`progressS ${this.state.process ? 'show' : ''}`}
              >
                <div>
                  <p>
                    <span>{json[value.lan].priceSet}</span> {
                      this.state.trading == 1 ? <CheckCircleOutlined /> : (this.state.trading == 2 ? <CloseCircleOutlined  /> : <Spin  className='is'/> )
                  }</p>
                  <Button type='primary' onClick={() => {
                    this.setState({trading: 0, process: false})
                  }} disabled={this.state.trading != 1}>
                    <Link to={`/user/${value.address}`}>
                      {json[value.lan].determine} 
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ThemeContext.Consumer>
    );
  }
}
