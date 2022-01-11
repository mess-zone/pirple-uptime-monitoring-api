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

}

handlers._users.put = (data, callback) =>{

}

handlers._users.delete = (data, callback) =>{

}


handlers.ping = (data, callback) => {
    callback(200)
}

handlers.notFound = (data, callback) => {
    callback(404)
}

module.exports = handlers