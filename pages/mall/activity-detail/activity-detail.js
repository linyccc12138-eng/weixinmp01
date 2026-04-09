const auth = require('../../../utils/auth')
const format = require('../../../utils/format')

Page({
  data: { activity: {} },
  onLoad(options) {
    if (options.id) this.loadActivity(options.id)
  },
  async loadActivity(id) {
    try {
      const res = await auth.request({ url: `/mall/api/activities/${id}`, method: 'GET' })
      let activity = {}
      if (res.success && res.data) {
        activity = {
          ...res.data,
          thumbnail_image: format.formatImageUrl(res.data.thumbnail_image)
        }
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
