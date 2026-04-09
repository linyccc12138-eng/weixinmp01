const auth = require('./utils/auth')

App({
  globalData: {
    userInfo: null,
    cartCount: 0,
    systemInfo: null
  },

  onLaunch() {
    this.getSystemInfo()
    this.checkUpdate()
    this.trySilentLogin()
    auth.fetchSession()
  },

  getSystemInfo() {
    try {
      const deviceInfo = wx.getDeviceInfo()
      const windowInfo = wx.getWindowInfo()
      const appBaseInfo = wx.getAppBaseInfo()
      this.globalData.systemInfo = {
        ...deviceInfo,
        ...windowInfo,
        ...appBaseInfo,
        platform: deviceInfo.platform || 'unknown'
      }
    } catch (e) {}
  },

  checkUpdate() {
    try {
      if (!wx.getUpdateManager) return
      const updateManager = wx.getUpdateManager()
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: modalRes => {
            if (modalRes.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })
      updateManager.onUpdateFailed(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本下载失败，请检查网络后重试',
          showCancel: false
        })
      })
    } catch (e) {}
  },

  trySilentLogin() {
    if (auth.isLoggedIn()) {
      const userInfo = auth.getUserInfo()
      if (userInfo) {
        this.globalData.userInfo = userInfo
      }
      this.fetchCartCount()
    }
  },

  async fetchCartCount() {
    if (!auth.isLoggedIn()) return
    try {
      const res = await auth.request({
        url: '/mall/api/cart',
        method: 'GET'
      })
      if (res.success && res.data) {
        const items = res.data.items || []
        this.globalData.cartCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0)
      }
    } catch (e) {}
  },

  updateCartCount(count) {
    this.globalData.cartCount = count
  },

  setUserInfo(info) {
    this.globalData.userInfo = info
    auth.setUserInfo(info)
  }
})
