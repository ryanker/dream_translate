'use strict'

function bingTranslate() {
    return {
        token: {
            ig: '',
            iid: '',
            num: 0,
            date: 0,
            ttsToken: '',
            ttsRegion: '',
            ttsExpiry: 0,
        },
        langCheck: '',
        langMap: {
            "auto": "auto-detect",
            "yue": "yue",
            "cs": "cs",
            "nl": "nl",
            "en": "en",
            "fil": "fil",
            "de": "de",
            "el": "el",
            "ht": "ht",
            "hi": "hi",
            "hu": "hu",
            "id": "id",
            "it": "it",
            "mg": "mg",
            "pl": "pl",
            "ro": "ro",
            "ru": "ru",
            "sm": "sm",
            "sk": "sk",
            "th": "th",
            "tr": "tr",
            "afr": "af",
            "ara": "ar",
            "asm": "as",
            "bos": "bs",
            "bul": "bg",
            "cat": "ca",
            "hrv": "hr",
            "dan": "da",
            "est": "et",
            "fin": "fi",
            "fra": "fr",
            "guj": "gu",
            "heb": "he",
            "ice": "is",
            "gle": "ga",
            "jp": "ja",
            "kan": "kn",
            "kaz": "kk",
            "kor": "ko",
            "lav": "lv",
            "lit": "lt",
            "may": "ms",
            "mal": "ml",
            "mlt": "mt",
            "mao": "mi",
            "mar": "mr",
            "nor": "nb",
            "pus": "ps",
            "per": "fa",
            "pan": "pa",
            "slo": "sl",
            "spa": "es",
            "swa": "sw",
            "swe": "sv",
            "tam": "ta",
            "tel": "te",
            "ukr": "uk",
            "urd": "ur",
            "vie": "vi",
            "wel": "cy",
            "zh": "zh-Hans",
            "cht": "zh-Hant",
            "frn": "fr-ca",
            "hmn": "mww",
            "pot": "pt",
            "pt": "pt-pt",
            "srp": "sr-Latn"
        },
        langMapReverse: {},
        lanTTS: ["zh", "en", "jp", "th", "spa", "ara", "fra", "kor", "ru", "de", "pt", "it", "el", "nl", "pl", "fin", "cs", "bul"],
        init() {
            this.langMapReverse = reverseObject(this.langMap)
            let str = localStorage.getItem('bingToken')
            if (str) this.token = JSON.parse(str)
            return this
        },
        setToken(options) {
            this.token = Object.assign(this.token, options)
            localStorage.setItem('bingToken', JSON.stringify(this.token))
        },
        getToken() {
            return new Promise((resolve, reject) => {
                httpGet('https://cn.bing.com/translator').then(r => {
                    let arr = r.match(/,IG:"([^"]+)",/)
                    let tArr = r.match(/_iid="([^"]+)"/)
                    if (!arr) return reject('bing IG empty!')
                    if (!tArr) return reject('bing IID empty!')
                    let token = {ig: arr[1], iid: tArr[1], num: 0, date: Math.floor(Date.now() / 36e5)}
                    this.setToken(token)
                    resolve(token)
                }).catch(e => {
                    reject(e)
                })
            })
        },
        trans(q, srcLan, tarLan) {
            srcLan = this.langMap[srcLan] || 'auto-detect'
            tarLan = this.langMap[tarLan] || 'zh-Hans'
            return new Promise((resolve, reject) => {
                if (q.length > 5000) return reject('The text is too large!')
                if (!this.token.ig) return reject('bing ig empty!')
                if (!this.token.iid) return reject('bing iid empty!')
                let ig = this.token.ig
                let iid = this.token.iid
                let num = ++this.token.num
                let url = `https://cn.bing.com/ttranslatev3?isVertical=1&&IG=${ig}&IID=${iid}.${num}`
                let p = new URLSearchParams(`&fromLang=${srcLan}&text=${q}&to=${tarLan}`)
                httpPost({url: url, body: p.toString()}).then(r => {
                    if (r) {
                        resolve(this.unify(r, q, srcLan, tarLan))
                    } else {
                        reject('bing trans error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        unify(r, q, srcLan, tarLan) {
            // console.log('bing:', r, q, srcLan, tarLan)
            if (srcLan === 'auto-detect' && r[0].detectedLanguage) srcLan = r[0].detectedLanguage.language
            let map = this.langMapReverse
            srcLan = map[srcLan] || 'auto'
            tarLan = map[tarLan] || ''
            let ret = {text: q, srcLan: srcLan, tarLan: tarLan, lanTTS: this.lanTTS, data: []}
            let srcArr = q.split('\n')
            let tarArr = []
            let arr = r && r[0] && r[0].translations
            arr && arr.forEach(v => {
                if (v.text) tarArr = Object.assign(tarArr, v.text.split('\n'))
            })
            tarArr.forEach((v, k) => {
                ret.data.push({srcText: srcArr[k] || '', tarText: v})
            })
            return ret
        },
        async query(q, srcLan, tarLan, noCache) {
            let t = Math.floor(Date.now() / 36e5)
            let d = this.token.date
            if (noCache || !d || Number(d) !== t) {
                await this.getToken().catch(err => {
                    console.warn(err)
                })
            }
            return this.trans(q, srcLan, tarLan)
        },
        tts(q, lan) {
            // see: https://docs.microsoft.com/zh-cn/azure/cognitive-services/speech-service/language-support
            // 英语（美国）	en-US	Female	en-US-JessaRUS
            // 普通话（简体中文，中国）	zh-CN	Female	zh-CN-HuihuiRUS
            let arr = {
                zh: {lang: 'zh-CN', gender: 'Female', name: 'zh-CN-HuihuiRUS'},
                en: {lang: 'en-US', gender: 'Female', name: 'en-US-JessaRUS'},
                jp: {lang: 'ja-JP', gender: 'Female', name: 'ja-JP-Ayumi'},
                th: {lang: 'th-TH', gender: 'Male', name: 'th-TH-Pattara'},
                spa: {lang: 'es-ES', gender: 'Female', name: 'es-ES-Laura'},
                ara: {lang: 'ar-SA', gender: 'Male', name: 'ar-SA-Naayf'},
                fra: {lang: 'fr-FR', gender: 'Female', name: 'fr-FR-Julie-Apollo'},
                kor: {lang: 'ko-KR', gender: 'Female', name: 'ko-KR-HeamiRUS'},
                ru: {lang: 'ru-RU', gender: 'Female', name: 'ru-RU-Irina-Apollo'},
                de: {lang: 'de-DE', gender: 'Female', name: 'de-DE-Hedda'},
                pt: {lang: 'pt-PT', gender: 'Female', name: 'pt-PT-HeliaRUS'},
                it: {lang: 'it-IT', gender: 'Female', name: 'it-IT-Cosimo-Apollo'},
                el: {lang: 'el-GR', gender: 'Male', name: 'el-GR-Stefanos'},
                nl: {lang: 'nl-NL', gender: 'Female', name: 'nl-NL-HannaRUS'},
                pl: {lang: 'pl-PL', gender: 'Female', name: 'pl-PL-PaulinaRUS'},
                fin: {lang: 'fi-FI', gender: 'Female', name: 'fi-FI-HeidiRUS'},
                cs: {lang: 'cs-CZ', gender: 'Male', name: 'cs-CZ-Jakub'},
                bul: {lang: 'bg-BG', gender: 'Male', name: 'bg-BG-Ivan'},
            }
            return new Promise((resolve, reject) => {
                if (!inArray(lan, this.lanTTS)) return reject('This language is not supported!')
                let l = arr[lan] || arr.en

                if (!this.token.ig) return reject('bing ig empty!')
                if (!this.token.iid) return reject('bing iid empty!')
                let ig = this.token.ig
                let iid = this.token.iid
                let num = this.token.num
                let token = this.token.ttsToken
                let region = this.token.ttsRegion
                let expiry = this.token.ttsExpiry

                let ttsBlob = (q, token, region) => {
                    httpPost({
                        url: `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
                        type: 'xml',
                        responseType: 'blob',
                        headers: [
                            {name: 'X-MICROSOFT-OutputFormat', value: 'audio-16khz-32kbitrate-mono-mp3'},
                            {name: 'Authorization', value: `Bearer ${token}`},
                        ],
                        body: `<speak version='1.0' xml:lang='${l.lang}'><voice xml:lang='${l.lang}' xml:gender='${l.gender}' name='${l.name}'><prosody rate='-20.00%'>${q}</prosody></voice></speak>`,
                    }).then(r => {
                        if (r) {
                            resolve(r)
                        } else {
                            reject('bing tts api error!')
                        }
                    }).catch(e => {
                        reject(e)
                    })
                }

                let t = Math.floor(Date.now() / 1000)
                if (expiry - 60 > t) {
                    ttsBlob(q, token, region)
                } else {
                    httpPost({url: `https://cn.bing.com/tfetspktok?isVertical=1&=&IG=${ig}&IID=${iid}.${num}`}).then(r => {
                        if (r && r.token && r.region && r.expiry && r.statusCode === 200) {
                            this.setToken({ttsToken: r.token, ttsRegion: r.region, ttsExpiry: r.expiry * 1})
                            ttsBlob(q, r.token, r.region)
                        } else {
                            reject('bing tts token api error!')
                        }
                    }).catch(e => {
                        reject(e)
                    })
                }
            })
        },
        link(q, srcLan, tarLan) {
            return `https://cn.bing.com/translator?tn=dream_translate`
        },
    }
}
