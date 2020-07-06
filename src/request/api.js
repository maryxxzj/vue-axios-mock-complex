/**
 * api接口统一管理
 */
import {get, post} from './http'


//api接口配置
export const testList = params => get('/api/v1/list', params);
