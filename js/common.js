/**
 * 浏览器统一兼容
 * 参考：
 * https://github.com/mozilla/webextension-polyfill
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities
 * https://developer.chrome.com/docs/extensions/reference/
 * https://crxdoc-zh.appspot.com/extensions/
 */
const isDebug = true
const isChrome = typeof browser === "undefined" || Object.getPrototypeOf(browser) !== Object.prototype
const B = {
    id: chrome.runtime.id,
    root: chrome.runtime.getURL(''),
    onMessage: chrome.runtime.onMessage,
    sendMessage: chrome.runtime.sendMessage,
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

function sendMessage(message) {
    return new Promise((resolve, reject) => {
        if (isChrome) {
            B.sendMessage(message, r => B.error ? reject(B.error) : resolve(r))
        } else {
            browser.runtime.sendMessage(message).then((r, err) => err ? reject(err) : resolve(r))
        }
    })
}

function sendTabMessage(tabId, message) {
    return new Promise((resolve, reject) => {
        if (isChrome) {
            // B.tabs.sendMessage(tabId, message, r => B.error ? reject(B.error) : resolve(r))
            tabId && B.tabs.sendMessage(tabId, message)
        } else {
            // browser.tabs.sendMessage(tabId, message).then(r => resolve(r)).catch(err => reject(err))
            tabId && browser.tabs.sendMessage(tabId, message).catch(err => debug('send error:', err))
        }
        resolve()
    })
}

function getActiveTabId() {
    return new Promise((resolve, reject) => {
        if (isChrome) {
            B.tabs.query({currentWindow: true, active: true}, tab => {
                let tabId = tab[0] && tab[0].url && resolve(tab[0].id)
                resolve(tabId)
            })
        } else {
            browser.tabs.query({currentWindow: true, active: true}).then(tab => {
                let tabId = tab[0] && tab[0].url && resolve(tab[0].id)
                resolve(tabId)
            }).catch(err => reject(err))
        }
    })
}

// ======== background ========
function loadLocalConf() {
    let s = localStorage.getItem('localTTSConf')
    if (s) localTTSConf = JSON.parse(s)
}

function setLocalConf(k, v) {
    localTTSConf[k] = v
    localStorage.setItem('localTTSConf', JSON.stringify(localTTSConf))
}

function resetLocalConf() {
    localStorage.removeItem('localTTSConf')
    localTTSConf = {}
}

function addMenu(name, title, url) {
    // {id: "separator1", type: "separator", contexts: ['selection']}
    B.contextMenus.create({
        id: name + '_page',
        title: title + '首页',
        contexts: ["page"],
        onclick: function () {
            B.tabs.create({url: (new URL(url)).origin + '?tn=dream_translate'})
        }
    })
    B.contextMenus.create({
        id: name + '_selection',
        title: lv.title + "“%s”",
        contexts: ["selection"],
        onclick: function (info) {
            B.tabs.create({url: url.format(decodeURIComponent(info.selectionText)) + '&tn=dream_translate'})
        }
    })
}

function removeMenu(name) {
    B.contextMenus.remove(name + '_page')
    B.contextMenus.remove(name + '_selection')
}

function setBrowserAction(text) {
    B.browserAction.setBadgeText({text: text || ''})
    B.browserAction.setBadgeBackgroundColor({color: 'red'})
}

// 获得所有语音的列表
function getVoices() {
    if (!B.tts || !B.tts.getVoices) return null
    let list = {}
    B.tts.getVoices(function (voices) {
        for (let i = 0; i < voices.length; i++) {
            // debug('Voice ' + i + ':', JSON.stringify(voices[i]))
            let v = voices[i]
            if (!list[v.lang]) list[v.lang] = []
            list[v.lang].push({lang: v.lang, voiceName: v.voiceName, remote: v.remote})
        }
    })
    return list
}

function sleep(delay) {
    return new Promise(r => setTimeout(r, delay))
}

function debug(...data) {
    isDebug && console.log('[DMX DEBUG]', ...data)
}
