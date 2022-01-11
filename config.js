/**
 * create and export configurations variables
 */

const environments = {}

environments.staging = {
    port: 3000,
    envName: 'staging'
}

environments.production = {
    port: 5000,
    envName: 'production'
}

const currentEnvironment = process.env.NODE_ENV?.toLowerCase() || ''

const environmentToExport = environments[currentEnvironment] || environments.staging

module.exports = environmentToExport