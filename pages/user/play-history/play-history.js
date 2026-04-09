const auth = require('../../../utils/auth')
const format = require('../../../utils/format')

Page({
  data: { records: [], loading: true, page: 1, hasMore: true },

  onLoad() { this.loadHistory(true) },

  async loadHistory(refresh = false) {
    if (refresh) this.setData({ page: 1 })
    this.setData({ loading: true })
    try {
      const res = await auth.courseRequest({
        url: '/course/api/user/play-history',
        method: 'GET',
        data: { page: this.data.page, page_size: 20 }
      })
      let items = []
      if (res.success && res.data) items = res.data.records || res.data || []
      items = items.map(r => ({
        ...r,
        played_at: format.timeAgo(r.played_at || r.last_played_at)
      }))
      this.setData({
        records: refresh ? items : [...this.data.records, ...items],
        hasMore: items.length >= 20,
        loading: false
      })
    } catch (e) { this.setData({ loading: false }) }
  },

  goPlay(e) {
    const { chapterId, courseId } = e.currentTarget.dataset
    if (chapterId && courseId) {
      wx.navigateTo({ url: `/pages/course/play/play?chapter_id=${chapterId}&course_id=${courseId}` })
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadHistory()
    }
  }
})
