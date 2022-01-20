/**
 * Primary file for the API
 */

const server = require('./lib/server')
const workers = require('./lib/workers')
const cli = require('./lib/cli')

const app = {}

app.init = (callback) => {
    //start server
    server.init()

    //start workers
    workers.init()

    // start CLI, make sure it starts last
    setTimeout(()=>{
        cli.init()
        callback()
    }, 50)
}

// self invoking only if required directly
if(require.main === module) {
    app.init(()=>{})
}

module.exports = app
