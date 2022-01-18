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
const util = require('util')
const debug = util.debuglog('server')

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
 
         chosenHandler(data, (statusCode = 200, payload = {}, contentType = 'json' )=>{
            let payloadString = ''

            if(contentType == 'json') {
                res.setHeader('Content-Type', 'application/json')
                payloadString = JSON.stringify(payload)
            } else if(contentType == 'html') {
                res.setHeader('Content-Type', 'text/html')
                payloadString = typeof(payload) == 'string' ? payload : ''
            }

             res.writeHead(statusCode)
             res.end(payloadString)

             if(statusCode == 200) {
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /'+trimmedPath + ' ' + statusCode)
            } else {
                 debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /'+trimmedPath + ' ' + statusCode)
            }
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
     '': handlers.index,
     'account/create': handlers.accountCreate,
     'account/edit': handlers.accountEdit,
     'account/deleted': handlers.accountDeleted,
     'session/create': handlers.sessionCreate,
     'session/deleted': handlers.sessionDeleted,
     'checks/all': handlers.checksList,
     'checks/create': handlers.checksCreate,
     'checks/edit': handlers.checksEdit,

     'ping': handlers.ping,
     'api/users': handlers.users,
     'api/tokens': handlers.tokens,
     'api/checks': handlers.checks
 }
 
 server.init = () => {
    server.httpServer.listen(config.httpPort, ()=>{ console.log('\x1b[36m%s\x1b[0m', `Server listening on port ${config.httpPort}`)})
    server.httpsServer.listen(config.httpsPort, ()=>{ console.log('\x1b[35m%s\x1b[0m', `Server listening on port ${config.httpsPort}`)})
 }
 
 module.exports = server
 
 