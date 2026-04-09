function formatMoney(value) {
  return Number(value || 0).toFixed(2)
}

function formatDate(dateStr, format = 'YYYY-MM-DD HH:mm') {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function maskPhone(phone) {
  if (!phone) return ''
  const str = String(phone)
  if (str.length < 7) return str
  return str.substring(0, 3) + '****' + str.substring(str.length - 4)
}

function orderStatusLabel(order) {
  const status = order.status || ''
  const paymentStatus = order.payment_status || ''
  if (status === 'pending_payment') {
    return paymentStatus === 'paid' ? '待发货' : '待付款'
  }
  if (status === 'pending_shipment') return '待发货'
  if (status === 'pending_receipt') return '待收货'
  if (status === 'completed') return '已完成'
  if (status === 'closed') return '已关闭'
  return status || '处理中'
}

function paymentMethodLabel(order) {
  const method = order.payment_method || ''
  if (method === 'balance') return '会员余额支付'
  if (method === 'wechat') return '微信支付'
  if (order.payment_status === 'paid') return '已支付'
  return '未支付'
}

function orderClosedReasonLabel(order) {
  const reason = (order.closed_reason || '').trim()
  if (!reason) return '未提供'
  if (reason === 'user_cancelled') return '用户主动取消'
  if (reason === 'admin_closed') return '管理员取消订单'
  if (reason === 'timeout') return '订单支付超时自动关闭'
  return reason
}

function receiverAddress(order) {
  const direct = (order.receiver_address || '').trim()
  if (direct) return direct
  const addr = order.address_snapshot || {}
  return [addr.province, addr.city, addr.district, addr.detail_address]
    .map(v => (v || '').trim())
    .filter(Boolean)
    .join(' ')
}

function memberDiscountRate(member) {
  const raw = Number((member && member.foff) || 1)
  if (!Number.isFinite(raw) || raw <= 0) return 1
  if (raw > 1 && raw <= 10) return Number((raw / 10).toFixed(2))
  return raw > 1 ? 1 : Number(raw.toFixed(2))
}

function hasMemberDiscount(member, supportsMemberDiscount) {
  return !!(member && memberDiscountRate(member) < 1 && Number(supportsMemberDiscount || 0) === 1)
}

function truncateText(text, maxLen = 2) {
  if (!text) return ''
  const str = String(text)
  return str.length > maxLen * 14 ? str.substring(0, maxLen * 14) + '...' : str
}

function getProgressColor(progress) {
  const p = Number(progress || 0)
  if (p >= 80) return '#22C55E'
  if (p >= 30) return '#888888'
  return '#BBBBBB'
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return formatDate(dateStr, 'YYYY-MM-DD')
}

module.exports = {
  formatMoney,
  formatDate,
  formatDuration,
  maskPhone,
  orderStatusLabel,
  paymentMethodLabel,
  orderClosedReasonLabel,
  receiverAddress,
  memberDiscountRate,
  hasMemberDiscount,
  truncateText,
  getProgressColor,
  timeAgo
}
