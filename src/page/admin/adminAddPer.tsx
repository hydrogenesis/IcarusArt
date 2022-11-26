import React, { useState } from 'react';

import './adminAddPer.less';
import {
  notification,
  Input,
  Spin
} from 'antd';
import { web3Object } from '../../interface/contract.js';
import {
  sendCoin,
} from '../../interface/sendTransaction.js';


export class AdminAddPer extends React.Component { 
  constructor(props: any) {
    super(props);
    this.onclick = this.onclick.bind(this)
    super(props);
    this.state = {
      address: '',
      loading: false,
    };
  }
  state: {
    address: string,
    loading: boolean
  }
  onclick() {
    this.setState({loading: true})
    // 注册为艺术家白名单
    const whitelistTokenForCreator = web3Object.managerContract.methods.whitelistUser(this.state.address).encodeABI()
    sendCoin(whitelistTokenForCreator,this.state.address).then(res => {
      this.setState({loading: false})
      notification.success({message: 'success: ' +  this.state.address,duration: 0,});
    }).catch(err => notification.error({message: err.message || 'err: ' +  this.state.address,duration: 0,}))
  }
  render() {
    return (
      <Spin spinning={this.state.loading}>
        <div id='adminAddPer'>
            <Input value={this.state.address} onChange = {(e) => {this.setState({address: e.target.value})}}  onPressEnter={this.onclick}></Input>
        </div>
      </Spin>
    )
  }

}