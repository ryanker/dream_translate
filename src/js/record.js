'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let bg = B.getBackgroundPage()
let audioSrc = bg.audioSrc || {}
let maxDuration = 5000
let practice_num = 0
let listen = {}, listen2 = {}, record, compare
document.addEventListener('DOMContentLoaded', async function () {
    playerInit()

    // 加载音频
    setTimeout(() => {
        if (audioSrc.blob) {
            listen.loadBlob(audioSrc.blob)
        } else {
            bg.getAudioBlob(audioSrc.url).then(b => {
                listen.loadBlob(b)
                audioSrc.blob = b
            })
        }
    }, 200)

    let record_box = $('record_box')
    let favorite_form = $('favorite_form')
    let favorite_but = $('favorite_but')
    let sentence_form = $('sentence_form')
    let back_but = $('back_but')
    let sentenceInp = S('input[name="sentence"]')
    let urlInp = S('input[name="url"]')
    let wordsTex = S('textarea[name="words"]')

    // 添加收藏
    favorite_but.addEventListener('click', () => {
        addClass(record_box, 'dmx_hide')
        addClass(favorite_form, 'dmx_show')

        let {url, blob} = audioSrc
        listen2 = playerListen('player_listen2')
        if (blob) listen2.loadBlob(blob)
        if (url) urlInp.value = url
    })

    // 修改链接
    urlInp.addEventListener('blur', () => {
        let url = urlInp.value.trim()
        if (url !== audioSrc.url) bg.getAudioBlob(url).then(blob => listen2.loadBlob(blob))
    })

    // 返回
    back_but.addEventListener('click', () => {
        rmClass(record_box, 'dmx_hide')
        rmClass(favorite_form, 'dmx_show')
    })

    // 提交表单
    sentence_form.addEventListener('submit', (e) => {
        e.preventDefault()
        idb('favorite', 1, initFavorite).then(async db => {
            // 如果链接修改过，重新获取二进制文件
            let url = urlInp.value.trim()
            if (url !== audioSrc.url) await bg.getAudioBlob(audioSrc.url).then(b => audioSrc.blob = b)

            await db.create('sentence', {
                cateId: 0,
                sentence: sentenceInp.value.trim(),
                words: wordsTex.value.trim(),
                remark: '',
                records: 0,
                days: 0,
                url,
                blob: audioSrc.blob,
                createDate: new Date().toJSON(),
            }).then(() => {
                dmxAlert('添加完成', 'success', 2000)
                sentenceInp.value = ''
                wordsTex.value = ''
                back_but.click()
            }).catch(e => {
                // console.log(e)
                let err = e.target.error.message
                let msg = '添加失败'
                if (err && err.includes('uniqueness requirements')) msg = '句子已存在，请勿重复添加'
                dmxAlert(msg, 'error')
            })
        })
    })
})

// 重新渲染
window.addEventListener('resize', function (e) {
    _setTimeout('resize', () => {
        if (audioSrc.blob) listen.loadBlob(audioSrc.blob)
    }, 1000)
})

function playerInit() {
    listen = playerListen('player_listen', {
        onReady: function (duration) {
            let times = 2
            if (duration > 10) times *= 2.5 // 时间越长，模仿越难
            maxDuration = Math.ceil(duration * times) * 1000
            record.setMaxDuration(maxDuration)
        },
        onFinish: () => {
            record.start() // 开始录音
        },
    })

    record = playerRecord('player_record', {
        maxDuration,
        onStop: () => {
            compare.loadBlob(audioSrc.blob)
            compare.once('finish', () => {
                // 恢复 显示开始录音按钮
                let t = setTimeout(() => {
                    listen.showControls() // 显示播放按钮
                }, maxDuration)

                setTimeout(() => {
                    // compare.load(URL.createObjectURL(record.blob))
                    compare.loadBlob(record.blob)
                    compare.once('finish', () => {
                        // 练习次数
                        practice_num++
                        $('practice_num').innerText = practice_num

                        // 显示播放按钮
                        listen.showControls()
                        if (t) {
                            clearTimeout(t)
                            t = null
                        }
                    })
                }, 100)
            })
        },
    })

    compare = playerCompare('player_compare')
}

// 播放
function playerListen(id, options) {
    if (!window._playerListen) window._playerListen = []
    let p = window._playerListen
    if (p[id]) {
        p[id].destroy()
    }

    // 创建元素
    let did = document.getElementById(id)
    let wid = id + '_waveform'
    did.innerHTML = `<div class="dmx_player">
    <div class="dmx_p_top">
        <div class="dmx_p_title">Listen</div>
        <div class="dmx_p_time"><span class="dmx_p_current"></span><span class="dmx_p_duration"></span></div>
    </div>
    <div class="dmx_surfer" id="${wid}"></div>
    <div class="dmx_controls"><button type="button">Play</button></div>
</div>`

    // 初始参数
    let o = Object.assign({
        url: '',
        onReady: null,
        onPlay: null,
        onFinish: null,
    }, options)

    // 基本元素
    let p_current = did.querySelector('.dmx_p_current')
    let p_duration = did.querySelector('.dmx_p_duration')
    let p_controls = did.querySelector('.dmx_controls')

    // 创建播放器
    let wsId = document.getElementById(wid)
    let height = wsId.clientHeight
    let ws, maxDuration
    ws = WaveSurfer.create({
        container: wsId,
        height: height,
        barWidth: 3,
        barHeight: 2,
        backend: 'WebAudio',
        backgroundColor: '#66CCCC', // 背景色
        waveColor: '#CCFF66', // 波纹色
        progressColor: '#FF9900', // 填充色(播放后)
        cursorColor: '#666633', // 指针色
        hideScrollbar: true,
    })
    o.url && ws.load(o.url)
    ws.hideControls = function () {
        p_controls.style.display = 'none'
    }
    ws.showControls = function () {
        p_controls.style.display = 'flex'
    }
    ws.on('ready', function () {
        maxDuration = ws.getDuration()
        if (maxDuration > 0) {
            p_duration.innerText = ' / ' + humanTime(maxDuration)
            p_current.innerText = '00:00:000'
        }
        typeof o.onReady === 'function' && o.onReady(maxDuration)
    })
    ws.on('loading', function (percents) {
        p_controls.style.display = percents === 100 ? 'flex' : 'none'
    })
    ws.on('audioprocess', function (duration) {
        p_current.innerText = humanTime(duration)
    })
    ws.on('play', function () {
        ws.hideControls()
        typeof o.onPlay === 'function' && o.onPlay.call(ws)
    })
    ws.on('finish', function () {
        p_current.innerText = humanTime(maxDuration)
        typeof o.onFinish === 'function' ? o.onFinish.call(ws) : ws.showControls()
    })
    p_controls.addEventListener('click', ws.playPause.bind(ws)) // 绑定事件
    window._playerListen[id] = ws
    return ws
}

// 录音
function playerRecord(id, options) {
    if (!navigator.mediaDevices) return
    if (!window._playerRecord) window._playerRecord = []
    let p = window._playerRecord
    if (p[id]) {
        if (p[id].ws) p[id].ws.destroy()
        if (p[id].recorder) p[id].recorder.destroy()
    }

    // 创建元素
    let did = document.getElementById(id)
    let wid = id + '_waveform'
    did.innerHTML = `<div class="dmx_player">
    <div class="dmx_p_top">
        <div class="dmx_p_title">Record</div>
        <div class="dmx_p_time"><span class="dmx_p_current"></span><span class="dmx_p_duration"></span></div>
    </div>
    <div class="dmx_surfer" id="${wid}"></div>
    <div class="dmx_controls">
        <div class="dmx_circle dmx_reverse"><i class="dmx-icon dmx-icon-voice"></i></div>
        <button type="button" style="display:none">Record</button>
    </div>
</div>`

    // 初始参数
    let o = Object.assign({
        showStartBut: false,
        maxDuration: 5 * 1000,
        mp3Enable: true, // safari 浏览器才启用
        onStart: null,
        onStop: null,
    }, options)

    // 元素
    let p_current = did.querySelector('.dmx_p_current')
    let p_duration = did.querySelector('.dmx_p_duration')
    let p_circle = did.querySelector('.dmx_circle')
    let p_start = did.querySelector('.dmx_controls button')
    let wsId = document.getElementById(wid)
    let height = wsId.clientHeight

    // 初始对象
    let obj = {
        duration: 0,
        recordStartTime: 0, // 开始录制时间
        recorder: null,
        microphone: null,
        ws: null,
        active: false,
        ButEl: {},
        blob: null,
    }

    // 录音中按钮效果
    obj.ButEl.start = () => addClass(p_circle, 'dmx_on')

    // 录音停止按钮效果
    obj.ButEl.stop = () => rmClass(p_circle, 'dmx_on')

    // 绑定开始录音事件
    p_start.addEventListener('click', function () {
        !obj.active && obj.start()
    })

    // 绑定停止录音事件
    p_circle.addEventListener('click', function () {
        if (!obj.active) return

        // 限制最短录音时长
        let minTime = 500
        if (!obj.recordStartTime || ((new Date() * 1) - obj.recordStartTime < minTime)) return

        obj.stop()
    })

    obj.showStartBut = function () {
        p_start.style.display = 'flex'
        p_circle.style.display = 'none'
    }
    obj.hideStartBut = function () {
        p_start.style.display = 'none'
        p_circle.style.display = 'flex'
    }

    // 初始按钮显示
    o.showStartBut ? obj.showStartBut() : obj.hideStartBut()

    // 定时器
    let t, tEnd
    let timeOutStart = function () {
        obj.recordStartTime = new Date() * 1 // 开始录制时间
        tEnd = (new Date() * 1) + Number(o.maxDuration)
        t = setInterval(function () {
            let remain = tEnd - (new Date() * 1)
            if (remain > 0) {
                p_current.innerText = humanTime((o.maxDuration - remain) / 1000)
            } else {
                obj.stop()
                clearInterval(t)
                p_current.innerText = humanTime(o.maxDuration / 1000)
            }
        }, 30)
    }
    let timeOutStop = function () {
        if (tEnd < (new Date() * 1)) return
        let remain = tEnd - (new Date() * 1)
        if (remain > 0) {
            p_current.innerText = humanTime((o.maxDuration - remain) / 1000)
            clearInterval(t)
        }
    }

    // 设置最大录音时长
    obj.setMaxDuration = function (maxDuration) {
        o.maxDuration = Number(maxDuration)
    }

    // 捕获麦克风
    obj.captureMicrophone = function (callback) {
        navigator.mediaDevices.getUserMedia({audio: true}).then(function (stream) {
            obj.microphone = stream
            callback(obj.microphone)
        })
    }

    // 停止麦克风
    obj.stopMicrophone = function () {
        if (!obj.microphone) return
        if (obj.microphone.getTracks) {
            // console.log('microphone getTracks stop...');
            obj.microphone.getTracks().forEach(stream => stream.stop())
        } else if (obj.microphone.stop) {
            // console.log('microphone stop...');
            obj.microphone.stop()
        }
        obj.microphone = null
    }

    // 销毁
    obj.destroy = function () {
        obj.stopMicrophone()
        if (obj.recorder) {
            obj.recorder.destroy()
            obj.recorder = null
        }
        if (obj.ws) {
            obj.ws.destroy()
            obj.ws = null
        }
    }

    // 开始录制
    obj.start = function () {
        if (obj.active) return
        obj.active = true
        obj.recordStartTime = 0

        // 切换按钮显示
        if (o.showStartBut) obj.hideStartBut()

        // 开始录音回调
        typeof o.onStart === 'function' && o.onStart.call(obj)

        // 初始时间
        p_duration.innerText = ' / ' + humanTime(o.maxDuration / 1000)
        p_current.innerText = '00:00:000'

        if (obj.recorder) obj.recorder.destroy()
        if (obj.ws === null) {
            obj.ws = WaveSurfer.create({
                container: wsId,
                height: height,
                barWidth: 3,
                barHeight: 2,
                cursorColor: '#CED5E2', // 指针色
                hideScrollbar: true,
                interact: false,
                plugins: [WaveSurfer.microphone.create()]
            })
            obj.ws.microphone.on('deviceReady', function (stream) {
                obj.microphone = stream
                setTimeout(() => {
                    obj.recorder = window.RecordRTC(stream, {type: 'audio', disableLogs: true})
                    obj.recorder.startRecording()

                    timeOutStart() // 定时器
                    obj.ButEl.start() // 录音中
                }, 300)
            })
            obj.ws.microphone.on('deviceError', function (code) {
                console.warn('Device error: ' + code)
            })
            obj.ws.microphone.start()
        } else {
            !obj.ws.microphone.active && obj.ws.microphone.start()
        }
    }

    // 停止录音
    obj.stop = function () {
        if (!obj.active) return
        obj.active = false

        timeOutStop() // 停止定时器
        obj.ButEl.stop() // 停止录音

        // 停止录音器波纹
        obj.ws.microphone.active && obj.ws.microphone.stop()

        // 停止录音
        obj.recorder.stopRecording(function () {
            // obj.url = this.toURL();
            obj.blob = this.getBlob()
            typeof o.onStop === 'function' && o.onStop.call(obj) // 停止录音回调
        })
    }
    window._playerRecord[id] = obj
    return obj
}

// 对比
function playerCompare(id, options) {
    if (!window._playerCompare) window._playerCompare = []
    let p = window._playerCompare
    if (p[id]) {
        p[id].destroy()
    }

    let did = document.getElementById(id)
    let wid = id + '_waveform'
    did.innerHTML = `<div class="dmx_player">
    <div class="dmx_p_top">
        <div class="dmx_p_title">Compare</div>
        <div class="dmx_p_time"><span class="dmx_p_current"></span><span class="dmx_p_duration"></span></div>
    </div>
    <div class="dmx_surfer" id="${wid}"></div>
    <div class="dmx_controls"><div class="dmx_circle"><i class="dmx-icon dmx-icon-headset-c"></i></div></div>
</div>`

    // 初始参数
    let o = Object.assign({
        url: '',
        autoPlay: true,
    }, options)

    // 初始化
    let p_current = did.querySelector('.dmx_p_current')
    let p_duration = did.querySelector('.dmx_p_duration')
    let but = did.querySelector('.dmx_circle')

    // 创建播放器
    let wsId = document.getElementById(wid)
    let height = wsId.clientHeight
    let ws = WaveSurfer.create({
        container: wsId,
        height: height,
        barWidth: 3,
        barHeight: 2,
        waveColor: '#FFFF66', // 波纹色
        progressColor: '#FFCC99', // 填充色(播放后)
        cursorColor: '#333', // 指针色
        hideScrollbar: true,
        interact: false,
    })
    o.url && ws.load(o.url)
    let maxDuration, isClickPlay
    ws.on('ready', function () {
        maxDuration = ws.getDuration()
        if (maxDuration > 0) {
            p_duration.innerText = ' / ' + humanTime(maxDuration)
            p_current.innerText = '00:00:000'
        }
        ws.setBackgroundColor('#66b1ff')

        // 自动播放
        if (o.autoPlay) {
            isClickPlay = true
            ws.play()
        }
    })
    ws.on('audioprocess', function (duration) {
        p_current.innerText = humanTime(duration)
    })
    ws.on('play', function () {
        addClass(but, 'dmx_on')
    })
    ws.on('finish', function () {
        isClickPlay = false
        p_current.innerText = humanTime(maxDuration)
        ws.setBackgroundColor('')
        ws.empty()
        rmClass(but, 'dmx_on')
    })
    window._playerCompare[id] = ws

    // 解决 Safari 浏览器自动播放音频失败问题
    // but.addEventListener('click', () => {
    //     isClickPlay && ws.play()
    // })
    return ws
}

function humanTime(s, isSecond) {
    if (s <= 0) return isSecond ? '00:00:00' : '00:00:000'
    let hs = Math.floor(s / 3600)
    let ms = hs > 0 ? Math.floor((s - hs * 3600) / 60) : Math.floor(s / 60)
    if (isSecond) {
        return zero(hs) + ':' + zero(ms) + ':' + zero(Math.floor(s % 60))
    } else {
        let se = (s % 60).toFixed(3).replace('.', ':')
        if (hs > 0) {
            return zero(hs) + ':' + zero(ms) + ':' + zero(se, 6)
        } else {
            return zero(ms) + ':' + zero(se, 6)
        }
    }
}

// 补零
function zero(value, digits) {
    digits = digits || 2
    let isNegative = Number(value) < 0
    let s = value.toString()
    if (isNegative) s = s.slice(1)
    let size = digits - s.length + 1
    s = new Array(size).join('0').concat(s)
    return (isNegative ? '-' : '') + s
}
