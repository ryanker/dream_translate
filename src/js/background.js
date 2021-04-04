'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let conf, setting, sdk = {}
let searchText, searchList
let ocrToken = '', ocrExpires = 0
var textTmp = ''
var historyMax = 3000
document.addEventListener('DOMContentLoaded', async function () {
    let languageList = '', dialogCSS = '', dictionaryCSS = {}
    await fetch('../conf/conf.json').then(r => r.json()).then(r => {
        conf = r
    })
    await fetch('../conf/searchText.txt').then(r => r.text()).then(str => {
        searchText = str
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

    await storageSyncGet(['setting', 'searchText']).then(function (r) {
        saveSettingAll(r.setting, true) // 初始设置参数
        searchList = getSearchList(r.searchText || searchText)
        if (!r.searchText) saveSearchText('') // 如果为空，设置默认值
    })

    // 最大保存历史记录数
    if (localStorage['historyMax']) historyMax = Number(localStorage['historyMax'])

    // 加载 js
    loadJs(uniqueArray(Object.keys(conf.translateList).concat(Object.keys(conf.translateTTSList))), 'translate')
    loadJs(Object.keys(conf.dictionaryList), 'dictionary')

    // 添加菜单
    setting.searchMenus.forEach(name => {
        let url = searchList[name]
        url && addMenu(name, name, url)
    })

    // 查看全部数据
    storageShowAll()
})

// 添加上下文菜单
B.contextMenus.create({
    title: "梦想翻译“%s”",
    contexts: ["selection"],
    onclick: function (info, tab) {
        if (!info.selectionText) return
        let msg = {action: 'contextMenus', text: info.selectionText}
        if (tab && tab.id > 0) {
            sendTabMessage(tab.id, msg)
        } else {
            getActiveTabId().then(tabId => sendTabMessage(tabId, msg))
        }
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
    } else if (m.action === 'onRecord') {
        openRecord()
    } else if (m.action === 'openUrl') {
        openTab(m.url)
    } else if (m.action === 'onAllowSelect') {
        sendAllowSelect()
    } else if (m.action === 'onCropImg') {
        cropImageSendMsg()
    } else if (m.action === 'onSaveSearchText') {
        saveSearchText(m.searchText)
    } else if (m.action === 'onCapture') {
        setTimeout(_ => capturePic(sender.tab, m), 100)
    } else if (m.action === 'textTmp') {
        createHistory(m) // 保存历史记录
        textTmp = m.text // 划词文字缓存
    }
})

// 监听快捷键
B.commands.onCommand.addListener(function (command) {
    command = command + ''
    if (command === 'openWindow') {
        openTransWindow()
    } else if (command === 'cropImage') {
        cropImageSendMsg()
    } else if (command === 'stopPlayAudio') {
        let a = window._Audio
        if (a) a.pause()
        if (B.tts && B.tts.stop) B.tts.stop()
    } else if (command === 'clipboardTrans') {
        clipboardTrans()
    } else if (command === 'toggleScribble') {
        if (!window.scribbleTmp) window.scribbleTmp = setting.scribble === 'off' ? 'direct' : 'off';
        [setting.scribble, window.scribbleTmp] = [window.scribbleTmp, setting.scribble] // 交换
        saveSettingAll(setting, true) // 保存
    }
})

async function runTranslate(tabId, m) {
    let {action, text, srcLan, tarLan} = m
    if (setting.autoLanguage) {
        srcLan = await autoLang(text)
        if (srcLan === tarLan) tarLan = srcLan === 'zh' ? 'en' : 'zh'
    }
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

function cropImageSendMsg() {
    getActiveTabId().then(tabId => tabId && sendTabMessage(tabId, {action: 'onCrop'}))
}

function capturePic(tab, m) {
    B.tabs.captureVisibleTab(tab.windowId, {}, function (data) {
        let im = document.createElement("img")
        im.onload = async function () {
            let ca = document.createElement("canvas")
            ca.width = m.width
            ca.height = m.height
            let ca2d = ca.getContext("2d")
            let t = im.height / m.innerHeight
            ca2d.drawImage(im, m.startX * t, m.startY * t, m.width * t, m.height * t, 0, 0, m.width, m.height)
            let b = ca.toDataURL("image/jpeg")

            // 获取 token
            let access_token = ''
            await getOcrToken().then(token => {
                access_token = token
            }).catch(err => {
                sendTabMessage(tab.id, {action: 'onAlert', message: err, type: 'error'})
            })
            if (!access_token) return

            // see https://cloud.baidu.com/doc/OCR/s/zk3h7xz52
            let url = 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=' + access_token
            let p = new URLSearchParams(`image=${encodeURIComponent(b.substr(b.indexOf(",") + 1))}&detect_language=true&language_type=${setting.translateOCR || 'CHN_ENG'}`)
            httpPost({url, body: p.toString()}).then(r => {
                let wordsRes = getJSONValue(r, 'words_result')
                if (wordsRes && wordsRes.length > 0) {
                    let text = ''
                    for (let v of wordsRes) text += v.words + '\n'
                    sendTabMessage(tab.id, {action: 'contextMenus', text: text.trim()})
                } else {
                    sendTabMessage(tab.id, {action: 'onAlert', message: '百度图片识别失败', type: 'error'})
                }
            }).catch(e => {
                sendTabMessage(tab.id, {action: 'onAlert', message: '百度图片识别 API 出错', type: 'error'})
                debug('baidu ocr error:', e)
            })
        }
        im.src = data
    })
}

function getOcrToken() {
    return new Promise((resolve, reject) => {
        if (localStorage['clearOcrExpires'] !== 'true') {
            localStorage['clearOcrExpires'] = 'false'
            ocrExpires = 0
        }
        if (ocrExpires - 10 > getTimestamp()) return resolve(ocrToken)
        if (setting.ocrType === 'baidu') {
            let url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${setting.baidu_orc_ak}&client_secret=${setting.baidu_orc_sk}`
            httpGet(url, 'json').then(r => {
                if (r.expires_in > 0 && r.access_token) {
                    ocrExpires = getTimestamp() + r.expires_in
                    ocrToken = r.access_token
                    resolve(ocrToken)
                } else if (r.error_description) {
                    reject(r.error_description)
                } else {
                    reject('请求百度接口网路错误')
                }
            }).catch(e => {
                debug('aip.baidubce.com api error!', e)
                reject('百度获取 TOKEN 接口错误')
            })
        } else {
            httpGet('https://mengxiang.net/api/getBaiduOcrToken.json', 'json').then(r => {
                if (r.expires > 0 && r.token) {
                    ocrExpires = r.expires
                    ocrToken = r.token
                    resolve(ocrToken)
                } else {
                    reject('请求官方接口网路错误')
                }
            }).catch(e => {
                debug('mengxiang.net api error!', e)
                reject('获取免费 TOKEN 接口错误')
            })
        }
    })
}

function getTimestamp() {
    return Date.parse(new Date()) / 1000
}

function saveSearchText(s) {
    if (!s) s = searchText
    storageSyncSet({searchText: s})
    searchList = getSearchList(s)
}

function saveSettingAll(data, updateIcon, resetDialog) {
    setting = Object.assign({}, conf.setting, data)
    updateIcon && changeBrowserIcon(setting.scribble) // 是否显示关闭划词图标
    let options = resetDialog ? {setting, dialogConf: {}} : {setting}
    if (resetDialog) saveSearchText('')
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
    let url = searchList[name]
    if (url) isAdd ? addMenu(name, name, url) : removeMenu(name)
}

function addMenu(name, title, url) {
    // {type: "separator"}
    let mid = md5(name)
    B.contextMenus.create({
        id: 'page_' + mid,
        title: title + '首页',
        contexts: ["page"],
        onclick: function () {
            B.tabs.create({url: (new URL(url)).origin})
        }
    })
    B.contextMenus.create({
        id: 'selection_' + mid,
        title: title + "“%s”",
        contexts: ["selection"],
        onclick: function (info) {
            B.tabs.create({url: url.format(decodeURIComponent(info.selectionText))})
        }
    })
}

function removeMenu(name) {
    let mid = md5(name)
    B.contextMenus.remove('page_' + mid)
    B.contextMenus.remove('selection_' + mid)
}

function openTransWindow() {
    openWindow('trans', 600, 520, B.root + 'html/popup.html?fullscreen=1')
}

function clipboardTrans() {
    openWindow('trans', 600, 520, B.root + 'html/popup.html?fullscreen=1&clipboardRead=1', true)
}

function openRecord() {
    openWindow('record', 600, 520, B.root + 'html/record.html', true)
}

function openWindow(wid, width, height, url, reopen) {
    let name = `_window_${wid}`
    let openFn = function (width, height, left, top) {
        let o = {type: 'popup', width, height, url}

        // 居中
        let screen = window.screen
        o.left = left ? left : (screen.width - o.width) / 2
        o.top = top ? top : (screen.height - o.height) / 2

        B.windows.create(o, w => window[name] = w.id)
    }
    let id = window[name]
    if (id) {
        B.windows.get(id, function (w) {
            if (!B.runtime.lastError && w.id) {
                if (reopen) {
                    B.windows.remove(w.id)
                    setTimeout(() => openFn(w.width, w.height, w.left, w.top), 100)
                } else {
                    B.windows.update(w.id, {focused: true})
                }
            } else {
                openFn(width, height)
            }
        })
    } else {
        openFn(width, height)
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

// 保存历史记录
function createHistory(m) {
    if (historyMax < 1) return // 如果为 0，则不再保存历史记录
    let text = m.text || m.text.trim()
    if (!text) return
    if (window.lastHistory === text) return
    if (m.formUrl.indexOf(B.root) === 0) return // 排除扩展内查询
    idb('history', 1, initHistory).then(db => {
        db.create('history', {
            content: text,
            formTitle: m.formTitle,
            formUrl: m.formUrl,
            createDate: new Date().toJSON(),
        }).then(() => {
            // 清理早期数据
            db.count('history').then(n => {
                if (n <= historyMax) return
                db.find('history', {direction: 'prev', offset: historyMax}).then(arr => {
                    for (let v of arr) db.delete('history', v.id)
                })
            })
        }).catch(e => {
            debug('history create error:', e)
        })
    })
    window.lastHistory = text
}

// 历史记录设置
function settingHistory(n) {
    historyMax = Number(n)
    localStorage.setItem('historyMax', n)
}

function minCss(s) {
    s = s.replace(/\/\*.*?\*\//g, '')
    s = s.replace(/\s+/g, ' ')
    s = s.replace(/\s*([:;{}!,])\s*/g, '$1')
    s = s.replace(/;}/g, '}')
    s = s.replace(/;}/g, '}')
    return s
}

async function autoLang(text) {
    let lang = 'en' // 默认值
    await httpPost({
        url: `https://fanyi.baidu.com/langdetect`,
        body: `query=${encodeURIComponent(text)}`
    }).then(r => {
        if (r && r.lan) lang = r.lan
    }).catch(err => {
        debug(err)
    })
    return lang
}

async function autoPlayTTS(tabId, text, lang) {
    let list = conf.translateTTSList || {}
    let arr = setting.translateTTSList || []
    if (lang === 'auto') lang = await autoLang(text)
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
            // if (blobUrl) URL.revokeObjectURL(blobUrl) // 释放内存
            resolve()
            let url = a.src // 记录最后一次播放的链接
            window.audioSrc = {url}
            getAudioBlob(url).then(b => window.audioSrc.blob = b)
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

// 缓存音频文件
async function getAudioBlob(url, retry) {
    let b
    retry = retry || 3
    for (let i = 0; i < retry; i++) {
        await httpGet(url, 'blob').then(blob => {
            // console.log(blob)
            b = blob
        }).catch(err => {
            console.warn('httpGet:' + err)
        })
        if (b) return b
    }
    return null
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
        p = callback(i)
        await p.then(r => {
            if (r.data && r.data.length > 0) isOk = true
        }).catch(_ => null)
        if (isOk) return p
        await sleep(300)
    }
    return p
}

function openBgPage(id, url, timeout) {
    isFirefox ? openIframe(id, url, timeout) : openPopup(id, url, timeout)
}

function removeBgPage(id) {
    isFirefox ? removeIframe(id) : removePopup(id)
}

// 打开一个几乎不可见的 popup
function openPopup(id, url, timeout) {
    timeout = timeout || 20 * 1000 // 默认 20 秒
    removePopup(id)
    let popupId = `_popup_${id || 'one'}`
    B.windows.create({type: 'popup', focused: false, width: 1, height: 1, url}, w => window[popupId] = w.id)

    // 定时关闭窗口，减少内存占用
    _setTimeout(id, () => {
        removePopup(id)
        cleanPopup(url)  // 清理所有小窗口
    }, timeout)
}

function removePopup(id) {
    let popupId = `_popup_${id || 'one'}`
    let wid = window[popupId]
    if (!wid) return
    B.windows.remove(wid, () => B.runtime.lastError) // 关闭
    window[popupId] = null
}

function cleanPopup(url) {
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
}

// 创建一个临时标签
function createTmpTab(id, url, timeout) {
    timeout = timeout || 20 * 1000 // 默认 20 秒
    let tabName = `_tmp_tab_${id || 'one'}`
    removeTmpTab(id) // 关闭
    B.tabs.create({active: false, url}, tab => window[tabName] = tab.id)
    _setTimeout(id, () => removeTmpTab(tabName), timeout)  // 定时关闭窗口，减少内存占用
}

// 关闭临时标签
function removeTmpTab(id) {
    let tabName = `_tmp_tab_${id || 'one'}`
    let tabId = window[tabName]
    if (!tabId) return
    B.tabs.remove(tabId, () => B.runtime.lastError) // 关闭
    window[tabName] = null
}

function openIframe(id, url, timeout) {
    timeout = timeout || 20 * 1000 // 默认 20 秒
    let ifrId = `_iframe_${id || 'one'}`
    let el = document.getElementById(ifrId)
    if (!el) {
        el = document.createElement('iframe')
        el.id = ifrId
        el.src = url
        document.body.appendChild(el)
    } else {
        el.src = url
    }

    // 定时删除，减小内存占用
    _setTimeout(id, () => el && el.remove(), timeout)
    return el
}

function removeIframe(id) {
    let ifrId = `_iframe_${id || 'one'}`
    let el = document.getElementById(ifrId)
    el && el.remove()
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
