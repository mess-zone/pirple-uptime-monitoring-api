/**
 * Helpers for various tasks
 */
const crypto = require('crypto')
const config = require('./config')

const helpers = {}

helpers.hash = (str) => {
    if(str) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex')
        return hash
    } else {
        return false
    }
}

helpers.parseJsonToObject = (str) => {
    try {
        const object = JSON.parse(str)
        return object
    } catch(err) {
        return {}
    }
}

module.exports = helpers