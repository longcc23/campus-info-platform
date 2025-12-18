// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 这个云函数会自动被微信识别并包含用户信息
 * 直接返回 OPENID
 */
exports.main = async (event, context) => {
  const { OPENID, APPID, UNIONID } = cloud.getWXContext()

  return {
    openid: OPENID,
    appid: APPID,
    unionid: UNIONID,
  }
}


