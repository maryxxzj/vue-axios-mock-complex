/**axios封装 ——请求拦截、相应拦截、错误统一处理  */
// 在http.js中引入axios
import axios from 'axios';   // 引入axios
import QS from 'qs'; // 引入qs模块，用来序列化post类型的数据
import {Toast} from 'vant';  // vant库的toast轻提示组件， 可选择自己使用的ui组件。

import store from '../store/index'

//切换环境
if (process.env.NODE_ENV == 'development') {
  axios.defaults.baseURL = '/';
} else if (process.env.NODE_ENV == 'debug') {
  axios.defaults.baseURL = 'http://127.0.0.1:8081';
} else if (process.env.NODE_ENV == 'production') {
  axios.defaults.baseURL = 'http://127.0.0.1:8082';
}

//设置请求超时时间
axios.defaults.timeout = 10000;

//post请求头的设置
// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';

// request 请求拦截器
axios.interceptors.request.use(
  config => {
    // 每次发送请求之前判断vuex中是否存在token。如果存在，则统一在http请求的header都加上token，不用每次请求手动添加
    // 即使本地存在token，也有可能token是过期的，所以在响应拦截器中要对返回状态进行判断。

    // config.data = JSON.stringify(config.data); 序列号放到了封装post请求方法中

    const token = store.state.token;
    token && (config.headers.Authorization = token);
    return config;
  },
  error => {
    return Promise.error(error)
    // return Promise.reject(error)
  })


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
      console.log(error);
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

/**
 * 封装get方法，对应get请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 * @returns {Promise}
 */
export function get(url, params) {
  return new Promise((resolve, reject) => {
    axios.get(url, {
      params: params
    })
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        reject(err.data)
      })
  });
}

/**
 * 封装post方法，对应post请求
 * @param {String} url [请求的url地址]
 * @param {Object} params
 * @returns {Promise}
 */
export function post(url, params) {
  return new Promise((resolve, reject) => {
    // axios.post(url, JSON.stringify(params))
    axios.post(url, QS.stringify(params))
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
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
