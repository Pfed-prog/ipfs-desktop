const { ipcMain } = require('electron')
const { EXPERIMENT_PUBSUB: CONFIG_KEY } = require('./common/config-keys')
const ipcMainEvents = require('./common/ipc-main-events')
const logger = require('./common/logger')
const store = require('./common/store')
const createToggler = require('./utils/create-toggler')

const pubsubFlag = '--enable-pubsub-experiment'
const isEnabled = flags => flags.some(f => f === pubsubFlag)

function enable () {
  const flags = store.get('ipfsConfig.flags', [])
  if (!isEnabled(flags)) {
    flags.push(pubsubFlag)
    applyConfig(flags)
  }
}

function disable () {
  let flags = store.get('ipfsConfig.flags', [])
  if (isEnabled(flags)) {
    flags = flags.filter(item => item !== pubsubFlag) // remove flag
    applyConfig(flags)
  }
}

function applyConfig (newFlags) {
  store.safeSet('ipfsConfig.flags', newFlags, () => {
    ipcMain.emit(ipcMainEvents.IPFS_CONFIG_CHANGED) // trigger node restart
  })
}

module.exports = async function () {
  const activate = ({ newValue, oldValue = null }) => {
    if (newValue === oldValue) { return }

    try {
      if (newValue === true) {
        enable()
      } else {
        disable()
      }

      return true
    } catch (err) {
      logger.error(`[pubsub] ${String(err)}`)

      return false
    }
  }
  activate({ newValue: store.get(CONFIG_KEY, false) })
  createToggler(CONFIG_KEY, activate)
  logger.info(`[pubsub] ${store.get(CONFIG_KEY, false) ? 'enabled' : 'disabled'}`)
}
