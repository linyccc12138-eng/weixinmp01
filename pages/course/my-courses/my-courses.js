const auth = require('../../../utils/auth')
const format = require('../../../utils/format')

Page({
  data: { courses: [], stats: null, loading: true },

  onLoad() { this.loadData() },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [coursesRes, statsRes] = await Promise.all([
        auth.courseRequest({ url: '/user/my-courses', method: 'GET' }).catch(() => null),
        auth.courseRequest({ url: '/user/api/profile', method: 'GET' }).catch(() => null)
      ])

      let courses = []
      if (coursesRes && coursesRes.success && coursesRes.data) {
        courses = (coursesRes.data.courses || coursesRes.data || []).map(c => ({
          ...c,
          progressPercentage: c.progress ? Math.round(c.progress.percentage || 0) : 0,
          chapter_count: c.chapter_count || (c.chapters ? c.chapters.length : 0)
        }))
      }

      let stats = null
      if (statsRes && statsRes.success && statsRes.data) {
        stats = statsRes.data
      }

      this.setData({ courses, stats, loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/course/detail/detail?id=${e.currentTarget.dataset.id}` })
  }
})
