/**
 * Worker related tasks
 */

const path = require('path')
const fs = require('fs')
const _data = require('./data')
const https = require('https')
const http = require('http')
const helpers = require('./helpers')
const url = require('url')
const _logs = require('./logs')

const workers = {}

// executa checagem a cada minuto
workers.loop = () => {
    setInterval(()=> {
        workers.gatherAllChecks()
    }, 1000 * 60)
}

// log roation and compression once por day
workers.logRotationLoop = () => {
    setInterval(()=> {
        workers.rotateLogs()
    }, 1000 * 60 * 60 * 24)
}


workers.log = (originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck) => {
    const logData = {
        check: originalCheckData,
        outcome: checkOutcome,
        state,
        alert: alertWarranted,
        time: timeOfCheck
    }

    const logString = JSON.stringify(logData)

    const logFileName = originalCheckData.id

    //append log string to the file
    _logs.append(logFileName, logString, (err)=>{
        if(!err) {
            console.log('loggin in file succeded')
        } else {
            console.log('loggin in file failed')
        }
    })
}

workers.gatherAllChecks = () => {
    //get all the checks on the sistem
    _data.list('checks', (err, checks) => {
        if(!err && checks && checks.length > 0) {
            checks.forEach(check => {
                _data.read('checks', check, (err, originalCheckData) => {
                    if(!err && originalCheckData) {
                        //pass check data to check validator
                        workers.validateCheckData(originalCheckData)
                    } else {
                        console.log('error reading one of the checks data')
                    }
                })
            });
        } else {
            console.log('error: could not found checks to process')
        }
    })
}


workers.validateCheckData = (originalCheckData)=> {
    originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData != null ? originalCheckData : {}

    originalCheckData.id = typeof(originalCheckData.id) == 'string' ? originalCheckData.id : false
    originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' ? originalCheckData.userPhone : false
    originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1? originalCheckData.protocol : false
    originalCheckData.url = typeof(originalCheckData.url) == 'string' ? originalCheckData.url : false
    originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false
    originalCheckData.successCodes = originalCheckData?.successCodes?.length > 0 ? originalCheckData?.successCodes : []
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5  ? originalCheckData.timeoutSeconds : false
    
    // set the keys tha may not been set if the worker never seen this check before
    originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down'
    originalCheckData.lastChecked =  typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0  ? originalCheckData.lastChecked : false

    // console.log(originalCheckData)
    //next step
    if(originalCheckData.id &&
        originalCheckData.userPhone &&
        originalCheckData.protocol &&
        originalCheckData.url &&
        originalCheckData.method &&
        originalCheckData.successCodes &&
        originalCheckData.timeoutSeconds) {
        workers.performCheck(originalCheckData)
    } else {
        console.log('one of the checks are not properly formated. Skipping it')
    }
}

// http request to the url
workers.performCheck = (originalCheckData) => {
    const checkOutcome = {
        error: false,
        responseCode: false
    }

    let outcomeSent = false

    const parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true)
    const hostname = parsedUrl.hostname
    const path = parsedUrl.path

    const requestDetails = {
        protocol: originalCheckData.protocol + ':',
        hostname,
        method: originalCheckData.method.toUpperCase(),
        path,
        timeout: originalCheckData.timeoutSeconds * 1000
    }

    const _moduleToUse = originalCheckData.protocol == 'http' ? http : https
    const req = _moduleToUse.request(requestDetails, (res)=> {
        const status = res.statusCode

        checkOutcome.responseCode = status
        // console.log(checkOutcome)
        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome)
            outcomeSent = true
        }
    })

    req.on('err', (e)=> {
        //update check outcome
        checkOutcome.error = {error: true, value: e, }

        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome)
            outcomeSent = true
        }
    })
    
    //timeout
    req.on('timeout', (e)=> {
        //update check outcome
        checkOutcome.error = {error: true, value: 'timeout', }

        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome)
            outcomeSent = true
        }
    })

    req.end()
}

// update check data e update user if needed
workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
    const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down'
    const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false

    const timeOfCheck = Date.now()
    //update check data
    const newCheckData = originalCheckData
    newCheckData.state = state
    newCheckData.lastChecked = timeOfCheck

    // log
    workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck)

    _data.update('checks', newCheckData.id, newCheckData, (err)=> {
        if(!err) {
            if(alertWarranted) {
                workers.alertUserToStatusChange(newCheckData)
            } else {
                console.log('check outcome has not changed, no alert needed')
            }
        }else {
            console.log('error trying to save updates to one of the checks')
        }
    })
}

workers.alertUserToStatusChange = (checkData) => {
    const msg = 'Alert: your check for '+ checkData.method.toUpperCase() + ' ' + checkData.protocol+ '://' + checkData.url + ' is currently ' + checkData.state

    helpers.sendTwilioSms(checkData.userPhone, msg, (err)=> {
        if(!err) {
            console.log('user was alerted: ', msg)
        } else {
            console.log('could not send sms: ', msg)
        }
    })
}

// compress the log files
workers.rotateLogs = () => {
    //list all non compressed log files in .logs folder
    _logs.list(false, (err, logs)=> {
        if(!err && logs && logs.length) {
            logs.forEach(logName => {
                //compress to a diferent file
                const logId = logName.replace('.log', '')
                const newFileId = logId+'-'+Date.now()
                _logs.compress(logId, newFileId, (err)=> {
                    if(!err) {
                        //truncating the log (empty original log file)
                        _logs.truncate(logId, (err)=> {
                            if(!err) {
                                console.log('success truncating log file')
                            } else {
                                console.log('error truncating log file')
                            }
                        })
                    } else {
                        console.log('error compressing one of the log files ', err)
                    }
                })
            });
        } else {
            console.log('error could not find any logs to rotate')
        }
    })
}

workers.init = () => {
    console.log('\x1b[33m%s\x1b[0m', 'Background workers are running')

    // execute all the checks
    workers.gatherAllChecks()

    // call loop
    workers.loop()

    // compress all the logs
    workers.rotateLogs()

    // call the compression loop s ologs will be compressed later on
    workers.logRotationLoop()
}

module.exports = workers
