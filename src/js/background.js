'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let conf, setting, voiceList, sdk = {}
document.addEventListener('DOMContentLoaded', async function () {
    let languageList = '', dialogCSS = '', dictionaryCSS = {}
    await fetch('../conf/conf.json').then(r => r.json()).then(r => {
        conf = r
    })
    await fetch('../conf/language.json').then(r => r.text()).then(s => {
        languageList += s
    })
    await fetch('../css/dmx_dialog.css').then(r => r.text()).then(s => {
        dialogCSS += minCss(s)
    })
    for (let name of conf.dictionaryCSS) {
        await fetch(`../css/${name}.css`).then(r => r.text()).then(s => {
            dictionaryCSS[name] = minCss(s)
        })
    }
    storageLocalSet({conf, languageList, dialogCSS, dictionaryCSS}).catch(err => debug(`save error: ${err}`))

    await storageSyncGet(['setting']).then(function (r) {
        saveSettingAll(r.setting, true) // 初始设置参数
    })

    // 发音列表
    !isFirefox && await getVoices().then(r => {
        voiceList = r
    })

    // 加载 js
    loadJs(uniqueArray(Object.keys(conf.translateList).concat(Object.keys(conf.translateTTSList))), 'translate')
    loadJs(Object.keys(conf.dictionaryList), 'dictionary')

    // 添加菜单
    setting.searchMenus.forEach(name => {
        let v = conf.searchList[name]
        v && addMenu(name, v.title, v.url)
    })

    // 查看全部数据
    storageShowAll()
})

// 添加上下文菜单
B.contextMenus.create({
    title: "梦想翻译“%s”",
    contexts: ["selection"],
    onclick: function (info, tab) {
        tab && sendTabMessage(tab.id, {action: 'contextMenus', text: info.selectionText})
    }
})

// 监听消息
B.onMessage.addListener(function (m, sender, sendResponse) {
    sendResponse()
    debug('request:', m)
    debug('sender:', sender && sender.url ? sender.url : sender)
    // if (!sender.tab) return
    let tabId = sender.tab.id

    if (m.action === 'translate') {
        runTranslate(tabId, m)
    } else if (m.action === 'translateTTS') {
        runTranslateTTS(tabId, m)
    } else if (m.action === 'dictionary') {
        runDictionary(tabId, m)
    } else if (m.action === 'dictionarySound') {
        runDictionarySound(tabId, m)
    } else if (m.action === 'menu') {
        changeMenu(m.name, m.isAdd)
    } else if (m.action === 'saveSetting') {
        saveSettingAll(m.setting, m.updateIcon, m.resetDialog)
    } else if (m.action === 'copy') {
        execCopy(m.text) // 后台复制，页面才不会失去焦点
    }
})

function runTranslate(tabId, m) {
    setting.translateList.forEach(name => {
        sdkInit(`${name}Translate`).then(sd => {
            sd.query(m.text, m.srcLan, m.tarLan).then(r => {
                debug(`${name}:`, r)
                sendTabMessage(tabId, {action: m.action, name: name, result: r})
            }).catch(e => {
                sendTabMessage(tabId, {action: m.action, name: name, text: m.text, error: e})
            })

            // 链接
            let url = sd.link(m.text, m.srcLan, m.tarLan)
            sendTabMessage(tabId, {action: 'link', type: m.action, name: name, link: url})
        })
    })

    // 自动朗读
    setTimeout(() => {
        autoPlayTTS(tabId, m.text, m.srcLan, conf.translateTTSList, setting.translateTTSList)
    }, 300)
}

function runTranslateTTS(tabId, m) {
    let list = conf.translateList
    let tList = conf.translateTTSList
    let message = {action: m.action, name: m.name, type: m.type, status: 'end'}
    playTTS(m.name, m.text, m.lang).then(() => {
        sendTabMessage(tabId, message)
    }).catch(err => {
        debug(`${m.name} sound error:`, err)
        let errMsg = `${tList[m.name] ? tList[m.name] : list[m.name] + '朗读'}出错`
        sendTabMessage(tabId, Object.assign({}, message, {error: errMsg}))
    })
}

function runDictionary(tabId, m) {
    setting.dictionaryList.forEach(name => {
        sdkInit(`${name}Dictionary`).then(sd => {
            sd.query(m.text).then(r => {
                debug(`${name}:`, r)
                sendTabMessage(tabId, {action: m.action, name: name, result: r})
            }).catch(e => {
                sendTabMessage(tabId, {action: m.action, name: name, text: m.text, error: e})
            })

            // 链接
            sendTabMessage(tabId, {action: 'link', type: m.action, name: name, link: sd.link(m.text)})
        })
    })
}

function runDictionarySound(tabId, m) {
    playAudio(m.url).then(() => {
        sendTabMessage(tabId, {action: m.action, name: m.name, type: m.type, status: 'end'})
    }).catch(err => {
        debug(`${m.name} sound error:`, err)
        let title = conf.dictionaryList[m.name] || ''
        sendTabMessage(tabId, {action: m.action, name: m.name, type: m.type, error: `${title}发音出错`})
    })
}

function saveSettingAll(data, updateIcon, resetDialog) {
    setting = Object.assign({}, conf.setting, data)
    updateIcon && changeBrowserIcon(setting.scribble) // 是否显示关闭划词图标
    let options = resetDialog ? {setting, dialogConf: {}} : {setting}
    storageSyncSet(options)
}

function changeBrowserIcon(scribble) {
    setBrowserAction(scribble === 'off' ? 'OFF' : '')
}

function setBrowserAction(text) {
    B.browserAction.setBadgeText({text: text || ''})
    B.browserAction.setBadgeBackgroundColor({color: 'red'})
    isFirefox && B.browserAction.setBadgeTextColor({color: 'white'})
}

function changeMenu(name, isAdd) {
    let v = conf.searchList[name]
    if (v) isAdd ? addMenu(name, v.title, v.url) : removeMenu(name)
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

function minCss(s) {
    s = s.replace(/\/\*.*?\*\//g, '')
    s = s.replace(/\s+/g, ' ')
    s = s.replace(/\s*([:;{}!,])\s*/g, '$1')
    s = s.replace(/;}/g, '}')
    s = s.replace(/;}/g, '}')
    return s
}

function autoPlayTTS(tabId, text, lang, list, arr) {
    (async () => {
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
            await sendTabMessage(tabId, Object.assign({}, message, {status: 'start'}))
            await playTTS(name, text, lang).then(() => {
                sendTabMessage(tabId, message)
            }).catch(err => {
                debug(`${name} sound error:`, err)
                sendTabMessage(tabId, Object.assign({}, message, {error: `${list[name]}出错`}))
            })
        }
    })()
}

function playTTS(name, text, lang) {
    return new Promise((resolve, reject) => {
        sdkInit(`${name}Translate`).then(sd => {
            sd.tts(text, lang).then(val => {
                if (name === 'local') return resolve()
                if (Array.isArray(val)) {
                    (async function () {
                        let ok = false
                        let err = new Error()
                        for (let i = 0; i < val.length; i++) {
                            await playAudio(val[i]).then(() => {
                                if (!ok) ok = true // 为更好的兼容，只要有一次播放成功就算播放成功
                            }).catch(e => {
                                err = e
                            })
                        }
                        ok ? resolve() : reject(err)
                    })()
                } else {
                    playAudio(val).then(() => {
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

function playAudio(url) {
    return new Promise((resolve, reject) => {
        if (!window._Audio) window._Audio = new Audio()
        let a = window._Audio
        let blobUrl = null
        if (typeof url === 'string') {
            a.src = url
        } else if (typeof url === 'object') {
            blobUrl = URL.createObjectURL(url)
            a.src = blobUrl
        } else {
            return reject('Audio url error:', url)
        }
        a.onended = function () {
            if (blobUrl) URL.revokeObjectURL(blobUrl) // 释放内存
            resolve()
        }
        a.onerror = function (err) {
            reject(err)
        }
        let playPromise = a.play()
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                // reject(err)
                resolve()
            })
        }
    })
}

function sdkInit(name) {
    return new Promise((resolve, reject) => {
        if (sdk[name]) return resolve(sdk[name])
        if (typeof window[name] === 'function') {
            sdk[name] = new window[name]().init()
            resolve(sdk[name])
        } else {
            let err = name + ' not exist!'
            debug('sdkInit error:', err)
            reject(err)
        }
    })
}

function loadJs(arr, type) {
    arr.forEach(k => {
        let el = document.createElement("script")
        el.type = 'text/javascript'
        el.src = `/js/${type || 'translate'}/${k}.js`
        document.head.appendChild(el)
    })
}

function uniqueArray(arr) {
    return [...new Set(arr)]
}

function invertObject(obj) {
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
