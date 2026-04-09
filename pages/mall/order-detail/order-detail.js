const auth = require('../../../utils/auth')
const format = require('../../../utils/format')

Page({
  data: {
    orderId: 0,
    order: {},
    addressText: '',
    paymentLabel: '',
    closedReason: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ orderId: parseInt(options.id) })
      this.loadOrder()
    }
  },

  async loadOrder() {
    try {
      const res = await auth.request({ url: `/mall/api/orders/${this.data.orderId}`, method: 'GET' })
      const order = res.data || res
      this.setData({
        order: { ...order, statusLabel: format.orderStatusLabel(order) },
        addressText: format.receiverAddress(order),
        paymentLabel: format.paymentMethodLabel(order),
        closedReason: format.orderClosedReasonLabel(order)
      })
      wx.setNavigationBarTitle({ title: '订单详情' })
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  copyOrderNo() {
    wx.setClipboardData({ data: this.data.order.order_no || '' })
  },

  copyShippingNo() {
    wx.setClipboardData({ data: this.data.order.shipping_no || '' })
  },

  async cancelOrder() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消该订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await auth.request({ url: `/mall/api/orders/${this.data.orderId}/cancel`, method: 'POST' })
            wx.showToast({ title: '已取消', icon: 'success' })
            this.loadOrder()
          } catch (e) { wx.showToast({ title: '取消失败', icon: 'none' }) }
        }
      }
    })
  },

  async payOrder() {
    try {
      const res = await auth.request({ url: `/mall/api/orders/${this.data.orderId}/pay/wechat`, method: 'POST' })
      if (res.success && res.data) {
        const payParams = res.data
        await wx.requestPayment({
          timeStamp: payParams.timeStamp,
          nonceStr: payParams.nonceStr,
          package: payParams.package,
          signType: payParams.signType || 'RSA',
          paySign: payParams.paySign
        })
        wx.showToast({ title: '支付成功', icon: 'success' })
        this.loadOrder()
      }
    } catch (e) {
      wx.showToast({ title: '支付失败', icon: 'none' })
    }
  },

  async completeOrder() {
    try {
      await auth.request({ url: `/mall/api/orders/${this.data.orderId}/complete`, method: 'POST' })
      wx.showToast({ title: '已确认收货', icon: 'success' })
      this.loadOrder()
    } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  }
})
