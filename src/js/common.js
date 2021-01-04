'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

/*!
 * 浏览器统一兼容
 * 参考：
 * https://github.com/mozilla/webextension-polyfill
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities
 * https://developer.chrome.com/docs/extensions/reference/
 * https://crxdoc-zh.appspot.com/extensions/
 */
const isDebug = true
const isFirefox = navigator.userAgent.includes("Firefox")
// const isFirefox = typeof browser !== "undefined" && Object.getPrototypeOf(browser) === Object.prototype
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
    webRequest: chrome.webRequest,
    cookies: chrome.cookies,
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
    if (!isDebug) return
    !isFirefox && storageSyncGet(null).then(function (r) {
        debug(`all sync storage:`, r)
    })
    storageLocalGet(null).then(function (r) {
        debug(`all local storage:`, r)
    })
}

function storage(type, method, options) {
    return new Promise((resolve, reject) => {
        if (!isFirefox) {
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
            let api = isDebug ? browser.storage.local : type === 'sync' ? browser.storage.sync : browser.storage.local
            if (method === 'get') {
                api.get(options).then(r => resolve(r), err => reject(err))
            } else if (method === 'set') {
                api.set(options).then(r => resolve(r), err => reject(err))
            }
        }
    })
}

function cookies(method, options) {
    return new Promise((resolve, reject) => {
        if (!isFirefox) {
            let callback = function (r) {
                let err = B.error
                err ? reject(err) : resolve(r)
            }
            if (method === 'get') {
                B.cookies.get(options, callback)
            } else if (method === 'getAll') {
                B.cookies.getAll(options, callback)
            } else if (method === 'set') {
                B.cookies.set(options, callback)
            } else if (method === 'remove') {
                B.cookies.remove(options, callback)
            }
        } else {
            if (method === 'get') {
                browser.cookies.get(options).then(r => resolve(r), err => reject(err))
            } else if (method === 'getAll') {
                browser.cookies.getAll(options).then(r => resolve(r), err => reject(err))
            } else if (method === 'set') {
                browser.cookies.set(options).then(r => resolve(r), err => reject(err))
            } else if (method === 'remove') {
                browser.cookies.remove(options).then(r => resolve(r), err => reject(err))
            }
        }
    })
}

function sendMessage(message) {
    return new Promise((resolve, reject) => {
        if (!isFirefox) {
            B.sendMessage(message, r => B.error ? reject(B.error) : resolve(r))
        } else {
            browser.runtime.sendMessage(message).then(r => resolve(r), err => reject(err))
        }
    })
}

function sendTabMessage(tabId, message) {
    return new Promise((resolve, reject) => {
        if (!isFirefox) {
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
        if (!isFirefox) {
            B.tabs.query({currentWindow: true, active: true}, tab => {
                let tabId = tab[0] && tab[0].url && resolve(tab[0].id)
                resolve(tabId)
            })
        } else {
            browser.tabs.query({currentWindow: true, active: true}).then(tab => {
                let tabId = tab[0] && resolve(tab[0].id)
                resolve(tabId)
            }, err => reject(err))
        }
    })
}

function onBeforeSendHeadersAddListener(callback, filter, opt_extraInfoSpec) {
    if (!opt_extraInfoSpec) opt_extraInfoSpec = Object.values(B.webRequest.OnBeforeSendHeadersOptions)
    B.webRequest.onBeforeSendHeaders.addListener(callback, filter, opt_extraInfoSpec)
}

function onBeforeSendHeadersRemoveListener(callback) {
    B.webRequest.onBeforeSendHeaders.removeListener(callback)
}

function requestHeadersFormat(s) {
    let r = []
    let arr = s.split('\n')
    arr && arr.forEach(v => {
        v = v.trim()
        if (!v) return
        let a = v.split(': ')
        if (a.length === 2) r.push({name: a[0].trim(), value: a[1].trim()})
    })
    return r
}

function onBeforeRequestAddListener(callback, filter, extraInfoSpec) {
    if (!extraInfoSpec) extraInfoSpec = Object.values(B.webRequest.OnBeforeRequestOptions)
    B.webRequest.onBeforeRequest.addListener(callback, filter, extraInfoSpec)
}

function onBeforeRequestRemoveListener(callback) {
    B.webRequest.onBeforeRequest.removeListener(callback)
}

function onHeadersReceivedAddListener(callback, filter, extraInfoSpec) {
    if (!extraInfoSpec) extraInfoSpec = Object.values(B.webRequest.OnHeadersReceivedOptions)
    B.webRequest.onHeadersReceived.addListener(callback, filter, extraInfoSpec)
}

function onHeadersReceivedRemoveListener(callback) {
    B.webRequest.onHeadersReceived.removeListener(callback)
}

function onCompletedAddListener(callback, filter, extraInfoSpec) {
    if (!extraInfoSpec) extraInfoSpec = Object.values(B.webRequest.OnCompletedOptions)
    B.webRequest.onCompleted.addListener(callback, filter, extraInfoSpec)
}

function onCompletedRemoveListener(callback) {
    B.webRequest.onCompleted.removeListener(callback)
}

function onRemoveFrame(details) {
    let headers = Object.assign([], details.responseHeaders)
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].name.toLowerCase().includes('frame-options')) {
            headers.splice(i, 1)
            break
        }
    }
    return {responseHeaders: headers}
}

// 获得所有语音的列表 (firefox 不支持)
function getVoices() {
    return new Promise((resolve, reject) => {
        if (!B.tts || !B.tts.getVoices) return reject("I won't support it!")

        B.tts.getVoices(function (voices) {
            let list = {}
            for (let i = 0; i < voices.length; i++) {
                // debug('Voice ' + i + ':', JSON.stringify(voices[i]))
                let v = voices[i]
                if (!list[v.lang]) list[v.lang] = []
                list[v.lang].push({lang: v.lang, voiceName: v.voiceName, remote: v.remote})
            }
            resolve(list)
        })
    })
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
    if (!el.className) return
    className = className.trim()
    let newClassName = el.className.trim()
    if ((` ${newClassName} `).indexOf(` ${className} `) === -1) return
    newClassName = newClassName.replace(new RegExp('(?:^|\\s)' + className + '(?:\\s|$)', 'g'), ' ').trim()
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

function sleep(delay) {
    return new Promise(r => setTimeout(r, delay))
}

function onD(el, type, listener, options) {
    el.forEach(v => {
        v.addEventListener(type, listener, options)
    })
}

function unD(el, type, listener, options) {
    el.forEach(v => {
        v.removeEventListener(type, listener, options)
    })
}

function removeD(el) {
    el.forEach(e => e.remove())
}

function rmClassD(el, className) {
    el.forEach(v => rmClass(v, className))
}

function inArray(val, arr) {
    // return arr.indexOf(val) !== -1
    return arr.includes(val)
}

// 解决 JSON 太深问题
function getJSONValue(data, keys, value) {
    value = value || {}
    if (!data) return value // 默认值
    keys = keys.trim()
    let arr = keys.split('.')
    let val = Object.assign({}, data)
    for (let key of arr) {
        if (!val[key]) return value // 默认值
        val = val[key]
    }
    return val
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

function httpGet(url, type, headers, notStrict) {
    return new Promise((resolve, reject) => {
        let c = new XMLHttpRequest()
        c.responseType = type || 'text'
        c.timeout = 10000
        c.onload = function (e) {
            if (notStrict) {
                resolve(this.response)
            } else {
                if (this.status === 200) {
                    resolve(this.response)
                } else {
                    reject(e)
                }
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
