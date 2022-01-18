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

//list all the logs, optionaly includes the compressed logs
lib.list = (includeCompressedLogs, callback)=> {
    fs.readdir(lib.baseDir, (err, data)=> {
        if(!err && data && data.length) {
            const trimmedFileNames = []
            data.forEach(fileName => {
                //.log files
                if(fileName.indexOf('.log') > -1) {
                    trimmedFileNames.push(fileName.replace('.log', ''))
                }
                
                //optional compressed files .gz
                if(fileName.indexOf('.gz.b64')> -1 && includeCompressedLogs) {
                    trimmedFileNames.push(fileName.replace('.gz.b64', ''))
                }
            });

            callback(false, trimmedFileNames)
        } else {
            callback(err, data)
        }
    })
}

// compress one .log file into an .gz.b64 file
lib.compress = (logId, newFileId, callback)=> {
    const sourceFile = logId+'.log'
    const destinationFile = newFileId+'.gz.b64'

    fs.read(lib.baseDir+sourceFile, 'utf8', (err, inputString) => {
        if(!err && inputString) {
            zlib.gzip(inputString, (err, buffer)=> {
                if(!err && buffer) {
                    fs.open(lib.baseDir + destinationFile, 'wx', (err, fileDescriptor)=>{
                        if(!err && fileDescriptor) {
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), (err)=> {
                                if(!err) {
                                    fs.close(fileDescriptor, (err)=> {
                                        if(!err){
                                            callback(false)
                                        } else {
                                            callback(err)
                                        }
                                    })
                                } else {
                                    callback(err)
                                }
                            })
                        } else {
                            callback(err)
                        }
                    })
                } else {
                    callback(err)
                }
            })
        } else {
            callback(err)
        }
    })
}


//decompress a .gz.b64 file into a string
lib.decompress = (fileId, callback) => {
    const fileName = fileId + '.gz.b64'

    fs.readFile(lib.baseDir + fileName, 'utf8', (err, str)=> {
        if(!err && str) {
            const inputBuffer = Buffer.from(str, 'base64')
            zlib.unzip(inputBuffer, (err, outputBuffer)=> {
                if(!err && outputBuffer) {
                    const str = outputBuffer.toString()
                    callback(false, str)
                } else {
                    callback(err)
                }
            })
        } else {
            callback(err)
        }
    })
}

//truncating a log file
lib.truncate = (logId, callback)=> {
    fs.truncate(lib.baseDir + logId + '.log', (err)=> {
        if(!err) {
            callback(false)
        } else {
            callback(err)
        }
    })
}

module.exports = lib