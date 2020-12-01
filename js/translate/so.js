'use strict'

function soTranslate() {
    return {
        data: {},
        init() {
            return this
        },
        addListenerRequest() {
            let arr = navigator.userAgent.match(/Chrome\/(\d+)/)
            let chromeVersion = arr ? Number(arr[1]) : -1
            chrome.webRequest.onBeforeSendHeaders.addListener(this.onChangeHeaders,
                {urls: ['*://fanyi.so.com/*']},
                chromeVersion > 71 ? ['blocking', 'requestHeaders', 'extraHeaders'] : ['blocking', 'requestHeaders'])
        },
        removeListenerRequest() {
            chrome.webRequest.onBeforeSendHeaders.removeListener(this.onChangeHeaders)
        },
        onChangeHeaders(details) {
            let h = details.requestHeaders
            let requestStr = `Host: fanyi.so.com
Origin: https://fanyi.so.com
pro: fanyi
Referer: https://fanyi.so.com/
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin`
            let arr = requestStr.split('\n')
            arr && arr.forEach(v => {
                v = v.trim()
                if (!v) return
                let a = v.split(': ')
                if (a.length === 2) h.push({name: a[0].trim(), value: a[1].trim()})
            })
            return {requestHeaders: h}
        },
        trans(q, srcLan, tarLan) {
            let eng = 0
            if (srcLan === 'en') {
                eng = 1
                tarLan = 'zh'
            } else {
                srcLan = 'zh'
                tarLan = 'en'
            }
            return new Promise((resolve, reject) => {
                if (q.length > 5000) return reject('The text is too large!')
                this.addListenerRequest()
                let url = `https://fanyi.so.com/index/search?eng=${eng}&validate=&ignore_trans=0&query=${encodeURIComponent(q)}`
                let p = new URLSearchParams(`eng=${eng}&validate=&ignore_trans=0&query=${encodeURIComponent(q)}`)
                httpPost({url: url, body: p.toString()}).then(r => {
                    this.removeListenerRequest()
                    if (r) {
                        resolve(this.unify(r, q, srcLan, tarLan))
                    } else {
                        reject('so trans error!')
                    }
                }).catch(e => {
                    this.removeListenerRequest()
                    reject(e)
                })
            })
        },
        unify(r, q, srcLan, tarLan) {
            // console.log('so:', r, q, srcLan, tarLan)
            let ret = {text: q, srcLan: srcLan, tarLan: tarLan, lanTTS: null, data: []}
            let data = r && r.data
            if (data) {
                this.data = data
                if (data.fanyi) ret.data.push({srcText: q, tarText: data.fanyi})
            }
            return ret
        },
        async query(q, srcLan, tarLan) {
            return this.trans(q, srcLan, tarLan)
        },
        tts(q, lan) {
            return new Promise((resolve, reject) => {
                let isEn = lan === 'en'
                let r = this.data?.speak_url
                if (r) {
                    let arr = {}
                    if (r.word_type === 'en2zh') {
                        arr['en'] = r.speak_url
                        arr['zh'] = r.tSpeak_url
                    } else {
                        arr['zh'] = r.speak_url
                        arr['en'] = r.tSpeak_url
                    }
                    resolve(`https://fanyi.so.com` + (isEn ? arr['en'] : arr['zh']))
                } else {
                    reject('speak url empty')
                }
            })
        },
        link(q, srcLan, tarLan) {
            return `https://fanyi.so.com/?tn=dream_translate#${q}`
        },
    }
}
