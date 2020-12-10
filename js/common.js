/**
 * 浏览器统一兼容
 * 参考：
 * https://github.com/mozilla/webextension-polyfill
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities
 * https://developer.chrome.com/docs/extensions/reference/
 * https://crxdoc-zh.appspot.com/extensions/
 */
const isDebug = true
const isChrome = window.navigator.userAgent.includes("Chrome")
// const isChrome = typeof browser === "undefined" || Object.getPrototypeOf(browser) !== Object.prototype
const B = {
    getBackgroundPage: chrome.extension.getBackgroundPage,
    id: chrome.runtime.id,
    root: chrome.runtime.getURL(''),
    onMessage: chrome.runtime.onMessage,
    sendMessage: chrome.runtime.sendMessage,
    error: chrome.runtime.lastError,
    storage: chrome.storage,
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

function storageShowAll() {
    isChrome && storageSyncGet(null).then(function (r) {
        debug(`all sync storage:`, r)
    })
    storageLocalGet(null).then(function (r) {
        debug(`all local storage:`, r)
    })
}

function storage(type, method, options) {
    return new Promise((resolve, reject) => {
        if (isChrome) {
            let callback = function (r) {
                let err = B.error
                err ? reject(err) : resolve(r)
            }
            let api = type === 'sync' ? B.storage.sync : B.storage.local
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
                let tabId = tab[0] && resolve(tab[0].id)
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
        title: title + "“%s”",
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
    !isChrome && B.browserAction.setBadgeTextColor({color: 'white'}) // firefox
}

// 获得所有语音的列表 (firefox 不支持)
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

function addClass(el, className) {
    className = className.trim()
    let oldClassName = el.className.trim()
    if (!oldClassName) {
        el.className = className
    } else if (` ${oldClassName} `.indexOf(` ${className} `) === -1) {
        el.className += ' ' + className
    }
}

function rmClass(el, className) {
    let newClassName = el.className.replace(new RegExp('(?:^|\\s)' + className + '(?:\\s|$)', 'g'), ' ').trim()
    if (newClassName) {
        el.className = newClassName
    } else {
        el.removeAttribute('class')
    }
}

function hasClass(el, className) {
    if (!el.className) return false
    return (` ${el.className.trim()} `).indexOf(` ${className.trim()} `) > -1
}

function inArray(val, arr) {
    // return arr.indexOf(val) !== -1
    return arr.includes(val)
}

function createTextarea() {
    let t = document.createElement("textarea")
    t.style.position = 'fixed'
    t.style.top = '-200%'
    document.body.appendChild(t)
    return t
}

function execCopy(s) {
    let t = createTextarea()
    t.value = s
    t.select()
    document.execCommand("copy")
    document.body.removeChild(t)
}

function execPaste() {
    let t = createTextarea()
    t.focus()
    document.execCommand("paste")
    let v = t.value
    document.body.removeChild(t)
    return v
}

function httpGet(url, type, headers) {
    return new Promise((resolve, reject) => {
        let c = new XMLHttpRequest()
        c.responseType = type || 'text'
        c.timeout = 10000
        c.onload = function (e) {
            if (this.status === 200) {
                resolve(this.response)
            } else {
                reject(e)
            }
        }
        c.ontimeout = function (e) {
            reject('NETWORK_TIMEOUT', e)
        }
        c.onerror = function (e) {
            reject('NETWORK_ERROR', e)
        }
        c.open("GET", url)
        headers && headers.forEach(v => {
            c.setRequestHeader(v.name, v.value)
        })
        c.send()
    })
}

function httpPost(options) {
    let o = Object.assign({
        url: '',
        responseType: 'json',
        type: 'form',
        body: null,
        timeout: 20000,
        headers: [],
    }, options)
    return new Promise((resolve, reject) => {
        let c = new XMLHttpRequest()
        c.responseType = o.responseType
        c.timeout = o.timeout
        c.onload = function (e) {
            if (this.status === 200 && this.response !== null) {
                resolve(this.response)
            } else {
                reject(e)
            }
        }
        c.ontimeout = function (e) {
            reject('NETWORK_TIMEOUT', e)
        }
        c.onerror = function (e) {
            reject('NETWORK_ERROR', e)
        }
        c.open("POST", o.url)
        if (o.type === 'form') {
            c.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
        } else if (o.type === 'json') {
            c.setRequestHeader("Content-Type", "application/json; charset=UTF-8")
        } else if (o.type === 'xml') {
            c.setRequestHeader("Content-Type", "application/ssml+xml")
        }
        o.headers.length > 0 && o.headers.forEach(v => {
            c.setRequestHeader(v.name, v.value)
        })
        c.send(o.body)
    })
}

function debug(...data) {
    isDebug && console.log('[DMX DEBUG]', ...data)
}
