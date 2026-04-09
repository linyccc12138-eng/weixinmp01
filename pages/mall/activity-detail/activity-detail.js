const auth = require('../../../utils/auth')

Page({
  data: { activity: {} },
  onLoad(options) {
    if (options.id) this.loadActivity(options.id)
  },
  async loadActivity(id) {
    try {
      const res = await auth.request({ url: `/mall/api/admin/activities`, method: 'GET', data: { page: 1, page_size: 100 } })
      let activity = {}
      if (res.success && res.data) {
        const items = res.data.items || res.data || []
        activity = items.find(a => String(a.id) === String(id)) || {}
      }
      this.setData({ activity })
      wx.setNavigationBarTitle({ title: activity.title || '活动详情' })
    } catch (e) { wx.showToast({ title: '加载失败', icon: 'none' }) }
  },
  onShareAppMessage() {
    return {
      title: this.data.activity.title,
      path: `/pages/mall/activity-detail/activity-detail?id=${this.data.activity.id}`
    }
  }
})
