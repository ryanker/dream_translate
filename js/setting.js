let bg = chrome.extension.getBackgroundPage()
let conf = bg.conf
let setting = bg.setting
document.addEventListener('DOMContentLoaded', function () {
    init()
})

function init() {
    // 初始展示
    settingBoxHTML('setting_translate_list', 'translateList', conf.translateList)
    settingBoxHTML('setting_translate_tts_list', 'translateTTSList', conf.translateTTSList)
    settingBoxHTML('setting_dictionary_list', 'dictionaryList', conf.dictionaryList)
    settingBoxHTML('setting_dictionary_sound_list', 'dictionarySoundList', conf.dictionarySoundList)
    settingBoxHTML('setting_search_list', 'searchList', conf.searchList)

    // 绑定导航
    navigate('navigate', '.setting_box')

    // 初始值
    setValue('scribble', setting.scribble)
    setValue('position', setting.position)
    setValue('allowSelect', setting.allowSelect)
    setValue('translateList', setting.translateList)
    setValue('translateTTSList', setting.translateTTSList)
    setValue('dictionaryList', setting.dictionaryList)
    setValue('dictionarySoundList', setting.dictionarySoundList)
    setValue('dictionaryReader', setting.dictionaryReader)
    setValue('searchList', setting.searchList)

    // 绑定值
    bindValue('scribble', setting.scribble)
    bindValue('position', setting.position)
    bindValue('allowSelect', setting.allowSelect)
    bindValue('translateList', setting.translateList)
    bindValue('translateTTSList', setting.translateTTSList)
    bindValue('dictionaryList', setting.dictionaryList)
    bindValue('dictionarySoundList', setting.dictionarySoundList)
    bindValue('dictionaryReader', setting.dictionaryReader)
    bindValue('searchList', setting.searchList)

    // 绑定顺序展示
    bindSortHTML('展示顺序：', 'setting_translate_sort', 'translateList', setting.translateList, conf.translateList)
    bindSortHTML('朗读顺序：', 'setting_translate_tts_sort', 'translateTTSList', setting.translateTTSList, conf.translateTTSList)
    bindSortHTML('展示顺序：', 'setting_dictionary_sort', 'dictionaryList', setting.dictionaryList, conf.dictionaryList)
    bindSortHTML('朗读顺序：', 'setting_dictionary_sound_sort', 'dictionarySoundList', setting.dictionarySoundList, conf.dictionarySoundList)
    bindSortHTML('展示顺序：', 'setting_search_sort', 'searchList', setting.searchList, conf.searchList)

    // 绑定是否显示"朗读"参数
    bindShow('setting_translate_reader', 'translateTTSList', setting.translateTTSList)
    bindShow('setting_dictionary_reader', 'dictionarySoundList', setting.dictionarySoundList)

    // 重置设置
    $('resetSetting').addEventListener('click', function () {
        bg.resetSetting(() => {
            fetch('../conf/conf.json').then(r => r.json()).then(r => {
                bg.setting = Object.assign({}, r.setting)
                bg.setSettingAll(bg.setting, () => {
                    location.reload()
                })
            })
        })
    })
}

function $(id) {
    return document.getElementById(id)
}

function N(id) {
    return document.getElementsByName(id)
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
            bg.setSetting(name, value)
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
            s += `${k > 0 ? ' > ' : ''}${list[v]}`
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

function settingBoxHTML(id, name, obj) {
    let s = ''
    for (let k in obj) {
        if (obj.hasOwnProperty(k)) s += `<label><input type="checkbox" name="${name}" value="${k}">${obj[k]}</label>`
    }
    let el = $(id)
    el.innerHTML = s
}
