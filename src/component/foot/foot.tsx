import React from 'react';
const json = require('./lan.json');
import { Input, message } from 'antd';
import { ThemeContext } from '../../index';
import { UserOutlined } from '@ant-design/icons';
const logo = require('../../assets/images/logo.svg');

export function Foot() {
  return (
    <ThemeContext.Consumer>
      {(value) => (
        <div id="appFoot">
          <h2>
            <img src={logo.default} alt="" />
            {/* {json[value.lan].found} */}
          </h2>
          <div className="linklist">
            {json[value.lan].links.map((item, index) => (
              <a href={item.url} key={index} target="_blank">
                {item.name}
              </a>
            ))}
          </div>
          <div className="subscibe">
            {/* <Input placeholder="SUBSCIBE"></Input> */}
          </div>
        </div>
      )}
    </ThemeContext.Consumer>
  );
}
