const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PENDING_SHIPMENT: 'pending_shipment',
  PENDING_RECEIPT: 'pending_receipt',
  COMPLETED: 'completed',
  CLOSED: 'closed'
}

const ORDER_GROUPS = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待付款' },
  { key: 'pending_shipment', label: '待发货' },
  { key: 'pending_receipt', label: '待收货' },
  { key: 'completed', label: '已完成' }
]

const PAYMENT_METHOD = {
  BALANCE: 'balance',
  WECHAT: 'wechat'
}

const VIDEO_QUALITY = [
  { label: '流畅', value: '360p' },
  { label: '标清', value: '540p' },
  { label: '高清', value: '720p' },
  { label: '超清', value: '1080p' }
]

const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

const PAGE_SIZE = 15

module.exports = {
  ORDER_STATUS,
  ORDER_GROUPS,
  PAYMENT_METHOD,
  VIDEO_QUALITY,
  PLAYBACK_RATES,
  PAGE_SIZE
}
