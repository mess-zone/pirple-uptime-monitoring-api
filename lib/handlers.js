/**
 * Request handlers
 */
const config = require('./config')
const _data = require('./data')
const helpers = require('./helpers')

const handlers = {}


/**
 * HTML handlers
 */

handlers.index = (data, callback) => {
    if(data.method == 'get') {

        // prepare data for interpolation
        const templateData = {
            'head.title': 'This is the title',
            'head.description': 'This is the meta description',
            'body.title': 'Hello World!',
            'body.class': 'index',
        }

        helpers.getTemplate('index', templateData, (err, str)=> {
            if(!err && str) {
                // add universal template header and footer
                helpers.addUniversalTemplates(str, templateData, (err, newStr)=> {
                    if(!err && newStr) {
                        callback(200, newStr, 'html')
                    } else {
                        callback(500, undefined, 'html')
                    }
                })
            } else {
                callback(500, undefined, 'html')
            }
        })
    } else {
        callback(404, undefined, 'html')
    }
}

handlers.favicon = (data, callback) => {
    if(data.method == 'get') {
        helpers.getStaticAsset('favicon.ico', (err, data)=> {
            if(!err && data) {
                callback(200, data, 'favicon')
            } else {
                callback(500)
            }
        })
    } else {
        callback(405)
    }
}

handlers.public = (data, callback) => {
    if(data.method == 'get') {
        const trimmedAssetName = data.trimmedPath.replace('public/', '').trim()
        if(trimmedAssetName.length > 0) {
            helpers.getStaticAsset(trimmedAssetName, (err, data)=> {
                if(!err && data) {
                    let contentType = 'plain'

                    if(trimmedAssetName.indexOf('.css') > -1) {
                        contentType = 'css'
                    }
                    if(trimmedAssetName.indexOf('.png') > -1) {
                        contentType = 'png'
                    }
                    if(trimmedAssetName.indexOf('.jpg') > -1) {
                        contentType = 'jpg'
                    }
                    if(trimmedAssetName.indexOf('.ico') > -1) {
                        contentType = 'favicon'
                    }

                    callback(200, data, contentType)
                } else {
                    callback(404)
                }
            })
        } else {
            callback(404)
        }
    } else {
        callback(405)
    }
}



/**
 * Json API handlers
 */



handlers.users = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback)
    } else {
        callback(405)
    }
}

handlers._users = {}

handlers._users.post = (data, callback) =>{
    const firstName = data.payload?.firstName?.trim() || false
    const lastName = data.payload?.lastName?.trim() || false
    const phone = data.payload?.phone?.trim() || false
    const password = data.payload?.password?.trim() || false
    const tosAgreement = data.payload?.tosAgreement || false

    if(firstName && lastName && phone && password && tosAgreement) {
        _data.read('users', phone, (err, data)=> {
            if(err) {  
                const hashedPassword = helpers.hash(password)

                if(hashedPassword) {
                    const userObject = {
                        firstName,
                        lastName,
                        phone,
                        hashedPassword,
                        tosAgreement
                    }
    
                    _data.create('users', userObject.phone, userObject, (err) => {
                        if(!err) {
                            callback(200)
                        } else {
                            console.log(err)
                            callback(500, {error: 'Could not create a new user'})
                        }
                    })

                } else {
                    callback(500, {error: 'Could not hash the user\'s password'})
                }

            } else {
                callback(400, {error: 'A user with that phone already exists'})
            }
        })

    } else {
        callback(400, {error: 'missing required fields'})
    }
}

handlers._users.get = (data, callback) =>{
    const phone = data?.queryStringObject?.phone?.trim()
    
    if(phone) {
        //verify if user token is valid (get token from the header request)
        const token = data.headers?.token || false

        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if(tokenIsValid) {
                _data.read('users', phone, (err, user)=> {
                    if(!err && user) {
                        delete user.hashedPassword
                        callback(200, user)
                    } else {
                        callback(404)
                    }
                })
            } else {
                callback(403, {error: 'Missing required token in header, or token is invalid'})
            }
        })


    } else {
        callback(400, { error: 'Missing required field'} )
    }
}

handlers._users.put = (data, callback) =>{
    const phone = data.payload?.phone?.trim() || false

    const firstName = data.payload?.firstName?.trim() || false
    const lastName = data.payload?.lastName?.trim() || false
    const password = data.payload?.password?.trim() || false

    if(phone) {
        if(firstName || lastName || password) {

            //verify if user token is valid (get token from the header request)
            const token = data.headers?.token || false

            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if(tokenIsValid) {
                    _data.read('users', phone, (err, userData) => {
                        if(!err && userData) {
                            if(firstName) {
                                userData.firstName = firstName
                            }
                            if(lastName) {
                                userData.lastName = lastName
                            }
                            if(password) {
                                userData.hashedPassword = helpers.hash(password)
                            }
        
                            _data.update('users', phone, userData, (err)=> {
                                if(!err) {
                                    callback(200)
                                } else {
                                    console.log(err)
                                    callback(500, {error: 'Could not update the user'})
                                }
                            })
                        } else {
                            callback(400, { error: 'The specified user does not exist'})
                        }
                    })
                        
                } else {
                    callback(403, {error: 'Missing required token in header, or token is invalid'})
                }
            })

        } else {
            callback(400, {error: 'Missing fields to update'})
        }

    } else {
        callback(400, {error: 'Missing required field'})
    }



}

handlers._users.delete = (data, callback) =>{
    const phone = data?.queryStringObject?.phone?.trim()
    
    if(phone) {

        //verify if user token is valid (get token from the header request)
        const token = data.headers?.token || false

        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if(tokenIsValid) {
                _data.read('users', phone, (err, userData)=> {
                    if(!err && userData) {
                        _data.delete('users', phone, (err)=> {
                            if(!err) {
                                const userChecks = userData?.checks?.length > 0 ? userData?.checks : []
                                const checksToDelete = userChecks.length
                                if(checksToDelete > 0) {
                                    let checksDeleted = 0;
                                    let deletionErros = false

                                    userChecks.forEach(checkId => {
                                        
                                        _data.delete('checks', checkId, (err)=> {
                                            if(err) {
                                                deletionErros = true
                                            } 
                                            checksDeleted++
                                            if(checksDeleted == checksToDelete) {
                                                if(!deletionErros) {
                                                    callback(200)
                                                } else {
                                                    callback(500, {error: "erros encountered while deleting checks"})
                                                }
                                            }
                                        })
                                    });
                                } else {
                                    callback(200)
                                }
                            } else {
                                callback(500, {error: 'could not delete the specified user'})
                            }
                        })
                    } else {
                        callback(400, {error: 'could not find especified user'})
                    }
                })
            } else {
                callback(403, {error: 'Missing required token in header, or token is invalid'})
            }
        })

    } else {
        callback(400, { error: 'Missing required field'} )
    }
}


handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback)
    } else {
        callback(405)
    }
}

handlers._tokens = {}

handlers._tokens.post = (data, callback) => {
    const phone = data.payload?.phone?.trim() || false
    const password = data.payload?.password?.trim() || false

    if(phone && password) {
        _data.read('users', phone, (err, userData)=> {
            if(!err && userData) {
                const hashedPassword = helpers.hash(password)

                if(hashedPassword == userData.hashedPassword) {
                    const tokenId = helpers.createRandomString(20)

                    const expires = Date.now() + 1000 * 60 * 60

                    const tokenObject = {
                        phone: userData.phone,
                        id: tokenId,
                        expires
                    }

                    _data.create('tokens', tokenId, tokenObject, (err)=> {
                        if(!err) {
                            callback(200, tokenObject)
                        } else {
                            callback(500, {error: 'could not create the new token'})
                        }
                    })
                } else {
                    callback(400, {error: 'Passoword does not matched user\'s password'})
                }
            } else {
                callback(400, {err: 'could not find the specified user'})
            }
        })

    } else {
        callback(400, {error: 'Missing required fields'})
    }
}

handlers._tokens.get = (data, callback) => {
    const id = data?.queryStringObject?.id?.trim()
    
    if(id) {
        _data.read('tokens', id, (err, token)=> {
            if(!err && token) {
                callback(200, token)
            } else {
                callback(404)
            }
        })
    } else {
        callback(400, { error: 'Missing required field'} )
    }
}

handlers._tokens.put = (data, callback) => {
    const id = data?.payload?.id?.trim()
    const extend = !!data?.payload?.extend

    if(id && extend) {
        _data.read('tokens', id, (err, token) => {
            if(!err && token) {
                if(token.expires > Date.now()) {
                    token.expires = Date.now() + 1000 * 60 * 60

                    _data.update('tokens', id, token, (err) => {
                        if(!err) {
                            callback(200)
                        } else {
                            callback(400, {error: 'Could not update the token expiration'})
                        }
                    })
                } else {
                    callback(400, {error: 'The token has already expired and can not be extended'})
                }
            } else {
                callback(400, {error: 'Specified token does not exist'})
            }
        })
    } else {
        callback(400, {error: 'Missing required filds or filds are invalid'})
    }
}

handlers._tokens.delete = (data, callback) => {
    const id = data?.queryStringObject?.id?.trim()
    
    if(id) {
        _data.read('tokens', id, (err, token)=> {
            if(!err && token) {
                _data.delete('tokens', id, (err)=> {
                    if(!err) {
                        callback(200)
                    } else {
                        callback(500, {error: 'could not delete the token'})
                    }
                })
            } else {
                callback(400, {error: 'could not find especified token'})
            }
        })
    } else {
        callback(400, { error: 'Missing required field'} )
    }
}

//verify if a given token id is valid for a given user
handlers._tokens.verifyToken = (id, phone, callback)=> {
    _data.read('tokens', id, (err, tokenData) => {
        if(!err && tokenData) {
            if(tokenData.phone === phone && tokenData.expires > Date.now()) {
                callback(true)
            } else {
                callback(false)
            }
        } else {
            callback(false)
        }
    })
}




handlers.checks = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback)
    } else {
        callback(405)
    }
}

handlers._checks = {}

handlers._checks.post = (data, callback) => {
    const protocol = ['http', 'https'].indexOf(data.payload?.protocol) > -1 ? data.payload?.protocol : false
    const url = data.payload?.url?.trim() || false
    const method = ['post', 'get', 'put', 'delete'].indexOf(data.payload?.method) > -1 ? data.payload?.method : false
    const successCodes = data.payload?.successCodes?.length > 0 ? data.payload?.successCodes : false
    const timeoutSeconds = data.payload?.timeoutSeconds > 1 && data.payload?.timeoutSeconds <= 5 ? data.payload?.timeoutSeconds : false

    if(protocol && url && method && successCodes && timeoutSeconds) {
        const token  = data.headers?.token || false

        _data.read('tokens', token, (err, tokenData) => {
            if(!err && tokenData) {
                const userPhone = tokenData.phone

                _data.read('users', userPhone, (err, userData)=> {
                    if(!err && userData) {
                        const userChecks = userData?.checks?.length > 0 ? userData?.checks : []

                        //verifica se o usuario tem até 5 checks cadastrados
                        if(userChecks.length < config.maxChecks) {
                            const checkId = helpers.createRandomString(20)
                            const checkObject = {
                                id: checkId,
                                userPhone,
                                protocol,
                                url,
                                method,
                                successCodes,
                                timeoutSeconds
                            }

                            _data.create('checks', checkId, checkObject, (err) => {
                                if(!err) {
                                    //add the check id to the users object
                                    userData.checks = userChecks
                                    userData.checks.push(checkId)

                                    _data.update('users', userPhone, userData, (err)=> {
                                        if(!err) {
                                            callback(200, checkObject)
                                        } else {
                                            callback(500, {error: 'could not update the user with the new check'})
                                        }
                                    })
                                } else {
                                    callback(500, {error: 'Could not create new check'})
                                }
                            })

                        } else {
                            callback(400, {error: `The user already has the maximum number of checks (${config.maxChecks})`})
                        }
                        
                    } else {
                        callback(403)
                    }
                })

            } else {
                callback(403)
            }
        })

    } else {
        callback(400, {error: 'Missing required inputs, or invalid inputs'})
    }
}

handlers._checks.get = (data, callback) => {
    const id = data?.queryStringObject?.id?.trim()
    
    if(id) {
        _data.read('checks', id, (err, checkData)=> {
            if(!err && checkData) {

                //verify if user token is valid (get token from the header request)
                const token = data.headers?.token || false

                handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                    if(tokenIsValid) {
                        callback(200, checkData)
                    } else {
                        callback(403, {error: 'Missing required token in header, or token is invalid'})
                    }
                })
            } else {
                callback(404)
            }
        })
    } else {
        callback(400, { error: 'Missing required field'} )
    }
}


handlers._checks.put = (data, callback) => {
    const id = data?.payload?.id?.trim()
    const protocol = ['http', 'https'].indexOf(data.payload?.protocol) > -1 ? data.payload?.protocol : false
    const url = data.payload?.url?.trim() || false
    const method = ['post', 'get', 'put', 'delete'].indexOf(data.payload?.method) > -1 ? data.payload?.method : false
    const successCodes = data.payload?.successCodes?.length > 0 ? data.payload?.successCodes : false
    const timeoutSeconds = data.payload?.timeoutSeconds > 1 && data.payload?.timeoutSeconds <= 5 ? data.payload?.timeoutSeconds : false


    if(id) {

        if(protocol || url || method || successCodes || timeoutSeconds) {

            _data.read('checks', id, (err, checkData) => {
                if(!err && checkData) {
                     
                    //verify if user token is valid (get token from the header request)
                    const token = data.headers?.token || false

                    handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                        if(tokenIsValid) {
                            if(protocol) {
                                checkData.protocol = protocol
                            }
                            if(url) {
                                checkData.url = url
                            }
                            if(method) {
                                checkData.method = method
                            }
                            if(successCodes) {
                                checkData.successCodes = successCodes
                            }
                            if(timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds
                            }

                            _data.update('checks', id, checkData, (err) => {
                                if(!err) {
                                    callback(200)
                                } else {
                                    callback(500, {error:"Could not update the check"})
                                }
                            })
                        } else {
                            callback(403, {error: 'Missing required token in header, or token is invalid'})
                        }
                    })

                } else {
                    callback(400, {error: 'Specified check id does not exist'})
                }
            })
        } else {
            callback(400, {error: 'Missing required fields or filds are invalid'})
        }
    } else {
        callback(400, {error: 'Missing required fields or filds are invalid'})
    }
}

handlers.ping = (data, callback) => {
    callback(200)
}

handlers.notFound = (data, callback) => {
    callback(404)
}



module.exports = handlers
