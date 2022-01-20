/**
 * Example REPL server
 */

const repl = require('repl')

repl.start({
    'prompt': '>',
    'eval': (str) => {
        console.log('Evaluation stage:', str)

        if(str.indexOf('fizz') > -1) {
            console.log('buzz')
        }
    }
})