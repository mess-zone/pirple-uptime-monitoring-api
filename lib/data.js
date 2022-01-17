/**
 * Library used to store and editing data
 * 
 */

const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')

const lib = {}

lib.baseDir = path.join(__dirname, '/../.data/')

lib.create = (dir, file, data, callback)=> {
    // cria um arquivo para escrita
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            const stringData = JSON.stringify(data)
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if(!err) {
                    fs.close(fileDescriptor, (err) => {
                        if(!err) {
                            callback(false)
                        } else {
                            callback('error closing new file')
                        }
                    })
                } else  {
                    callback('error writing to new file')
                }
            })

        } else {
            callback('Could not create new file, it may already exist')
        }
    })
}

lib.read = (dir, file, callback)=>{
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', (err, data)=> {
        if(!err && data) {
            const parsedData = helpers.parseJsonToObject(data)
            callback(false, parsedData)
        } else {
            callback('error reading the file')
        }
    })
}

lib.update = (dir, file, data, callback)=>{
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            const stringData = JSON.stringify(data)

            fs.ftruncate(fileDescriptor, (err)=>{
                if(!err) {
                    fs.writeFile(fileDescriptor, stringData, (err)=>{
                        if(!err) {
                            fs.close(fileDescriptor, (err)=> {
                                if(!err) {
                                    callback(false)
                                } else {
                                    callback('error closing the file')
                                }
                            })
                        } else {
                            callback('error writing to existing file')
                        }
                    })
                } else {
                    callback('error truncating file')
                }
            })
        } else {
            callback('could not open the file for updating, it may not exist yet')
        }
    })
}

lib.delete = (dir, file, callback)=> {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
        if(!err) {
            callback(false)
        } else {
            callback('error deleting file')
        }
    })
}

module.exports = lib