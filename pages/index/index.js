const auth = require('../../utils/auth')
const format = require('../../utils/format')

Page({
  data: {
    activities: [],
    newProducts: [],
    courses: [],
    loading: true
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh())
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const promises = [
        auth.request({ url: '/mall/api/products', method: 'GET', data: { page: 1, page_size: 6 } }).catch(() => null),
        auth.request({ url: '/mall/api/activities', method: 'GET' }).catch(() => null)
      ]
      const [productRes, activityRes] = await Promise.all(promises)

      let newProducts = []
      if (productRes && productRes.success && productRes.data) {
        const data = productRes.data
        newProducts = data.data || data.items || []
        newProducts = newProducts.map(item => ({
          ...item,
          cover_image: format.formatImageUrl(item.cover_image),
          hasOriginalPrice: Number(item.market_price || item.original_price || 0) > 0 && Number(item.market_price || item.original_price || 0) > Number(item.price)
        }))
      }

      let activities = []
      if (activityRes && activityRes.success && activityRes.data) {
        activities = (Array.isArray(activityRes.data) ? activityRes.data : (activityRes.data.items || [])).map(a => ({
          ...a,
          thumbnail_image: format.formatImageUrl(a.thumbnail_image)
        }))
      }

      this.setData({
        newProducts,
        activities,
        loading: false
      })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  goCourse() {
    wx.switchTab({ url: '/pages/course/list/list' })
  },

  goMall() {
    wx.switchTab({ url: '/pages/mall/home/home' })
  },

  goActivity(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/mall/activity-detail/activity-detail?id=${id}` })
  },

  goProduct(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/mall/product-detail/product-detail?id=${id}` })
  },

  goCourseDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/course/detail/detail?id=${id}` })
  }
})
