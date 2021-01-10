'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function deeplTranslate() {
    return {
        langMap: {
            "auto": "auto",
            "zh": "zh",
            "en": "en",
            "de": "de",
            "fra": "fr",
            "spa": "es",
            "pt": "pt",
            "it": "it",
            "nl": "nl",
            "pl": "pl",
            "ru": "ru",
            "jp": "ja",
        },
        langMapInvert: {},
        isData: false,
        init() {
            this.langMapInvert = invertObject(this.langMap)
            return this
        },
        trans(q, srcLan, tarLan) {
            srcLan = this.langMap[srcLan] || 'auto'
            tarLan = this.langMap[tarLan] || 'zh'
            return new Promise((resolve, reject) => {
                if (q.length > 5000) return reject('The text is too large!')

                // popup 框
                let url = `https://www.deepl.com/translator#${srcLan}/${tarLan}/${encodeURIComponent(q)}`
                // console.log('url:', url)
                openPopup('popup_DeepL', url, 30 * 1000)

                // 获取请求参数
                let filter = {urls: ['*://*.deepl.com/jsonrpc*'], types: ['xmlhttprequest']} // 请求参数
                this.isData = false
                let onBeforeRequest = (details) => {
                    if (this.isData) return
                    let rBody = details.requestBody
                    let bytes = getJSONValue(rBody, 'raw.0.bytes')
                    if (!bytes) return
                    let body = new TextDecoder().decode(bytes)

                    // 获取数据
                    _setTimeout('trans_DeepL', () => {
                        onBeforeSendHeadersAddListener(onBeforeSendHeaders, filter)
                        let options = {url: details.url, type: 'json', body}
                        httpPost(options).then(r => {
                            removeListener()
                            if (r) {
                                // 超时报错
                                let outId = _setTimeout('trans_DeepL_reject', () => {
                                    reject('DeepL result error!')
                                }, 20 * 1000)
                                let res = this.unify(r, q, srcLan, tarLan)
                                if (res.data && res.data.length > 0) {
                                    if (this.isData) return
                                    this.isData = true // 表示有数据了
                                    resolve(res)
                                    _clearTimeout(outId)
                                }
                            } else {
                                reject('DeepL error!')
                            }
                        }).catch(e => {
                            removeListener()
                            reject(e)
                        })
                    }, 200)
                    // return {cancel: true}
                }
                onBeforeRequestAddListener(onBeforeRequest, filter)

                // 请求接口数据修改
                function onBeforeSendHeaders(details) {
                    let h = details.requestHeaders
                    h.push({name: 'Origin', value: 'https://www.deepl.com'})
                    h.push({name: 'Referer', value: 'https://www.deepl.com/'})
                    h.push({name: 'Sec-Fetch-Site', value: 'same-origin'})
                    return {requestHeaders: h}
                }

                // 销毁
                function removeListener() {
                    onHeadersReceivedRemoveListener(onRemoveFrame)
                    onBeforeSendHeadersRemoveListener(onBeforeSendHeaders)
                    onBeforeRequestRemoveListener(onBeforeRequest)
                }
            })
        },
        unify(r, text, srcLan, tarLan) {
            // console.log('DeepL:', r, text, srcLan, tarLan)
            // console.log(JSON.stringify(r))
            // v1.0 2021.1.10
            if (srcLan === 'auto' && r.source_lang) srcLan = r.source_lang.toLowerCase()
            let map = this.langMapInvert
            srcLan = map[srcLan] || 'auto'
            tarLan = map[tarLan] || ''

            let data = []
            let extra = ''
            let trans = getJSONValue(r, 'result.translations')
            if (trans && trans.length > 0) {
                let srcArr = text.split('\n')
                trans.forEach(tv => {
                    if (!tv.beams) return
                    tv.beams.forEach((v, k) => {
                        let tarText = v.postprocessed_sentence
                        if (tarText) {
                            if (k === 0) {
                                data.push({srcText: srcArr[k] || '', tarText})
                            } else {
                                extra += `<p>${tarText}</p>`
                            }
                        }
                    })
                })
            }
            if (extra) extra = `<div class="case_dd"><div class="case_dd_parts">${extra}</div></div>`
            return {text, srcLan, tarLan, lanTTS: this.lanTTS, data, extra}
        },
        async query(q, srcLan, tarLan) {
            return checkRetry(() => this.trans(q, srcLan, tarLan), 1)
        },
        tts(q, lan) {
            lan = this.langMap[lan] || 'en'
            return new Promise((resolve) => {
                let getUrl = (s) => {
                    return `https://fanyi.sogou.com/reventondc/synthesis?text=${encodeURIComponent(s)}&speed=1&lang=${lan}&from=translateweb&speaker=4`
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
            tarLan = this.langMap[tarLan] || 'zh'
            return `https://www.deepl.com/translator#${srcLan}/${tarLan}/${encodeURIComponent(q)}`
        },
    }
}
