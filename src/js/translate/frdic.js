'use strict'

function frdicTranslate() {
    return {
        init() {
            return this
        },
        addListenerRequest() {
            let arr = navigator.userAgent.match(/Chrome\/(\d+)/)
            let chromeVersion = arr ? Number(arr[1]) : -1
            chrome.webRequest.onBeforeSendHeaders.addListener(this.onChangeHeaders,
                {urls: ['*://api.frdic.com/api/*']},
                chromeVersion > 71 ? ['blocking', 'requestHeaders', 'extraHeaders'] : ['blocking', 'requestHeaders'])
        },
        removeListenerRequest() {
            chrome.webRequest.onBeforeSendHeaders.removeListener(this.onChangeHeaders)
        },
        onChangeHeaders(details) {
            let h = details.requestHeaders
            h.push({name: 'Origin', value: 'https://dict.eudic.net/'})
            h.push({name: 'Referer', value: 'https://dict.eudic.net/'})
            return {requestHeaders: h}
        },
        encode(s) {
            let Base64 = {
                _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
                encode: function (n) {
                    let f = '', e, t, i, s, h, o, r, u = 0
                    for (n = Base64._utf8_encode(n); u < n.length;)
                        e = n.charCodeAt(u++), t = n.charCodeAt(u++), i = n.charCodeAt(u++), s = e >> 2,
                            h = (e & 3) << 4 | t >> 4, o = (t & 15) << 2 | i >> 6, r = i & 63, isNaN(t) ? o = r = 64 : isNaN(i) && (r = 64),
                            f = f + Base64._keyStr.charAt(s) + Base64._keyStr.charAt(h) + Base64._keyStr.charAt(o) + Base64._keyStr.charAt(r)
                    return f
                },
                decode: function (n) {
                    let t = '', e, o, s, h, u, r, f, i = 0
                    for (n = n.replace(/[^A-Za-z0-9\+\/\=]/g, ""); i < n.length;)
                        h = Base64._keyStr.indexOf(n.charAt(i++)),
                            u = Base64._keyStr.indexOf(n.charAt(i++)),
                            r = Base64._keyStr.indexOf(n.charAt(i++)),
                            f = Base64._keyStr.indexOf(n.charAt(i++)),
                            e = h << 2 | u >> 4,
                            o = (u & 15) << 4 | r >> 2,
                            s = (r & 3) << 6 | f,
                            t = t + String.fromCharCode(e),
                        r !== 64 && (t = t + String.fromCharCode(o)),
                        f !== 64 && (t = t + String.fromCharCode(s))
                    return Base64._utf8_decode(t)
                },
                _utf8_encode: function (n) {
                    let i, r, t
                    for (n = n.replace(/\r\n/g, "\n"), i = "", r = 0; r < n.length; r++)
                        t = n.charCodeAt(r), t < 128 ? i += String.fromCharCode(t) : t > 127 && t < 2048 ?
                            (i += String.fromCharCode(t >> 6 | 192), i += String.fromCharCode(t & 63 | 128)) :
                            (i += String.fromCharCode(t >> 12 | 224), i += String.fromCharCode(t >> 6 & 63 | 128), i += String.fromCharCode(t & 63 | 128))
                    return i
                },
                _utf8_decode: function (n) {
                    let r = '', t = 0, i = 0, c2 = 0, c3 = 0
                    for (; t < n.length;)
                        i = n.charCodeAt(t), i < 128 ? (r += String.fromCharCode(i), t++) : i > 191 && i < 224 ?
                            (c2 = n.charCodeAt(t + 1), r += String.fromCharCode((i & 31) << 6 | c2 & 63), t += 2) :
                            (c2 = n.charCodeAt(t + 1), c3 = n.charCodeAt(t + 2), r += String.fromCharCode((i & 15) << 12 | (c2 & 63) << 6 | c3 & 63), t += 3)
                    return r
                }
            }
            let fix = function (s) {
                return encodeURIComponent(s).replace(/[!'()]/g, escape).replace(/\*/g, "%2A")
            }
            return fix(Base64.encode(s))
        },
        tts(q, lan) {
            this.addListenerRequest()
            return new Promise((resolve, reject) => {
                if (lan === 'auto') lan = 'en'
                let lanArr = {'en': 'en', 'zh': 'zh', 'fra': 'fr', 'de': 'de', 'spa': 'es', 'jp': 'jp'}
                if (!lanArr[lan]) return reject('This language is not supported!')
                lan = lanArr[lan]
                let getUrl = (s) => {
                    return `https://api.frdic.com/api/v2/speech/speakweb?langid=${lan}&txt=QYN${this.encode(s)}`
                }
                let r = []
                let arr = sliceStr(q, 128)
                arr.forEach(text => {
                    r.push(getUrl(text))
                })
                resolve(r)
            })
        },
    }
}
