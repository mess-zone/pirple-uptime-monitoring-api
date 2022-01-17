/**
 * Storing and rotating logs
 */

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const lib = {}

lib.baseDir = path.join(__dirname, '/../.logs/')

// apend string to a file, create a file if it does not exist
lib.append = (file, str, callback) => {
    fs.open(lib.baseDir + file + '.log', 'a', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            fs.appendFile(fileDescriptor, str + '\n', (err) => {
                if(!err) {
                    fs.close(fileDescriptor, (err)=> {
                        if(!err) {
                            callback(false)
                        } else {
                            callback('error closing file log')
                        }
                    })
                } else {
                    callback('error appending to log file')
                }
            })
        } else {
            callback('could not open file for appending')
        }
    })
}

module.exports = lib