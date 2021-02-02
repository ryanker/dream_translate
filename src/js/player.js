'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

window.playerTips = `<div class="learn_points">
    <div class="title"><b>练习要点</b></div>
    <div class="case">
        1、带上耳机听发音，更有助听清声音中的细节。<br>
        2、练句子，把生词融入句子中。「需语法正确的句子」<br>
        3、先理解句子含义。如有生词时，应先根据经验猜，然后才查词典确认猜的对不对。首选查英英词典，推荐朗文或格林斯之类的词典，把英语当工具使用，用英语思维去学习生词。如果还没达到这个能力，才考虑查中英词典。当理解含义后，忘掉所有文字，不管中文还是英文，理解含义为最终目的。<br>
        4、认真听句子发音，并模仿发音。模仿发音时，需要忘掉所有文字，脑海里应浮现出句子运用的场景，你现在的是一个演员，把自己置身在场景中，投入感情和动用感官（视觉，听觉，嗅觉，味觉，触觉）去模仿。<br>
        5、认真听自己的发音和原音的差异。<br>
        6、重复第 4-5 步。直到你感觉语速能跟上，发音接近，并且很流利为止。「练习次数多多益善」
    </div>
</div>

<div class="learn_points">
    <div class="title"><b>语速问题</b></div>
    <div class="case">
        如果感觉语速跟不上，这证明缺乏锻炼，不要想着去降低播放速度，而需要强迫你的耳朵和嘴巴能跟上速度。开始练习发音吧，当你重复练习 N 次后，你会感觉语速变慢了。相信自己，你可以的！
    </div>
</div>

<div class="learn_points">
    <div class="title"><b>语言运用</b></div>
    <div class="case">
        语言是技能，最重要的是实战运用。所以句子练熟之后呢？就需要去使用这些句子，如果你有个友好耐心的老外朋友当陪练那当然最好，没有也不用特别在意，很多学者都发现，在学习外语过程中，跟自己说话，要比跟别人交流更重要。
    </div>
</div>`

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
