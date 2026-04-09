const auth = require('../../../utils/auth')

Page({
  data: { isBound: false, submitting: false },

  onLoad() { this.checkBindStatus() },

  async checkBindStatus() {
    try {
      const res = await auth.request({ url: '/mall/api/profile', method: 'GET' })
      if (res.success && res.data) {
        const user = res.data.user || {}
        this.setData({ isBound: !!user.wechat_openid })
      }
    } catch (e) {}
  },

  async bindWechat() {
    this.setData({ submitting: true })
    try {
      const loginRes = await wx.login()
      if (!loginRes.code) throw new Error('微信登录失败')
      const res = await auth.request({
        url: '/mall/api/auth/bind-wechat',
        method: 'POST',
        data: { code: loginRes.code }
      })
      if (res.success) {
        wx.showToast({ title: '绑定成功', icon: 'success' })
        this.setData({ isBound: true })
      } else {
        wx.showToast({ title: res.message || '绑定失败', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: e.message || '绑定失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  async unbindWechat() {
    wx.showModal({
      title: '确认解绑',
      content: '解绑后将无法使用微信快捷登录，确定要解绑吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ submitting: true })
          try {
            const res = await auth.request({ url: '/mall/api/auth/unbind-wechat', method: 'POST' })
            if (res.success) {
              wx.showToast({ title: '已解绑', icon: 'success' })
              this.setData({ isBound: false })
            } else {
              wx.showToast({ title: res.message || '解绑失败', icon: 'none' })
            }
          } catch (e) {
            wx.showToast({ title: '解绑失败', icon: 'none' })
          } finally {
            this.setData({ submitting: false })
          }
        }
      }
    })
  }
})
