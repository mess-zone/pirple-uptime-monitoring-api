/**
 * CLI related tasks
 */

const readline = require('readline')
const util = require('util')
const debug = util.debuglog('cli')
const events = require('events')
class _events extends events {}
const e = new _events()
const os = require('os')
const v8 = require('v8')
const _data = require('./data')
const _logs = require('./logs')
const helpers = require('./helpers')
const childProcess = require('child_process')

const cli = {}

// input handlers
e.on('man', (str)=> {
    cli.responders.help()
})

e.on('help', (str)=> {
    cli.responders.help()
})

e.on('exit', (str)=> {
    cli.responders.exit()
})

e.on('stats', (str)=> {
    cli.responders.stats()
})

e.on('list users', (str)=> {
    cli.responders.listUsers()
})

e.on('more user info', (str)=> {
    cli.responders.moreUserInfo(str)
})

e.on('list checks', (str)=> {
    cli.responders.listChecks(str)
})

e.on('more check info', (str)=> {
    cli.responders.moreCheckInfo(str)
})

e.on('list logs', (str)=> {
    cli.responders.listLogs()
})

e.on('more log info', (str)=> {
    cli.responders.moreLogInfo(str)
})


cli.verticalSpace = (lines = 1) => {
    for(let i = 0; i< lines; i++) {
        console.log('')
    }
}

cli.horizontalLine = () => {
    const width = process.stdout.columns

    let line = ''
    for(let i=0; i<width; i++) {
        line+='-'
    }

    console.log(line)
}

cli.centered = (str = '') => {
    str = str.trim()
    const width = process.stdout.columns
    const leftPadding = Math.floor((width - str.length) / 2)

    let line = ''
    for(let i=0; i<leftPadding; i++) {
        line+=' '
    }
    line += str

    console.log(line)
}

// responders
cli.responders = {}

cli.responders.help = ()=> {
    const commands = {
        'exit': 'Kill the CLI and the application ',
        'man': 'Show this help page',
        'help': 'Alias of the "man" command',
        'stats': 'Get statistics on the underlying operating system and resources utilization',
        'list users': 'Show a list of all registered users',
        'more user info --{userId}': 'Show details of a specific user',
        'list checks --up --down': 'Show a list of all the active checks, inlcuding their state. The "--up" and "--down" flags are optional',
        'more check info --{checkId}': 'Show details of a specific check',
        'list logs': 'Show a list of all log files available (compressed only)',
        'more log info --{fileName}': 'Show details of a specified log file'
    }

    cli.horizontalLine()
    cli.centered('CLI MANUAL')
    cli.horizontalLine()
    cli.verticalSpace(2)

    for(let key in commands) {
        if(commands.hasOwnProperty(key)) {
            const value = commands[key]
            let line = '\x1b[33m' + key + '\x1b[0m'
            const padding = 60 - line.length

            for(let i = 0; i < padding; i++) {
                line+=' '
            }
            line+=value
            console.log(line)
            cli.verticalSpace(1)
        }
    }

    cli.verticalSpace(1)
    cli.horizontalLine()
}

cli.responders.exit = ()=> {
    process.exit(0)
}

cli.responders.stats = ()=> {
    const stats = {
        'Load Average': os.loadavg().join(' '),
        'CPU Count': os.cpus().length,
        'Free Memory': os.freemem(),
        'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
        'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
        'Allocated Heap Used (%)': Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size)*100),
        'Avaliable Heap Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit)*100),
        'Uptime': os.uptime()+ ' seconds'
    }

    cli.horizontalLine()
    cli.centered('SYSTEM STATISTICS')
    cli.horizontalLine()
    cli.verticalSpace(2)

    for(let key in stats) {
        if(stats.hasOwnProperty(key)) {
            const value = stats[key]
            let line = '\x1b[33m' + key + '\x1b[0m'
            const padding = 60 - line.length

            for(let i = 0; i < padding; i++) {
                line+=' '
            }
            line+=value
            console.log(line)
            cli.verticalSpace(1)
        }
    }

    cli.verticalSpace(1)
    cli.horizontalLine()

}

cli.responders.listUsers = ()=> {
    _data.list('users', (err, userIds) => {
        if(!err && userIds && userIds.length > 0) {
            cli.verticalSpace()
            userIds.forEach(userId => {
                _data.read('users', userId, (errr, userData) => {
                    if(!err && userData) {
                        let line = 'Name: '+ userData.firstName + ' ' + userData.lastName + ' Phone:' + userData.phone + ' Checks:'
                        let numberOfChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks.length : 0
                        
                        line += numberOfChecks

                        console.log(line)
                        cli.verticalSpace()
                    }
                })
            });
        }
    })
}

cli.responders.moreUserInfo = (str)=> {
    const arr = str.split('--')
    const userId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false

    if(userId) {
        _data.read('users', userId, (err, userData)=> {
            if(!err && userData) {
                delete userData.hashedPassword

                cli.verticalSpace()
                console.dir(userData, {'colors': true})
                cli.verticalSpace()
            }
        })
    }
}

cli.responders.listChecks = (str)=> {
    _data.list('checks', (err, checkIds) => {
        if(!err && checkIds && checkIds.length > 0) {
            cli.verticalSpace()
            checkIds.forEach(checkId => {
                _data.read('checks', checkId, (err, checkData)=> {
                    let includeCheck = false
                    let lowerString = str.toLowerCase()

                    let state = typeof(checkData.state) == 'string' ? checkData.state : 'down'

                    let stateOrUnknown = typeof(checkData.state) == 'string' ? checkData.state : 'unknown'

                    if( lowerString.indexOf('--'+state) > -1 || (lowerString.indexOf('--down') == -1 && lowerString.indexOf('--up') == -1) ) {
                        let line = 'ID: ' + checkData.id + ' ' + checkData.method.toUpperCase() + ' ' + checkData.protocol + '://' + checkData.url + ' State:' + stateOrUnknown
                        console.log(line)
                        cli.verticalSpace()
                    }
                })
            });
        }
    })
}

cli.responders.moreCheckInfo = (str)=> {
    const arr = str.split('--')
    const checkId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false

    if(checkId) {
        _data.read('checks', checkId, (err, checkData)=> {
            if(!err && checkData) {

                cli.verticalSpace()
                console.dir(checkData, {'colors': true})
                cli.verticalSpace()
            }
        })
    }
}

cli.responders.listLogs = ()=> {
    const ls = childProcess.spawn('ls', ['./.logs/'])
    ls.stdout.on('data', (dataObj)=> {
        const dataStr = dataObj.toString()
        const logFileNames = dataStr.split('\n')
        cli.verticalSpace()
        logFileNames.forEach(logFileName => {
            if(typeof(logFileName) == 'string' && logFileName.length > 0 && logFileName.indexOf('-') > -1) {
                console.log(logFileName.trim().split('.')[0])
                cli.verticalSpace()
            }
        });
    })
}

cli.responders.moreLogInfo = (str)=> {
    const arr = str.split('--')
    const logFileName = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false

    if(logFileName) {
        cli.verticalSpace()

        _logs.decompress(logFileName, (err, strData)=> {
            if(!err && strData) {
                // split into lines
                const arr = strData.split('\n')
                arr.forEach(jsonString => {
                    const logObject = helpers.parseJsonToObject(jsonString)
                    if(logObject && JSON.stringify(logObject) != {}) {
                        console.dir(logObject, {colors: true})
                        cli.verticalSpace()
                    }
                });
            }
        })
    }
}



cli.processInput = (str) => {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false

    if(str) {
        const uniqueInputs = [
            'man',
            'help',
            'exit',
            'stats',
            'list users',
            'more user info',
            'list checks',
            'more check info',
            'list logs',
            'more log info'
        ]

        let matchFound = false
        let counter = 0;
        uniqueInputs.some((input) => {
            if(str.toLowerCase().indexOf(input) > -1) {
                matchFound = true
                e.emit(input, str)
                return true
            }
        })

        if(!matchFound) {
            console.log('Sorry, try again!')
        }

    }
}

cli.init = () => {
    console.log('\x1b[34m%s\x1b[0m', `the CLI is running`)

    const _interface  = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '>'
    })

    _interface.prompt()

    // handle each line of input separately
    _interface.on('line', (str)=> {
        cli.processInput(str)

        _interface.prompt()
    })

    // if user stops the cli
    _interface.on('close', ()=> {
        process.exit(0)
    })
}

module.exports = cli