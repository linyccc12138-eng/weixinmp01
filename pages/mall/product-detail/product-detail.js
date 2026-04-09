const auth = require('../../../utils/auth')
const format = require('../../../utils/format')
const app = getApp()

Page({
  data: {
    productId: 0,
    product: {},
    galleryImages: [],
    skuOptionsList: [],
    selectedOptions: {},
    currentPrice: '0.00',
    currentStock: 0,
    currentSkuId: 0,
    selectedSkuText: '',
    hasSku: false,
    showSkuPicker: false,
    quantity: 1,
    cartCount: 0,
    showMemberPrice: false,
    skuAction: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ productId: options.id })
      this.loadProduct(options.id)
    }
    this.setData({ cartCount: app.globalData.cartCount })
  },

  async loadProduct(id) {
    try {
      const res = await auth.request({ url: `/mall/api/products/${id}/quick-view`, method: 'GET' })
      const product = res.data || res
      let galleryImages = []
      if (product.gallery_json) {
        try { galleryImages = JSON.parse(product.gallery_json) } catch (e) {}
      }
      if (galleryImages.length === 0 && product.cover_image) {
        galleryImages = [product.cover_image]
      }
      galleryImages = galleryImages.map(url => format.formatImageUrl(url))
      product.cover_image = format.formatImageUrl(product.cover_image)

      const skuOptionsList = []
      const skuOptions = product.sku_options || product.options || {}
      for (const [name, options] of Object.entries(skuOptions)) {
        skuOptionsList.push({ name, options })
      }

      const hasSku = skuOptionsList.length > 0
      const skus = product.skus || product.product_skus || []
      const memberInfo = app.globalData.userInfo
      const memberDiscount = memberInfo ? format.memberDiscountRate(memberInfo) : 1
      const showMemberPrice = format.hasMemberDiscount(memberInfo, product.supports_member_discount)
      const showOriginalPrice = Number(product.price) > 0 && Number(product.original_price) > Number(product.price)

      this.setData({
        product,
        galleryImages,
        skuOptionsList,
        hasSku,
        currentPrice: format.formatMoney(product.price),
        currentStock: product.stock || 0,
        showMemberPrice: showMemberPrice && memberDiscount < 1,
        showOriginalPrice
      })
      wx.setNavigationBarTitle({ title: product.name || '商品详情' })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  previewImage(e) {
    wx.previewImage({ current: e.currentTarget.dataset.src, urls: this.data.galleryImages })
  },

  openSkuPicker() {
    this.setData({ showSkuPicker: true, skuAction: '' })
  },

  closeSkuPicker() {
    this.setData({ showSkuPicker: false })
  },

  selectOption(e) {
    const { name, value } = e.currentTarget.dataset
    const selectedOptions = { ...this.data.selectedOptions, [name]: value }
    this.setData({ selectedOptions })
    this.updateSkuInfo()
  },

  updateSkuInfo() {
    const { product, selectedOptions, skuOptionsList } = this.data
    const skus = product.skus || product.product_skus || []
    const allSelected = skuOptionsList.every(g => selectedOptions[g.name])
    if (!allSelected || skus.length === 0) return

    const matchedSku = skus.find(sku => {
      const attrs = sku.attributes || sku.option_values || {}
      return Object.entries(selectedOptions).every(([k, v]) => attrs[k] === v)
    })

    if (matchedSku) {
      const selectedSkuText = Object.values(selectedOptions).join(' / ')
      this.setData({
        currentSkuId: matchedSku.id,
        currentPrice: format.formatMoney(matchedSku.price || product.price),
        currentStock: matchedSku.stock || 0,
        selectedSkuText
      })
    }
  },

  changeQty(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    let qty = this.data.quantity + delta
    if (qty < 1) qty = 1
    if (qty > this.data.currentStock) qty = this.data.currentStock
    this.setData({ quantity: qty })
  },

  onQtyInput(e) {
    let qty = parseInt(e.detail.value) || 1
    if (qty < 1) qty = 1
    if (qty > this.data.currentStock) qty = this.data.currentStock
    this.setData({ quantity: qty })
  },

  async addToCart() {
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/auth/login/login' })
      return
    }
    if (this.data.hasSku && !this.data.currentSkuId) {
      this.setData({ showSkuPicker: true, skuAction: 'cart' })
      return
    }
    try {
      const res = await auth.request({
        url: '/mall/api/cart',
        method: 'POST',
        data: {
          product_id: this.data.productId,
          sku_id: this.data.currentSkuId,
          quantity: this.data.quantity
        }
      })
      if (res.success) {
        wx.showToast({ title: '已加入购物车', icon: 'success' })
        const newCount = this.data.cartCount + this.data.quantity
        this.setData({ cartCount: newCount })
        app.updateCartCount(newCount)
      } else {
        wx.showToast({ title: res.message || '添加失败', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: e.message || '添加失败', icon: 'none' })
    }
  },

  buyNow() {
    if (!auth.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/auth/login/login' })
      return
    }
    if (this.data.hasSku && !this.data.currentSkuId) {
      this.setData({ showSkuPicker: true, skuAction: 'buy' })
      return
    }
    const params = `mode=buy_now&product_id=${this.data.productId}&sku_id=${this.data.currentSkuId}&quantity=${this.data.quantity}`
    wx.navigateTo({ url: `/pages/mall/checkout/checkout?${params}` })
  },

  confirmSku() {
    this.setData({ showSkuPicker: false })
    if (this.data.skuAction === 'cart') {
      this.addToCart()
    } else if (this.data.skuAction === 'buy') {
      this.buyNow()
    }
  },

  goCart() {
    wx.switchTab({ url: '/pages/mall/cart/cart' })
  },

  onShareAppMessage() {
    return {
      title: this.data.product.name,
      path: `/pages/mall/product-detail/product-detail?id=${this.data.productId}`,
      imageUrl: format.formatImageUrl(this.data.product.cover_image) || ''
    }
  }
})
