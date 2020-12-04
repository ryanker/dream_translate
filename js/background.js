'use strict'

let isDebug = true
let aud = new Audio()
var conf, setting, sdk = {}, voiceList = {}, localTTSConf = {}
document.addEventListener('DOMContentLoaded', function () {
    loadLocalConf()
    fetch('../conf/conf.json').then(r => r.json()).then(r => {
        conf = r
        loadSetting(function (result) {
            setting = Object.assign({}, conf.setting, result.setting)
            if (setting.scribble === 'off') setBrowserAction('OFF')
            saveSetting(setting)
            loadJs(uniqueArray(Object.keys(conf.translateList).concat(Object.keys(conf.translateTTSList))), 'translate')
            loadJs(Object.keys(conf.dictionaryList), 'dictionary')
            loadJs(Object.keys(conf.searchList), 'search')
        })

        // delete conf.setting
        chrome.storage.local.set({'conf': conf}, function () {
            debug('conf:', conf)
        })
    })

    fetch('../css/dmx_dialog.css').then(r => r.text()).then(s => {
        s = s.replace(/\/\*.*?\*\//g, '')
        s = s.replace(/\s+/g, ' ')
        s = s.replace(/\s*([:;{}!,])\s*/g, '$1')
        s = s.replace(/;}/g, '}')
        chrome.storage.local.set({'dialogCSS': s}, function () {
            // debug('dialogCSS:', s)
        })
    })

    fetch('../conf/language.json').then(r => r.text()).then(r => {
        chrome.storage.local.set({'languageList': r}, function () {
            // debug('languageList:', r)
        })
    })
})

// 添加上下文菜单
chrome.contextMenus.create({
    "title": "梦想翻译“%s”",
    "contexts": ["selection"],
    "onclick": function (info, tab) {
        tab && sendMessage(tab.id, {action: 'contextMenus', text: info.selectionText})
    }
})

// 获得所有语音的列表
chrome.tts.getVoices(function (voices) {
    for (let i = 0; i < voices.length; i++) {
        // debug('Voice ' + i + ':', JSON.stringify(voices[i]))
        let v = voices[i]
        if (!voiceList[v.lang]) voiceList[v.lang] = []
        voiceList[v.lang].push({lang: v.lang, voiceName: v.voiceName, remote: v.remote})
    }
})

chrome.runtime.onMessage.addListener(function (m, sender, sendResponse) {
    // debug('sender', sender)
    debug(sender.tab ? `from: ${sender.tab.url}` : `from extensions`)
    debug('request', m)
    sendResponse('received')
    if (!sender.tab) return
    let tabId = sender.tab.id

    if (m.action === 'translate') {
        setting.translateList.forEach(name => {
            sdkInit(`${name}Translate`, sd => {
                if (!sd) return

                // 翻译
                sd.query(m.text, m.srcLan, m.tarLan).then(r => {
                    debug(`${name}:`, r)
                    sendMessage(tabId, {action: m.action, name: name, result: r})
                }).catch(e => {
                    sendMessage(tabId, {action: m.action, name: name, text: m.text, error: e})
                })

                // 链接
                let url = sd.link(m.text, m.srcLan, m.tarLan)
                sendMessage(tabId, {action: 'link', type: m.action, name: name, link: url})
            })
        })

        // 自动播放读音
        setTimeout(() => {
            autoSoundPlay(tabId, m.text, m.srcLan, conf.translateTTSList, setting.translateTTSList)
        }, 300)
    } else if (m.action === 'translateTTS') {
        let list = conf.translateList
        let tList = conf.translateTTSList
        let message = {action: m.action, name: m.name, type: m.type, status: 'end'}
        soundPlay(m.name, m.text, m.lang).then(() => {
            sendMessage(tabId, message)
        }).catch(err => {
            debug(`${m.name} sound error:`, err)
            let errMsg = `${tList[m.name] ? tList[m.name] : list[m.name] + '朗读'}出错`
            sendMessage(tabId, Object.assign({}, message, {error: errMsg}))
        })
    } else if (m.action === 'dictionary') {
        setting.dictionaryList.forEach(name => {
            sdkInit(`${name}Dictionary`, sd => {
                if (!sd) return

                // 查词
                sd.query(m.text).then(r => {
                    debug(`${name}:`, r)
                    sendMessage(tabId, {action: m.action, name: name, result: r})
                }).catch(e => {
                    sendMessage(tabId, {action: m.action, name: name, text: m.text, error: e})
                })

                // 链接
                sendMessage(tabId, {action: 'link', type: m.action, name: name, link: sd.link(m.text)})
            })
        })
    } else if (m.action === 'dictionarySound') {
        audioPlay(m.url).then(() => {
            sendMessage(tabId, {action: m.action, name: m.name, type: m.type, status: 'end'})
        }).catch(err => {
            debug(`${m.name} sound error:`, err)
            let title = conf.dictionaryList[m.name] || ''
            sendMessage(tabId, {action: m.action, name: m.name, type: m.type, error: `${title}发音出错`})
        })
    } else if (m.action === 'search') {
        setting.searchList.forEach(name => {
            sdkInit(`${name}Search`, sd => {
                if (!sd) return

                // 查词
                sd.query(m.text).then(r => {
                    debug(`${name}:`, r)
                    sendMessage(tabId, {action: m.action, name: name, result: r})
                }).catch(e => {
                    sendMessage(tabId, {action: m.action, name: name, text: m.text, error: e})
                })

                // 链接
                sendMessage(tabId, {action: 'link', type: m.action, name: name, link: sd.link(m.text)})
            })
        })
    }
})

chrome.tabs.onSelectionChanged.addListener(function (tabId) {
    sendMessage(tabId, {action: 'loadSetting'})
})

async function autoSoundPlay(tabId, text, lang, list, arr) {
    if (lang === 'auto') {
        lang = 'en' // 默认值
        await httpPost({
            url: `https://fanyi.baidu.com/langdetect`,
            body: `query=${encodeURIComponent(text)}`
        }).then(r => {
            if (r && r.lan) lang = r.lan
        }).catch(err => {
            debug(err)
        })
    }
    for (let k = 0; k < arr.length; k++) {
        let name = arr[k]
        let message = {action: 'translateTTS', name: name, type: 'source', status: 'end'}
        sendMessage(tabId, Object.assign({}, message, {status: 'start'}))
        await soundPlay(name, text, lang).then(() => {
            sendMessage(tabId, message)
        }).catch(err => {
            debug(`${name} sound error:`, err)
            sendMessage(tabId, Object.assign({}, message, {error: `${list[name]}出错`}))
        })
    }
}

function soundPlay(name, text, lang) {
    return new Promise((resolve, reject) => {
        sdkInit(`${name}Translate`, sd => {
            if (!sd) return reject('sdkInit error')
            sd.tts(text, lang).then(val => {
                if (name === 'local') return resolve()
                if (Array.isArray(val)) {
                    (async function () {
                        let ok = false
                        let err = new Error()
                        for (let i = 0; i < val.length; i++) {
                            await audioPlay(val[i]).then(() => {
                                if (!ok) ok = true // 为更好的兼容，只要有一次播放成功就算播放成功
                            }).catch(e => {
                                err = e
                            })
                        }
                        ok ? resolve() : reject(err)
                    })()
                } else {
                    audioPlay(val).then(() => {
                        resolve()
                    }).catch(err => {
                        reject(err)
                    })
                }
            }).catch(err => {
                reject(err)
            })
        })
    })
}

async function audioPlay(url) {
    return new Promise((resolve, reject) => {
        let blobUrl = null
        if (typeof url === 'string') {
            aud.src = url
        } else if (typeof url === 'object') {
            blobUrl = URL.createObjectURL(url)
            aud.src = blobUrl
        } else {
            return reject('Audio url error:', url)
        }
        aud.onended = function () {
            if (blobUrl) URL.revokeObjectURL(blobUrl) // 释放内存
            resolve()
        }
        aud.onerror = function (err) {
            reject(err)
        }
        aud.play().catch(e => {
            reject(e)
        })
    })
}

function sendMessage(tabId, message) {
    chrome.tabs.sendMessage(tabId, message)
}

function setBrowserAction(text) {
    chrome.browserAction.setBadgeText({text: text || ''})
    chrome.browserAction.setBadgeBackgroundColor({color: 'red'})
}

function sdkInit(sdkName, callback) {
    if (sdk[sdkName]) {
        callback && callback(sdk[sdkName])
        return
    }
    if (typeof window[sdkName] !== 'function') {
        debug(sdkName + ' not exist!')
        callback && callback(null)
        return
    }
    sdk[sdkName] = new window[sdkName]().init()
    callback && callback(sdk[sdkName])
}

function setSetting(name, value) {
    debug('setSetting:', name, value)
    setting[name] = value
    // localStorage.setItem('setting', JSON.stringify(setting))
    chrome.storage.sync.set({'setting': setting}, function () {
        debug('setting:', setting)
        currentTabMessage({action: 'loadSetting'})
    })
    if (name === 'scribble') setBrowserAction(value === 'off' ? 'OFF' : '')
}

function saveSetting(setting, callback) {
    chrome.storage.sync.set({'setting': setting}, function () {
        debug('setting:', setting)
        currentTabMessage({action: 'loadSetting'})
        callback && callback(chrome.runtime.lastError)
    })
}

function loadSetting(callback) {
    chrome.storage.sync.get(['setting'], function (r) {
        callback && callback(r)
    })
}

function clearSetting(callback) {
    chrome.storage.sync.clear(function () {
        callback && callback(chrome.runtime.lastError)
    })
}

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

function currentTabMessage(message) {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        // alert(JSON.stringify(tabs))
        tabs[0] && tabs[0].url && sendMessage(tabs[0].id, message)
    })
}

function debug(...data) {
    isDebug && console.log('[DMX DEBUG]', ...data)
}

function loadJs(arr, type) {
    arr.forEach(k => {
        let el = document.createElement("script")
        el.type = 'text/javascript'
        el.src = `/js/${type || 'translate'}/${k}.js`
        document.head.appendChild(el)
    })
}

function sleep(delay) {
    return new Promise(r => setTimeout(r, delay))
}

function inArray(val, arr) {
    // return arr.indexOf(val) !== -1
    return arr.includes(val)
}

function uniqueArray(arr) {
    return [...new Set(arr)]
}

function objectReverse(obj) {
    let r = {}
    for (const [key, value] of Object.entries(obj)) {
        r[value] = key
    }
    return r
}

function sliceStr(text, maxLen) {
    let r = []
    if (text.length <= maxLen) {
        r.push(text)
    } else {
        // 根据优先级截取字符串，详细符号见：https://zh.wikipedia.org/wiki/%E6%A0%87%E7%82%B9%E7%AC%A6%E5%8F%B7
        let separators = `?!;.-…,/"`
        separators += `？！；。－－＿～﹏·，：、`
        separators += `“”﹃﹄「」﹁﹂『』﹃﹄（）［］〔〕【】《》〈〉()[]{}`
        let separatorArr = [...separators]
        let arr = text.split('\n')
        arr.forEach(s => {
            s = s.trim()
            if (!s) return

            if (s.length <= maxLen) {
                r.push(s)
            } else {
                do {
                    if (s.length <= maxLen) {
                        r.push(s)
                        break
                    }
                    let end = false
                    for (let i = 0; i < separatorArr.length; i++) {
                        if (i + 1 === separatorArr.length) end = true
                        let symbol = separatorArr[i]
                        let n = s.indexOf(symbol)
                        if (n === -1) continue
                        if (n > maxLen) continue
                        let s2 = s.substring(0, n).trim()
                        s2 && r.push(s2)
                        s = s.substring(n + 1).trim()
                        break
                    }
                    if (!end) continue
                    if (!s) break
                    if (s.length <= maxLen) {
                        r.push(s)
                        break
                    }

                    let s1 = s.substring(0, maxLen)
                    let s2 = s.substring(maxLen)
                    let n = s1.lastIndexOf(' ')
                    if (n !== -1) {
                        // 处理英文
                        let s3 = s1.substring(0, n)
                        let s4 = s1.substring(n)
                        r.push(s3)
                        s = (s4 + s2).trim()
                    } else {
                        // 没有空格，就硬切（这种情况一般是中文）
                        r.push(s1)
                        s = s2
                    }
                } while (s)
            }
        })
    }
    return r
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
