/**
 * api接口统一管理
 */
import { get, post } from './http'

//api接口配置
export const userList = params => post('api/v1/users/list', params);
