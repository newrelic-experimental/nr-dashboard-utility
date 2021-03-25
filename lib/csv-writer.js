const fs = require('fs'),
  csv = require('csv'),
  logger = require('./Logger'),
  { Symbols } = require('./Logger')

const writeResults = (config, outFile, importResults) => {
  const { source, target } = config

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outFile, { encoding: 'utf-8' }),
      columns = [
        'Source Account ID',
        'Source Name',
        'Source GUID',
        'Source Export Success?',
        'Source Export Error',
        'Target Account ID',
        'Target Name',
        'Target GUID',
        'Target Import Success?',
        'Target Import Error',
      ],
      stringifier = csv.stringify({
        header: true,
        columns: columns,
      })
    let dbCount = 0,
      errorCount = 0

    stringifier.on('readable', () => {
      let row = stringifier.read()
      while(row){
        file.write(row)
        row = stringifier.read()
      }
    })

    stringifier.on('error', err => {
      logger.error(err)
      reject(err)
    })

    stringifier.on('finish', () => {
      file.end()
      logger.log(`${Symbols.success} Finished writing results CSV!`)
      logger.log(`${Symbols.good} ${dbCount} dashboards exported with ${Symbols.bad} ${errorCount} errors.`)
      resolve()
    })

    importResults.forEach(result => {
      stringifier.write([
        source.accountId,
        result.sourceName,
        result.sourceGuid,
        result.exportSuccess ? 'Y' : 'N',
        result.exportError ? result.exportError : '',
        target.accountId,
        result.targetName || '',
        result.targetGuid || '',
        result.importSuccess !== undefined ?
          (result.importSuccess ? 'Y' : 'N') : '',
        result.importError ? result.importError : '',
      ])
    })
  })
}

module.exports = writeResults
