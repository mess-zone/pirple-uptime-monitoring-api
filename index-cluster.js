/**
 * Primary file for the API
 */

const server = require('./lib/server')
const workers = require('./lib/workers')
const cli = require('./lib/cli')
const cluster = require('cluster')
const os = require('os')

const app = {}

app.init = (callback) => {

    // start background workers and CLI in master thread
    if(cluster.isMaster) {
        //start workers
        workers.init()
    
        // start CLI, make sure it starts last
        setTimeout(()=>{
            cli.init()
            callback()
        }, 50)

        // fork the process
        console.log('os.cpus()', os.cpus())
        for(let i = 0; i < os.cpus().length; i++) {
            cluster.fork()
        }

    } else {
        //start server in fork theads
        server.init()
    }


}

// self invoking only if required directly
if(require.main === module) {
    app.init(()=>{})
}

module.exports = app
