/**
 * Test runner
 */

_app = {}

_app.tests = {}

_app.tests.unit = require('./unit')


_app.countTests = ()=> {
    let counter = 0;
    for(let key in _app.tests) {
        if(_app.tests.hasOwnProperty(key)) {
            const subTests = _app.tests[key]
            for(let testName in subTests) {
                if(subTests.hasOwnProperty(testName)) {
                    counter++
                }
            }
        }
    }

    return counter
}

_app.produceTestReport = (limit, successes, errors) => {
    console.log('')
    console.log('------ BEGIN TEST REPORT --------')
    console.log('')
    console.log(`Total tests: ${limit}`)
    console.log(`Pass: ${successes}`)
    console.log(`Fails: ${errors.length}`)
    console.log('')
    
    if(errors.length > 0) {
        console.log('------ BEGIN ERROR DETAILS --------')
        console.log('')
        
        errors.forEach(testError => {
            console.log('\x1b[31m%s\x1b[0m', testError.name)
            console.log(testError.error)
            console.log('')
        });

        console.log('')
        console.log('------ END ERROR DETAILS --------')
        
    }
    
    
    console.log('')
    console.log('------ END TEST REPORT --------')

}

_app.runTests = () => {
    const errors = []
    let successes = 0
    let limit = _app.countTests()
    let counter = 0

    for(let key in _app.tests) {
        if(_app.tests.hasOwnProperty(key)) {
            const subTests = _app.tests[key]

            for(let testName in subTests) {
                if(subTests.hasOwnProperty(testName)) {
                    (()=> {
                        var tmpTestName = testName
                        var testValue = subTests[testName]

                        // call the test
                        try {
                            testValue(()=> {
                                //succeded
                                console.log('\x1b[32m%s\x1b[0m', tmpTestName)
                                counter++
                                successes++
                                if(counter == limit) {
                                    _app.produceTestReport(limit, successes, errors)
                                }
                            })
                        } catch(e) {
                            //failed
                            errors.push({
                                name: tmpTestName,
                                error: e
                            })
                            console.log('\x1b[31m%s\x1b[0m', tmpTestName)
                            counter++
                            if(counter == limit) {
                                _app.produceTestReport(limit, successes, errors)
                            }
                        }
                    })()
                }
            }
        }
    }
}


// run the test
_app.runTests()