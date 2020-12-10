'use strict'

let langList, voices, conf = {}
let voiceEl = $('speak_voice')
let rateEl = $('speak_rate')
let pitchEl = $('speak_pitch')
let inputEl = $('speak_input')
let buttonEl = $('speak_button')
document.addEventListener('DOMContentLoaded', async function () {
    if (isFirefox) {
        let d = document.createElement('div')
        d.textContent = 'Firefox 不支持本地朗读功能'
        d.setAttribute('style', 'padding:5px;text-align:center;color:red;font-weight:bold;font-size:20px')
        document.body.appendChild(d)
        return
    }

    // 语音包
    await fetch('../conf/langSpeak.json').then(r => r.json()).then(r => {
        langList = r
    })

    // 获取发音列表
    await getVoices().then(r => {
        voices = r
    })

    // 添加发音列表
    let voiceList = voiceListSort(voices)
    for (const [key, val] of Object.entries(voiceList)) {
        val.forEach(v => {
            let op = document.createElement('option')
            op.value = v.voiceName
            op.innerText = `${langList[key] ? langList[key].zhName : key} | ${v.voiceName}${v.remote ? ' | 远程' : ''}`
            voiceEl.appendChild(op)
        })
    }

    // 初始设置
    loadConf()

    // 修改设置
    voiceEl.addEventListener('change', function () {
        setConf('voiceName', this.value)
    })
    rateEl.addEventListener('change', function () {
        setConf('rate', this.value)
    })
    pitchEl.addEventListener('change', function () {
        setConf('pitch', this.value)
    })

    // 粘贴事件
    inputEl.addEventListener('paste', function (e) {
        e.stopPropagation()
        e.preventDefault()
        this.innerText = (e.clipboardData || window.clipboardData).getData('Text')
    })

    // 开始朗读
    buttonEl.addEventListener('click', function () {
        let text = inputEl.innerText
        let voiceName = voiceEl.value
        let rate = rateEl.value
        let pitch = pitchEl.value
        let options = {}
        if (voiceName) options.voiceName = voiceName
        if (rate) options.rate = Number(rate)
        if (pitch) options.pitch = Number(pitch)
        speak(text, options)
    })

    // 停止朗读
    document.addEventListener('keyup', function (e) {
        if (e.key === 'Escape') B.tts.stop()
    })
})

function $(id) {
    return document.getElementById(id)
}

function voiceListSort(list) {
    if (!list) return {}
    let kArr = Object.keys(list)
    // console.log(kArr.length)
    // console.log(JSON.stringify(kArr.sort()))
    kArr = kArr.sort() // 排序
    let r = {}
    if (list['zh-CN']) r['zh-CN'] = list['zh-CN'] // 中文简体放最前面
    kArr.forEach(k => {
        if (k === 'zh-CN') return
        r[k] = list[k]
    })
    return r
}

function speak(text, options) {
    // console.log(text, options)
    if (text) {
        let arr = B.getBackgroundPage().sliceStr(text, 128)
        arr.forEach((v, k) => {
            if (k === 0) {
                B.tts.speak(v, options)
            } else {
                B.tts.speak(v, Object.assign({enqueue: true}, options))
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
}
