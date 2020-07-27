const {PeerServer} = require('peer')
const {p2pServerConfig} = require('../config')

const peerServer = PeerServer(p2pServerConfig)
