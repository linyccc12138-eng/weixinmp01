const auth = require('../../../utils/auth')

Page({
  data: { success: false, order: null, orderId: 0 },

  onLoad(options) {
    const success = options.success === '1' || options.success === 'true'
    const orderId = parseInt(options.order_id) || 0
    this.setData({ success, orderId })
    if (orderId) this.loadOrder(orderId)
  },

  async loadOrder(id) {
    try {
      const res = await auth.request({ url: `/mall/api/orders/${id}`, method: 'GET' })
      if (res.success && res.data) {
        this.setData({ order: res.data })
      }
    } catch (e) {}
  },

  goOrderDetail() {
    if (this.data.orderId) {
      wx.redirectTo({ url: `/pages/mall/order-detail/order-detail?id=${this.data.orderId}` })
    } else {
      wx.navigateTo({ url: '/pages/mall/order-list/order-list' })
    }
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
