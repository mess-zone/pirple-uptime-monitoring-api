/**
 * Helpers for various tasks
 */
const crypto = require('crypto')
const config = require('./config')
const https = require('https')
const querystring = require('querystring')
const path = require('path')
const fs = require('fs')

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

helpers.sendTwilioSms = (phone, msg, callback) => {
    if(phone && msg) {
        const payload = {
            From: config.twilio.fromPhone,
            To: '+55'+phone,
            Body: msg
        }

        const stringPayload = querystring.stringify(payload)

        const requestDetails = {
            protocol: 'https:',
            hostName: 'api.twilio.com',
            method: 'POST',
            path: '/2010-04-01/Accounts/'+config.twilio.accountSid + '/Messages.json',
            auth: config.twilio.accountSid + ':' + config.twilio.authToken,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        }

        const req = https.request(requestDetails, (res)=> {
            const status = res.statusCode

            if(status == 200 || status == 201){
                callback(false)
            } else {
                callback('status code returned was ' + status)
            }
        })

        req.on('error', (e) => {
            callback(e)
        })

        req.write(stringPayload);

        req.end()
    } else {
        callback('given parameters are missing or invalid')
    }
}



helpers.getTemplate = (templateName, callback) => {
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false

    if(templateName) {
        const templatesDir = path.join(__dirname, '/../templates/')

        fs.readFile(templatesDir + templateName + '.html', 'utf8', (err, str)=> {
            if(!err && str && str.length > 0) {
                callback(false, str)
            } else {
                callback('no template could be found')
            }
        })
    } else {
        callback('a valid template name was not specified')
    }
}

module.exports = helpers