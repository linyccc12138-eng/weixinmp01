function validatePhone(phone) {
  if (!phone) return '请输入手机号'
  if (!/^1[3-9]\d{9}$/.test(phone)) return '手机号格式不正确'
  return ''
}

function validatePassword(password) {
  if (!password) return '请输入密码'
  if (password.length < 8) return '密码长度至少为8位'
  return ''
}

function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return '请确认密码'
  if (password !== confirmPassword) return '两次输入的密码不一致'
  return ''
}

function validateRequired(value, fieldName) {
  if (!value || !String(value).trim()) return `请输入${fieldName}`
  return ''
}

function validateReceiverName(name) {
  return validateRequired(name, '收货人姓名')
}

function validateReceiverPhone(phone) {
  return validatePhone(phone)
}

function validateAddress(address) {
  if (!address || !address.trim()) return '请输入详细地址'
  return ''
}

function validateRegion(region) {
  if (!region || !region.province || !region.city || !region.district) {
    return '请选择完整的省市区'
  }
  return ''
}

module.exports = {
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  validateRequired,
  validateReceiverName,
  validateReceiverPhone,
  validateAddress,
  validateRegion
}
