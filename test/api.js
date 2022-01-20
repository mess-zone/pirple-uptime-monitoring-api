/**
 * API tests
 */

const app = require('./../index')
const assert = require('assert')
const http = require('http')
const config = require('./../lib/config')

const api = {}

const helpers = {}

helpers.makeGetRequest = (path, callback) => {
    const requestDetails = {
        protocol: 'http:',
        hostname: 'localhost',
        port: config.httpPort,
        method: 'GET',
        path,
        headers: {
            'Content-Type': 'application/json'
        }
    }

    const req = http.request(requestDetails, (res)=> {
        callback(res)
    })

    req.end()
}

api['app.init should start without throwing'] = (done) => {
    assert.doesNotThrow(()=> {
        app.init((err)=> {
            done()
        })
    }, TypeError)
}

api['/ping should respond to GET with 200'] = (done) => {
    helpers.makeGetRequest('/ping', (res)=> {
        assert.equal(res.statusCode, 200)
        done()
    })
}

api['/api/users should respond to GET with 400'] = (done) => {
    helpers.makeGetRequest('/api/users', (res)=> {
        assert.equal(res.statusCode, 400)
        done()
    })
}

api['A random path should respond to GET with 404'] = (done) => {
    helpers.makeGetRequest('/invalidPath', (res)=> {
        assert.equal(res.statusCode, 404)
        done()
    })
}

module.exports = api