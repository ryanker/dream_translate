'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let conf, setting, sdk = {}
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
    let tabId = getJSONValue(sender, 'tab.id')
    if (!tabId) tabId = 'popup'

    if (m.action === 'translate') {
        runTranslate(tabId, m)
    } else if (m.action === 'translateTTS') {
        runTranslateTTS(tabId, m)
    } else if (m.action === 'dictionary') {
        runDictionary(tabId, m)
    } else if (m.action === 'playSound') {
        runPlaySound(tabId, m)
    } else if (m.action === 'menu') {
        changeMenu(m.name, m.isAdd)
    } else if (m.action === 'saveSetting') {
        saveSettingAll(m.setting, m.updateIcon, m.resetDialog)
    } else if (m.action === 'copy') {
        execCopy(m.text) // 后台复制，页面才不会失去焦点
    } else if (m.action === 'transWindow') {
        openTransWindow()
    } else if (m.action === 'openUrl') {
        openTab(m.url)
    } else if (m.action === 'onAllowSelect') {
        sendAllowSelect()
    }
})

// 监听快捷键
B.commands.onCommand.addListener(function (command) {
    command = command + ''
    if (command === 'openWindow') {
        openTransWindow()
    } else if (command === 'toggleScribble') {
        if (!window.scribbleTmp) window.scribbleTmp = setting.scribble === 'off' ? 'direct' : 'off';
        [setting.scribble, window.scribbleTmp] = [window.scribbleTmp, setting.scribble] // 交换
        saveSettingAll(setting, true) // 保存
    }
})

function runTranslate(tabId, m) {
    let {action, text, srcLan, tarLan} = m
    setting.translateList.forEach(name => {
        sdkInit(`${name}Translate`).then(sd => {
            sd.query(text, srcLan, tarLan).then(result => {
                debug(`${name}:`, result)
                sandFgMessage(tabId, {action, name, result})
            }).catch(error => {
                sandFgMessage(tabId, {action, name, text, error})
            })

            // 链接
            let link = sd.link(text, srcLan, tarLan)
            sandFgMessage(tabId, {action: 'link', type: action, name, link})
        })
    })

    // 自动朗读
    setTimeout(() => {
        autoPlayTTS(tabId, text, srcLan).then(_ => null)
    }, 300)
}

function runTranslateTTS(tabId, m) {
    let list = conf.translateList
    let tList = conf.translateTTSList
    let {name, type, text, lang} = m
    let message = {action: 'playSound', nav: 'translate', name, type, status: 'end'}
    playTTS(name, text, lang).then(() => {
        sandFgMessage(tabId, message)
    }).catch(err => {
        debug(`${name} sound error:`, err)
        let errMsg = `${tList[name] ? tList[name] : list[name] + '朗读'}出错`
        sandFgMessage(tabId, Object.assign({}, message, {error: errMsg}))
    })
}

function runDictionary(tabId, m) {
    let {action, text} = m
    window.dictionarySounds = {} // 返回的发音缓存
    setting.dictionaryList.forEach(name => {
        sdkInit(`${name}Dictionary`).then(sd => {
            sd.query(text).then(result => {
                debug(`${name}:`, result)
                let {sound} = result
                if (sound && sound.length > 0) dictionarySounds[name] = sound // 记录发音
                sandFgMessage(tabId, {action, name, result})
            }).catch(error => {
                sandFgMessage(tabId, {action, name, text, error})
            })

            // 链接
            sandFgMessage(tabId, {action: 'link', type: action, name, link: sd.link(text)})
        })
    })

    // 自动朗读
    setTimeout(() => {
        autoPlayAudio(tabId, text).then(_ => null)
    }, 300)
}

function runPlaySound(tabId, m) {
    let {action, nav, name, type, url} = m
    playAudio(url).then(() => {
        sandFgMessage(tabId, {action, nav, name, type, status: 'end'})
    }).catch(err => {
        debug(`${name} sound error:`, err)
        let title = conf.dictionaryList[name] || conf.translateList[name] || ''
        sandFgMessage(tabId, {action, nav, name, type, error: `${title}发音出错`})
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
    // {type: "separator"}
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

function openTransWindow() {
    let fn = function () {
        let screen = window.screen
        let o = {type: 'popup', width: 600, height: 520, url: B.root + 'html/popup.html?fullscreen=1'}
        if (screen.width) o.left = (screen.width - o.width) / 2
        if (screen.height) o.top = (screen.height - o.height) / 2
        B.windows.create(o, w => window.transWindowId = w.id)
    }
    let id = window.transWindowId
    if (id) {
        B.windows.get(id, function (w) {
            if (!B.runtime.lastError && w.id) {
                B.windows.update(w.id, {focused: true})
            } else {
                fn()
            }
        })
    } else {
        fn()
    }
}

function openTab(url) {
    B.tabs.create({url})
}

function sendAllowSelect() {
    getActiveTabId().then(tabId => {
        tabId && sendTabMessage(tabId, {action: 'allowSelect'})
    })
}

function minCss(s) {
    s = s.replace(/\/\*.*?\*\//g, '')
    s = s.replace(/\s+/g, ' ')
    s = s.replace(/\s*([:;{}!,])\s*/g, '$1')
    s = s.replace(/;}/g, '}')
    s = s.replace(/;}/g, '}')
    return s
}

async function autoPlayTTS(tabId, text, lang) {
    let list = conf.translateTTSList || {}
    let arr = setting.translateTTSList || []
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
    for (let name of arr) {
        let message = {action: 'playSound', nav: 'translate', name, type: 'source', status: 'end'}
        await sandFgMessage(tabId, Object.assign({}, message, {status: 'start'}))
        await playTTS(name, text, lang).then(() => {
            sandFgMessage(tabId, message)
        }).catch(err => {
            debug(`${name} sound error:`, err)
            sandFgMessage(tabId, Object.assign({}, message, {error: `${list[name] || '发音'}出错`}))
        })
    }
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

async function autoPlayAudio(tabId, text) {
    let list = conf.dictionaryList || {}
    let sounds = window.dictionarySounds
    let type = setting.dictionaryReader || 'us'
    let arr = setting.dictionarySoundList || []
    for (let name of arr) {
        let message = {action: 'playSound', nav: 'dictionary', name, type, status: 'end'}
        await sandFgMessage(tabId, Object.assign({}, message, {status: 'start'})) // 显示开始朗读图标
        let url = ''
        if (sounds[name]) {
            url = getSoundUrl(sounds[name], type) // 缓存中获取
        } else {
            let sdkRun = {}
            await sdkInit(`${name}Dictionary`).then(r => {
                sdkRun = r
            })
            await sdkRun.query(text).then(r => {
                if (r.sound) url = getSoundUrl(r.sound, type) // 接口中获取
            }).catch(error => {
                debug(`${name} dictionary error:`, error)
            })
        }
        debug('_playAudio_', name, type, url)
        if (!url) continue // 没有发音跳过

        // 播放声音
        await playAudio(url).then(() => {
            sandFgMessage(tabId, message)
        }).catch(err => {
            debug(`${name} sound error:`, err)
            sandFgMessage(tabId, Object.assign({}, message, {error: `${list[name] || ''}发音出错`}))
        })
    }
    debug('_playAudio_ finish.')
}

function getSoundUrl(arr, type) {
    for (let v of arr) if (v.type === type && !v.isWoman) return v.url
    return ''
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

// 清理元素属性
function cleanAttr(el, attrs) {
    el.querySelectorAll('*').forEach(e => {
        for (let i = e.attributes.length - 1; i >= 0; i--) {
            let v = e.attributes[i]
            if (typeof attrs === 'object') {
                if (!attrs.includes(v.name)) e.removeAttribute(v.name) // 过滤白名单
            } else {
                e.removeAttribute(v.name) // 全部删除
            }
        }
    })
}

// 检测返回结果是否正确，如果不正确，则重试
async function checkRetry(callback, times) {
    times = times || 3 // 默认 3 次
    let isOk = false
    let p
    for (let i = 0; i < times; i++) {
        p = callback()
        await p.then(r => {
            if (r.data && r.data.length > 0) isOk = true
        }).catch(_ => null)
        if (isOk) return p
        await sleep(300)
    }
    return p
}

// 打开一个几乎不可见的 popup
function openPopup(id, url, timeout) {
    id = id || 'dmx_popup'
    timeout = timeout || 20 * 1000 // 默认 20 秒
    let popupId = `_popup_${id}`
    let wid = window[popupId]

    wid && B.windows.remove(wid, () => B.runtime.lastError) // 直接关闭
    B.windows.create({type: 'popup', focused: false, width: 1, height: 1, url}, w => window[popupId] = w.id)

    // 定时关闭窗口，减少内存占用
    _setTimeout(id, () => {
        // wid && B.windows.remove(wid, () => B.runtime.lastError)
        // 清理所有小窗口
        B.windows.getAll({populate: true}, function (windows) {
            let curOri = new URL(url).origin
            windows.forEach(w => {
                if (w.type === 'popup' && w.width === 1 && w.tabs.length === 1) {
                    // console.log('url:', w.tabs[0].url)
                    if (!w.tabs[0].url || new URL(w.tabs[0].url).origin === curOri) {
                        B.windows.remove(w.id, () => B.runtime.lastError) // 关闭
                    }
                }
            })
        })
    }, timeout)
}

function openIframe(id, url, timeout) {
    id = id || 'iframe_' + Date.now()
    timeout = timeout || 60 * 1000 // 默认 1 分钟

    let el = document.getElementById(id)
    if (!el) {
        el = document.createElement('iframe')
        el.id = id
        el.src = url
        document.body.appendChild(el)
    } else {
        el.src = url
    }

    // 定时删除，减小内存占用
    _setTimeout(id, () => el && el.remove(), timeout)
    return el
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
