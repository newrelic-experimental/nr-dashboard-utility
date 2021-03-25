const Symbols = {
    hello: "\uD83D\uDC4B",
    goodbye: "\uD83C\uDF89",
    done: "\uD83D\uDCAF",
    working: "\uD83D\uDE80",
    search: "\uD83D\uDD0E",
    progress: [
      "\uD83D\uDD5B",
      "\uD83D\uDD50",
      "\uD83D\uDD51",
      "\uD83D\uDD52",
      "\uD83D\uDD53",
      "\uD83D\uDD54",
      "\uD83D\uDD55",
      "\uD83D\uDD56",
      "\uD83D\uDD57",
      "\uD83D\uDD58",
      "\uD83D\uDD59",
      "\uD83D\uDD5A",
    ],
    warning: "\u26A0\uFE0F",
    error: "\uD83D\uDE31",
    success: "\uD83D\uDC4F",
    good: "\uD83D\uDC4D",
    bad: "\uD83D\uDC4E",
  }

const Level = {
  INFO: 0,
  VERBOSE: 1,
  DEBUG: 2,
}

class Logger {
  constructor(appName = '', logLevel = Level.INFO) {
    this.appName = appName
    this.logLevel = logLevel
  }

  setAppName(appName) {
    this.appName = appName
  }

  setLogLevel(logLevel) {
    this.logLevel = logLevel
  }

  formatter() {
    return msg => {
      const now = new Date()
      return `[${now.toUTCString()}] ${this.appName} ${msg}`
    }
  }

  log(msg, type = 'log') {
    const format = this.formatter()

    if (typeof msg === 'function') {
      msg(console[type], format)
      return
    }

    console[type](format(msg))
  }

  error(msg) {
    this.log(msg, 'error')
  }

  warn(msg) {
    this.log(msg, 'warn')
  }

  verbose(msg) {
    this.logLevel >= Level.VERBOSE && this.log(msg)
  }

  debug(msg) {
    this.logLevel >= Level.DEBUG && this.log(msg)
  }
}

const logger = new Logger()

logger.Level = Level
logger.Symbols = Symbols

module.exports = logger
