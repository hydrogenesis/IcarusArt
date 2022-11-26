import React, { useState } from 'react';
import { Input, Upload, message, Form, Button, Checkbox } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
const json = require('./lan.json');
import { ThemeContext } from '../../index';
import { API, uploadAvatar, walletSign, getRecoverid } from '../../fetch/fetch';
import './userEdit.less';
declare const window: any;
import { ipfsAdd, ipfsGet } from '../../fetch/ipfs.js';

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}


export class userEdit extends React.Component {
  static contextType = ThemeContext;
  constructor(props: any) {
    super(props);
    this.state = {
      loading: false,
      loadingForm: false,
      userInfor: {
        avatar: '',
        name: '',
        email: '',
        area: '',
        web: '',
        introduce: '',
      }
    };
  }
  props:any;
  state: {
    loading: boolean;
    loadingForm: boolean;
    userInfor: {
      avatar: string;
      name: string;
      email: string;
      area: string;
      web: string;
      introduce: string;
    };
  };
  componentDidMount() {
    let _this = this;
    fetch(`${window.ftachUrl}/get_info?user_address=${this.context.address}`)
    .then(res => res.json())
    .then(json => {
      _this.setState({userInfor: json,loadingForm : true})
    })
  }
  render() {
    const onFinish = (values: any) => {
      let _this = this
      fetch(`${window.ftachUrl}/save_info`, {
        method: 'post',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          avatar: this.state.userInfor.avatar || '',
          name: values.name == undefined ? '' : values.name,
          email: values.email == undefined ?  '' : values.email,
          area: values.area == undefined ?  '' : values.area,
          web: values.web == undefined ? '' : values.web,
          introduce: values.introduce == undefined ?  '' : values.introduce,
          ts: parseInt(new Date().getTime()/1000 + ''),
          user_address: _this.context.address
        })
      }).then(res => {
        this.props.history.push("/user/" + this.context.address);
        message.success('success')
        // window.location.reload()
      }) 
    };
    const { avatar } = this.state.userInfor;
    const { loading } = this.state;
    const uploadButton = (
      <div>
        {loading ? <LoadingOutlined /> : <PlusOutlined />}
        <div style={{ marginTop: 8 }}>Upload</div>
      </div>
    );
    return (
      <ThemeContext.Consumer>
        {(value) => (
          <div id="userEdit">
            <div className="userEditContent">
              <h1>{json[value.lan].edit}</h1>
              <div className="avatar">
                <Upload
                  name="avatar"
                  accept=".gif,.png,.jpeg,.jpg"
                  listType="picture-card"
                  className="avatar-uploader"
                  showUploadList={false}
                  beforeUpload={(file, fileList) => {
                    return new Promise((resolve, reject) => {
                      const isLt2M = file.size / 1024 / 1024 <= 2; //图片大小不超过2MB
                      if (!isLt2M) {
                        message.error(json[value.lan].error9);
                        return reject(false);
                      }
                      return resolve(file);
                    });
                  }}
                  customRequest={(v) => {
                    let that = this
                    getBase64(v.file, (data) => {
                      v.onSuccess({},data);
                      this.state.userInfor.avatar = data
                      that.setState({userInfor: {...that.state.userInfor} })
                    });
                  }}
                >
                  {this.state.userInfor.avatar ? (
                    <img src={avatar} alt="avatar" style={{ width: '100%' }} />
                  ) : (
                    uploadButton
                  )}
                  <p className="disT">{json[value.lan].dis1}</p>
                </Upload>
              </div>
              {this.state.loadingForm && (
                <Form
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 22 }}
                  name="basic"
                  initialValues={this.state.userInfor}
                  onFinish={onFinish}
                  // onFinishFailed={onFinishFailed}
                >
                  <Form.Item label={json[value.lan].name} name="name">
                    <Input />
                  </Form.Item>

                  <Form.Item
                    label={json[value.lan].email}
                    name="email"
                    rules={[
                      {
                        type: 'email',
                        message: json[value.lan].emailM
                      }
                    ]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item label={json[value.lan].area} name="area">
                    <Input />
                  </Form.Item>
                  <Form.Item label={json[value.lan].webUrl} name="web">
                    <Input />
                  </Form.Item>
                  <Form.Item label={json[value.lan].introduce} name="introduce">
                    <Input.TextArea rows={4} />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      {json[value.lan].save}
                    </Button>
                  </Form.Item>
                </Form>
              )}
            </div>
          </div>
        )}
      </ThemeContext.Consumer>
    );
  }
}
