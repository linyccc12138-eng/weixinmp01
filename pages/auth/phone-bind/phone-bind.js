const auth = require('../../../utils/auth')
const validators = require('../../../utils/validators')

Page({
  data: {
    phone: '',
    password: '',
    confirmPassword: '',
    errorMsg: '',
    submitting: false,
    wxLoading: false
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value, errorMsg: '' }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value, errorMsg: '' }) },
  onConfirmInput(e) { this.setData({ confirmPassword: e.detail.value, errorMsg: '' }) },

  async onGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      this.setData({ errorMsg: '获取手机号失败，请手动输入' })
      return
    }
    this.setData({ wxLoading: true, errorMsg: '' })
    try {
      const res = await auth.request({
        url: '/mall/api/open/accounts',
        method: 'POST',
        data: {
          phone: e.detail.phoneNumber || '',
          code: e.detail.code,
          role: 'customer',
          allow_existing: true
        }
      })
      if (res.success && res.data && (res.data.token || res.data.session_id)) {
        auth.setToken(res.data.token || res.data.session_id)
        auth.setUserInfo(res.data.user || res.data)
        const app = getApp()
        app.setUserInfo(res.data.user || res.data)
        app.fetchCartCount()
        wx.showToast({ title: '绑定成功', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 500)
      } else {
        this.setData({ errorMsg: res.message || '绑定失败' })
      }
    } catch (e) {
      this.setData({ errorMsg: e.message || '绑定失败' })
    } finally {
      this.setData({ wxLoading: false })
    }
  },

  async onBind() {
    const { phone, password, confirmPassword } = this.data
    const phoneError = validators.validatePhone(phone)
    if (phoneError) { this.setData({ errorMsg: phoneError }); return }
    const pwdError = validators.validatePassword(password)
    if (pwdError) { this.setData({ errorMsg: pwdError }); return }
    const confirmError = validators.validateConfirmPassword(password, confirmPassword)
    if (confirmError) { this.setData({ errorMsg: confirmError }); return }

    this.setData({ submitting: true, errorMsg: '' })
    try {
      const res = await auth.request({
        url: '/mall/api/open/accounts',
        method: 'POST',
        data: { phone, password, role: 'customer', allow_existing: false }
      })
      if (res.success && res.data && (res.data.token || res.data.session_id)) {
        auth.setToken(res.data.token || res.data.session_id)
        auth.setUserInfo(res.data.user || res.data)
        const app = getApp()
        app.setUserInfo(res.data.user || res.data)
        app.fetchCartCount()
        wx.showToast({ title: '绑定成功', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 500)
      } else {
        this.setData({ errorMsg: res.message || '绑定失败' })
      }
    } catch (e) {
      this.setData({ errorMsg: e.message || '绑定失败' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
