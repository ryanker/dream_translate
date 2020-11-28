'use strict'

function qqTranslate() {
    return {
        token: {
            qtv: '',
            qtk: '',
        },
        cookie: {},
        langMap: {
            "auto": "auto",
            "zh": "zh",
            "en": "en",
            "jp": "jp",
            "it": "it",
            "de": "de",
            "tr": "tr",
            "ru": "ru",
            "pt": "pt",
            "id": "id",
            "th": "th",
            "hi": "hi",
            "kor": "kr",
            "fra": "fr",
            "spa": "es",
            "vie": "vi",
            "ara": "ar",
            "may": "ms"
        },
        langMapReverse: {},
        pairMap: {
            auto: ["zh", "en", "jp", "kr", "fr", "es", "it", "de", "tr", "ru", "pt", "vi", "id", "th", "ms"],
            en: ["zh", "fr", "es", "it", "de", "tr", "ru", "pt", "vi", "id", "th", "ms", "ar", "hi"],
            zh: ["en", "jp", "kr", "fr", "es", "it", "de", "tr", "ru", "pt", "vi", "id", "th", "ms"],
            fr: ["zh", "en", "es", "it", "de", "tr", "ru", "pt"],
            es: ["zh", "en", "fr", "it", "de", "tr", "ru", "pt"],
            it: ["zh", "en", "fr", "es", "de", "tr", "ru", "pt"],
            de: ["zh", "en", "fr", "es", "it", "tr", "ru", "pt"],
            tr: ["zh", "en", "fr", "es", "it", "de", "ru", "pt"],
            ru: ["zh", "en", "fr", "es", "it", "de", "tr", "pt"],
            pt: ["zh", "en", "fr", "es", "it", "de", "tr", "ru"],
            vi: ["zh", "en"],
            id: ["zh", "en"],
            ms: ["zh", "en"],
            th: ["zh", "en"],
            jp: ["zh"],
            kr: ["zh"],
            ar: ["en"],
            hi: ["en"]
        },
        init() {
            this.langMapReverse = objectReverse(this.langMap)
            let str = localStorage.getItem('qqToken')
            if (str) this.token = JSON.parse(str)
            this.getCookieAll()
            return this
        },
        setToken(options) {
            this.token = Object.assign(this.token, options)
            localStorage.setItem('qqToken', JSON.stringify(this.token))
        },
        getToken() {
            return new Promise((resolve, reject) => {
                let qtv = this.token.qtv
                let qtk = this.token.qtk
                let body = ''
                if (qtv && qtk) body = `qtv=${this.rep(qtv)}&qtk=${this.rep(qtk)}`
                // todo: 腾讯老改版，浪费时间
                httpPost({url: 'https://fanyi.qq.com/api/reauth123f', body: body}).then(r => {
                    if (r) {
                        let token = {qtv: r.qtv, qtk: r.qtk}
                        this.setToken(token)
                        this.setCookie('qtk', r.qtk)
                        this.setCookie('qtv', r.qtv)
                        resolve(token)
                    } else {
                        reject('qq reaauth error!')
                    }
                }).catch(e => {
                    reject(e)
                })
                /*httpGet('https://fanyi.qq.com/').then(r => {
                    let arr = r.match(/var qtv = "([^"]+)";/)
                    let tArr = r.match(/var qtk = "([^"]+)";/)
                    if (!arr) return reject('qq gtk empty!')
                    if (!tArr) return reject('qq token empty!')
                    let token = {qtv: arr[1], qtk: tArr[1], date: Math.floor(Date.now() / 36e5)}
                    this.setToken(token)
                    resolve(token)
                }).catch(e => {
                    reject(e)
                })*/
            })
        },
        rep(s) {
            return s.replace(/\+/g, '%2B')
        },
        addListenerRequest() {
            let arr = navigator.userAgent.match(/Chrome\/(\d+)/)
            let chromeVersion = arr ? Number(arr[1]) : -1
            chrome.webRequest.onBeforeSendHeaders.addListener(this.onChangeHeaders,
                {urls: ['*://fanyi.qq.com/api/*']},
                chromeVersion > 71 ? ['blocking', 'requestHeaders', 'extraHeaders'] : ['blocking', 'requestHeaders'])
        },
        removeListenerRequest() {
            chrome.webRequest.onBeforeSendHeaders.removeListener(this.onChangeHeaders)
        },
        onChangeHeaders(details) {
            let h = details.requestHeaders
            let requestStr = `Host: fanyi.qq.com
Origin: https://fanyi.qq.com
Referer: https://fanyi.qq.com
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
            srcLan = this.langMap[srcLan] || 'auto'
            tarLan = this.langMap[tarLan] || 'zh'
            if (!inArray(tarLan, this.pairMap[srcLan])) tarLan = this.pairMap[srcLan][0]
            return new Promise((resolve, reject) => {
                if (q.length > 5000) return reject('The text is too large!')
                setTimeout(this.removeListenerRequest, 200)
                let qtv = this.token.qtv
                let qtk = this.token.qtk
                let uuid = 'translate_uuid' + (new Date).getTime()
                let p = `source=${srcLan}&target=${tarLan}&sourceText=${encodeURIComponent(q)}&qtv=${this.rep(qtv)}&qtk=${this.rep(qtk)}&sessionUuid=${uuid}`
                httpPost({url: 'https://fanyi.qq.com/api/translate', body: p}).then(r => {
                    if (r) {
                        resolve(this.unify(r, q, srcLan, tarLan))
                    } else {
                        reject('qq translate error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        unify(r, q, srcLan, tarLan) {
            // console.log('qq:', r, q, srcLan, tarLan)
            if (srcLan === 'auto' && r.translate && r.translate.source) srcLan = r.translate.source
            let map = this.langMapReverse
            srcLan = map[srcLan] || 'auto'
            tarLan = map[tarLan] || ''
            let ret = {text: q, srcLan: srcLan, tarLan: tarLan, lanTTS: null, data: []}
            let arr = r && r.translate && r.translate.records
            arr && arr.forEach(v => {
                let srcText = v.sourceText ? v.sourceText.trim() : ''
                let tarText = v.targetText ? v.targetText.trim() : ''
                if (srcText && tarText) ret.data.push({srcText: srcText, tarText: tarText})
            })
            return ret
        },
        async query(q, srcLan, tarLan) {
            this.addListenerRequest()
            await this.getToken().catch(err => {
                debug('qq getToken error:', err)
            })
            return this.trans(q, srcLan, tarLan)
        },
        setCookie(name, value) {
            chrome.cookies.set({
                url: 'https://fanyi.qq.com/',
                name: name,
                value: value,
                domain: 'fanyi.qq.com',
                path: '/'
            }, v => {
                if (!chrome.runtime.lastError) this.cookie[v.name] = v.value
            })
        },
        getCookieAll() {
            chrome.cookies.getAll({domain: 'fanyi.qq.com'}, cookies => {
                cookies.forEach(v => {
                    // this.cookie.push({name: v.name, value: v.value})
                    this.cookie[v.name] = v.value
                })
            })
        },
        getCookie(name) {
            return this.cookie[name] || ''
        },
        tts(q, lan) {
            lan = this.langMap[lan] || 'en'
            return new Promise((resolve) => {
                this.addListenerRequest()
                setTimeout(() => {
                    this.removeListenerRequest()
                }, 200)
                let guid = this.getCookie('fy_guid')
                // todo: 腾讯 TTS 服务很不稳定
                resolve(`https://fanyi.qq.com/api/tts?platform=PC_Website&lang=${lan}&text=${encodeURIComponent(q)}&guid=${guid}`)
            })
        },
        link(q, srcLan, tarLan) {
            return `https://fanyi.qq.com/?tn=dream_translate`
        },
    }
}
