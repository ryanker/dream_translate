let conf = {}
chrome.tts.getVoices(function (voices) {
    let arr = {}
    for (let i = 0; i < voices.length; i++) {
        // console.log('Voice ' + i + ':', JSON.stringify(voices[i]))
        let v = voices[i]
        if (!arr[v.lang]) {
            arr[v.lang] = [{voiceName: v.voiceName, remote: v.remote}]
        } else {
            arr[v.lang].push({voiceName: v.voiceName, remote: v.remote})
        }
    }

    // 排序
    let kArr = Object.keys(arr)
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
})

$('speak_voice').addEventListener('change', function () {
    setConf('voiceName', this.value)
})
$('speak_rate').addEventListener('change', function () {
    setConf('rate', this.value)
})
$('speak_pitch').addEventListener('change', function () {
    setConf('pitch', this.value)
})
$('speak_input').addEventListener('paste', function (e) {
    e.stopPropagation()
    e.preventDefault()
    this.innerText = (e.clipboardData || window.clipboardData).getData('Text')
})
$('speak_button').addEventListener('click', function () {
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
        if (text.length < 500) {
            chrome.tts.speak(text, options)
        } else {
            let arr = text.split('\n')
            arr.forEach((v, k) => {
                v = v.trim()
                if (!v) return
                // console.log(v, k)
                if (k === 0) {
                    chrome.tts.speak(v, options)
                } else {
                    options.enqueue = true
                    chrome.tts.speak(v, options)
                }
            })
        }
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
    if (conf.voiceName) $('speak_voice').value = conf.voiceName
    if (conf.rate) $('speak_rate').value = conf.rate
    if (conf.pitch) $('speak_pitch').value = conf.pitch
    // if (conf.voiceName) selectValue($('speak_voice'), conf.voiceName)
    // if (conf.rate) selectValue($('speak_rate'), conf.rate)
    // if (conf.pitch) selectValue($('speak_pitch'), conf.pitch)
}

/*function selectValue(el, value) {
    el.querySelectorAll('option').forEach(v => {
        if (v.value === value) v.selected = true
    })
}*/
