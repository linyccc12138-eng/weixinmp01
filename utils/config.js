const ENV = 'production'

const CONFIG = {
  development: {
    baseUrl: 'https://magic.lyccc.xyz',
    courseBaseUrl: 'https://magic.lyccc.xyz',
    timeout: 15000,
    tokenKey: 'auth_token',
    userInfoKey: 'user_info'
  },
  production: {
    baseUrl: 'https://magic.lyccc.xyz',
    courseBaseUrl: 'https://magic.lyccc.xyz',
    timeout: 15000,
    tokenKey: 'auth_token',
    userInfoKey: 'user_info'
  }
}

const config = CONFIG[ENV] || CONFIG.production

export default config
