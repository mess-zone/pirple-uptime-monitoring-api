/**
 * Primary file for the API
 */

const server = require('./lib/server')
const workers = require('./lib/workers')

const app = {}

app.init = () => {
    //start server
    server.init()

    //start workers
    workers.init()
}

app.init()

module.exports = app
