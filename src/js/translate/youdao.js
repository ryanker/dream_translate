'use strict'

function youdaoTranslate() {
    return {
        token: {
            token: '',
            date: 0,
        },
        langMap: {
            "en": "en",
            "ru": "ru",
            "pt": "pt",
            "hi": "hi",
            "de": "de",
            "el": "el",
            "it": "it",
            "id": "id",
            "nl": "nl",
            "kor": "ko",
            "jp": "ja",
            "fra": "fr",
            "spa": "es",
            "ara": "ar",
            "dan": "da",
            "fin": "fi",
            "may": "ms",
            "vie": "vi",
            "zh": "zh-CHS"
        },
        langMapReverse: {},
        lanTTS: ["en", "zh", "jp", "kor", "fra"],
        md5(e) {
            var n = function (e, t) {
                return e << t | e >>> 32 - t
            }, r = function (e, t) {
                var n, r, i, a, o
                return i = 2147483648 & e,
                    a = 2147483648 & t,
                    n = 1073741824 & e,
                    r = 1073741824 & t,
                    o = (1073741823 & e) + (1073741823 & t),
                    n & r ? 2147483648 ^ o ^ i ^ a : n | r
                        ? 1073741824 & o ? 3221225472 ^ o ^ i ^ a
                            : 1073741824 ^ o ^ i ^ a : o ^ i ^ a
            }, i = function (e, t, n) {
                return e & t | ~e & n
            }, a = function (e, t, n) {
                return e & n | t & ~n
            }, o = function (e, t, n) {
                return e ^ t ^ n
            }, s = function (e, t, n) {
                return t ^ (e | ~n)
            }, l = function (e, t, a, o, s, l, c) {
                return e = r(e, r(r(i(t, a, o), s), c)), r(n(e, l), t)
            }, c = function (e, t, i, o, s, l, c) {
                return e = r(e, r(r(a(t, i, o), s), c)), r(n(e, l), t)
            }, u = function (e, t, i, a, s, l, c) {
                return e = r(e, r(r(o(t, i, a), s), c)), r(n(e, l), t)
            }, d = function (e, t, i, a, o, l, c) {
                return e = r(e, r(r(s(t, i, a), o), c)), r(n(e, l), t)
            }, f = function (e) {
                for (var t, n = e.length, r = n + 8, i = 16 * ((r - r % 64) / 64 + 1), a = Array(i - 1), o = 0, s = 0; s < n;) {
                    o = s % 4 * 8, a[t = (s - s % 4) / 4] = a[t] | e.charCodeAt(s) << o, s++
                }
                return t = (s - s % 4) / 4, o = s % 4 * 8, a[t] = a[t] | 128 << o, a[i - 2] = n << 3, a[i - 1] = n >>> 29, a
            }, p = function (e) {
                var t, n = "", r = ""
                for (t = 0; t <= 3; t++) n += (r = "0" + (e >>> 8 * t & 255).toString(16)).substr(r.length - 2, 2)
                return n
            }, h = function (e) {
                e = e.replace(/\x0d\x0a/g, "\n")
                for (var t = "", n = 0; n < e.length; n++) {
                    var r = e.charCodeAt(n)
                    if (r < 128) {
                        t += String.fromCharCode(r)
                    } else if (r > 127 && r < 2048) {
                        t += String.fromCharCode(r >> 6 | 192)
                        t += String.fromCharCode(63 & r | 128)
                    } else if (r >= 55296 && r <= 56319) {
                        if (n + 1 < e.length) {
                            var i = e.charCodeAt(n + 1)
                            if (i >= 56320 && i <= 57343) {
                                var a = 1024 * (r - 55296) + (i - 56320) + 65536
                                t += String.fromCharCode(240 | a >> 18 & 7),
                                    t += String.fromCharCode(128 | a >> 12 & 63),
                                    t += String.fromCharCode(128 | a >> 6 & 63),
                                    t += String.fromCharCode(128 | 63 & a), n++
                            }
                        }
                    } else {
                        t += String.fromCharCode(r >> 12 | 224),
                            t += String.fromCharCode(r >> 6 & 63 | 128),
                            t += String.fromCharCode(63 & r | 128)
                    }
                }
                return t
            }, m = function (e) {
                var t, n, i, a, o, s, m, g, v, y = Array()
                e = h(e), y = f(e), s = 1732584193, m = 4023233417, g = 2562383102, v = 271733878
                for (t = 0; t < y.length; t += 16) {
                    n = s, i = m, a = g, o = v, s = l(s, m, g, v, y[t + 0], 7, 3614090360),
                        v = l(v, s, m, g, y[t + 1], 12, 3905402710),
                        g = l(g, v, s, m, y[t + 2], 17, 606105819),
                        m = l(m, g, v, s, y[t + 3], 22, 3250441966),
                        s = l(s, m, g, v, y[t + 4], 7, 4118548399),
                        v = l(v, s, m, g, y[t + 5], 12, 1200080426),
                        g = l(g, v, s, m, y[t + 6], 17, 2821735955),
                        m = l(m, g, v, s, y[t + 7], 22, 4249261313),
                        s = l(s, m, g, v, y[t + 8], 7, 1770035416),
                        v = l(v, s, m, g, y[t + 9], 12, 2336552879),
                        g = l(g, v, s, m, y[t + 10], 17, 4294925233),
                        m = l(m, g, v, s, y[t + 11], 22, 2304563134),
                        s = l(s, m, g, v, y[t + 12], 7, 1804603682),
                        v = l(v, s, m, g, y[t + 13], 12, 4254626195),
                        g = l(g, v, s, m, y[t + 14], 17, 2792965006),
                        m = l(m, g, v, s, y[t + 15], 22, 1236535329),
                        s = c(s, m, g, v, y[t + 1], 5, 4129170786),
                        v = c(v, s, m, g, y[t + 6], 9, 3225465664),
                        g = c(g, v, s, m, y[t + 11], 14, 643717713),
                        m = c(m, g, v, s, y[t + 0], 20, 3921069994),
                        s = c(s, m, g, v, y[t + 5], 5, 3593408605),
                        v = c(v, s, m, g, y[t + 10], 9, 38016083),
                        g = c(g, v, s, m, y[t + 15], 14, 3634488961),
                        m = c(m, g, v, s, y[t + 4], 20, 3889429448),
                        s = c(s, m, g, v, y[t + 9], 5, 568446438),
                        v = c(v, s, m, g, y[t + 14], 9, 3275163606),
                        g = c(g, v, s, m, y[t + 3], 14, 4107603335),
                        m = c(m, g, v, s, y[t + 8], 20, 1163531501),
                        s = c(s, m, g, v, y[t + 13], 5, 2850285829),
                        v = c(v, s, m, g, y[t + 2], 9, 4243563512),
                        g = c(g, v, s, m, y[t + 7], 14, 1735328473),
                        m = c(m, g, v, s, y[t + 12], 20, 2368359562),
                        s = u(s, m, g, v, y[t + 5], 4, 4294588738),
                        v = u(v, s, m, g, y[t + 8], 11, 2272392833),
                        g = u(g, v, s, m, y[t + 11], 16, 1839030562),
                        m = u(m, g, v, s, y[t + 14], 23, 4259657740),
                        s = u(s, m, g, v, y[t + 1], 4, 2763975236),
                        v = u(v, s, m, g, y[t + 4], 11, 1272893353),
                        g = u(g, v, s, m, y[t + 7], 16, 4139469664),
                        m = u(m, g, v, s, y[t + 10], 23, 3200236656),
                        s = u(s, m, g, v, y[t + 13], 4, 681279174),
                        v = u(v, s, m, g, y[t + 0], 11, 3936430074),
                        g = u(g, v, s, m, y[t + 3], 16, 3572445317),
                        m = u(m, g, v, s, y[t + 6], 23, 76029189),
                        s = u(s, m, g, v, y[t + 9], 4, 3654602809),
                        v = u(v, s, m, g, y[t + 12], 11, 3873151461),
                        g = u(g, v, s, m, y[t + 15], 16, 530742520),
                        m = u(m, g, v, s, y[t + 2], 23, 3299628645),
                        s = d(s, m, g, v, y[t + 0], 6, 4096336452),
                        v = d(v, s, m, g, y[t + 7], 10, 1126891415),
                        g = d(g, v, s, m, y[t + 14], 15, 2878612391),
                        m = d(m, g, v, s, y[t + 5], 21, 4237533241),
                        s = d(s, m, g, v, y[t + 12], 6, 1700485571),
                        v = d(v, s, m, g, y[t + 3], 10, 2399980690),
                        g = d(g, v, s, m, y[t + 10], 15, 4293915773),
                        m = d(m, g, v, s, y[t + 1], 21, 2240044497),
                        s = d(s, m, g, v, y[t + 8], 6, 1873313359),
                        v = d(v, s, m, g, y[t + 15], 10, 4264355552),
                        g = d(g, v, s, m, y[t + 6], 15, 2734768916),
                        m = d(m, g, v, s, y[t + 13], 21, 1309151649),
                        s = d(s, m, g, v, y[t + 4], 6, 4149444226),
                        v = d(v, s, m, g, y[t + 11], 10, 3174756917),
                        g = d(g, v, s, m, y[t + 2], 15, 718787259),
                        m = d(m, g, v, s, y[t + 9], 21, 3951481745),
                        s = r(s, n), m = r(m, i), g = r(g, a), v = r(v, o)
                }
                return (p(s) + p(m) + p(g) + p(v)).toLowerCase()
            }
            return m(e)
        },
        init() {
            this.langMapReverse = reverseObject(this.langMap)
            let str = localStorage.getItem('youdaoToken')
            if (str) this.token = JSON.parse(str)
            return this
        },
        setToken(options) {
            this.token = Object.assign(this.token, options)
            localStorage.setItem('youdaoToken', JSON.stringify(this.token))
        },
        getToken() {
            return new Promise((resolve, reject) => {
                httpGet('http://fanyi.youdao.com/').then(r => {
                    let arr = r.match(/<script.*?src="(http[^"]+fanyi\.min\.js)"/)
                    if (arr) {
                        httpGet(arr[1]).then(r => {
                            let tArr = r.match(/sign:n\.md5\("fanyideskweb"\+e\+i\+"([^"]+)"\)/)
                            if (tArr) {
                                let token = {token: tArr[1], date: Math.floor(Date.now() / 36e5)}
                                this.setToken(token)
                                resolve(token)
                            } else {
                                reject('youdao token error!')
                            }
                        }).catch(e => {
                            reject('youdao js error:', e)
                        })
                    } else {
                        reject('youdao *.min.js error!')
                    }
                }).catch(e => {
                    reject('youdao home error:', e)
                })
            })
        },
        addListenerRequest() {
            onBeforeSendHeadersAddListener(this.onChangeHeaders,
                {urls: ['*://fanyi.youdao.com/*'], types: ['xmlhttprequest']})
        },
        removeListenerRequest() {
            onBeforeSendHeadersRemoveListener(this.onChangeHeaders)
        },
        onChangeHeaders(details) {
            let h = details.requestHeaders
            /*h.some((v, k) => {
                if (v.name.toLowerCase() === 'referer') {
                    h.splice(k, 1)
                    return true
                }
            })*/
            h.push({name: 'Origin', value: 'https://fanyi.youdao.com'})
            h.push({name: 'Referer', value: 'http://fanyi.youdao.com'})
            return {requestHeaders: h}
        },
        trans(q, srcLan, tarLan) {
            srcLan = this.langMap[srcLan] || 'AUTO'
            tarLan = this.langMap[tarLan] || 'zh-CHS'
            if (srcLan !== 'zh-CHS') tarLan = 'zh-CHS' // 有道只支持单一中文互换翻译
            return new Promise((resolve, reject) => {
                if (q.length > 5000) return reject('The text is too large!')
                if (!this.token.token) return reject('youdao token empty!')
                this.addListenerRequest()
                let bv = this.md5(navigator.appVersion), ts = '' + (new Date).getTime(),
                    salt = ts + Math.floor(10 * Math.random())
                let sign = this.md5("fanyideskweb" + q + salt + this.token.token)
                let p = new URLSearchParams(`i=${q}&from=${srcLan}&to=${tarLan}&smartresult=dict&client=fanyideskweb&salt=${salt}&sign=${sign}&lts=${ts}&bv=${bv}&doctype=json&version=2.1&keyfrom=fanyi.web&action=FY_BY_CLICKBUTTION`)
                let url = 'http://fanyi.youdao.com/translate_o?smartresult=dict&smartresult=rule'
                httpPost({url: url, body: p.toString()}).then(r => {
                    this.removeListenerRequest()
                    if (r) {
                        resolve(this.unify(r, q, srcLan, tarLan))
                    } else {
                        reject('youdao trans error!')
                    }
                }).catch(e => {
                    this.removeListenerRequest()
                    reject(e)
                })
            })
        },
        unify(r, q, srcLan, tarLan) {
            // console.log('youdao:', r, q, srcLan, tarLan)
            let lanArr = r.type.split('2')
            if (lanArr.length > 1) srcLan = lanArr[0]
            let map = this.langMapReverse
            srcLan = map[srcLan] || 'auto'
            tarLan = map[tarLan] || ''
            let ret = {text: q, srcLan: srcLan, tarLan: tarLan, lanTTS: this.lanTTS, data: []}
            let arr = r && r.translateResult
            arr && arr.forEach(val => {
                val.forEach(v => {
                    if (v.tgt && v.src) ret.data.push({srcText: v.src, tarText: v.tgt})
                })
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
            return new Promise((resolve, reject) => {
                if (!inArray(lan, this.lanTTS)) return reject('This language is not supported!')
                let lanArr = {en: "eng", zh: 'zh-CHS', jp: "jap", kor: "ko", fra: "fr"}
                let le = lanArr[lan] || lanArr.en
                // resolve(`http://tts.youdao.com/fanyivoice?word=${encodeURIComponent(q)}&le=eng&keyfrom=speaker-target`)
                let getUrl = (s) => {
                    return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(s)}&le=${le}`
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
            return `http://fanyi.youdao.com/?tn=dream_translate`
        },
    }
}
