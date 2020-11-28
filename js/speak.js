let bg = chrome.extension.getBackgroundPage()
let conf = {};

(function (arr) {
    // 排序
    let kArr = Object.keys(arr)
    // console.log(JSON.stringify(kArr.sort()))
    // console.log(kArr.length)
    kArr = kArr.sort()
    let list = {}
    if (arr['zh-CN']) list['zh-CN'] = arr['zh-CN'] // 中文简体放最前面
    kArr.forEach(k => {
        if (k === 'zh-CN') return
        list[k] = arr[k]
    })
    // console.log(list)

    fetch('../conf/langSpeak.json').then(r => r.json()).then(langList => {
        let el = $('speak_voice')
        for (const [key, val] of Object.entries(list)) {
            val.forEach(v => {
                let op = document.createElement('option')
                op.value = v.voiceName
                op.innerText = `${langList[key] ? langList[key].zhName : key} | ${v.voiceName}${v.remote ? ' | 远程' : ''}`
                el.appendChild(op)
            })
        }
        loadConf()
    })
})(bg.voiceList)

let voiceEl = $('speak_voice')
let rateEl = $('speak_rate')
let pitchEl = $('speak_pitch')
let inputEl = $('speak_input')
let buttonEl = $('speak_button')
voiceEl.addEventListener('change', function () {
    setConf('voiceName', this.value)
})
rateEl.addEventListener('change', function () {
    setConf('rate', this.value)
})
pitchEl.addEventListener('change', function () {
    setConf('pitch', this.value)
})
inputEl.addEventListener('paste', function (e) {
    e.stopPropagation()
    e.preventDefault()
    this.innerText = (e.clipboardData || window.clipboardData).getData('Text')
})
buttonEl.addEventListener('click', function () {
    let text = $('speak_input').innerText
    let voiceName = $('speak_voice').value
    let rate = $('speak_rate').value
    let pitch = $('speak_pitch').value
    let options = {}
    if (voiceName) options.voiceName = voiceName
    if (rate) options.rate = Number(rate)
    if (pitch) options.pitch = Number(pitch)
    speak(text, options)
})
document.addEventListener('keyup', function (e) {
    if (e.key === 'Escape') chrome.tts.stop()
})

function $(id) {
    return document.getElementById(id)
}

function speak(text, options) {
    // console.log(text, options)
    if (text) {
        let arr = bg.sliceStr(text, 128)
        arr.forEach((v, k) => {
            if (k === 0) {
                chrome.tts.speak(v, options)
            } else {
                chrome.tts.speak(v, Object.assign({enqueue: true}, options))
            }
        })
    }
}

function setConf(key, value) {
    conf[key] = value
    localStorage.setItem('speakConf', JSON.stringify(conf))
}

function loadConf() {
    let s = localStorage.getItem('speakConf')
    if (!s) return
    conf = JSON.parse(s)
    if (conf.voiceName) voiceEl.value = conf.voiceName
    if (conf.rate) rateEl.value = conf.rate
    if (conf.pitch) pitchEl.value = conf.pitch
    // if (conf.voiceName) selectValue($('speak_voice'), conf.voiceName)
    // if (conf.rate) selectValue($('speak_rate'), conf.rate)
    // if (conf.pitch) selectValue($('speak_pitch'), conf.pitch)
}

/*function selectValue(el, value) {
    el.querySelectorAll('option').forEach(v => {
        if (v.value === value) v.selected = true
    })
}*/
