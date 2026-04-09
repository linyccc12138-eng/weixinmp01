const auth = require('../../../utils/auth')
const validators = require('../../../utils/validators')

Page({
  data: {
    phone: '',
    password: '',
    errorMsg: '',
    submitting: false,
    wxLoading: false
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value, errorMsg: '' })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value, errorMsg: '' })
  },

  async onLogin() {
    const { phone, password } = this.data
    const phoneError = validators.validatePhone(phone)
    if (phoneError) {
      this.setData({ errorMsg: phoneError })
      return
    }
    const pwdError = validators.validatePassword(password)
    if (pwdError) {
      this.setData({ errorMsg: pwdError })
      return
    }

    this.setData({ submitting: true, errorMsg: '' })
    try {
      await auth.phoneLogin(phone, password)
      const app = getApp()
      app.setUserInfo(auth.getUserInfo())
      app.fetchCartCount()
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)
    } catch (e) {
      this.setData({ errorMsg: e.message || '登录失败，请重试' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  async onWxLogin() {
    this.setData({ wxLoading: true, errorMsg: '' })
    try {
      const result = await auth.wxLogin()
      if (result.needBindPhone) {
        wx.navigateTo({ url: '/pages/auth/phone-bind/phone-bind' })
      } else {
        const app = getApp()
        app.setUserInfo(result.user)
        app.fetchCartCount()
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' })
        }, 500)
      }
    } catch (e) {
      this.setData({ errorMsg: e.message || '微信登录失败' })
    } finally {
      this.setData({ wxLoading: false })
    }
  },

  viewAgreement(e) {
    const type = e.currentTarget.dataset.type
    const title = type === 'service' ? '用户服务协议' : '隐私政策'
    wx.showModal({
      title,
      content: type === 'service'
        ? '欢迎使用神奇喵喵屋小程序。使用本服务即表示您同意遵守相关服务条款。本平台提供的课程和商品信息仅供参考，具体以实际为准。用户应妥善保管账户信息，因用户自身原因导致的账户安全问题由用户自行承担。'
        : '我们重视您的隐私保护。本小程序仅收集必要的用户信息（手机号、微信OpenID）用于身份验证和服务提供。我们不会将您的个人信息出售或分享给第三方。您有权随时查看、修改或删除您的个人信息。',
      showCancel: false,
      confirmText: '我知道了'
    })
  }
})
