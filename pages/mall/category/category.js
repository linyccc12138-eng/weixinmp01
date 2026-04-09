const auth = require('../../../utils/auth')

Page({
  data: {
    keyword: '',
    categories: [],
    products: [],
    activeCategory: 0,
    loading: true,
    page: 1,
    hasMore: true
  },

  onLoad(options) {
    if (options.category_id) {
      this.setData({ activeCategory: parseInt(options.category_id) })
    }
    this.loadCategories()
    this.loadProducts(true)
  },

  async loadCategories() {
    try {
      const res = await auth.request({ url: '/mall/api/admin/categories', method: 'GET' })
      if (res.success && res.data) {
        this.setData({ categories: res.data.items || res.data || [] })
      }
    } catch (e) {}
  },

  async loadProducts(refresh = false) {
    if (refresh) this.setData({ page: 1, products: [] })
    this.setData({ loading: true })
    try {
      const data = { page: this.data.page, page_size: 20 }
      if (this.data.keyword) data.keyword = this.data.keyword
      if (this.data.activeCategory) data.category_id = this.data.activeCategory
      const res = await auth.request({ url: '/mall/api/products', method: 'GET', data })
      let items = []
      if (res.success && res.data) items = res.data.items || res.data || []
      this.setData({
        products: refresh ? items : [...this.data.products, ...items],
        hasMore: items.length >= 20,
        loading: false
      })
    } catch (e) { this.setData({ loading: false }) }
  },

  onSearchInput(e) { this.setData({ keyword: e.detail.value }) },
  onSearch() { this.loadProducts(true) },
  selectCategory(e) {
    this.setData({ activeCategory: parseInt(e.currentTarget.dataset.id) })
    this.loadProducts(true)
  },
  goProduct(e) {
    wx.navigateTo({ url: `/pages/mall/product-detail/product-detail?id=${e.currentTarget.dataset.id}` })
  },
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadProducts()
    }
  }
})
