import { isVideoRequest } from './video-network.js'

const MONITOR_TAB_KEY = 'moonstoVideoMonitorTabId'
const REQUESTS_KEY = 'moonstoVideoNetworkRequests'
const MAX_SAVED_REQUESTS = 300
let persistQueue = Promise.resolve()

function saveRequest(details, contentType = '') {
  if (!Number.isInteger(details.tabId) || details.tabId < 0) return
  const request = {
    tabId: details.tabId,
    url: details.url,
    type: details.type || '',
    contentType,
    timeStamp: details.timeStamp || Date.now(),
  }
  if (!isVideoRequest(request)) return

  persistQueue = persistQueue.then(async () => {
    const state = await chrome.storage.local.get([MONITOR_TAB_KEY, REQUESTS_KEY])
    if (state[MONITOR_TAB_KEY] !== request.tabId) return
    const saved = state[REQUESTS_KEY] || []
    const index = saved.findIndex(item => item.url === request.url && item.type === request.type)
    if (index >= 0) {
      if (request.contentType) saved[index].contentType = request.contentType
      saved[index].timeStamp = request.timeStamp
    } else {
      saved.push(request)
    }
    await chrome.storage.local.set({ [REQUESTS_KEY]: saved.slice(-MAX_SAVED_REQUESTS) })
  }).catch(error => console.error('[moonsto] could not store media request', error))
}

const requestFilter = {
  urls: ['<all_urls>'],
  types: ['media', 'xmlhttprequest', 'other'],
}

chrome.webRequest.onBeforeRequest.addListener(details => saveRequest(details), requestFilter)
chrome.webRequest.onHeadersReceived.addListener(details => {
  const contentType = details.responseHeaders?.find(header => header.name.toLowerCase() === 'content-type')?.value || ''
  saveRequest(details, contentType)
}, requestFilter, ['responseHeaders'])

chrome.runtime.onInstalled.addListener(() => {
  console.log('[moonsto] Extension instalada — modo captura activo')
})
