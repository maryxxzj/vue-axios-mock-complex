# vue-axios-mock-complex 复杂项目 

 ## 介绍
  vue-cli 本地开发使用axios+mock数据
  
 **技术栈**：
 * Vue
 * Vue-router 
 * webpack
 * axios
 * mock 
 
 **关键步骤**：
 1. nodeJS安装
 2. vue-cli 安装模板及初始化项目
 3. 安装淘宝镜像和依赖并启动项目
 4. 配置mock.js
 5. Vuex使用
 6. 封装axios
 7. api统一管理
 8. 调用api接口
 
 **说明**
 如果NodeJS已安装，忽略第一步
 如果vue-cli已全局安装，直接进行初始化项目
 如果淘宝镜像以全局安装，可直接安装相关依赖，并启动项目

## 配置mock.js
 mockjs安装  `cnpm install mockjs --save-dev`
 
为了只在开发环境使用mock.js，打包到生产环境时自动不使用mock.js，做以下配置：

01 **config目录下dev.env.js**
```
'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  Mock: true
})
```
02 **config目录下prod.env.js**
```
'use strict'

module.exports = {
  NODE_ENV: '"production"',
  Mock: false
}
```
03 src目录下main.js
```
process.env.Mock && require('./mock/mock.js')
```
04 根目录下创建mock文件夹，新建mock.js的文件并编写相应数据
~~~
// 引入mockjs
const Mock = require('mockjs')
// 获取 mock.Random 对象
const Random = Mock.Random
// mock一组数据
const produceNewsData = function () {
  let articles = []
  for (let i = 0; i < 50; i++) {
    let newArticleObject = { 
      author_name: Random.cname(), // Random.cname() 随机生成一个中文姓名
    }
    articles.push(newArticleObject)
  }
  return articles 
}
// 拦截ajax请求，配置mock的数据
Mock.mock('/api/v1/list', 'get', produceNewsData)
~~~

## 封装axios
 axios安装  `cnpm install axios --save-dev
`
#### 引入axios
 一般会在项目的src目录中，新建一个request文件夹，并在里面新建一个http.js和一个api.js文件。**http.js文件用来封装axios，api.js用来统一管理接口**。

在http.js中引入axios 
* `cnpm install vant --save`  安装UI组件库vant ，使用vant库的toast轻提示组件
*  引用node的qs模块来序列化参数`QS.stringify(params)`，也可以使用JSON序列化参数`JSON.stringify(params)) `
```
import axios from 'axios';   // 引入axios
import QS from 'qs'; // 引入qs模块，用来序列化post类型的数据 
import { Toast } from 'vant';  // vant的toast提示框组件，ui组件可自选 。
```

环境的切换

项目环境可能有开发环境、测试环境和生产环境。通过**node的环境变量**来匹配默认的接口url前缀。`axios.defaults.baseURL`可以设置axios的默认请求地址。
~~~  
if (process.env.NODE_ENV == 'development') {
  axios.defaults.baseURL = '/';}
else if (process.env.NODE_ENV == 'debug') {
  axios.defaults.baseURL = 'http://127.0.0.1:8081';
}
else if (process.env.NODE_ENV == 'production') {
  axios.defaults.baseURL = 'http://127.0.0.1:8082';
} 
~~~
设置请求超时——通过`axios.defaults.timeout`设置默认的请求超时时间。  
~~~ 
//设置请求超时时间
axios.defaults.timeout = 10000;
~~~
post请求头的设置
~~~
//post请求头的设置
// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8'
~~~
请求拦截
>需使用vuex,因为请求拦截时要使用到里面的状态对象，`import store from '@/store/index'; `
~~~ 
// 请求拦截器
axios.interceptors.request.use( 
    config => { 
        // 每次发送请求之前判断vuex中是否存在token。
        // 如果存在，则统一在http请求的header都加上token，这样后台根据token判断你的登录情况
        // 即使本地存在token，也有可能token是过期的，在响应拦截器中要对返回状态进行判断 
        const token = store.state.token; 
        token && (config.headers.Authorization = token); 
        return config; 
    }, 
    error => { 
    return Promise.error(error); 
}) 
~~~

响应拦截
> 响应拦截器就是服务器返回的数据，在拿到之前可以对它进行一些处理。如后台返回的状态码是200，正常返回数据，否则根据错误的状态码类型进行错误的统一处理。
```
// response 响应拦截器
axios.interceptors.response.use(
  response => {
    // 如果返回的状态码为200，说明接口请求成功，可以正常读取数据；否则抛出错误。
    if (response.status === 200) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(response);
    }
  },
  // 服务器状态码跟后台开发人员协商好统一的错误状态码，然后根据返回的状态码进行一些操作，如登录过期提示，错误提示等
  // 列举几个常见的操作
  error => {
    if (error.response.status) {
      switch (error.response.status) {
        // 401: 未登录，  未登录则跳转登录页面，并携带当前页面的路径；在登录成功后返回当前页面，这一步需要在登录页操作。
        case 401:
          router.replace({
            path: '/login',
            query: {
              redirect: router.currentRoute.fullPath
            }
          });
          break;

        // 403 token过期， 登录过期对用户进行提示，清除本地token和清空vuex中token对象，跳转登录页面。
        case 403:
          Toast({
            message: '登录过期，请重新登录',
            duration: 1000,
            forbidClick: true
          });
          // 清除token
          localStorage.removeItem('token');
          store.commit('loginSuccess', null);
          // 跳转登录页面，并将要浏览的页面fullPath传过去，登录成功后跳转需要访问的页面
          setTimeout(() => {
            router.replace({
              path: '/login',
              query: {
                redirect: router.currentRoute.fullPath
              }
            });
          }, 1000);
          break;

        // 404请求不存在
        case 404:
          Toast({
            message: '网络请求不存在',
            duration: 1500,
            forbidClick: true
          });
          break;

        // 其他错误，直接抛出错误提示
        default:
          Toast({
            message: error.response.data.message,
            duration: 1500,
            forbidClick: true
          });
      }
      return Promise.reject(error.response);
    }
  }
); 
```
封装方法
```
/**
 * get方法，对应get请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export function get(url, params){    
    return new Promise((resolve, reject) =>{        
        axios.get(url, {            
            params: params        
        }).then(res => {
            resolve(res.data);
        }).catch(err =>{
            reject(err.data)        
    })    
});}
 
/** 
 * post方法，对应post请求 
 * @param {String} url [请求的url地址] 
 * @param {Object} params [请求时携带的参数] 
 */
export function post(url, params) {
    return new Promise((resolve, reject) => {
        // axios.post(url, JSON.stringify(params))
         axios.post(url, QS.stringify(params))
        .then(res => {
            resolve(res.data);
        })
        .catch(err =>{
            reject(err.data)
        })
    });
}
 
/**
 * 封装patch请求
 * @param url
 * @param data
 * @returns {Promise}
 */
export function patch(url, data = {}) {
  return new Promise((resolve, reject) => {
    axios.patch(url, data)
      .then(res => {
        resolve(res.data);
      }, err => {
        reject(err)
      })
  })
}
 
 /**
 * 封装put请求
 * @param url
 * @param data
 * @returns {Promise}
 */
export function put(url, data = {}) {
  return new Promise((resolve, reject) => {
    axios.put(url, data)
      .then(res => {
        resolve(res.data);
      }, err => {
        reject(err)
      })
  })
}
```

## api统一管理
01 在api.js中引入封装的get和post方法  
```
/* api接口统一管理   */
import { get, post } from './http'
```
 02 api接口配置
```
// api接口配置
export const testList = params => get('/api/v1/list', params);
```

## Build Setup

``` bash
# install registry 安装淘宝镜像
npm install -g cnpm --registry=https://registry.npm.taobao.org

# install dependencies 安装依赖
cnpm install

# serve with hot reload at localhost:8080
npm run dev 运行项目

# build for production with minification
npm run build 编译

# build for production and view the bundle analyzer report
npm run build --report  查看编译报告
``` 
