const Turn = require('node-turn')

const server = new Turn({
  listeningPort: 3478, // Port default for STUN/TURN
  authMech: 'long-term',
  debugLevel: 'ALL',
  credentials: {
    user1: 'password123',
    user2: 'securepass',
  },
})

server.start()

console.log('TURN server running on port 3478...')
