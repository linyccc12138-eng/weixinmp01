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
  },

  getSystemInfo() {
    try {
      const info = wx.getSystemInfoSync()
      this.globalData.systemInfo = info
    } catch (e) {}
  },

  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckUpdate(res => {
        if (res.hasUpdate) {
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
        }
      })
    }
  },

  trySilentLogin() {
    const token = auth.getToken()
    if (token) {
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
