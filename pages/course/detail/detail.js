const auth = require('../../../utils/auth')
const format = require('../../../utils/format')

Page({
  data: {
    courseId: 0,
    course: {},
    chapters: [],
    hasPermission: false,
    progress: null,
    lastChapter: null,
    loading: true
  },

  onLoad(options) {
    const id = options.id
    if (id) {
      this.setData({ courseId: id })
      this.loadCourseDetail(id)
    }
  },

  async loadCourseDetail(id) {
    this.setData({ loading: true })
    try {
      const [courseRes, chaptersRes] = await Promise.all([
        auth.courseRequest({ url: `/course/${id}`, method: 'GET' }).catch(() => null),
        auth.courseRequest({ url: `/course/${id}/api/chapters`, method: 'GET' }).catch(() => null)
      ])
      const course = (courseRes && (courseRes.data || courseRes)) || {}
      const chaptersData = (chaptersRes && (chaptersRes.data || chaptersRes)) || []
      const chapters = (course.chapters || chaptersData.chapters || chaptersData || []).map((ch, idx) => ({
        ...ch,
        is_locked: !course.has_permission,
        is_completed: course.progress && course.progress.completed_chapter_ids
          ? course.progress.completed_chapter_ids.includes(ch.id)
          : false
      }))
      const lastChapter = chapters.find(ch => !ch.is_locked) || null
      this.setData({
        course,
        chapters,
        hasPermission: course.has_permission || false,
        progress: course.progress || null,
        lastChapter,
        loading: false
      })
      wx.setNavigationBarTitle({ title: course.title || '课程详情' })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  playChapter(e) {
    const { id, locked } = e.currentTarget.dataset
    if (locked) {
      wx.showToast({ title: '暂无权限', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/course/play/play?chapter_id=${id}&course_id=${this.data.courseId}` })
  },

  continuePlay() {
    if (this.data.lastChapter) {
      wx.navigateTo({
        url: `/pages/course/play/play?chapter_id=${this.data.lastChapter.id}&course_id=${this.data.courseId}`
      })
    }
  }
})
