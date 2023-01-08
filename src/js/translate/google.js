'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function googleTranslate() {
    return {
        token: {
            tkk: '',
            tk1: '',
            tk2: '',
            tk3: '',
        },
        langMap: {
            "auto": "auto",
            "pl": "pl",
            "de": "de",
            "ru": "ru",
            "ht": "ht",
            "nl": "nl",
            "cs": "cs",
            "ro": "ro",
            "mg": "mg",
            "hmn": "hmn",
            "pt": "pt",
            "sm": "sm",
            "sk": "sk",
            "ceb": "ceb",
            "th": "th",
            "tr": "tr",
            "el": "el",
            "haw": "haw",
            "hu": "hu",
            "it": "it",
            "hi": "hi",
            "id": "id",
            "en": "en",
            "alb": "sq",
            "ara": "ar",
            "amh": "am",
            "aze": "az",
            "gle": "ga",
            "est": "et",
            "baq": "eu",
            "bel": "be",
            "bul": "bg",
            "ice": "is",
            "bos": "bs",
            "per": "fa",
            "tat": "tt",
            "dan": "da",
            "fra": "fr",
            "fil": "tl",
            "fin": "fi",
            "hkm": "km",
            "geo": "ka",
            "guj": "gu",
            "kaz": "kk",
            "kor": "ko",
            "hau": "ha",
            "kir": "ky",
            "glg": "gl",
            "cat": "ca",
            "kan": "kn",
            "cos": "co",
            "hrv": "hr",
            "kur": "ku",
            "lat": "la",
            "lav": "lv",
            "lao": "lo",
            "lit": "lt",
            "ltz": "lb",
            "kin": "rw",
            "mlt": "mt",
            "mar": "mr",
            "mal": "ml",
            "may": "ms",
            "mac": "mk",
            "mao": "mi",
            "ben": "bn",
            "bur": "my",
            "nep": "ne",
            "nor": "no",
            "pan": "pa",
            "pus": "ps",
            "nya": "ny",
            "jp": "ja",
            "swe": "sv",
            "sin": "si",
            "epo": "eo",
            "slo": "sl",
            "swa": "sw",
            "som": "so",
            "tgk": "tg",
            "tel": "te",
            "tam": "ta",
            "tuk": "tk",
            "wel": "cy",
            "urd": "ur",
            "ukr": "uk",
            "uzb": "uz",
            "spa": "es",
            "heb": "iw",
            "snd": "sd",
            "sna": "sn",
            "arm": "hy",
            "ibo": "ig",
            "yid": "yi",
            "yor": "yo",
            "vie": "vi",
            "afr": "af",
            "xho": "xh",
            "zul": "zu",
            "srp": "sr",
            "jav": "jw",
            "zh": "zh-CN",
            "fry": "fy",
            "sco": "gd",
            "sun": "su",
            "or": "or",
            "mn": "mn",
            "st": "st",
            "ug": "ug"
        },
        langMapInvert: {},
        sign(t, e) {
            let xe = '', Ue = function (t, e) {
                for (let r = 0, n; r < e.length - 2; r += 3) {
                    n = "a" <= (n = e.charAt(r + 2)) ? n.charCodeAt(0) - 87 : Number(n)
                    n = "+" === e.charAt(r + 1) ? t >>> n : t << n
                    t = "+" === e.charAt(r) ? t + n & 4294967295 : t ^ n
                }
                return t
            }
            let r, n = (r = '' !== xe ? xe : (xe = e || "") || "").split(".")
            r = Number(n[0]) || 0
            let o = [], a = 0, c = 0
            for (; c < t.length; c++) {
                let i = t.charCodeAt(c)
                128 > i ? o[a++] = i : (2048 > i ? o[a++] = i >> 6 | 192 : (55296 === (64512 & i) && c + 1 < t.length && 56320 === (64512 & t.charCodeAt(c + 1))
                    ? (i = 65536 + ((1023 & i) << 10) + (1023 & t.charCodeAt(++c)), o[a++] = i >> 18 | 240, o[a++] = i >> 12 & 63 | 128) :
                    o[a++] = i >> 12 | 224, o[a++] = i >> 6 & 63 | 128), o[a++] = 63 & i | 128)
            }
            for (t = r, a = 0; a < o.length; a++) t += o[a], t = Ue(t, "+-a^+6")
            return t = Ue(t, "+-3^+b+-f"), 0 > (t ^= Number(n[1]) || 0) && (t = 2147483648 + (2147483647 & t)), (t %= 1e6).toString() + "." + (t ^ r)
        },
        init() {
            this.langMapInvert = invertObject(this.langMap)
            let str = localStorage.getItem('googleToken')
            if (str) this.token = JSON.parse(str)
            onHeadersReceivedAddListener(onRemoveCross, {urls: ["*://translate.google.com/translate_tts*"]})
            return this
        },
        setToken(options) {
            this.token = Object.assign(this.token, options)
            localStorage.setItem('googleToken', JSON.stringify(this.token))
        },
        getToken() {
            return new Promise((resolve, reject) => {
                httpGet('https://translate.google.com/translate_a/element.js', 'text').then(r => {
                    // let arr = r.match(/tkk:'(\d+\.\d+)'/)
                    let arr = r.match(/_ctkk='(\d+\.\d+)'/)
                    if (!arr) return reject('google tkk empty!')
                    let token = {tkk: arr[1]}
                    this.setToken(token)
                    resolve(token)
                }).catch(function (e) {
                    reject(e)
                })
            })
        },
        getTokenNew() {
            return new Promise((resolve, reject) => {
                httpGet('https://translate.google.com', 'text').then(r => {
                    let arr1 = r.match(/"FdrFJe":"(.*?)"/)
                    if (!arr1) return reject('google tk1 empty!')
                    let arr2 = r.match(/"cfb2h":"(.*?)"/)
                    if (!arr2) return reject('google tk2 empty!')
                    let arr3 = r.match(/"SNlM0e":"(.*?)"/)

                    let token = {tk1: arr1[1], tk2: arr2[1]}
                    if (arr3 && arr3[1]) token.tk3 = arr3[1]
                    token.date = Date.now()
                    this.setToken(token)
                    resolve(token)
                }).catch(function (e) {
                    reject(e)
                })
            })
        },
        trans(q, srcLan, tarLan) {
            srcLan = this.langMap[srcLan] || 'auto'
            tarLan = this.langMap[tarLan] || 'zh-CN'
            return new Promise(async (resolve, reject) => {
                if (q.length > 1000) return reject('The text is too large!')
                if (!this.token.tkk) return reject('google tkk empty!')
                let tk = this.sign(q, this.token.tkk)

                // let url = `https://translate.google.com/translate_a/single?client=webapp&sl=${srcLan}&tl=${tarLan}&hl=${navigator.language}&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=sos&dt=ss&dt=t&otf=1&ssel=0&tsel=0&kc=1&tk=${tk}&q=${encodeURI(q)}`
                let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${srcLan}&tl=${tarLan}&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=sos&dt=ss&dt=t&otf=1&ssel=0&tsel=0&kc=1&&q=${encodeURI(q)}&tk=${tk}`
                await httpGet(url, 'json').then(r => {
                    if (r) {
                        resolve(this.unify(r, q, srcLan, tarLan))
                    } else {
                        reject('google translate error!')
                    }
                }).catch(function (e) {
                    reject(e)
                })
            })
        },
        transNew(q, srcLan, tarLan) {
            srcLan = this.langMap[srcLan] || 'auto'
            tarLan = this.langMap[tarLan] || 'zh-CN'
            return new Promise(async (resolve, reject) => {
                if (q.length > 1000) return reject('The text is too large!')

                let t = this.token
                if (!t.tk1) return reject('google tk1 empty!')
                if (!t.tk2) return reject('google tk2 empty!')

                let req = JSON.stringify([[["MkEWBc", JSON.stringify([[q, srcLan, tarLan, !0], [null]]), null, "generic"]]])
                let p = new URLSearchParams(`f.req=${req}&at=${t.tk3 || ''}`)
                let rid = Math.floor(1e3 + 9e3 * Math.random())
                this.addListenerRequest()
                httpPost({
                    url: `https://translate.google.com/_/TranslateWebserverUi/data/batchexecute?rpcids=MkEWBc&f.sid=${t.tk1}&bl=${t.tk2}&hl=zh-CN&soc-app=1&soc-platform=1&soc-device=1&_reqid=${rid}&rt=c`,
                    body: p.toString(),
                    responseType: 'text'
                }).then(r => {
                    this.removeListenerRequest()
                    if (!r) return reject('google translate error!')

                    let arr = r.split('\n')
                    if (!arr[3]) return reject('google translate error No.1!')

                    let arr2 = JSON.parse(arr[3])
                    if (!arr2[0] || !arr2[0][2]) return reject('google translate error No.2!')

                    let arr3 = JSON.parse(arr2[0][2])
                    // console.log(arr3)
                    // console.log(JSON.stringify(arr3))

                    resolve(this.unifyNew(arr3, q, srcLan, tarLan))
                }).catch(e => {
                    this.removeListenerRequest()
                    reject(e)
                })
            })
        },
        unify(r, q, srcLan, tarLan) {
            // console.log('google:', r, q, srcLan, tarLan)
            if (srcLan === 'auto' && r[2]) srcLan = r[2]
            let map = this.langMapInvert
            srcLan = map[srcLan] || 'auto'
            tarLan = map[tarLan] || ''
            let ret = {text: q, srcLan: srcLan, tarLan: tarLan, lanTTS: null, data: []}
            let arr = r && r[0]
            arr && arr.forEach(v => {
                if (v[0] && v[1]) ret.data.push({srcText: v[1], tarText: v[0]})
            })
            if (!setting.translateThin && r[1] && isArray(r[1])) {
                let s = ''
                if (arr[0][1]) s += `<div class="case_dd_head">${arr[0][1]}</div>`  // 查询的单词
                s += `<div class="case_dd_parts">`
                r[1].forEach(v => {
                    if (v[0] && v[1]) s += `<p>${v[0] ? `<b>${v[0]}</b>` : ''}${v[1].join('；')}</p>`
                })
                s += `</div>`
                ret.extra = `<div class="case_dd">${s}</div>`
            }
            return ret
        },
        unifyNew(r, q, srcLan, tarLan) {
            // console.log('google:', r, q, srcLan, tarLan)
            let rt = getJSONValue(r, '2')
            let arr1 = getJSONValue(r, '0.4')
            let arr2 = getJSONValue(r, '1.0.0.5')
            // console.log(rt, arr1, arr2)
            if (srcLan === 'auto' && rt[3]) srcLan = rt[3]
            let map = this.langMapInvert
            srcLan = map[srcLan] || 'auto'
            tarLan = map[tarLan] || ''
            let ret = {text: q, srcLan: srcLan, tarLan: tarLan, lanTTS: null, data: []}

            let i = 0
            arr1 && arr1.forEach(v => {
                let srcText = v[0].trim()
                let tarText = getJSONValue(arr2, `${i}.0`)
                if (srcText && tarText) {
                    ret.data.push({srcText, tarText})
                    i++
                }
            })

            // 单词详情
            let arr3 = getJSONValue(r, '3.5.0')
            if (!setting.translateThin && arr3 && isArray(arr3)) {
                let word = getJSONValue(r, '3.0')
                let s = ''
                if (word) s += `<div class="case_dd_head">${word}</div>`  // 查询的单词
                s += `<div class="case_dd_parts">`
                arr3.forEach(v => {
                    if (v[0] && v[1]) {
                        if (v[1] && isArray(v[1])) {
                            let a2 = []
                            v[1].forEach(v2 => {
                                a2.push(v2[0])
                            })
                            s += `<p>${v[0] ? `<b>${v[0]}</b>` : ''}${a2.join('；')}</p>`
                        }
                    }
                })
                s += `</div>`
                ret.extra = `<div class="case_dd">${s}</div>`
            }
            return ret
        },
        async query(q, srcLan, tarLan, noCache) {
            return checkRetry(async (i) => {
                if (i === 1) {
                    let t = Math.floor(Date.now() / 36e5)
                    let d = this.token.tkk
                    if (i > 0) noCache = true
                    if (noCache || !d || Number(d.split('.')[0]) !== t) {
                        await this.getToken().catch(err => console.warn(err))
                    }
                    return this.trans(q, srcLan, tarLan)
                } else {
                    // if (Date.now() - this.token.date > 3e5) {
                    //     await this.getTokenNew().catch(err => console.warn(err))
                    // }
                    await this.getTokenNew().catch(err => console.warn(err))
                    return this.transNew(q, srcLan, tarLan)
                }
            })
        },
        addListenerRequest() {
            onBeforeSendHeadersAddListener(this.onChangeHeaders,
                {urls: ['*://translate.google.com/*'], types: ['xmlhttprequest']})
        },
        removeListenerRequest() {
            onBeforeSendHeadersRemoveListener(this.onChangeHeaders)
        },
        onChangeHeaders(details) {
            let s = `origin: https://translate.google.com
referer: https://translate.google.com`
            return {requestHeaders: details.requestHeaders.concat(requestHeadersFormat(s))}
        },
        tts(q, lan) {
            lan = this.langMap[lan] || 'en'
            return new Promise(async (resolve, reject) => {
                if (!this.token.tkk) await sleep(1000) // 第一次没获取到 tkk, 等待 1 秒后再次尝试
                if (!this.token.tkk) return reject('google tkk empty!')
                // 备用 See:
                // https://cloud.google.com/text-to-speech
                // https://cloud.google.com/translate/docs/basic/translating-text#translate_translate_text-drest
                let getUrl = (s) => {
                    // 2021.6.4 google TTS 官方接口调整后，声音变的比以前难听多了，耳朵有点难受。
                    // let tk = this.sign(s, this.token.tkk)
                    // return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURI(s)}&tl=${lan}&total=1&idx=0&textlen=${s.length}&tk=${tk}&client=webapp&prev=input`
                    return `https://translate.googleapis.com/translate_tts?client=gtx&tl=${lan}&ie=UTF-8&q=${encodeURI(s)}`
                    // return `https://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&client=tw-ob&tl=${lan}&q=${encodeURI(s)}&textlen=${s.length}`
                }
                let r = []
                let arr = sliceStr(q, 128)
                arr.forEach(text => {
                    r.push(getUrl(text))
                })
                resolve(r)
            })
        },
        link(q, srcLan, tarLan) {
            srcLan = this.langMap[srcLan] || 'auto'
            tarLan = this.langMap[tarLan] || 'zh-CN'
            return `https://translate.google.com/?sl=${srcLan}&tl=${tarLan}&text=${encodeURI(q)}&op=translate`
        },
    }
}
