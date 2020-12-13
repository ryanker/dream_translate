'use strict'
/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let conf, setting, bg = {}
document.addEventListener('DOMContentLoaded', async function () {
    if (!isFirefox) bg = B.getBackgroundPage()
    await fetch('../conf/conf.json').then(r => r.json()).then(r => {
        conf = r
    })
    await storageSyncGet(['setting']).then(function (r) {
        setting = r.setting
    })
    init()
    // debug('conf:', conf)
    // debug('setting:', setting)
})

function init() {
    // 初始展示
    settingBoxHTML('setting_translate_list', 'translateList', conf.translateList)
    settingBoxHTML('setting_translate_tts_list', 'translateTTSList', conf.translateTTSList)
    settingBoxHTML('setting_dictionary_list', 'dictionaryList', conf.dictionaryList)
    settingBoxHTML('setting_dictionary_sound_list', 'dictionarySoundList', conf.dictionarySoundList)
    settingBoxHTML('setting_search_list', 'searchList', conf.searchList)
    settingBoxHTML('setting_search_menus', 'searchMenus', conf.searchList)

    // 绑定导航
    navigate('navigate', '.setting_box')

    // 初始值
    setValue('scribble', setting.scribble)
    setValue('position', setting.position)
    setValue('allowSelect', setting.allowSelect)
    setValue('autoCopy', setting.autoCopy)
    setValue('translateList', setting.translateList)
    setValue('translateTTSList', setting.translateTTSList)
    setValue('dictionaryList', setting.dictionaryList)
    setValue('dictionarySoundList', setting.dictionarySoundList)
    setValue('dictionaryReader', setting.dictionaryReader)
    setValue('searchList', setting.searchList)
    setValue('searchMenus', setting.searchMenus)

    // 绑定值
    bindValue('scribble', setting.scribble)
    bindValue('position', setting.position)
    bindValue('allowSelect', setting.allowSelect)
    bindValue('autoCopy', setting.autoCopy)
    bindValue('translateList', setting.translateList)
    bindValue('translateTTSList', setting.translateTTSList)
    bindValue('dictionaryList', setting.dictionaryList)
    bindValue('dictionarySoundList', setting.dictionarySoundList)
    bindValue('dictionaryReader', setting.dictionaryReader)
    bindValue('searchList', setting.searchList)
    bindValue('searchMenus', setting.searchMenus)

    // 绑定右键菜单设置
    bindSearchMenus()

    // 绑定顺序展示
    bindSortHTML('展示顺序：', 'setting_translate_sort', 'translateList', setting.translateList, conf.translateList)
    bindSortHTML('朗读顺序：', 'setting_translate_tts_sort', 'translateTTSList', setting.translateTTSList, conf.translateTTSList)
    bindSortHTML('展示顺序：', 'setting_dictionary_sort', 'dictionaryList', setting.dictionaryList, conf.dictionaryList)
    bindSortHTML('朗读顺序：', 'setting_dictionary_sound_sort', 'dictionarySoundList', setting.dictionarySoundList, conf.dictionarySoundList)
    bindSortHTML('展示顺序：', 'setting_search_sort', 'searchList', setting.searchList, conf.searchList)
    bindSortHTML('展示顺序：', 'setting_search_menus_sort', 'searchMenus', setting.searchMenus, conf.searchList)

    // 绑定是否显示"朗读"参数
    bindShow('setting_dictionary_reader', 'dictionarySoundList', setting.dictionarySoundList)

    // 本地 TTS 设置
    localTtsSetting()

    // 重置设置
    $('clearSetting').addEventListener('click', clearSetting)
}

function $(id) {
    return document.getElementById(id)
}

function N(id) {
    return document.getElementsByName(id)
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

function setValue(name, value) {
    let el = N(name)
    let t = typeof value
    el && el.forEach(v => {
        if (t === 'object') {
            let checked = false
            for (let k in value) {
                if (value.hasOwnProperty(k) && v.value === value[k]) {
                    checked = true
                    break
                }
            }
            v.checked = checked
        } else {
            if (v.value === value) v.checked = true
        }
    })
}

function bindValue(name, value) {
    let el = N(name)
    el && el.forEach(v => {
        v.addEventListener('change', function () {
            let val = this.value
            if (typeof value === 'object') {
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

            // 保存设置
            setSetting(name, value)
        })
    })
}

function bindSearchMenus() {
    N('searchMenus').forEach(v => {
        v.addEventListener('change', function () {
            // firefox 在 iframe 下功能缺失，只能通过 message 处理
            sendMessage({action: 'menu', name: this.value, checked: this.checked})
        })
    })
}

function bindSortHTML(preName, id, name, value, list) {
    sortShow(preName, id, value, list)
    let el = N(name)
    el && el.forEach(v => {
        v.addEventListener('change', function () {
            sortShow(preName, id, value, list)
        })
    })
}

function sortShow(preName, id, value, list) {
    let s = ''
    if (value.length > 0) {
        s = preName
        value.forEach((v, k) => {
            let o = list[v]
            s += (k > 0 ? ' > ' : '') + (o.title || o)
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
        let o = list[v]
        s += `<label><input type="checkbox" name="${name}" value="${v}">${o.title || o}</label>`
    })
    let el = $(id)
    el.innerHTML = s
}

function localTtsSetting() {
    let listEl = $('local_tts_list')
    let dialogEl = $('local_tts_dialog')
    let butEl = document.querySelector('[name="translateTTSList"][value="local"]')
    if (isFirefox) {
        butEl.parentElement.style.display = 'none'
        return
    }

    // 关闭设置
    dialogEl.querySelector('.dialog_back').onclick = function () {
        dialogEl.style.display = 'none'
    }

    // 打开设置
    let i = document.createElement('i')
    i.className = 'dmx-icon dmx-icon-setting'
    i.title = '本地朗读设置'
    i.onclick = function (e) {
        e.preventDefault()
        dialogEl.style.display = 'block'
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
    if (isFirefox) {
        // firefox 在 iframe 下功能缺失，所以通过 message 处理
        sendMessage({action: 'saveSetting', setting, updateIcon, resetDialog})
    } else {
        bg.saveSettingAll(setting, updateIcon, resetDialog)
    }
}
