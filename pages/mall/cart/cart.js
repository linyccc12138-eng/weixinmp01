const auth = require('../../../utils/auth')
const format = require('../../../utils/format')
const app = getApp()

Page({
  data: {
    items: [],
    loading: true,
    selectedIds: [],
    allSelected: false,
    selectedCount: 0,
    totalPrice: '0.00'
  },

  onShow() {
    if (auth.isLoggedIn()) {
      this.loadCart()
    } else {
      this.setData({ loading: false })
    }
  },

  async loadCart() {
    this.setData({ loading: true })
    try {
      const res = await auth.request({ url: '/mall/api/cart', method: 'GET' })
      if (res.success && res.data) {
        const items = (res.data.items || []).map(item => ({
          ...item,
          cover_image: format.formatImageUrl(item.cover_image),
          selected: this.data.selectedIds.includes(item.id)
        }))
        this.setData({ items, loading: false })
        this.updateSummary()
        const count = items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        app.updateCartCount(count)
      } else {
        this.setData({ loading: false })
      }
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  toggleSelect(e) {
    const id = e.currentTarget.dataset.id
    const items = this.data.items.map(item => ({
      ...item,
      selected: item.id === id ? !item.selected : item.selected
    }))
    this.setData({ items })
    this.updateSummary()
  },

  toggleAll() {
    const allSelected = !this.data.allSelected
    const items = this.data.items.map(item => ({ ...item, selected: allSelected && item.item_status === 'valid' }))
    this.setData({ items, allSelected })
    this.updateSummary()
  },

  updateSummary() {
    const selected = this.data.items.filter(item => item.selected && item.item_status === 'valid')
    const totalPrice = selected.reduce((sum, item) => sum + Number(item.final_price || item.unit_price || 0) * (item.quantity || 1), 0)
    this.setData({
      selectedCount: selected.reduce((sum, item) => sum + (item.quantity || 0), 0),
      totalPrice: format.formatMoney(totalPrice),
      allSelected: this.data.items.length > 0 && this.data.items.filter(i => i.item_status === 'valid').every(i => i.selected)
    })
  },

  async changeQty(e) {
    const { id, delta } = e.currentTarget.dataset
    const item = this.data.items.find(i => i.id === id)
    if (!item) return
    let newQty = item.quantity + delta
    if (newQty < 1) return
    try {
      await auth.request({ url: `/mall/api/cart/${id}`, method: 'PUT', data: { quantity: newQty } })
      const items = this.data.items.map(i => i.id === id ? { ...i, quantity: newQty } : i)
      this.setData({ items })
      this.updateSummary()
    } catch (e) {
      wx.showToast({ title: '修改失败', icon: 'none' })
    }
  },

  async removeItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要移除该商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await auth.request({ url: `/mall/api/cart/${id}`, method: 'DELETE' })
            const items = this.data.items.filter(i => i.id !== id)
            this.setData({ items })
            this.updateSummary()
          } catch (e) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  checkout() {
    const selectedIds = this.data.items.filter(i => i.selected && i.item_status === 'valid').map(i => i.id)
    if (selectedIds.length === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/mall/checkout/checkout?mode=cart&selected_item_ids=${selectedIds.join(',')}` })
  },

  goProduct(e) {
    wx.navigateTo({ url: `/pages/mall/product-detail/product-detail?id=${e.currentTarget.dataset.id}` })
  },

  goMall() {
    wx.switchTab({ url: '/pages/mall/home/home' })
  }
})
