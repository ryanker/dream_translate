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
}

function storageLocalGet(options) {
    return apiToPromise(B.storageLocal, 'get', options)
}

function storageLocalSet(options) {
    return apiToPromise(B.storageLocal, 'set', options)
}

function storageSyncGet(options) {
    return apiToPromise(isChrome ? B.storageSync : B.storageLocal, 'get', options)
}

function storageSyncSet(options) {
    return apiToPromise(isChrome ? B.storageSync : B.storageLocal, 'set', options)
}

function apiToPromise(api, type, options) {
    return new Promise((resolve, reject) => {
        if (isChrome) {
            api[type](options, function (r) {
                B.error ? reject(B.error) : resolve(r)
            })
        } else {
            api[type](options).then(r => resolve(r)).catch(err => reject(err))
        }
    })
}

function debug(...data) {
    window.isDebug && console.log('[DMX DEBUG]', ...data)
}

function sleep(delay) {
    return new Promise(r => setTimeout(r, delay))
}

String.prototype.format = function () {
    let args = arguments
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match
    })
}
