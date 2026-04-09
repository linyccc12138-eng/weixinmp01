const auth = require('../../../utils/auth')
const format = require('../../../utils/format')

Page({
  data: { memberInfo: null, memberBalance: '0.00', memberDiscount: 1, records: [] },

  onLoad() { this.loadWallet() },

  async loadWallet() {
    try {
      const res = await auth.request({ url: '/mall/api/profile', method: 'GET' })
      if (res.success && res.data) {
        const memberInfo = res.data.member || null
        const memberDiscount = memberInfo ? format.memberDiscountRate(memberInfo) : 1
        const memberBalance = memberInfo ? format.formatMoney(memberInfo.fbalance || 0) : '0.00'
        this.setData({ memberInfo, memberDiscount, memberBalance })
      }
    } catch (e) {}
    try {
      const res = await auth.request({ url: '/mall/api/wallet', method: 'GET' })
      if (res.success && res.data) {
        this.setData({ records: res.data.records || res.data || [] })
      }
    } catch (e) {}
  }
})
