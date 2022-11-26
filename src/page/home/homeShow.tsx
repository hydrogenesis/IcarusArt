import { GLTFLoader  } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from "three";
import React from 'react';
import { ThemeContext } from '../../index';
import { Link } from 'react-router-dom';
import { Button } from 'antd'
const json = require('./lan.json');
const loader = new GLTFLoader();
const img = require('../../assets/images/homeBcButtonIcon.png').default;
export class HomeShow extends React.Component {
  componentDidMount() {
    /**
     * 创建场景对象Scene
     */
     var scene = new THREE.Scene();
     //环境光
     var point = new THREE.AmbientLight(0xffffff)
     scene.add(point);
     var point2 = new THREE.PointLight(0xffffff);
     point2.position.set(10, 0, 0); //点光源位置
     scene.add(point2);
     var point3 = new THREE.PointLight(0xffffff);
     point3.position.set(0, 10, 0); //点光源位置
     scene.add(point3);
     // console.log(scene)
     // console.log(scene.children)
     var loader = new GLTFLoader()
     let xxx
     loader.load( './homeShow.glb', function ( gltf ) {
       scene.add( gltf.scene )
       camera.lookAt(0,6,0); //设置相机方向(指向的场景对象)
       xxx = gltf.scene
     }, undefined, function ( error ) {
       console.error( error );
     
     } )
 
     /**
      * 相机设置
      */
     var width = 360; //窗口宽度
     var height = 580; //窗口高度
     //创建相机对象
     var camera = new THREE.PerspectiveCamera(45, 360/580, 1, 1000);
     camera.position.set(6, 6, 6); //设置相机位置
     /**
      * 创建渲染器对象
      */
     var renderer = new THREE.WebGLRenderer();
     renderer.setSize(width, height);//设置渲染区域尺寸
     renderer.setClearColor(0xb9d3ff, 0); //设置背景颜色
     document.querySelector('#homeShow').appendChild(renderer.domElement); //body元素中插入canvas对象
     //执行渲染操作   指定场景、相机作为参数
     function render() {
      renderer.render(scene,camera);//执行渲染操作
      xxx && (xxx.rotateY(0.01))
      requestAnimationFrame(render);//请求再次执行渲染函数render
    }
    render();
    // var controls = new OrbitControls(camera, document.querySelector('#homeShow'));
  }
  render() {
    return (
      <ThemeContext.Consumer>
        {
          value => (
            <div id='homeShow'>
              <a target='_blank' href='https://www.tingmuseum.art/peony-dream-reve'>
                <Button>{json[value.lan].more} <img src={img} alt="" /></Button>
              </a>
            </div>
          )
        }
      </ThemeContext.Consumer>
    )
  }
}