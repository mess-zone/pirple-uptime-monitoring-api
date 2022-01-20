const helpers = require('./../lib/helpers')
const logs = require('./../lib/logs')
const exampleDebuggingProblem = require('./../lib/exampleDebuggingProblem')
const assert = require('assert')

const unit = {}

unit['helpers.getANumber should return a number'] = (done) => {
    const val = helpers.getANumber()

    assert.equal(typeof(val), 'number')
    done()
}

unit['helpers.getANumber should return 1'] = (done) => {
    const val = helpers.getANumber()

    assert.equal(val, 1)
    done()
}

unit['helpers.getANumber should return 2'] = (done) => {
    const val = helpers.getANumber()

    assert.equal(val, 2)
    done()
}

//logs.list should callback a false error and a array of log names
unit['logs.list should callback a false error and a array of log names'] = (done) => {
    logs.list(true, (err, logFileNames)=> {
        assert.equal(err, false)
        assert.ok(logFileNames instanceof Array)
        assert.ok(logFileNames.length > 1)
        done()
    })
}

// logs.truncate should not throw if logId doesnt exist 
unit['logs.truncate should not throw if logId doesnt exist. It should callback an error instead'] = (done) => {
    assert.doesNotThrow(()=> {
        logs.truncate('I do not exist', (err)=> {
            assert.ok(err)
            done()
        })
    }, TypeError)
}

// exampleDebuggingProblem should not throw
unit['exampleDebuggingProblem should not throw'] = (done) => {
    assert.doesNotThrow(()=> {
        exampleDebuggingProblem.init()
        done()
    }, TypeError)
}


module.exports = unit
