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

helpers.createRandomString = (strLength) => {
    if (strLength > 0) {
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789'

        let str = ''

        for(let i = 1; i <= strLength; i++) {
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length)) 
            
            str += randomCharacter
        }

        return str
    } else {
        return false
    }
}

module.exports = helpers