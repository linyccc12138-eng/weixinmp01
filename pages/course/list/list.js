const auth = require('../../../utils/auth')
const format = require('../../../utils/format')

Page({
  data: {
    courses: [],
    keyword: '',
    loading: true,
    hasMore: false,
    page: 1,
    isLoggedIn: auth.isLoggedIn()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    const loggedIn = auth.isLoggedIn()
    if (loggedIn !== this.data.isLoggedIn) {
      this.setData({ isLoggedIn: loggedIn })
    }
    if (loggedIn) {
      this.loadCourses(true)
    } else {
      this.setData({ loading: false })
    }
  },

  onPullDownRefresh() {
    this.loadCourses(true).then(() => wx.stopPullDownRefresh())
  },

  async loadCourses(refresh = false) {
    if (refresh) {
      this.setData({ page: 1 })
    }
    const page = this.data.page
    this.setData({ loading: true })
    try {
      const res = await auth.courseRequest({
        url: '/course/',
        method: 'GET',
        data: { page, page_size: 20, keyword: this.data.keyword }
      })
      let courses = []
      if (res.success && res.data) {
        courses = res.data.courses || res.data.items || res.data || []
      } else if (Array.isArray(res.data)) {
        courses = res.data
      } else if (Array.isArray(res)) {
        courses = res
      }
      const newCourses = courses.map(c => ({
        ...c,
        has_permission: c.has_permission || false,
        chapter_count: c.chapter_count || (c.chapters ? c.chapters.length : 0),
        progressColor: format.getProgressColor(c.progress ? c.progress.percentage : 0)
      }))
      this.setData({
        courses: refresh ? newCourses : [...this.data.courses, ...newCourses],
        hasMore: newCourses.length >= 20,
        loading: false
      })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.loadCourses(true)
  },

  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadCourses()
    }
  },

  goDetail(e) {
    const { id, allowed } = e.currentTarget.dataset
    if (!allowed) {
      wx.showToast({ title: '暂无权限，请联系管理员', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/course/detail/detail?id=${id}` })
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/auth/login/login' })
  }
})
