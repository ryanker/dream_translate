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
            return this
        },
        setToken(options) {
            this.token = Object.assign(this.token, options)
            localStorage.setItem('googleToken', JSON.stringify(this.token))
        },
        getToken() {
            return new Promise((resolve, reject) => {
                httpGet('https://translate.google.cn/translate_a/element.js', 'text').then(r => {
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
        trans(q, srcLan, tarLan) {
            srcLan = this.langMap[srcLan] || 'auto'
            tarLan = this.langMap[tarLan] || 'zh-CN'
            return new Promise((resolve, reject) => {
                if (q.length > 1000) return reject('The text is too large!')
                if (!this.token.tkk) return reject('google tkk empty!')
                let tk = this.sign(q, this.token.tkk)
                let url = `https://translate.google.cn/translate_a/single?client=webapp&sl=${srcLan}&tl=${tarLan}&hl=${navigator.language}&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=sos&dt=ss&dt=t&otf=1&ssel=0&tsel=0&kc=1&tk=${tk}&q=${encodeURIComponent(q)}`
                httpGet(url, 'json').then(r => {
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
            return ret
        },
        async query(q, srcLan, tarLan, noCache) {
            return checkRetry(async (i) => {
                let t = Math.floor(Date.now() / 36e5)
                let d = this.token.tkk
                if (i > 0) noCache = true
                if (noCache || !d || Number(d.split('.')[0]) !== t) {
                    await this.getToken().catch(err => console.warn(err))
                }
                return this.trans(q, srcLan, tarLan)
            })
        },
        tts(q, lan) {
            lan = this.langMap[lan] || 'en'
            return new Promise(async (resolve, reject) => {
                if (!this.token.tkk) await sleep(2000) // 第一次没获取到 tkk, 等待 2 秒后再次尝试
                if (!this.token.tkk) return reject('google tkk empty!')
                // 备用 See:
                // https://cloud.google.com/text-to-speech
                // https://cloud.google.com/translate/docs/basic/translating-text#translate_translate_text-drest
                let getUrl = (s) => {
                    let tk = this.sign(s, this.token.tkk)
                    return `https://translate.google.cn/translate_tts?ie=UTF-8&q=${encodeURIComponent(s)}&tl=${lan}&total=1&idx=0&textlen=${s.length}&tk=${tk}&client=webapp&prev=input`
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
            return `https://translate.google.cn/?sl=${srcLan}&tl=${tarLan}&text=${encodeURIComponent(q)}&op=translate`
        },
    }
}
