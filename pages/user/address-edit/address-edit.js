const auth = require('../../../utils/auth')
const validators = require('../../../utils/validators')

Page({
  data: {
    addressId: 0,
    form: { receiver_name: '', receiver_phone: '', province: '', city: '', district: '', detail_address: '', is_default: false },
    region: [],
    regionText: '',
    errorMsg: '',
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ addressId: parseInt(options.id) })
      this.loadAddress(options.id)
    }
  },

  async loadAddress(id) {
    try {
      const res = await auth.request({ url: '/mall/api/addresses', method: 'GET' })
      if (res.success && res.data) {
        const addresses = res.data.addresses || res.data || []
        const addr = addresses.find(a => a.id === parseInt(id))
        if (addr) {
          this.setData({
            form: addr,
            region: [addr.province, addr.city, addr.district],
            regionText: `${addr.province} ${addr.city} ${addr.district}`
          })
        }
      }
    } catch (e) {}
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value, errorMsg: '' })
  },

  onRegionChange(e) {
    const region = e.detail.value
    this.setData({
      region,
      'form.province': region[0],
      'form.city': region[1],
      'form.district': region[2],
      regionText: region.join(' ')
    })
  },

  onSwitchChange(e) {
    this.setData({ 'form.is_default': e.detail.value })
  },

  async save() {
    const { form } = this.data
    const nameError = validators.validateReceiverName(form.receiver_name)
    if (nameError) { this.setData({ errorMsg: nameError }); return }
    const phoneError = validators.validateReceiverPhone(form.receiver_phone)
    if (phoneError) { this.setData({ errorMsg: phoneError }); return }
    if (!form.province || !form.city || !form.district) {
      this.setData({ errorMsg: '请选择完整的省市区' }); return
    }
    const addrError = validators.validateAddress(form.detail_address)
    if (addrError) { this.setData({ errorMsg: addrError }); return }

    this.setData({ submitting: true, errorMsg: '' })
    try {
      const url = this.data.addressId ? `/mall/api/addresses/${this.data.addressId}` : '/mall/api/addresses'
      const method = this.data.addressId ? 'PUT' : 'POST'
      await auth.request({ url, method, data: form })
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 500)
    } catch (e) {
      this.setData({ errorMsg: e.message || '保存失败' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
