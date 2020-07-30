const isProd = process.env.NODE_ENV === 'production'

const p2pServerConfigDev = {
  host: 'localhost',
  port: '9000',
  path: '/poker',
  debug: 2,
}

const p2pServerConfigProd = {
  host: 'p2p-poker.herokuapp.com',
  port: '443',
  path: '/poker',
  secure: true,
}


module.exports = {
  p2pServerConfig: isProd? p2pServerConfigProd : p2pServerConfigDev
}

