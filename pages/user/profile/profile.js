const auth = require('../../../utils/auth')
const format = require('../../../utils/format')
const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: {},
    memberInfo: null,
    memberDiscount: 1,
    memberBalance: '0.00',
    maskedPhone: '',
    initial: '',
    stats: {}
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    const isLoggedIn = auth.isLoggedIn()
    this.setData({ isLoggedIn })
    if (isLoggedIn) {
      this.loadProfile()
    } else {
      this.setData({ userInfo: {}, maskedPhone: '', initial: '?' })
    }
  },

  async loadProfile() {
    try {
      const res = await auth.request({ url: '/mall/api/profile', method: 'GET' })
      if (res.success && res.data) {
        const userInfo = res.data.user || {}
        const memberInfo = res.data.member || null
        const memberDiscount = memberInfo ? format.memberDiscountRate(memberInfo) : 1
        const memberBalance = memberInfo ? format.formatMoney(memberInfo.fbalance || 0) : '0.00'
        const maskedPhone = format.maskPhone(userInfo.phone || '')
        const initial = (userInfo.nickname || userInfo.phone || '?')[0].toUpperCase()
        this.setData({
          userInfo,
          memberInfo,
          memberDiscount,
          memberBalance,
          maskedPhone,
          initial
        })
        app.setUserInfo(userInfo)
      }
    } catch (e) {}

    try {
      const res = await auth.courseRequest({ url: '/course/api/user/stats', method: 'GET' })
      if (res.success && res.data) {
        this.setData({ stats: res.data })
      }
    } catch (e) {}
  },

  goLogin() { wx.navigateTo({ url: '/pages/auth/login/login' }) },
  goMyCourses() { wx.navigateTo({ url: '/pages/course/my-courses/my-courses' }) },
  goOrders() { wx.navigateTo({ url: '/pages/mall/order-list/order-list' }) },
  goAddresses() { wx.navigateTo({ url: '/pages/user/addresses/addresses' }) },
  goWallet() { wx.navigateTo({ url: '/pages/user/wallet/wallet' }) },
  goHistory() { wx.navigateTo({ url: '/pages/user/play-history/play-history' }) },
  goChangePassword() { wx.navigateTo({ url: '/pages/user/change-password/change-password' }) },
  goBindWechat() { wx.navigateTo({ url: '/pages/user/bind-wechat/bind-wechat' }) },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          auth.logout()
        }
      }
    })
  }
})
