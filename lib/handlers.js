/**
 * Request handlers
 */
const _data = require('./data')
const helpers = require('./helpers')

const handlers = {}

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
                _data.read('users', phone, (err, user)=> {
                    if(!err && user) {
                        _data.delete('users', phone, (err)=> {
                            if(!err) {
                                callback(200)
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

//helpers

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

handlers.ping = (data, callback) => {
    callback(200)
}

handlers.notFound = (data, callback) => {
    callback(404)
}



module.exports = handlers
