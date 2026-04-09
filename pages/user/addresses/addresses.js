const auth = require('../../../utils/auth')

Page({
  data: { addresses: [], selectMode: false },

  onLoad(options) {
    if (options.select === '1') this.setData({ selectMode: true })
  },
  onShow() { this.loadAddresses() },

  async loadAddresses() {
    try {
      const res = await auth.request({ url: '/mall/api/addresses', method: 'GET' })
      if (res.success && res.data) {
        this.setData({ addresses: res.data.addresses || res.data || [] })
      }
    } catch (e) {}
  },

  selectAddress(e) {
    if (!this.data.selectMode) return
    const id = e.currentTarget.dataset.id
    const addr = this.data.addresses.find(a => a.id === id)
    if (addr) {
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      if (prevPage && prevPage.setData) {
        prevPage.setData({ selectedAddress: addr })
      }
      wx.navigateBack()
    }
  },

  editAddress(e) {
    wx.navigateTo({ url: `/pages/user/address-edit/address-edit?id=${e.currentTarget.dataset.id}` })
  },

  addAddress() {
    wx.navigateTo({ url: '/pages/user/address-edit/address-edit' })
  },

  async setDefault(e) {
    const id = e.currentTarget.dataset.id
    try {
      const addr = this.data.addresses.find(a => a.id === id)
      if (addr) {
        await auth.request({ url: `/mall/api/addresses/${id}`, method: 'PUT', data: { ...addr, is_default: true } })
        this.loadAddresses()
      }
    } catch (e) { wx.showToast({ title: '设置失败', icon: 'none' }) }
  },

  deleteAddress(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该地址吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await auth.request({ url: `/mall/api/addresses/${id}`, method: 'DELETE' })
            this.loadAddresses()
          } catch (e) { wx.showToast({ title: '删除失败', icon: 'none' }) }
        }
      }
    })
  }
})
