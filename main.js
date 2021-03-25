#!/usr/bin/env node

const fs = require ('fs'),
  yargs =  require('yargs/yargs'),
  YAML = require('yaml'),
  logger = require('./lib/Logger'),
  { Symbols, Level } = require('./lib/Logger'),
  { exportDashboards, importDashboards } = require('./lib/DashboardHelper'),
  writeResults = require('./lib/csv-writer')

const validateSourceConfig = config => {
  if (!config.source) {
    throw new Error('Missing source account configuration')
  }

  if (!config.source.accountId) {
    throw new Error('Missing source account ID')
  }

  if (!config.userKey && !config.source.userKey) {
    throw new Error('Missing source account user key')
  }

  if (!config.source.dashboards) {
    throw new Error('Missing source account dashboard list')
  }
}

const validateTargetConfig = config => {
  if (!config.target) {
    throw new Error('Missing target account configuration')
  }

  if (!config.target.accountId) {
    throw new Error('Missing target account ID')
  }

  if (!config.userKey && !config.target.userKey) {
    throw new Error('Missing target account user key')
  }
}

const validateConfig = config => {
  logger.verbose('Validating source configuration...')
  validateSourceConfig(config)
  logger.verbose('Validating target configuration...')
  validateTargetConfig(config)

  logger.debug((channel, format) => {
    channel(format(`Configuration is valid:`))
    channel(config)
  })

  return config
}

const migrate = async config => {
  const exportResults = await exportDashboards(config)

  logger.debug((channel, format) => {
    channel(format('Export results:'))
    channel(exportResults)
  })

  const importResults = await importDashboards(
    config,
    exportResults.filter(result => result.success)
  )

  logger.debug((channel, format) => {
    channel(format('Import results:'))
    channel(importResults)
  })

  logger.log(`${Symbols.working} Collating results...`)

  return exportResults.map(result => {
    const exportSuccess = result.success,
      importResult = exportSuccess ? importResults[result.entity.guid] : null,
      importEntity = (
        importResult && importResult.success ? importResult.entity : null
      )

    return {
      sourceAccountId: config.source.accountId,
      sourceName: exportSuccess ? result.entity.name : result.dashboard.name,
      sourceGuid: exportSuccess ? result.entity.guid : result.dashboard.guid,
      exportSuccess: exportSuccess,
      exportError: exportSuccess ? null : result.message,
      targetAccountId: config.target.accountId,
      targetName: importEntity ? importEntity.name : null,
      targetGuid: importEntity ? importEntity.guid : null,
      importSuccess: importResult ? importResult.success : null,
      importError: (
        importResult && !importResult.success ? importResult.message : null
      ),
    }
  })
}

(async () => {
  logger.setAppName('nr-dashboard-utility')
  logger.log(`${Symbols.hello} Hi.`)

  try {
    const yarggles = yargs(process.argv.slice(2))
      .usage('Usage: $0 -c|--config config-file [-o|--output csv-file])')
      .option('config', {
        type: 'string',
        describe: 'YML configuration file',
        alias: 'c',
        nargs: 1,
      })
      .option('output', {
        type: 'string',
        describe: 'CSV report file ',
        alias: 'o',
        nargs: 1,
      })
      .option('verbose', {
        type: 'boolean',
        describe: 'Enable verbose mode (overrides config)',
        alias: 'v',
        default: undefined
      })
      .option('debug', {
        type: 'boolean',
        describe: 'Enable debug mode (overrides config)',
        alias: 'd',
        default: undefined
      })
      .demandOption('config', 'Please specify a config file'),
      argv = yarggles.argv,
      configFile = argv.config,
      outFile = argv.output,
      data = fs.readFileSync(configFile, { encoding: 'utf-8' }),
      config = YAML.parse(data),
      verbose = argv.v,
      debug = argv.d
    let level = Level.INFO

    if (verbose !== undefined) {
      level = Level.VERBOSE
    }
    if (debug !== undefined) {
      level = Level.DEBUG
    }

    logger.setLogLevel(level)

    const importResults = await migrate(validateConfig(config))

    if (outFile) {
      writeResults(config, outFile, importResults)
    }

    logger.log(`${Symbols.goodbye} Bye.`)
  } catch (err) {
    logger.error(`${Symbols.error} ${err}`)
  }
})()
