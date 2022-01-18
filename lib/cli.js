/**
 * CLI related tasks
 */

const readline = require('readline')
const util = require('util')
const debug = util.debuglog('cli')
const events = require('events')
class _events extends events {}
const e = new _events()

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


cli.verticalSpaces = (lines = 1) => {
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
        'list logs': 'Show a list of all log files available (compressed and uncompressed)',
        'more log info --{fileName}': 'Show details of a specified log file'
    }

    cli.horizontalLine()
    cli.centered('CLI MANUAL')
    cli.horizontalLine()
    cli.verticalSpaces(2)

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
            cli.verticalSpaces(1)
        }
    }

    cli.verticalSpaces(1)
    cli.horizontalLine()
}

cli.responders.exit = ()=> {
    process.exit(0)
}

cli.responders.stats = ()=> {
    console.log('you asked for stats')
}

cli.responders.listUsers = ()=> {
    console.log('you asked for list users')
}

cli.responders.moreUserInfo = (str)=> {
    console.log('you asked for moreUserInfo', str)
}

cli.responders.listChecks = (str)=> {
    console.log('you asked for listChecks', str)
}

cli.responders.moreCheckInfo = (str)=> {
    console.log('you asked for moreCheckInfo', str)
}

cli.responders.listLogs = ()=> {
    console.log('you asked for listLogs')
}

cli.responders.moreLogInfo = (str)=> {
    console.log('you asked for moreLogInfo', str)
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