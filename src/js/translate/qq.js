'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

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
        langMapInvert: {},
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
            this.langMapInvert = invertObject(this.langMap)
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
                // 2021.1.8 修正改版
                openIframe('iframe_qq', 'https://fanyi.qq.com/')
                setTimeout(() => {
                    this.getCookieAll(() => {
                        let qtk = this.getCookie('qtk')
                        let qtv = this.getCookie('qtv')
                        let token = {qtv, qtk}
                        this.setToken(token)
                        resolve(token)
                    })
                }, 1000)

                // todo: 腾讯做的不怎么样，还老改版，浪费时间。收购了搜狗，看样子这个部门要被合并掉了！
                /*let qtv = this.token.qtv
                let qtk = this.token.qtk
                let body = ''
                if (qtv && qtk) body = `qtv=${this.rep(qtv)}&qtk=${this.rep(qtk)}`
                httpPost({url: 'https://fanyi.qq.com/api/reauth1230', body: body}).then(r => {
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
                })*/
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
            onBeforeSendHeadersAddListener(this.onChangeHeaders, {urls: ['*://fanyi.qq.com/api/*']})
        },
        removeListenerRequest() {
            onBeforeSendHeadersRemoveListener(this.onChangeHeaders)
        },
        onChangeHeaders(details) {
            let s = `Host: fanyi.qq.com
Origin: https://fanyi.qq.com
Referer: https://fanyi.qq.com
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin`
            return {requestHeaders: details.requestHeaders.concat(requestHeadersFormat(s))}
        },
        onRequest() {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId)
                this.timeoutId = null
            }
            this.timeoutId = setTimeout(this.removeListenerRequest, 30000)
        },
        trans(q, srcLan, tarLan) {
            srcLan = this.langMap[srcLan] || 'auto'
            tarLan = this.langMap[tarLan] || 'zh'
            if (!inArray(tarLan, this.pairMap[srcLan])) tarLan = this.pairMap[srcLan][0]
            return new Promise((resolve, reject) => {
                if (q.length > 5000) return reject('The text is too large!')
                let qtv = this.token.qtv
                let qtk = this.token.qtk
                let uuid = 'translate_uuid' + (new Date).getTime()
                let p = `source=${srcLan}&target=${tarLan}&sourceText=${encodeURIComponent(q)}&qtv=${this.rep(qtv)}&qtk=${this.rep(qtk)}&sessionUuid=${uuid}`
                httpPost({url: 'https://fanyi.qq.com/api/translate', body: p}).then(r => {
                    this.removeListenerRequest()
                    if (r) {
                        resolve(this.unify(r, q, srcLan, tarLan))
                    } else {
                        reject('qq translate error!')
                    }
                }).catch(e => {
                    this.removeListenerRequest()
                    reject(e)
                })
            })
        },
        unify(r, q, srcLan, tarLan) {
            // console.log('qq:', r, q, srcLan, tarLan)
            if (srcLan === 'auto' && r.translate && r.translate.source) srcLan = r.translate.source
            let map = this.langMapInvert
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
            let domain = 'fanyi.qq.com'
            cookies('set', {url: `https://${domain}`, name: name, value: value, domain: domain, path: '/'}).then(v => {
                this.cookie[v.name] = v.value
            })
        },
        getCookieAll(callback) {
            cookies('getAll', {domain: 'fanyi.qq.com'}).then(arr => {
                arr.forEach(v => {
                    this.cookie[v.name] = v.value
                })
                typeof callback === 'function' && callback()
            })
        },
        getCookie(name) {
            return this.cookie[name] || ''
        },
        tts(q, lan) {
            lan = this.langMap[lan] || 'en'
            return new Promise((resolve) => {
                this.onRequest()
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
