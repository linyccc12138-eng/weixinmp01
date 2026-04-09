const config = require('./config')

const TOKEN_KEY = config.tokenKey
const COURSE_SESSION_KEY = 'course_session'
const CSRF_KEY = 'csrf_token'
const MALL_SESSION_KEY = 'mall_session'
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

function getCourseSession() {
  return wx.getStorageSync(COURSE_SESSION_KEY) || ''
}

function setCourseSession(sessionId) {
  wx.setStorageSync(COURSE_SESSION_KEY, sessionId)
}

function removeCourseSession() {
  wx.removeStorageSync(COURSE_SESSION_KEY)
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

function getCsrfToken() {
  return wx.getStorageSync(CSRF_KEY) || ''
}

function setCsrfToken(token) {
  wx.setStorageSync(CSRF_KEY, token)
}

function getMallSession() {
  return wx.getStorageSync(MALL_SESSION_KEY) || ''
}

function setMallSession(sessionId) {
  wx.setStorageSync(MALL_SESSION_KEY, sessionId)
}

async function fetchCsrfToken() {
  try {
    const res = await new Promise((resolve, reject) => {
      wx.request({
        url: config.baseUrl + '/mall/api/session',
        method: 'GET',
        success(r) {
          if (r.statusCode >= 200 && r.statusCode < 300) {
            const setCookie = r.header && (r.header['Set-Cookie'] || r.header['set-cookie'] || '')
            resolve({ data: r.data, setCookie })
          } else {
            reject(new Error('获取session失败'))
          }
        },
        fail: reject
      })
    })
    if (res.data && res.data.success && res.data.data) {
      setCsrfToken(res.data.data.csrf_token || '')
    }
    if (res.setCookie) {
      const match = res.setCookie.match(/magic_mall=([^;]+)/)
      if (match) {
        setMallSession(match[1])
      }
    }
  } catch (e) {}
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
  removeCourseSession()
  removeUserInfo()
  wx.reLaunch({ url: '/pages/index/index' })
}

async function wxLogin() {
  try {
    const loginRes = await wx.login()
    if (!loginRes.code) {
      throw new Error('微信登录失败')
    }
    await fetchCsrfToken()
    const res = await request({
      url: '/mall/api/auth/wechat-login',
      method: 'POST',
      data: { code: loginRes.code, _csrf_token: getCsrfToken() }
    })
    if (res.success) {
      const data = res.data
      if (data.token || data.session_id) {
        setToken(data.token || data.session_id)
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
  await fetchCsrfToken()
  const res = await request({
    url: '/mall/api/auth/login',
    method: 'POST',
    data: { phone, password, _csrf_token: getCsrfToken() }
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
      'X-Mini-Program': '1',
      ...options.header
    }
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
    const mallSession = getMallSession()
    if (mallSession) {
      header['Cookie'] = (header['Cookie'] ? header['Cookie'] + '; ' : '') + `magic_mall=${mallSession}`
    }
    const method = (options.method || 'GET').toUpperCase()
    if (method !== 'GET') {
      const csrf = getCsrfToken()
      if (csrf) {
        header['X-CSRF-TOKEN'] = csrf
      }
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
          removeCourseSession()
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
        const setCookie = res.header && (res.header['Set-Cookie'] || res.header['set-cookie'] || '')
        if (setCookie) {
          const match = setCookie.match(/magic_mall=([^;]+)/)
          if (match) {
            setMallSession(match[1])
          }
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
  const sessionId = getCourseSession()
  const token = getToken()
  const header = {
    ...options.header
  }
  if (sessionId) {
    header['Cookie'] = `session=${sessionId}`
  }
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }
  options.header = header
  options.baseUrl = config.courseBaseUrl
  return request(options)
}

module.exports = {
  getToken,
  setToken,
  removeToken,
  getCourseSession,
  setCourseSession,
  removeCourseSession,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  getCsrfToken,
  setCsrfToken,
  getMallSession,
  setMallSession,
  fetchCsrfToken,
  isLoggedIn,
  checkLogin,
  logout,
  wxLogin,
  phoneLogin,
  request,
  courseRequest
}
