/**
 * Example udp server
 */

const dgram = require('dgram')

const server = dgram.createSocket('udp4')

server.on('message', (messageBuffer, sender)=> {
    const messageString = messageBuffer.toString()
    console.log(messageString)
})

server.bind(6000)