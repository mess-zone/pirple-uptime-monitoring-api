/**
 * Primary file for the API
 */

const http = require('http')
const url = require('url')
const {StringDecoder} = require('string_decoder')

const server = http.createServer((req, res)=>{
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

        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload: buffer
        }

        chosenHandler(data, (statusCode = 200, payload = {})=>{

            const payloadString = JSON.stringify(payload)

            res.writeHead(statusCode)
            res.end(payloadString)
            console.log('Returning response:', statusCode,payloadString )
        })

    })

})

server.listen(3000, ()=>{ console.log('Server listening on port 3000')})


const handlers = {}

handlers.sample = (data, callback) => {
    callback(406, {name: 'sample handler'})
}

handlers.notFound = (data, callback) => {
    callback(404)
}



// request router

const router = {
    'sample': handlers.sample
}
