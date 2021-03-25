const PromisePool = require('es6-promise-pool'),
  logger = require('./Logger'),
  { Symbols } = require('./Logger'),
  NerdGraphClient = require('./NerdGraphClient')

const sortByIndex = (a, b) => {
  if (a.index < b.index) {
    return -1
  } else if (a.index > b.index) {
    return 1
  }
  return 0
}

const sortResultsByIndex = results => {
  results.sort(sortByIndex)
  return results
}

const exportError = (msg, index) => ({
  success: false,
  message: msg,
  index,
})

const importError = (msg, guid) => ({
  success: false,
  message: msg,
  guid
})

const getDashboardEntityByGuid = async (client, guid, index) => {
  logger.log(`${Symbols.working} Exporting dashboard info for dashboard ${guid}...`)

  const {
    data,
    errors
  } = await client
    .query({
      query: `query ($guid: EntityGuid!)
          {
            actor {
              entity(guid: $guid) {
                guid
                ... on DashboardEntity {
                  name
                  permissions
                  pages {
                    name
                    widgets {
                      visualization { id }
                      title
                      layout { row width height column }
                      rawConfiguration
                    }
                  }
                }
              }
            }
          }
        `,
      variables: {
        guid: guid,
      }
    })

  if (errors && errors.length > 0) {
    return exportError(errors[0], index)
  }

  logger.verbose(`${Symbols.done} Exported dashboard info for dashboard ${guid}.`)

  logger.debug((channel, format) => {
    channel(format(`Dashboard info for dashboard ${guid}:`))
    channel(data.actor.entity)
  })

  if (!data.actor.entity) {
    return exportError(
      `No dashboard found with the guid ${guid}`,
      index
    )
  }

  return {
    success: true,
    entity: data.actor.entity,
    index,
  }
}

const getDashboardEntityByName = async (source, client, name, index) => {
  logger.log(`${Symbols.working} Retrieving dashboard guid for account ID ${source.accountId} and dashboard ${name}...`)

  const query = `name = '${name}' AND tags.accountId = '${source.accountId}' AND type IN ('DASHBOARD')`,
    {
      data,
      errors
    } = await client
      .query({
        query: `
            query {
              actor {
                entitySearch(query: "${query}") {
                  results {
                    entities {
                      guid
                    }
                  }
                }
              }
            }
          `,
        variables: {}
      })

  if (errors && errors.length > 0) {
    return exportError(errors[0], index)
  }

  const entities = data.actor.entitySearch.results.entities

  if (entities.length === 0) {
    return exportError(
      `No dashboard found in account ID ${source.accountId} with the name ${name}`,
      index
    )
  } else if (entities.length > 1) {
    return exportError(
      `More than one dashboard found in account ID ${source.accountId} with the name ${name}`,
      index
    )
  }

  const guid = entities[0].guid

  logger.verbose(`${Symbols.done} Retrieved dashboard guid ${guid} for dashboard ${name}.`)

  return await getDashboardEntityByGuid(client, guid, index)
}

const dashboardExportPromiseGenerator = function* (source, client) {
  for (let index = 0; index < source.dashboards.length; index += 1) {
    const dashboard = source.dashboards[index]

    if (dashboard.guid) {
      yield getDashboardEntityByGuid(client, dashboard.guid, index)
    } else {
      yield getDashboardEntityByName(source, client, dashboard.name, index)
    }
  }
}

const exportDashboards = config => {
  const source = config.source,
    client = new NerdGraphClient(source.userKey || config.userKey),
    results = []

  logger.log(`${Symbols.working} Fetching dashboards from account ID ${source.accountId}...`)

  const pool = new PromisePool(
    dashboardExportPromiseGenerator(source, client),
    4
  )

  pool.addEventListener('fulfilled', event => {
    const result = event.data.result,
      {
        success,
        index,
      } = result

    if (success) {
      results.push({
        success: true,
        entity: result.entity,
        index,
      })
      return
    }

    const message = result.message,
      dashboard = source.dashboards[index]

    logger.error(`Export error: ${dashboard.name || dashboard.guid}: ${message}`)
    results.push({
      success: false,
      message,
      index,
      dashboard,
    })
  })

  return pool.start().then(() => sortResultsByIndex(results))
}

const updateNrqlAccountIds = (source, target, entity) => {
  if (!entity.pages) {
    return
  }

  entity.pages.forEach(page => {
    if (!page.widgets) {
      return
    }

    page.widgets.forEach(widget => {
      if (!widget.rawConfiguration) {
        return
      }

      if (!widget.rawConfiguration.nrqlQueries) {
        return
      }

      widget.rawConfiguration.nrqlQueries.forEach(query => {
        if (query.accountId === source.accountId) {
          query.accountId = target.accountId
        }
      })
    })
  })
}

const createDashboard = async (source, target, client, exportResult) => {
  const {
      entity,
    } = exportResult,
    sourceGuid = entity.guid,
    newEntity = Object.assign({}, entity)

  delete newEntity.guid

  logger.log(`${Symbols.working} Creating dashboard with source guid ${sourceGuid}...`)

  updateNrqlAccountIds(source, target, newEntity)

  const {
    data,
    errors
  } = await client
    .query({
      query: `mutation create($accountId: Int!, $dashboard: Input!) {
          dashboardCreate(accountId: $accountId, dashboard: $dashboard) {
            entityResult {
              guid
              name
            }
            errors {
              description
            }
          }
        }
      `,
      variables: {
        accountId: parseInt(target.accountId),
        dashboard: newEntity,
      }
    })

  if (errors && errors.length > 0) {
    return importError(errors[0], sourceGuid)
  }

  if (data.dashboardCreate.errors && data.dashboardCreate.errors.length > 0) {
    return importError(data.dashboardCreate.errors[0].description, sourceGuid)
  }

  const targetGuid = data.dashboardCreate.entityResult.guid

  logger.verbose(`${Symbols.done} Imported dashboard with new guid ${targetGuid} for source guid ${sourceGuid}.`)

  logger.debug((channel, format) => {
    channel(format(
      `Dashboard create result for dashboard with new guid ${targetGuid}:`
    ))
    channel(data.dashboardCreate)
  })

  return {
    success: true,
    guid: sourceGuid,
    entity: data.dashboardCreate.entityResult
  }
}

const dashboardImportPromiseGenerator = function* (
  source,
  target,
  client,
  exportResults
) {
  for (const result of exportResults) {
    yield createDashboard(source, target, client, result)
  }
}

const importDashboards = (config, exportResults) => {
  const source = config.source,
    target = config.target,
    client = new NerdGraphClient(target.userKey || config.userKey),
    pool = new PromisePool(
      dashboardImportPromiseGenerator(
        source,
        target,
        client,
        exportResults
      ),
      4
    ),
    results = {}

  logger.log(`${Symbols.working} Importing dashboards to account ID ${target.accountId}...`)

  pool.addEventListener('fulfilled', event => {
    const result = event.data.result,
      {
        success,
        guid
      } = result

    if (success) {
      results[guid] = {
        success: true,
        entity: result.entity
      }
      return
    }

    const message = result.message

    logger.error(`Import Error: ${guid}: ${message}`)
    results[guid] = {
      success: false,
      message
    }
  })

  return pool.start().then(() => results)
}

module.exports = {
  exportDashboards,
  importDashboards,
}
