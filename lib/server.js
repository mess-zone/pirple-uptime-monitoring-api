/**
 * Server related tasks
 */
 const http = require('http')
 const https = require('https')
 const url = require('url')
 const {StringDecoder} = require('string_decoder')
 const config = require('./config')
 const fs  = require('fs')
 const handlers = require('./handlers')
 const helpers = require('./helpers')
 const path = require('path')
 
const server = {}

 server.unifiedServer = (req, res) =>{
     const parsedUrl = url.parse(req.url, true)
 
     const path = parsedUrl.pathname
     const trimmedPath = path.replace(/^\/+|\/+$/g, '')
 
     const queryStringObject = parsedUrl.query
 
     const method = req.method.toLowerCase()
 
     const headers = req.headers
 
 
     // get body payload, if any
     const decoder = new StringDecoder('utf-8') 
     let buffer = ''
 
     req.on('data', (data)=>{
         buffer += decoder.write(data)
     })
 
     req.on('end', ()=>{
         buffer += decoder.end()
 
         const chosenHandler = server.router[trimmedPath] || handlers.notFound
         const data = {
             trimmedPath,
             queryStringObject,
             method,
             headers,
             payload: helpers.parseJsonToObject(buffer)
         }
 
         chosenHandler(data, (statusCode = 200, payload = {})=>{
             const payloadString = JSON.stringify(payload)
             console.log('Returning response:', statusCode, payloadString )
 
             res.setHeader('Content-Type', 'application/json')
             res.writeHead(statusCode)
             res.end(payloadString)
         })
 
     })
 }
 
 // HTTP server
 server.httpServer = http.createServer(server.unifiedServer)
 
 // HTTPS server
 server.httpsServerOption = {
     key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
     cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
 }
 server.httpsServer = https.createServer(server.httpsServerOption, server.unifiedServer)
 
 // request router
 
 server.router = {
     'ping': handlers.ping,
     'users': handlers.users,
     'tokens': handlers.tokens,
     'checks': handlers.checks
 }
 
 server.init = () => {
    server.httpServer.listen(config.httpPort, ()=>{ console.log(`Server listening on port ${config.httpPort}`)})
    server.httpsServer.listen(config.httpsPort, ()=>{ console.log(`Server listening on port ${config.httpsPort}`)})
 }
 
 module.exports = server
 
 