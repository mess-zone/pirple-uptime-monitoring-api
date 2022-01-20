/**
 * Example VM running arbitrary commands
 */

const vm = require('vm')

const context = {
    'foo': 25
}

const script = new vm.Script(`
    foo = foo * 2;
    var bar = foo + 1;
    fizz = 52;
`)

script.runInNewContext(context)

console.log(context)