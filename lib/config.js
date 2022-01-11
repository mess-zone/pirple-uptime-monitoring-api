/**
 * create and export configurations variables
 */

const environments = {}

environments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    envName: 'staging',
    hashingSecret: 'this is a secret'
}

environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: 'production',
    hashingSecret: 'this is a production secret'
}

const currentEnvironment = process.env.NODE_ENV?.toLowerCase() || ''

const environmentToExport = environments[currentEnvironment] || environments.staging

module.exports = environmentToExport