const fetch = require('node-fetch'),
  logger = require('./Logger')

class NerdGraphClient {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.headers = {
      'User-agent': 'NewRelic_NerdGraphClient/1.0.0',
      'Content-type': 'application/json',
      'Accept': 'application/json',
      'Accept-Charset': 'utf-8',
      'Cache-Control': 'no-cache',
      'API-Key': this.apiKey,
    }

    this.query = this.query.bind(this)
  }

  setOptions(options) {
    this._options = { ...this._options, ...options }
    return this
  }

  async query(gqlJSON) {
    const options = {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(gqlJSON)
    }

    logger.debug((channel, format) => {
      channel(format('Fetch options:'))
      channel(JSON.stringify(options, null, 2))
    })

    const response = await fetch('https://api.newrelic.com/graphql', options)
    const data = await response.json()

    logger.debug((channel, format) => {
      channel(format('GraphQL response:'))
      channel(format(JSON.stringify(data)))
    })

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`GraphQL API call failed with status: ${response.status}`)
    }

    let errors

    if (data.errors) {
      errors = data.errors
    }

    return { ...data, errors }
  }
}

module.exports = NerdGraphClient
