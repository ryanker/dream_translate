/**
 * 浏览器统一兼容
 * 参考：
 * https://github.com/mozilla/webextension-polyfill
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities
 */
const isChrome = typeof browser === "undefined" || Object.getPrototypeOf(browser) !== Object.prototype
const B = {
    id: chrome.runtime.id,
    onMessage: chrome.runtime.onMessage,
    sendMessage: chrome.runtime.sendMessage,
    getURL: chrome.runtime.getURL,
    error: chrome.runtime.lastError,
    storageLocal: chrome.storage.local,
    storageSync: chrome.storage.sync,
    browserAction: chrome.browserAction,
    contextMenus: chrome.contextMenus,
    tabs: chrome.tabs,
    tts: chrome.tts,
}
String.prototype.format = function () {
    let args = arguments
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match
    })
}

function storageLocalGet(options) {
    return storage('local', 'get', options)
}

function storageLocalSet(options) {
    return storage('local', 'set', options)
}

function storageSyncGet(options) {
    return storage('sync', 'get', options)
}

function storageSyncSet(options) {
    return storage('sync', 'set', options)
}

function storage(type, method, options) {
    return new Promise((resolve, reject) => {
        if (isChrome) {
            let callback = function (r) {
                let err = B.error
                err ? reject(err) : resolve(r)
            }
            let api = type === 'sync' ? B.storageSync : B.storageLocal
            if (method === 'get') {
                api.get(options, callback)
            } else if (method === 'set') {
                api.set(options, callback)
            }
        } else {
            let callback = function (r, err) {
                err ? reject(err) : resolve(r)
            }
            let api = browser.storage.local
            if (method === 'get') {
                api.get(options).then(callback)
            } else if (method === 'set') {
                api.set(options).then(callback)
            }
        }
    })
}

function debug(...data) {
    window.isDebug && console.log('[DMX DEBUG]', ...data)
}

function sleep(delay) {
    return new Promise(r => setTimeout(r, delay))
}
