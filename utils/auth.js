const config = require('./config')

const TOKEN_KEY = config.tokenKey
let isRedirecting401 = false

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || ''
}

function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token)
}

function removeToken() {
  wx.removeStorageSync(TOKEN_KEY)
}

function getUserInfo() {
  try {
    const info = wx.getStorageSync(config.userInfoKey)
    return info ? JSON.parse(info) : null
  } catch (e) {
    return null
  }
}

function setUserInfo(info) {
  wx.setStorageSync(config.userInfoKey, JSON.stringify(info))
}

function removeUserInfo() {
  wx.removeStorageSync(config.userInfoKey)
}

function isLoggedIn() {
  return !!getToken()
}

function checkLogin() {
  if (!isLoggedIn()) {
    wx.navigateTo({ url: '/pages/auth/login/login' })
    return false
  }
  return true
}

function logout() {
  removeToken()
  removeUserInfo()
  wx.reLaunch({ url: '/pages/index/index' })
}

async function wxLogin() {
  try {
    const loginRes = await wx.login()
    if (!loginRes.code) {
      throw new Error('微信登录失败')
    }
    const res = await request({
      url: '/mall/api/miniprogram/wx-login',
      method: 'POST',
      data: { code: loginRes.code }
    })
    if (res.success) {
      const data = res.data
      if (data.token) {
        setToken(data.token)
        setUserInfo(data.user)
        return { needBindPhone: false, user: data.user }
      }
      return { needBindPhone: true, openid: data.openid }
    }
    throw new Error(res.message || '登录失败')
  } catch (e) {
    throw e
  }
}

async function phoneLogin(phone, password) {
  const res = await request({
    url: '/mall/api/auth/login',
    method: 'POST',
    data: { phone, password }
  })
  if (res.success) {
    const data = res.data
    setToken(data.token || data.session_id)
    setUserInfo(data.user)
    return data.user
  }
  throw new Error(res.message || '登录失败')
}

function request(options) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    }
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    const baseUrl = options.baseUrl || config.baseUrl
    const url = options.url.startsWith('http') ? options.url : baseUrl + options.url

    wx.request({
      url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      timeout: options.timeout || config.timeout,
      success(res) {
        if (res.statusCode === 401) {
          removeToken()
          removeUserInfo()
          if (!isRedirecting401) {
            isRedirecting401 = true
            wx.reLaunch({
              url: '/pages/auth/login/login',
              complete() { isRedirecting401 = false }
            })
          }
          reject(new Error('登录已过期，请重新登录'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const msg = (res.data && res.data.message) || '请求失败'
          reject(new Error(msg))
        }
      },
      fail(err) {
        reject(new Error('网络请求失败，请检查网络连接'))
      }
    })
  })
}

function courseRequest(options) {
  options.baseUrl = config.courseBaseUrl
  return request(options)
}

module.exports = {
  getToken,
  setToken,
  removeToken,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  isLoggedIn,
  checkLogin,
  logout,
  wxLogin,
  phoneLogin,
  request,
  courseRequest
}
