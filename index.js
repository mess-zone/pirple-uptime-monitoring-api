/**
 * Primary file for the API
 */

const http = require('http')
const https = require('https')
const url = require('url')
const {StringDecoder} = require('string_decoder')
const config = require('./config')
const fs  = require('fs')

const unifiedServer = (req, res) =>{
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

        const chosenHandler = router[trimmedPath] || handlers.notFound
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload: buffer
        }

        chosenHandler(data, (statusCode = 200, payload = {})=>{

            const payloadString = JSON.stringify(payload)

            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode)
            res.end(payloadString)
            console.log('Returning response:', statusCode,payloadString )
        })

    })
}

// HTTP server
const httpServer = http.createServer(unifiedServer)
httpServer.listen(config.httpPort, ()=>{ console.log(`Server listening on port ${config.httpPort}`)})

// HTTPS server
const httpsServerOption = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
}
const httpsServer = https.createServer(httpsServerOption, unifiedServer)
httpsServer.listen(config.httpsPort, ()=>{ console.log(`Server listening on port ${config.httpsPort}`)})







const handlers = {}

handlers.ping = (data, callback) => {
    callback(200)
}

handlers.notFound = (data, callback) => {
    callback(404)
}



// request router

const router = {
    'ping': handlers.ping
}



