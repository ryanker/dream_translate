'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let conf, setting
let searchText, searchList
document.addEventListener('DOMContentLoaded', async function () {
    await fetch('../conf/conf.json').then(r => r.json()).then(r => {
        conf = r
    })
    await storageSyncGet(['setting', 'searchText']).then(function (r) {
        setting = r.setting
        searchText = r.searchText || ''
    })
    await fetch('../conf/searchText.txt').then(r => r.text()).then(r => {
        searchText = searchText || r.trim()
        searchList = getSearchKey(searchText)
    })
    init()
    // debug('conf:', conf)
    // debug('setting:', setting)
})

function init() {
    // 词典发音列表
    let dictionarySoundList = {}
    for (let [k, v] of Object.entries(conf.dictionaryList)) {
        if (conf.dictionarySoundExcluded.includes(k)) continue // 排除
        dictionarySoundList[k] = v
    }

    // 绑定导航
    navigate('navigate', '.setting_box')

    // 初始参数
    settingBoxHTML('setting_translate_list', 'translateList', conf.translateList)
    settingBoxHTML('setting_translate_tts_list', 'translateTTSList', conf.translateTTSList)
    settingBoxHTML('setting_dictionary_list', 'dictionaryList', conf.dictionaryList)
    settingBoxHTML('setting_dictionary_sound_list', 'dictionarySoundList', dictionarySoundList)

    // 设置值 & 绑定事件
    setBindValue('scribble', setting.scribble)
    setBindValue('excludeChinese', setting.excludeChinese)
    setBindValue('excludeSymbol', setting.excludeSymbol)
    setBindValue('position', setting.position)
    setBindValue('allowSelect', setting.allowSelect)
    setBindValue('autoCopy', setting.autoCopy)
    setBindValue('autoPaste', setting.autoPaste)
    setBindValue('autoWords', setting.autoWords)
    setBindValue('cutHumpName', setting.cutHumpName)
    setBindValue('translateList', setting.translateList)
    setBindValue('translateTTSList', setting.translateTTSList)
    setBindValue('translateOCR', setting.translateOCR || 'CHN_ENG')
    setBindValue('ocrType', setting.ocrType)
    setBindValue('translateThin', setting.translateThin)
    setBindValue('hideOriginal', setting.hideOriginal)
    setBindValue('autoLanguage', setting.autoLanguage)
    setBindValue('dictionaryList', setting.dictionaryList)
    setBindValue('dictionarySoundList', setting.dictionarySoundList)
    setBindValue('dictionaryReader', setting.dictionaryReader)

    // 绑定顺序展示
    bindSortHTML('展示顺序：', 'setting_translate_sort', 'translateList', setting.translateList, conf.translateList)
    bindSortHTML('朗读顺序：', 'setting_translate_tts_sort', 'translateTTSList', setting.translateTTSList, conf.translateTTSList)
    bindSortHTML('展示顺序：', 'setting_dictionary_sort', 'dictionaryList', setting.dictionaryList, conf.dictionaryList)
    bindSortHTML('朗读顺序：', 'setting_dictionary_sound_sort', 'dictionarySoundList', setting.dictionarySoundList, dictionarySoundList)

    // 搜索设置功能
    initSearch()

    // 绑定是否显示"朗读"参数
    bindShow('setting_dictionary_reader', 'dictionarySoundList', setting.dictionarySoundList)

    // 本地 TTS 设置
    localTtsSetting()
    searchListSetting()

    // 文字识别设置
    settingOcr()

    // 重置设置
    $('clearSetting').addEventListener('click', clearSetting)
}

function initSearch() {
    settingBoxHTML('setting_search_list', 'searchList', searchList)
    settingBoxHTML('setting_search_menus', 'searchMenus', searchList)
    settingBoxHTML('setting_search_side', 'searchSide', searchList)

    setBindValue('searchList', setting.searchList)
    setBindValue('searchMenus', setting.searchMenus)
    setBindValue('searchSide', setting.searchSide)

    bindSortHTML('展示顺序：', 'setting_search_sort', 'searchList', setting.searchList, searchList)
    bindSortHTML('展示顺序：', 'setting_search_menus_sort', 'searchMenus', setting.searchMenus, searchList)
    bindSortHTML('展示顺序：', 'setting_search_side_sort', 'searchSide', setting.searchSide, searchList)

    // 绑定右键菜单设置
    bindSearchMenus()
}

function getSearchKey(s) {
    let r = {}
    Object.keys(getSearchList(s)).forEach(k => r[k] = k)
    return r
}

function navigate(navId, contentSel) {
    let nav = $(navId)
    let el = nav.querySelectorAll('u')
    let conEl = document.querySelectorAll(contentSel)
    el.forEach(fn => {
        fn.addEventListener('click', function () {
            // 修改活动样式
            el.forEach(elu => {
                rmClass(elu, 'active')
            })
            addClass(this, 'active')

            // 显示对应框
            conEl.forEach(elc => {
                elc.style.display = 'none'
            })
            let target = this.getAttribute('target')
            $(target).style.display = 'block'
        })
    })
    nav.querySelector('u.active').click() // 激活初始值
}

function setBindValue(name, value) {
    setValue(name, value)
    bindValue(name, value)
}

function setValue(name, value) {
    let isArr = isArray(value)
    let el = N(name)
    el && el.forEach(v => {
        let nodeName = v.nodeName
        if (nodeName === 'SELECT') {
            v.value = value
        } else if (nodeName === 'INPUT') {
            if (isArr) {
                let checked = false
                for (let val of value) {
                    if (v.value === val) {
                        checked = true
                        break
                    }
                }
                v.checked = checked
            } else {
                if (v.value === value) v.checked = true
            }
        }
    })
}

function bindValue(name, value) {
    let isArr = isArray(value)
    let el = N(name)
    el && el.forEach(v => {
        v.addEventListener('change', function () {
            let val = this.value
            let nodeName = this.nodeName
            if (nodeName === 'SELECT') {
                value = val
            } else if (nodeName === 'INPUT') {
                if (isArr) {
                    if (this.checked) {
                        value.push(val)
                    } else {
                        for (let k in value) {
                            if (value.hasOwnProperty(k) && val === value[k]) {
                                value.splice(k, 1)
                                break
                            }
                        }
                    }
                } else {
                    value = this.checked ? val : ''
                }
            }

            // 保存设置
            setSetting(name, value)
        })
    })
}

function bindSearchMenus() {
    N('searchMenus').forEach(v => {
        v.addEventListener('change', function () {
            // firefox 在 iframe 下功能缺失，只能通过 message 处理
            sendMessage({action: 'menu', name: this.value, isAdd: this.checked})
        })
    })
}

function bindSortHTML(textName, id, name, value, list) {
    sortShow(textName, id, value, list) // 初始值
    let el = N(name)
    el && el.forEach(v => {
        v.addEventListener('change', function () {
            sortShow(textName, id, value, list)
        })
    })
}

function sortShow(textName, id, value, list) {
    let s = ''
    if (isArray(value) && value.length > 0) {
        s = textName
        value.forEach((v, k) => {
            s += (k > 0 ? ' > ' : '') + list[v]
        })
    }
    $(id).innerHTML = s
}

function bindShow(id, name, value) {
    let el = N(name)
    el && el.forEach(v => {
        v.addEventListener('change', function () {
            $(id).style.display = (!value || value.length === 0) ? 'none' : 'block'
        })
    })
    $(id).style.display = (!value || value.length === 0) ? 'none' : 'block'
}

function settingBoxHTML(id, name, list) {
    let s = ''
    Object.keys(list).forEach(v => {
        s += `<label><input type="checkbox" name="${name}" value="${v}">${list[v]}</label>`
    })
    let el = $(id)
    el.innerHTML = s
}

function settingOcr() {
    let boxEl = $('baidu_ocr_box')
    let akEl = S('input[name="baidu_orc_ak"]')
    let skEl = S('input[name="baidu_orc_sk"]')
    let clearFn = () => localStorage['clearOcrExpires'] = 'true'
    let el = N('ocrType')
    el && el.forEach(v => {
        v.addEventListener('change', function () {
            (this.value === 'baidu' ? addClass : rmClass)(boxEl, 'dmx_show')
            clearFn()
        })
    })
    if (setting.ocrType === 'baidu') addClass(boxEl, 'dmx_show')
    akEl.value = setting.baidu_orc_ak || ''
    skEl.value = setting.baidu_orc_sk || ''
    akEl.onblur = () => {
        setSetting('baidu_orc_ak', akEl.value)
        clearFn()
    }
    skEl.onblur = () => {
        setSetting('baidu_orc_sk', skEl.value)
        clearFn()
    }
}

function searchListSetting() {
    let dialogEl = $('search_list_dialog')
    let butEl = $('search_setting_but')
    let saveEl = $('search_list_save')
    let textEl = S('textarea[name="search_text"]')
    butEl.onclick = () => {
        dialogEl.style.display = 'block'
        addClass(document.body, 'dmx_overflow_hidden')
        textEl.value = searchText
    }
    saveEl.onclick = () => {
        searchText = textEl.value.trim()
        searchList = getSearchKey(searchText)

        // 清理不存在的设置
        let keyArr = Object.keys(searchList)
        let funNewArr = function (arr, isMenu) {
            let newArr = []
            arr.forEach(v => {
                if (keyArr.includes(v)) {
                    newArr.push(v)
                } else if (isMenu) {
                    // 移除右键设置
                    sendMessage({action: 'menu', name: v, isAdd: false})
                }
            })
            return newArr
        }
        setting.searchList = funNewArr(setting.searchList)
        setting.searchMenus = funNewArr(setting.searchMenus)
        setting.searchSide = funNewArr(setting.searchSide)
        setSetting('searchList', setting.searchList)
        setSetting('searchMenus', setting.searchMenus)
        setSetting('searchSide', setting.searchSide)

        // 重新初始化
        initSearch()

        sendMessage({action: 'onSaveSearchText', searchText})
        dal('保存成功')
    }

    // 关闭设置
    $('search_list_back').onclick = function () {
        dialogEl.style.display = 'none'
        rmClass(document.body, 'dmx_overflow_hidden')
    }
}

function localTtsSetting() {
    let listEl = $('local_tts_list')
    let dialogEl = $('local_tts_dialog')
    let butEl = S('[name="translateTTSList"][value="local"]')
    if (isFirefox) {
        butEl.parentElement.style.display = 'none'
        return
    }

    // 关闭设置
    dialogEl.querySelector('.dialog_back').onclick = function () {
        dialogEl.style.display = 'none'
        rmClass(document.body, 'dmx_overflow_hidden')
    }

    // 打开设置
    let i = document.createElement('i')
    i.className = 'dmx-icon dmx-icon-setting'
    i.title = '本地朗读设置'
    i.onclick = function (e) {
        e.preventDefault()
        dialogEl.style.display = 'block'
        addClass(document.body, 'dmx_overflow_hidden')
    }
    butEl.parentNode.appendChild(i)

    // 初始设置
    let langList = {}, voices = {}
    ;(async () => {
        // 语音包
        await fetch('../conf/langSpeak.json').then(r => r.json()).then(r => {
            langList = r
        })

        // 获取发音列表
        await getVoices().then(r => {
            voices = r
        })

        // 归类发音列表
        let specialLang = ['en', 'es', 'nl']
        let voiceList = voiceListSort(voices, specialLang)

        // 创建发音列表
        let s1 = '', s2 = ''
        let ttsKeys = Object.values(conf.ttsList)
        for (const [key, val] of Object.entries(voiceList)) {
            let preName = langList[key] ? langList[key].zhName : key
            let select = `<select key="${key}"><option value="">默认</option>`
            val.forEach(v => {
                let name = v.voiceName + (v.remote ? ' | 远程' : '')
                if (specialLang.includes(key)) name = (langList[v.lang] ? langList[v.lang].zhName : v.lang) + ' | ' + name
                select += `<option value="${v.voiceName}">${name}</option>`
            })
            select += '</select>'
            let row = `<div class="fx mt_1"><div class="local_list_name">${preName}</div>${select}</div>`
            if (ttsKeys.includes(key) || specialLang.includes(key)) {
                s1 += row
            } else {
                s2 += row
            }
        }
        listEl.insertAdjacentHTML('beforeend', `<div class="lang_list">${s1}</div><div class="lang_list_err">${s2}</div>`)

        // 初始发音设置
        if (!setting.ttsConf) setting.ttsConf = {}
        for (let [k, v] of Object.entries(setting.ttsConf)) {
            let vEl = dialogEl.querySelector(`select[key="${k}"]`)
            if (vEl) vEl.value = v
        }

        // 修改发音设置
        let sEl = dialogEl.querySelectorAll('select')
        sEl.forEach(fn => {
            fn.onchange = function () {
                let key = fn.getAttribute('key')
                setting.ttsConf[key] = this.value
                setSetting('ttsConf', setting.ttsConf) // 保存设置
            }
        })

        // 重置发音设置
        $('local_tts_reset_setting').onclick = function () {
            setSetting('ttsConf', {})
            sEl.forEach(fn => {
                fn.value = ''
            })
        }
    })()
}

function voiceListSort(voices, specialLang) {
    let kArr = Object.keys(voices)
    kArr = kArr.sort()
    let r = {}
    kArr.forEach(k => {
        let v = voices[k]
        for (let i = 0; i < specialLang.length; i++) {
            let lan = specialLang[i]
            if (k === lan || (new RegExp(`^${lan}-`)).test(k)) {
                if (!r[lan]) r[lan] = []
                v.forEach(val => r[lan].push(val))
                return
            }
        }
        r[k] = v
    })
    return r
}

function setSetting(name, value) {
    setting[name] = value
    sendSetting(setting, name === 'scribble')
}

function clearSetting() {
    sendSetting({}, true, true)
    setTimeout(() => {
        let url = new URL(location.href)
        url.searchParams.set('r', Date.now() + '')
        location.href = url.toString()
    }, 300)
}

function sendSetting(setting, updateIcon, resetDialog) {
    if (B.getBackgroundPage) {
        B.getBackgroundPage().saveSettingAll(setting, updateIcon, resetDialog)
    } else {
        // firefox 在 iframe 下功能缺失，所以通过 message 处理
        sendMessage({action: 'saveSetting', setting, updateIcon, resetDialog})
    }
}
