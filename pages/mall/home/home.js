const auth = require('../../../utils/auth')
const format = require('../../../utils/format')

function processProductList(products, memberDiscount) {
  return (products || []).map(item => {
    const price = Number(item.price) || 0
    const originalPrice = Number(item.original_price) || 0
    const hasOriginalPrice = originalPrice > 0 && originalPrice > price
    const showMemberPrice = !!(item.supports_member_discount && memberDiscount < 1)
    const memberPrice = showMemberPrice ? format.formatMoney(price * memberDiscount) : ''
    return {
      ...item,
      hasOriginalPrice,
      showMemberPrice,
      memberPrice
    }
  })
}

Page({
  data: {
    banners: [],
    categories: [],
    products: [],
    newProducts: [],
    memberInfo: null,
    memberDiscount: 1,
    memberDiscountLabel: '',
    hasMemberDiscount: false,
    memberBalance: '0.00',
    loading: true,
    page: 1,
    hasMore: true
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    this.loadData(true)
  },

  onPullDownRefresh() {
    this.loadData(true).then(() => wx.stopPullDownRefresh()).catch(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadProducts()
    }
  },

  async loadData(refresh = false) {
    if (refresh) this.setData({ page: 1, products: [] })
    this.setData({ loading: true })
    try {
      const promises = [
        auth.request({ url: '/mall/api/products', method: 'GET', data: { page: 1, page_size: 20 } }).catch(() => null),
        auth.request({ url: '/mall/api/admin/activities', method: 'GET', data: { page: 1, page_size: 5 } }).catch(() => null)
      ]
      if (auth.isLoggedIn()) {
        promises.push(
          auth.request({ url: '/mall/api/profile', method: 'GET' }).catch(() => null)
        )
      }
      const [productRes, activityRes, profileRes] = await Promise.all(promises)

      let rawProducts = []
      if (productRes && productRes.success && productRes.data) {
        rawProducts = productRes.data.items || productRes.data || []
      }

      let banners = []
      if (activityRes && activityRes.success && activityRes.data) {
        banners = activityRes.data.items || activityRes.data || []
      }

      let memberInfo = null
      let memberDiscount = 1
      let memberBalance = '0.00'
      if (profileRes && profileRes.success && profileRes.data) {
        memberInfo = profileRes.data.member || null
        if (memberInfo) {
          memberDiscount = format.memberDiscountRate(memberInfo)
          memberBalance = format.formatMoney(memberInfo.fbalance || 0)
        }
      }

      const hasMemberDiscount = memberDiscount < 1
      const memberDiscountLabel = hasMemberDiscount ? (memberDiscount * 10).toFixed(1) : ''
      const products = processProductList(rawProducts, memberDiscount)

      this.setData({
        products,
        banners,
        memberInfo,
        memberDiscount,
        memberDiscountLabel,
        hasMemberDiscount,
        memberBalance,
        loading: false,
        hasMore: rawProducts.length >= 20
      })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  async loadProducts() {
    const page = this.data.page + 1
    this.setData({ loading: true })
    try {
      const res = await auth.request({
        url: '/mall/api/products',
        method: 'GET',
        data: { page, page_size: 20 }
      })
      let items = []
      if (res && res.success && res.data) {
        items = res.data.items || res.data || []
      }
      const processedItems = processProductList(items, this.data.memberDiscount)
      this.setData({
        products: [...this.data.products, ...processedItems],
        page,
        hasMore: items.length >= 20,
        loading: false
      })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/mall/category/category' })
  },

  goCategory(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/mall/category/category?category_id=${id}` })
  },

  goProduct(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/mall/product-detail/product-detail?id=${id}` })
  },

  goWallet() {
    wx.navigateTo({ url: '/pages/user/wallet/wallet' })
  },

  onBannerTap(e) {
    const item = e.currentTarget.dataset.item
    if (item && item.id) {
      wx.navigateTo({ url: `/pages/mall/activity-detail/activity-detail?id=${item.id}` })
    }
  }
})
