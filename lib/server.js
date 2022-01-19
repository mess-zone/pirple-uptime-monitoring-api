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
 
         let chosenHandler = server.router[trimmedPath] || handlers.notFound

         chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler

         const data = {
             trimmedPath,
             queryStringObject,
             method,
             headers,
             payload: helpers.parseJsonToObject(buffer)
         }
 
         try {
             chosenHandler(data, (statusCode = 200, payload = {}, contentType = 'json' )=>{
                server.processHandlerResponse(res, method, trimmedPath, statusCode, payload, contentType)
             })
         } catch(e) {
            debug(e)
            server.processHandlerResponse(res, method, trimmedPath, 500, {'error': 'A unknown error has ocurred'}, 'json')
         }
 
     })
 }

 //process the response from the handler 
 server.processHandlerResponse = (res, method, trimmedPath, statusCode, payload, contentType) => {
    let payloadString = ''

    if(contentType == 'json') {
        res.setHeader('Content-Type', 'application/json')
        payloadString = JSON.stringify(payload)
    } else if(contentType == 'html') {
        res.setHeader('Content-Type', 'text/html')
        payloadString = typeof(payload) == 'string' ? payload : ''
    } else if(contentType == 'favicon') {
        res.setHeader('Content-Type', 'image/x-icon')
        payloadString = typeof(payload) !== 'undefined' ? payload : ''
    } else if(contentType == 'css') {
        res.setHeader('Content-Type', 'text/css')
        payloadString = typeof(payload) !== 'undefined' ? payload : ''
    } else if(contentType == 'png') {
        res.setHeader('Content-Type', 'image/png')
        payloadString = typeof(payload) !== 'undefined' ? payload : ''
    } else if(contentType == 'jpg') {
        res.setHeader('Content-Type', 'image/jpeg')
        payloadString = typeof(payload) !== 'undefined' ? payload : ''
    } else if(contentType == 'plain') {
        res.setHeader('Content-Type', 'text/plain')
        payloadString = typeof(payload) !== 'undefined' ? payload : ''
    }

     res.writeHead(statusCode)
     res.end(payloadString)

     if(statusCode == 200) {
        debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /'+trimmedPath + ' ' + statusCode)
    } else {
         debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /'+trimmedPath + ' ' + statusCode)
    }
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
     'favicon.ico': handlers.favicon,
     'public': handlers.public,

     'ping': handlers.ping,
     'api/users': handlers.users,
     'api/tokens': handlers.tokens,
     'api/checks': handlers.checks,
     'examples/error': handlers.exampleError
 }
 
 server.init = () => {
    server.httpServer.listen(config.httpPort, ()=>{ console.log('\x1b[36m%s\x1b[0m', `Server listening on port ${config.httpPort}`)})
    server.httpsServer.listen(config.httpsPort, ()=>{ console.log('\x1b[35m%s\x1b[0m', `Server listening on port ${config.httpsPort}`)})
 }
 
 module.exports = server
 
 