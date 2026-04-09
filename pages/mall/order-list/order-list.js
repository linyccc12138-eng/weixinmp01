const auth = require('../../../utils/auth')
const format = require('../../../utils/format')
const constants = require('../../../utils/constants')

Page({
  data: {
    groups: constants.ORDER_GROUPS,
    activeGroup: 'all',
    orders: [],
    loading: true,
    page: 1,
    hasMore: true
  },

  onLoad(options) {
    if (options.group) this.setData({ activeGroup: options.group })
    this.loadOrders(true)
  },

  async loadOrders(refresh = false) {
    if (refresh) this.setData({ page: 1 })
    this.setData({ loading: true })
    try {
      const res = await auth.request({
        url: '/mall/api/orders',
        method: 'GET',
        data: { group: this.data.activeGroup, page: this.data.page, page_size: 15 }
      })
      let items = []
      if (res.success && res.data) items = res.data.items || res.data || []
      items = items.map(o => {
        if (o.items) {
          o.items = o.items.map(item => ({
            ...item,
            cover_image: format.formatImageUrl(item.cover_image)
          }))
        }
        return { ...o, statusLabel: format.orderStatusLabel(o) }
      })
      this.setData({
        orders: refresh ? items : [...this.data.orders, ...items],
        hasMore: items.length >= 15,
        loading: false
      })
    } catch (e) { this.setData({ loading: false }) }
  },

  switchGroup(e) {
    this.setData({ activeGroup: e.currentTarget.dataset.key })
    this.loadOrders(true)
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/mall/order-detail/order-detail?id=${e.currentTarget.dataset.id}` })
  },

  async payOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/mall/order-detail/order-detail?id=${id}&action=pay` })
  },

  async cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认取消',
      content: '确定要取消该订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await auth.request({ url: `/mall/api/orders/${id}/cancel`, method: 'POST' })
            wx.showToast({ title: '已取消', icon: 'success' })
            this.loadOrders(true)
          } catch (e) { wx.showToast({ title: '取消失败', icon: 'none' }) }
        }
      }
    })
  },

  async completeOrder(e) {
    const id = e.currentTarget.dataset.id
    try {
      await auth.request({ url: `/mall/api/orders/${id}/complete`, method: 'POST' })
      wx.showToast({ title: '已确认收货', icon: 'success' })
      this.loadOrders(true)
    } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadOrders()
    }
  }
})
