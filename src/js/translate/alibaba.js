'use strict'
/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function alibabaTranslate() {
    return {
        langMap: {
            "auto": "auto",
            "en": "en",
            "zh": "zh",
            "ru": "ru",
            "tr": "tr",
            "pt": "pt",
            "th": "th",
            "id": "id",
            "it": "it",
            "spa": "es",
            "fra": "fr",
            "ara": "ar",
            "vie": "vi"
        },
        langMapReverse: {},
        pairMap: {
            "auto": ["en"],
            "en": ["zh", "ru", "es", "fr", "ar", "tr", "pt", "th", "id", "vi"],
            "zh": ["en"],
            "ru": ["en", "es", "tr", "it", "fr", "pt"],
            "es": ["en", "ru", "tr", "it", "fr", "pt"],
            "fr": ["en", "ru", "tr", "it", "es", "pt"],
            "ar": ["en"],
            "tr": ["en", "ru", "fr", "it", "es", "pt"],
            "pt": ["en", "ru", "fr", "it", "es", "tr"],
            "it": ["en", "ru", "fr", "pt", "es", "tr"],
            "th": ["en"],
            "id": ["en"],
            "vi": ["en"]
        },
        init() {
            this.langMapReverse = reverseObject(this.langMap)
            return this
        },
        addListenerRequest() {
            onBeforeSendHeadersAddListener(this.onChangeHeaders,
                {urls: ['*://translate.alibaba.com/*'], types: ['xmlhttprequest']})
        },
        removeListenerRequest() {
            onBeforeSendHeadersRemoveListener(this.onChangeHeaders)
        },
        onChangeHeaders(details) {
            let s = `origin: https://translate.alibaba.com
referer: https://translate.alibaba.com/
sec-fetch-site: same-origin`
            return {requestHeaders: details.requestHeaders.concat(requestHeadersFormat(s))}
        },
        trans(q, srcLan, tarLan) {
            srcLan = this.langMap[srcLan] || 'auto'
            tarLan = this.langMap[tarLan] || 'zh'
            if (!inArray(tarLan, this.pairMap[srcLan])) tarLan = this.pairMap[srcLan][0]
            return new Promise((resolve, reject) => {
                if (q.length > 5000) return reject('The text is too large!')
                this.addListenerRequest()
                let url = `https://translate.alibaba.com/translationopenseviceapp/trans/TranslateTextAddAlignment.do`
                let p = new URLSearchParams(`srcLanguage=${srcLan}&tgtLanguage=${tarLan}&srcText=${q}&viewType=&source=&bizType=message`)
                httpPost({url: url, body: p.toString()}).then(r => {
                    this.removeListenerRequest()
                    if (r) {
                        resolve(this.unify(r, q, srcLan, tarLan))
                    } else {
                        reject('alibaba trans error!')
                    }
                }).catch(e => {
                    this.removeListenerRequest()
                    reject(e)
                })
            })
        },
        unify(r, q, srcLan, tarLan) {
            // console.log('alibaba:', r, q, srcLan, tarLan)
            if (srcLan === 'auto' && r.recognizeLanguage) srcLan = r.recognizeLanguage
            let map = this.langMapReverse
            srcLan = map[srcLan] || 'auto'
            tarLan = map[tarLan] || ''
            let ret = {text: q, srcLan: srcLan, tarLan: tarLan, lanTTS: null, data: []}
            let srcArr = q.split('\n')
            let tarArr = []
            let arr = r && r.listTargetText
            arr && arr.forEach(v => {
                tarArr = Object.assign(tarArr, v.split('\n'))
            })
            tarArr.forEach((v, k) => {
                ret.data.push({srcText: srcArr[k] || '', tarText: v})
            })
            return ret
        },
        async query(q, srcLan, tarLan) {
            return this.trans(q, srcLan, tarLan)
        },
        tts(q, lan) {
            lan = this.langMap[lan] || 'en'
            return new Promise((resolve) => {
                // 阿里云 TTS 有点慢，发音效果也不是太理想，懒得解密了，偷懒直接用搜狗的。
                let getUrl = (s) => {
                    return `https://fanyi.sogou.com/reventondc/synthesis?text=${encodeURIComponent(s)}&speed=1&lang=${lan}&from=translateweb&speaker=3`
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
            return `https://translate.alibaba.com/?tn=dream_translate`
        },
    }
}
