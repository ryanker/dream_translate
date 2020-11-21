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

    let el = $('speak_voice')
    let j = 0
    for (const [key, val] of Object.entries(arr)) {
        j++
        val.forEach(v => {
            let op = document.createElement('option')
            op.value = v.voiceName
            op.innerText = `${key} | ${v.voiceName}${v.remote ? ' | 远程' : ''}`
            el.appendChild(op)
        })
    }
    // console.log('languages:', j)
    loadConf()
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

function $(id) {
    return document.getElementById(id)
}

function speak(text, options) {
    // console.log(text, options)
    chrome.tts.speak(text, options)
}

function loadConf() {
    let s = localStorage.getItem('speakConf')
    if (!s) return
    conf = JSON.parse(s)
    if (conf.voiceName) selectValue($('speak_voice'), conf.voiceName)
    if (conf.rate) selectValue($('speak_rate'), conf.rate)
    if (conf.pitch) selectValue($('speak_pitch'), conf.pitch)
}

function setConf(key, value) {
    conf[key] = value
    localStorage.setItem('speakConf', JSON.stringify(conf))
}

function selectValue(el, value) {
    el.querySelectorAll('option').forEach(v => {
        if (v.value === value) v.selected = true
    })
}
