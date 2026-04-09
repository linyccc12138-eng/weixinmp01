const auth = require('../../../utils/auth')
const format = require('../../../utils/format')

Page({
  data: {
    mode: 'cart',
    checkoutItems: [],
    addresses: [],
    selectedAddress: null,
    memberInfo: null,
    memberBalance: '0.00',
    paymentMethod: 'wechat',
    summary: { subtotal: '0.00', discount: '0.00', payable: '0.00' },
    submitting: false,
    selectedItemIds: [],
    productId: 0,
    skuId: 0,
    quantity: 1
  },

  onLoad(options) {
    this.setData({
      mode: options.mode || 'cart',
      selectedItemIds: options.selected_item_ids ? options.selected_item_ids.split(',').map(Number) : [],
      productId: parseInt(options.product_id) || 0,
      skuId: parseInt(options.sku_id) || 0,
      quantity: parseInt(options.quantity) || 1
    })
    this.loadCheckoutData()
  },

  async loadCheckoutData() {
    try {
      const [addrRes, profileRes] = await Promise.all([
        auth.request({ url: '/mall/api/addresses', method: 'GET' }),
        auth.request({ url: '/mall/api/profile', method: 'GET' }).catch(() => null)
      ])

      const addresses = (addrRes.success && addrRes.data) ? (addrRes.data.addresses || addrRes.data || []) : []
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0] || null

      let memberInfo = null
      let memberBalance = '0.00'
      if (profileRes && profileRes.success && profileRes.data) {
        memberInfo = profileRes.data.member || null
        if (memberInfo) memberBalance = format.formatMoney(memberInfo.fbalance || 0)
      }

      let checkoutItems = []
      let subtotal = 0
      let discount = 0
      let memberDiscount = 1

      if (memberInfo) {
        memberDiscount = format.memberDiscountRate(memberInfo)
      }

      if (this.data.mode === 'buy_now') {
        const prodRes = await auth.request({ url: `/mall/api/products/${this.data.productId}/quick-view`, method: 'GET' })
        if (prodRes.success && prodRes.data) {
          const product = prodRes.data
          let unitPrice = Number(product.price)
          if (format.hasMemberDiscount(memberInfo, product.supports_member_discount) && memberDiscount < 1) {
            const memberPrice = unitPrice * memberDiscount
            discount += (unitPrice - memberPrice) * this.data.quantity
            unitPrice = memberPrice
          }
          checkoutItems = [{
            product_id: product.id,
            product_name: product.name,
            cover_image: product.cover_image,
            final_price: format.formatMoney(unitPrice),
            unit_price: product.price,
            quantity: this.data.quantity,
            sku_id: this.data.skuId
          }]
          subtotal = product.price * this.data.quantity
        }
      } else {
        const cartRes = await auth.request({ url: '/mall/api/cart', method: 'GET' })
        if (cartRes.success && cartRes.data) {
          const cartItems = cartRes.data.items || []
          checkoutItems = cartItems.filter(item => this.data.selectedItemIds.includes(item.id))
          checkoutItems = checkoutItems.map(item => {
            const originalPrice = Number(item.unit_price || item.final_price || 0)
            if (format.hasMemberDiscount(memberInfo, item.supports_member_discount) && memberDiscount < 1) {
              const memberPrice = originalPrice * memberDiscount
              discount += (originalPrice - memberPrice) * (item.quantity || 1)
              return { ...item, final_price: format.formatMoney(memberPrice) }
            }
            return item
          })
          subtotal = checkoutItems.reduce((sum, item) => sum + Number(item.unit_price || item.final_price || 0) * (item.quantity || 1), 0)
        }
      }

      const payable = Math.max(0, subtotal - discount)
      this.setData({
        addresses,
        selectedAddress: defaultAddr,
        memberInfo,
        memberBalance,
        checkoutItems,
        summary: {
          subtotal: format.formatMoney(subtotal),
          discount: format.formatMoney(discount),
          payable: format.formatMoney(payable)
        }
      })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  selectAddress() {
    wx.navigateTo({ url: '/pages/user/addresses/addresses?select=1' })
  },

  selectPayment(e) {
    this.setData({ paymentMethod: e.currentTarget.dataset.method })
  },

  async submitOrder() {
    if (!this.data.selectedAddress) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    try {
      const data = {
        address_id: this.data.selectedAddress.id,
        mode: this.data.mode
      }
      if (this.data.mode === 'buy_now') {
        data.product_id = this.data.productId
        data.sku_id = this.data.skuId
        data.quantity = this.data.quantity
      } else {
        data.selected_item_ids = this.data.selectedItemIds
      }

      const res = await auth.request({ url: '/mall/api/orders', method: 'POST', data })
      if (res.success && res.data) {
        const order = res.data
        if (this.data.paymentMethod === 'balance') {
          await this.payWithBalance(order.id)
        } else {
          await this.payWithWechat(order.id)
        }
      } else {
        wx.showToast({ title: res.message || '下单失败', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: e.message || '下单失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  async payWithBalance(orderId) {
    try {
      const res = await auth.request({ url: `/mall/api/orders/${orderId}/pay/balance`, method: 'POST' })
      if (res.success) {
        wx.redirectTo({ url: `/pages/mall/order-result/order-result?success=1&order_id=${orderId}` })
      } else {
        wx.redirectTo({ url: `/pages/mall/order-result/order-result?success=0&order_id=${orderId}` })
      }
    } catch (e) {
      wx.redirectTo({ url: `/pages/mall/order-result/order-result?success=0&order_id=${orderId}` })
    }
  },

  async payWithWechat(orderId) {
    try {
      const res = await auth.request({ url: `/mall/api/orders/${orderId}/pay/wechat`, method: 'POST' })
      if (res.success && res.data) {
        const payParams = res.data
        await wx.requestPayment({
          timeStamp: payParams.timeStamp,
          nonceStr: payParams.nonceStr,
          package: payParams.package,
          signType: payParams.signType || 'RSA',
          paySign: payParams.paySign
        })
        wx.redirectTo({ url: `/pages/mall/order-result/order-result?success=1&order_id=${orderId}` })
      } else {
        wx.showToast({ title: res.message || '发起支付失败', icon: 'none' })
      }
    } catch (e) {
      if (e.errMsg && e.errMsg.includes('cancel')) {
        wx.redirectTo({ url: `/pages/mall/order-result/order-result?success=0&order_id=${orderId}` })
      } else {
        wx.redirectTo({ url: `/pages/mall/order-result/order-result?success=0&order_id=${orderId}` })
      }
    }
  }
})
