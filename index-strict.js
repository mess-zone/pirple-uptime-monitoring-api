/**
 * Primary file for the API
 */

const server = require('./lib/server')
const workers = require('./lib/workers')
const cli = require('./lib/cli')

//global, strict mode will catch
foo = 'bar'

const app = {}

app.init = () => {
    //start server
    server.init()

    //start workers
    workers.init()

    // start CLI, make sure it starts last
    setTimeout(()=>{
        cli.init()
    }, 50)
}

app.init()

module.exports = app
