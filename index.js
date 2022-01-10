/**
 * Primary file for the API
 */

const http = require('http')
const url = require('url')

const server = http.createServer((req, res)=>{
    const parsedUrl = url.parse(req.url, true)
    const path = parsedUrl.pathname
    const trimmedPath = path.replace(/^\/+|\/+$/g, '')

    const method = req.method.toLowerCase()

    res.end('Hello World!\n')
    console.log('Request received:', trimmedPath, method)
})

server.listen(3000, ()=>{ console.log('Server listening on port 3000')})