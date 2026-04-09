const config = require('./config')

const USER_INFO_KEY = config.userInfoKey
const COURSE_SESSION_KEY = 'course_session'
const CSRF_KEY = 'csrf_token'
const MALL_SESSION_KEY = 'mall_session'
let isRedirecting401 = false

function getUserInfo() {
  try {
    const info = wx.getStorageSync(USER_INFO_KEY)
    return info ? JSON.parse(info) : null
  } catch (e) {
    return null
  }
}

function setUserInfo(info) {
  wx.setStorageSync(USER_INFO_KEY, JSON.stringify(info))
}

function removeUserInfo() {
  wx.removeStorageSync(USER_INFO_KEY)
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

function removeMallSession() {
  wx.removeStorageSync(MALL_SESSION_KEY)
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

function isLoggedIn() {
  return !!(getUserInfo() && getMallSession())
}

function checkLogin() {
  if (!isLoggedIn()) {
    wx.navigateTo({ url: '/pages/auth/login/login' })
    return false
  }
  return true
}

function logout() {
  removeMallSession()
  removeCourseSession()
  removeUserInfo()
  removeCsrfToken()
  wx.reLaunch({ url: '/pages/index/index' })
}

function removeCsrfToken() {
  wx.removeStorageSync(CSRF_KEY)
}

async function fetchSession() {
  try {
    const res = await new Promise((resolve, reject) => {
      wx.request({
        url: config.baseUrl + '/mall/api/session',
        method: 'GET',
        header: buildCookieHeader(),
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
    extractSessionCookie(res.setCookie)
    if (res.data && res.data.success && res.data.data) {
      setCsrfToken(res.data.data.csrf_token || '')
      if (res.data.data.user) {
        setUserInfo(res.data.data.user)
      }
    }
  } catch (e) {}
}

function extractSessionCookie(setCookie) {
  if (!setCookie) return
  const match = setCookie.match(/magic_mall=([^;]+)/)
  if (match && match[1]) {
    setMallSession(match[1])
  }
}

function buildCookieHeader() {
  const parts = []
  const mallSession = getMallSession()
  if (mallSession) {
    parts.push(`magic_mall=${mallSession}`)
  }
  const courseSession = getCourseSession()
  if (courseSession) {
    parts.push(`session=${courseSession}`)
  }
  return parts.length > 0 ? parts.join('; ') : ''
}

async function phoneLogin(phone, password) {
  await fetchSession()
  const res = await request({
    url: '/mall/api/auth/login',
    method: 'POST',
    data: { phone, password, _csrf_token: getCsrfToken() }
  })
  if (res.success && res.data && res.data.user) {
    setUserInfo(res.data.user)
    return res.data.user
  }
  throw new Error((res.data && res.data.message) || res.message || '登录失败')
}

async function wxLogin() {
  try {
    const loginRes = await wx.login()
    if (!loginRes.code) {
      throw new Error('微信登录失败')
    }
    await fetchSession()
    const res = await request({
      url: '/mall/api/auth/wechat-login',
      method: 'POST',
      data: { code: loginRes.code, _csrf_token: getCsrfToken() }
    })
    if (res.success && res.data) {
      if (res.data.user) {
        setUserInfo(res.data.user)
        return { needBindPhone: false, user: res.data.user }
      }
      return { needBindPhone: true, openid: res.data.openid }
    }
    throw new Error(res.message || '登录失败')
  } catch (e) {
    throw e
  }
}

function request(options) {
  return new Promise((resolve, reject) => {
    const header = {
      'Content-Type': 'application/json',
      'X-Mini-Program': '1',
      ...options.header
    }
    const cookieStr = buildCookieHeader()
    if (cookieStr) {
      header['Cookie'] = cookieStr
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
          removeMallSession()
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
        extractSessionCookie(res.header && (res.header['Set-Cookie'] || res.header['set-cookie'] || ''))
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
  const header = {
    ...options.header
  }
  const courseSession = getCourseSession()
  if (courseSession) {
    header['Cookie'] = `session=${courseSession}`
  }
  options.header = header
  options.baseUrl = config.courseBaseUrl
  return request(options)
}

module.exports = {
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  getCourseSession,
  setCourseSession,
  removeCourseSession,
  getMallSession,
  setMallSession,
  getCsrfToken,
  setCsrfToken,
  fetchSession,
  isLoggedIn,
  checkLogin,
  logout,
  wxLogin,
  phoneLogin,
  request,
  courseRequest
}
