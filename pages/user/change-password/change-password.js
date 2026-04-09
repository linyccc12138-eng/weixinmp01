const auth = require('../../../utils/auth')
const validators = require('../../../utils/validators')

Page({
  data: { currentPassword: '', newPassword: '', confirmPassword: '', errorMsg: '', submitting: false },

  onInput(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value, errorMsg: '' }) },

  async changePassword() {
    const { currentPassword, newPassword, confirmPassword } = this.data
    if (!currentPassword) { this.setData({ errorMsg: '请输入当前密码' }); return }
    const pwdError = validators.validatePassword(newPassword)
    if (pwdError) { this.setData({ errorMsg: pwdError }); return }
    const confirmError = validators.validateConfirmPassword(newPassword, confirmPassword)
    if (confirmError) { this.setData({ errorMsg: confirmError }); return }

    this.setData({ submitting: true, errorMsg: '' })
    try {
      const res = await auth.request({
        url: '/mall/api/profile/password',
        method: 'PUT',
        data: { current_password: currentPassword, new_password: newPassword }
      })
      if (res.success) {
        wx.showToast({ title: '修改成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 500)
      } else {
        this.setData({ errorMsg: res.message || '修改失败' })
      }
    } catch (e) {
      this.setData({ errorMsg: e.message || '修改失败' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
