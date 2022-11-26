import React, { useState } from 'react';
import {
  Input,
  Select,
  message,
  DatePicker,
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
import { CheckCircleOutlined,CloseCircleOutlined, CheckOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import { Link } from 'react-router-dom';
import { API, uploadAvatar, walletSign } from '../../fetch/fetch';
import './priceSet.less';
import { ipfsGet } from '../../fetch/ipfs.js';
import { web3Object } from '../../interface/contract.js';
import { sendTransactionInCtxwallet } from '../../interface/sendTransaction.js';
import moment from 'moment';
declare const window: any;

export class priceSet extends React.Component {
  static contextType = ThemeContext;
  constructor(props: any) {
    super(props);
    this.state = {
      current: 0,
      data: [],
      address: '',
      process: false,
      trading: 0,
    };
  }
  state: {
    current: number;
    data: any;
    address: string;
    process: boolean,
    trading: number,
  };
  props: any;
  async componentDidMount() {
    let address = this.context.address;
    this.state.address = address;
    const token = this.props.match.params.token;
    if (!token || !address) window.history.go(-1);
    try {
      const arr = [];
      let res = await fetch(`${window.ftachUrl}/get_canvas?token_id=${token}`)
      let  canvasContent = await res.json()

      const ownAddress = await web3Object.managerContract.methods
      .ownerOf(token)
      .call({ gas: 1000000 });
      if (ownAddress.toUpperCase() !== address.toUpperCase()) {
        window.history.go(-1);
        return;
      }
      // 查询售价
      const canvasPrice = await web3Object.managerContract.methods
        .sellingState(token)
        .call({ gas: 1000000 });
        canvasPrice.buyPrice = canvasPrice.buyPrice / window.defaultUnit
        canvasPrice.reservePrice = canvasPrice.reservePrice / window.defaultUnit
      let canvasPriceType = '3';
      if (canvasPrice.buyPrice != '0') {
        canvasPriceType = '1';
      }
      if (canvasPrice.reservePrice != '0') {
        canvasPriceType = '2';
      }
      canvasPrice.reservePrice = (canvasPrice.reservePrice < 0.01 ? 0.01 : canvasPrice.reservePrice)
      if (canvasContent.type == 'single'){ // 单图层的艺术品
        arr.push({
          name: canvasContent.name,
          type: json[window.localStorage.language].ddd,
          tokenId: token,
          priceType: canvasPriceType,
          ...canvasPrice,
          hasPrice: false,
          single: canvasContent.str,
        });
      } 
      else { // 多图层的艺术品
        arr.push({
          name: canvasContent[1].name,
          type: json[window.localStorage.language].canvas,
          tokenId: token,
          priceType: canvasPriceType,
          ...canvasPrice,
          hasPrice: false
        });
        for (let i = 1; i < canvasContent.length - 1; i ++) {
          const layerToken = token - 0 + i + '';
          const ownAddress = await web3Object.managerContract.methods
              .ownerOf(layerToken)
              .call({ gas: 1000000 });
            // 这个图层有可能已经单独卖掉了，没有拥有权就不能再修改价格
            if (ownAddress.toUpperCase() !== address.toUpperCase()) {
              continue;
            }
          let layerContent = {
            ...canvasContent[i + 1],
            list: canvasContent[i + 1].str
          }
          // 从合约获取当前图层/画布的售卖方式和售价
          const layerPrice = await web3Object.managerContract.methods
          .sellingState(layerToken)
          .call({ gas: 1000000 });
          layerPrice.buyPrice = layerPrice.buyPrice / window.defaultUnit
          layerPrice.reservePrice = layerPrice.reservePrice / window.defaultUnit
          let layerPriceType = '3';
          if (layerPrice.buyPrice != '0') {
            layerPriceType = '1';
          }
          if (layerPrice.reservePrice != '0') {
            layerPriceType = '2';
          }
          arr.push({
            priceType: layerPriceType,
            ...layerContent,
            tokenId: layerToken,
            ...layerPrice,
            showIndex: 0,
            hasPrice: false,
            type: json[window.localStorage.language].layer,
          });
        }
      }
      console.log(arr)
      this.setState({ data: arr});
    } catch (error) {
      console.log(error)
      message.error(JSON.stringify(error));
    }
  }
  changePrice(data, num) {
    const obj = [
      data.tokenId,
      window.BigInt(Math.floor(data.buyPrice * window.defaultUnit)).toString(), // 1ctxc = 10的18次方个基本单位
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
    this.setState({ process: true});
    web3Object.managerContract.methods
      .setSellingState(...obj)
      .send({ from: this.state.address })
      .then((res) => {
        this.setState({ trading: 1 });
        data.priceType = num;
        data.hasPrice = true
        message.success('success');
        this.setState({ data: [...this.state.data] });
      })
      .catch((res) => {
        message.error('error');
        this.setState({ trading: 2 });
      });
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
          <div id="priceSet">
            <div className="contentBox">
              <h1>{json[value.lan].price}</h1>
              {this.state.data.map((item, index) => (
                <div className='canvasBox' key={index}>
                  <h2>{`${item.type + '-'}${item.name}`}</h2>
                  <div>
                    <div className="imgList">
                       {/* 这段耐心点看。 */}
                       {
                         item.single && (
                          <video className='canvasImg'  autoPlay loop muted src={item.single} />
                         )
                       }
                       {
                         item.single  && (
                          <img className='canvasImg'  src={item.single} alt=""/>
                         )
                       }
                      {item.list ? item.list.map((todo, j) => (
                        <img 
                        className={item.showIndex == j ? "active2" : ""}
                        onClick={() => {
                          item.showIndex = j
                          this.setState({data: [...this.state.data]})
                        }}
                        key={todo} src={todo} alt="" />
                      )) : 
                      this.state.data.map((item, index) => (
                        item.list && 
                        <img className='canvasImg' src={item.list[item.showIndex]}
                        key={index}/>
                      ))}
                    </div>
                    <Tabs defaultActiveKey={item.priceType}>
                      <TabPane tab={json[value.lan].type1} key="1">
                        <InputNumber
                          min={0}
                          value={item.buyPrice}
                          onChange={(v:any) => {
                            const data = item;
                            data.buyPrice = v.toFixed(window.priceNumS);
                            this.state.data[index] = data;

                            this.setState({ data: [...this.state.data] });
                          }}
                        ></InputNumber>
                        <span className='unitlC'>{window.unitlC}</span>
                        <Button
                          className="ok"
                          onClick={() => {
                            this.changePrice(item, 1);
                          }}
                          disabled={canChange(item) || item.buyPrice <= item.reservePrice }
                        >
                          {json[value.lan].ok}
                        </Button>
                      </TabPane>
                      <TabPane tab={json[value.lan].type2} key="2">
                        <h3>{json[value.lan].price1}</h3>
                        <InputNumber
                          min={0.01}
                          value={item.reservePrice}
                          onChange={(v:any) => {
                            const data = item;
                            data.reservePrice = v.toFixed(window.priceNumS);
                            const timeLim =
                              data.auctionEndTime - data.auctionStartTime;
                            data.canCommit = timeLim > 0 && timeLim < 604800;
                            this.state.data[index] = data;

                            this.setState({ data: [...this.state.data] });
                          }}
                        ></InputNumber>
                        <span className='unitlC'>{window.unitlC}</span>
                        <h3>{json[value.lan].time1}</h3>
                        <DatePicker
                          showTime
                          disabledDate={(current) => {
                            return (
                              current <= moment().endOf('seconds') ||
                              current > moment().add(3, 'day')
                            );
                          }}
                          defaultValue={
                            item.auctionStartTime != 0
                              ? moment(new Date(item.auctionStartTime * 1000))
                              : moment(new Date())
                          }
                          onChange={(date) => {
                            let dataClone = item;
                            dataClone.auctionStartTime = date.unix();
                            const timeLim =
                              dataClone.auctionEndTime -
                              dataClone.auctionStartTime;
                            dataClone.canCommit =
                              timeLim > 0 && timeLim < 604800;
                            this.state.data[index] = dataClone;
                            this.setState({ data: [...this.state.data] });
                            console.log(item);
                          }}
                        ></DatePicker>
                        <h3>{json[value.lan].time2}</h3>
                        <DatePicker
                          key={new Date().getTime()}
                          disabled={item.auctionStartTime == 0}
                          showTime
                          disabledDate={(current) => {
                            return (
                              current.unix() < item.auctionStartTime ||
                              current >
                                moment(
                                  new Date(item.auctionStartTime * 1000)
                                ).add(7, 'day')
                            );
                          }}
                          defaultValue={
                            item.auctionEndTime != '0'
                              ? moment(new Date(item.auctionEndTime * 1000))
                              : moment(
                                  new Date(item.auctionStartTime * 1000)
                                ).add(7, 'day')
                          }
                          onChange={(date) => {
                            let dataClone = item;
                            dataClone.auctionEndTime = date.unix();
                            const timeLim =
                              dataClone.auctionEndTime -
                              dataClone.auctionStartTime;
                            dataClone.canCommit =
                              timeLim > 0 && timeLim < 604800;
                            this.state.data[index] = dataClone;
                            this.setState({ data: [...this.state.data] });
                          }}
                        ></DatePicker>
                        {/* <h3>{json[value.lan].price2}</h3>
                            <InputNumber min={0}></InputNumber> */}
                        <h3>{json[value.lan].type1}</h3>
                        <InputNumber
                          min={0}
                          value={item.buyPrice}
                          onChange={(v:any) => {
                            const data = item;
                            data.buyPrice = v.toFixed(window.priceNumS);
                            this.state.data[index] = data;

                            this.setState({ data: [...this.state.data] });
                          }}
                        ></InputNumber>
                        <span className='unitlC'>{window.unitlC}</span>
                        <Button
                          className="ok"
                          onClick={() => {
                            this.changePrice(item, 2);
                          }}
                          disabled={canChange(item) || !item.canCommit || item.buyPrice <= item.reservePrice }
                        >
                          {json[value.lan].ok}
                        </Button>
                      </TabPane>
                      <TabPane tab={json[value.lan].type3} key="3">
                      {json[value.lan].dis}
                      <Button
                        className="ok"
                        onClick={() => {
                          this.changePrice(item, 3);
                        }}
                        disabled={canChange(item)}
                      >
                        {json[value.lan].ok}
                      </Button>
                    </TabPane>
                      <CheckOutlined className={item.hasPrice ? "active2" : ""}/>
                    </Tabs>
                  </div>
                  </div>
              ))}
              <div className='lastT'>
                <Button disabled={this.state.data.findIndex(item => item.hasPrice == false) != -1}>
                  <Link to={`/user/${this.context.address}`}>
                    {json[value.lan].ok2}
                  </Link>
                </Button>
              </div>

            <div
              className={`progressS ${this.state.process ? 'show' : ''}`}
            >
              <div>
                <p>
                  <span>{json[value.lan].price}</span> {
                    this.state.trading == 1 ? <CheckCircleOutlined /> : (this.state.trading == 2 ? <CloseCircleOutlined  /> : <Spin  className='is'/> )
                }</p>
                <Button type='primary' onClick={() => {
                  this.setState({trading: 0, process: false})
                }} disabled={this.state.trading != 1}>
                  <Link to={`/user/${value.address}`}>
                    {json[value.lan].ok2} 
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
