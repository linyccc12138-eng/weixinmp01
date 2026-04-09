const auth = require('../../../utils/auth')
const format = require('../../../utils/format')
const constants = require('../../../utils/constants')

Page({
  data: {
    chapterId: 0,
    courseId: 0,
    chapter: {},
    course: {},
    allChapters: [],
    videoSrc: '',
    resumeTime: 0,
    playbackRate: 1.0,
    playbackRates: constants.PLAYBACK_RATES,
    showChapterList: false,
    showWatermark: false,
    watermarkImage: '',
    progressTimer: null,
    currentTime: 0,
    duration: 0
  },

  videoCtx: null,

  onLoad(options) {
    const { chapter_id, course_id } = options
    if (chapter_id && course_id) {
      this.setData({ chapterId: parseInt(chapter_id), courseId: parseInt(course_id) })
      this.loadPlayData(chapter_id)
    }
    this.setupScreenProtection()
  },

  onUnload() {
    this.saveProgress()
    this.clearProgressTimer()
    this.removeScreenProtection()
  },

  onHide() {
    this.removeScreenProtection()
  },

  onShow() {
    if (this.data.chapterId) {
      this.setupScreenProtection()
    }
  },

  setupScreenProtection() {
    try {
      const deviceInfo = wx.getDeviceInfo()
      if (deviceInfo.platform === 'android') {
        wx.setVisualEffectOnCapture({ visualEffect: 'hidden' })
      } else {
        wx.onUserCaptureScreen(() => {
          wx.showToast({ title: '课程内容受版权保护，请勿传播', icon: 'none' })
          this.reportSecurityEvent('capture_screen')
        })
        wx.onScreenRecordingStateChanged(res => {
          if (res.state === 'start') {
            this.videoCtx && this.videoCtx.pause()
            wx.showModal({
              title: '版权保护',
              content: '检测到录屏，播放已暂停。课程内容受版权保护，禁止录屏传播。',
              showCancel: false
            })
            this.reportSecurityEvent('screen_recording_start')
          }
        })
        wx.getScreenRecordingState({
          success: res => {
            if (res.state === 'recording') {
              wx.showModal({
                title: '版权保护',
                content: '检测到正在录屏，请关闭录屏后继续学习。',
                showCancel: false
              })
            }
          }
        })
      }
    } catch (e) {}
    this.generateWatermark()
  },

  removeScreenProtection() {
    try {
      const deviceInfo = wx.getDeviceInfo()
      if (deviceInfo.platform === 'android') {
        wx.setVisualEffectOnCapture({ visualEffect: 'none' })
      } else {
        wx.offUserCaptureScreen()
        wx.offScreenRecordingStateChanged()
      }
    } catch (e) {}
  },

  generateWatermark() {
    const userInfo = auth.getUserInfo()
    const phone = userInfo ? format.maskPhone(userInfo.phone || '') : ''
    const userId = userInfo ? userInfo.id : ''
    const now = format.formatDate(new Date(), 'YYYY-MM-DD HH:mm')
    const watermarkText = `${phone} | ID:${userId} | ${now}`
    this.setData({ watermarkText, showWatermark: true })
  },

  async loadPlayData(chapterId) {
    try {
      const res = await auth.courseRequest({
        url: `/play/api/${chapterId}`,
        method: 'GET'
      })
      const data = (res && res.data) || {}
      const chapter = data.chapter || {}
      const course = data.course || {}
      const allChapters = (data.all_chapters || []).map(ch => ({
        ...ch,
        is_completed: false
      }))

      let videoSrc = ''
      if (chapter.file_id) {
        try {
          const psignRes = await auth.courseRequest({
            url: `/play/api/${chapterId}/psign`,
            method: 'GET'
          })
          if (psignRes && psignRes.success && psignRes.play_url) {
            videoSrc = psignRes.play_url
          }
        } catch (e) {}
      }

      this.setData({
        chapter,
        course,
        allChapters,
        resumeTime: data.resume_time || 0,
        videoSrc
      })
      wx.setNavigationBarTitle({ title: chapter.title || '视频播放' })
      this.videoCtx = wx.createVideoContext('courseVideo')
      this.startProgressTimer()
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  startProgressTimer() {
    this.clearProgressTimer()
    this._progressTimer = setInterval(() => {
      this.saveProgress()
    }, 30000)
  },

  clearProgressTimer() {
    if (this._progressTimer) {
      clearInterval(this._progressTimer)
      this._progressTimer = null
    }
  },

  async saveProgress() {
    if (!this.data.currentTime || !this.data.chapterId) return
    try {
      await auth.courseRequest({
        url: `/play/${this.data.chapterId}/progress`,
        method: 'POST',
        data: {
          current_time: this.data.currentTime,
          duration: this.data.duration,
          progress: this.data.duration > 0 ? Math.min(100, (this.data.currentTime / this.data.duration * 100)) : 0
        }
      })
    } catch (e) {}
  },

  onPlay() {},
  onPause() {},

  onTimeUpdate(e) {
    this.setData({
      currentTime: e.detail.currentTime,
      duration: e.detail.duration
    })
  },

  onEnded() {
    this.saveProgress()
  },

  onFullscreenChange(e) {},

  toggleChapterList() {
    this.setData({ showChapterList: !this.data.showChapterList })
  },

  switchChapter(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.chapterId) return
    this.saveProgress()
    this.setData({ chapterId: id })
    this.loadPlayData(id)
  },

  setSpeed(e) {
    const rate = parseFloat(e.currentTarget.dataset.rate)
    this.setData({ playbackRate: rate })
    if (this.videoCtx) {
      this.videoCtx.playbackRate(rate)
    }
  },

  async reportSecurityEvent(eventType) {
    try {
      await auth.courseRequest({
        url: '/play/api/security-event',
        method: 'POST',
        data: {
          event_type: eventType,
          chapter_id: this.data.chapterId,
          course_id: this.data.courseId
        }
      })
    } catch (e) {}
  }
})
