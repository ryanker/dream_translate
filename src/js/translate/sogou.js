'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function sogouTranslate() {
    return {
        langMap: {
            "auto": "auto",
            "pl": "pl",
            "de": "de",
            "ru": "ru",
            "fil": "fil",
            "ht": "ht",
            "nl": "nl",
            "cs": "cs",
            "ro": "ro",
            "mg": "mg",
            "pt": "pt",
            "sk": "sk",
            "sm": "sm",
            "th": "th",
            "tr": "tr",
            "el": "el",
            "hu": "hu",
            "en": "en",
            "it": "it",
            "hi": "hi",
            "id": "id",
            "yue": "yue",
            "ara": "ar",
            "est": "et",
            "bul": "bg",
            "bos": "bs-Latn",
            "per": "fa",
            "dan": "da",
            "fra": "fr",
            "fin": "fi",
            "kor": "ko",
            "kli": "tlh",
            "hrv": "hr",
            "lav": "lv",
            "lit": "lt",
            "may": "ms",
            "mlt": "mt",
            "ben": "bn",
            "afr": "af",
            "nor": "no",
            "jp": "ja",
            "swe": "sv",
            "slo": "sl",
            "srp": "sr-Latn",
            "src": "sr-Cyrl",
            "swa": "sw",
            "wel": "cy",
            "ukr": "uk",
            "urd": "ur",
            "spa": "es",
            "heb": "he",
            "vie": "vi",
            "cat": "ca",
            "zh": "zh-CHS",
            "cht": "zh-CHT"
        },
        langMapInvert: {},
        init() {
            this.langMapInvert = invertObject(this.langMap)
            return this
        },
        // 2020.12.03 刚写完就改版，白破解了！要吐了。。。
        /*transOld(q, srcLan, tarLan) {
            srcLan = this.langMap[srcLan] || 'auto'
            tarLan = this.langMap[tarLan] || 'zh-CHS'
            return new Promise((resolve, reject) => {
                if (q.length > 5000) return reject('The text is too large!')

                // 取消 Frame 嵌入限制
                onHeadersReceivedAddListener(onRemoveFrame, {urls: ["*://fanyi.sogou.com/*"]})

                // Frame 请求
                let url = `https://fanyi.sogou.com/?keyword=${encodeURIComponent(q)}&transfrom=${srcLan}&transto=${tarLan}&model=general`
                openIframe('iframe_soGou', url)

                // 获取请求参数
                let urls = ['*://fanyi.sogou.com/reventondc/translateV*']
                let isFirst = false
                let onBeforeRequest = function (details) {
                    if (isFirst) return
                    isFirst = true

                    let data = details.requestBody.formData
                    // console.log(data)
                    let url = details.url
                    setTimeout(() => {
                        post(url, data)
                    }, 200)
                    return {cancel: true}
                }
                onBeforeRequestAddListener(onBeforeRequest, {urls: urls})

                // 请求接口数据修改
                let onBeforeSendHeaders = function (details) {
                    let h = details.requestHeaders
                    h.push({name: 'Host', value: 'fanyi.sogou.com'})
                    h.push({name: 'Origin', value: 'https://fanyi.sogou.com'})
                    h.push({name: 'Referer', value: url})
                    h.push({name: 'Sec-Fetch-Site', value: 'same-origin'})
                    return {requestHeaders: h}
                }

                // 销毁
                let removeListener = function () {
                    // el.remove()
                    onHeadersReceivedRemoveListener(onRemoveFrame)
                    onBeforeSendHeadersRemoveListener(onBeforeSendHeaders)
                    onBeforeRequestRemoveListener(onBeforeRequest)
                }

                // 获取数据
                let post = (url, data) => {
                    onBeforeSendHeadersAddListener(onBeforeSendHeaders, {urls: urls})
                    let p = new URLSearchParams(data)
                    httpPost({url: url, body: p.toString()}).then(r => {
                        removeListener()
                        if (r) {
                            resolve(this.unify(r, q, srcLan, tarLan))
                        } else {
                            reject('sogou trans error!')
                        }
                    }).catch(e => {
                        removeListener()
                        reject(e)
                    })
                }
            })
        },*/
        trans(q, srcLan, tarLan) {
            srcLan = this.langMap[srcLan] || 'auto'
            tarLan = this.langMap[tarLan] || 'zh-CHS'
            return new Promise((resolve, reject) => {
                if (q.length > 5000) return reject('The text is too large!')

                let url = `https://fanyi.sogou.com/?keyword=${encodeURIComponent(q)}&transfrom=${srcLan}&transto=${tarLan}&model=general`
                let pageId = 'iframe_soGou'
                openIframe(pageId, url, 60 * 1000)
                httpGet(url, 'document').then(r => {
                    // 获取翻译结果
                    let data
                    let sEl = r.querySelectorAll('script')
                    for (let i = 0; i < sEl.length; i++) {
                        let el = sEl[i]
                        if (el.getAttribute('src')) continue
                        let s = el.textContent
                        if (!s) continue
                        let arr = s.match(/window\.__INITIAL_STATE__=(.*?);\(function\(\){var s;/m)
                        if (arr.length < 2) continue
                        try {
                            data = JSON.parse(arr[1])
                            if (data) break
                        } catch (e) {
                            debug('json error!')
                            return reject('JSON.parse Error!')
                        }
                    }
                    if (data) {
                        resolve(this.unify(data, q, srcLan, tarLan))
                        // removeBgPage(pageId) // 关闭太快，会被 sogou 防火墙判定为恶意用户
                    } else {
                        reject('Get data is empty!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        unify(r, text, srcLan, tarLan) {
            // console.log('sogou:', r, text, srcLan, tarLan)
            // console.log(JSON.stringify(r))
            // 修正改版 2021.1.8
            if (srcLan === 'auto') {
                let str = getJSONValue(r, 'textTranslate.translateData.detect.detect')
                if (str && isString(str)) srcLan = str
            }
            let map = this.langMapInvert
            srcLan = map[srcLan] || 'auto'
            tarLan = map[tarLan] || ''
            let data = []
            let tar = getJSONValue(r, 'textTranslate.result')
            if (tar) {
                let srcArr = text.split('\n')
                let tarArr = tar.split('\n')
                tarArr.forEach((tar, key) => {
                    if (tar) data.push({srcText: srcArr[key] || '', tarText: tar})
                })
            }
            if (setting.translateThin) return {text, srcLan, tarLan, lanTTS: null, data} // 精简显示

            // 重点词汇
            let s = ''
            let keywords = getJSONValue(r, 'textTranslate.translateData.keywords')
            if (keywords && keywords.length > 0) {
                s += `<div class="case_dd"><div class="case_dd_head">重点词汇</div>`
                s += `<div class="case_dd_parts">`
                keywords.forEach(v => {
                    if (v.key && v.value) s += `<p><b data-search="true">${v.key}</b>${v.value}</p>`
                })
                s += `</div></div>`
            }

            // 音标
            let phonetic = getJSONValue(r, 'textTranslate.translateData.voice.phonetic')
            let phStr = ''
            if (phonetic && phonetic.length > 0) {
                let getIconHTML = function (type, filename) {
                    if (type !== 'uk') type = 'us'
                    let title = type === 'uk' ? '英音' : '美音'
                    filename = (filename.substring(0, 2) === '//' ? 'https:' : 'https://fanyi.sogou.com') + filename
                    return `<i class="dmx-icon dmx_ripple" data-type="${type}" data-src-mp3="${filename}" title="${title}"></i>`
                }
                let ph_uk = '', ph_us = '', ph_mp3 = ''
                phonetic.forEach(v => {
                    if (!v.text || !v.type || !v.filename) return
                    if (v.type === 'uk') ph_uk = v.text
                    if (v.type === 'usa') ph_us = v.text
                    ph_mp3 += getIconHTML(v.type, v.filename)
                })
                if (ph_uk && ph_mp3) phStr += `<div class="case_dd_ph">[${ph_uk}${ph_uk !== ph_us ? ' $ ' + ph_us : ''}]${ph_mp3}</div>`
            }

            // 搜狗用的牛津词典 (上一个版本，层级太深，这次改版简化了。)
            let wordCard = getJSONValue(r, 'textTranslate.translateData.wordCard')
            if (isObject(wordCard) && wordCard.usual_Dict) {
                s += `<div class="case_dd">`
                s += `<div class="case_dd_head">${text}</div>`  // 查询的单词
                s += phStr

                // 释义
                let {usual_Dict, exchange, levelList} = wordCard
                if (usual_Dict && usual_Dict.length > 0) {
                    s += `<div class="case_dd_parts">`
                    usual_Dict.forEach(v => {
                        s += `<p>${v.pos ? `<b>${v.pos}</b>` : ''}${isArray(v.values) ? v.values.join('；') : v.values}</p>`
                    })
                    s += `</div>`
                }

                // 单词形态
                if (exchange) {
                    s += `<div class="case_dd_exchange">`
                    let exchangeObj = {
                        word_third: '第三人称单数',
                        word_pl: '复数',
                        word_ing: '现在分词',
                        word_past: '过去式',
                        word_done: '过去分词',
                        word_er: '比较级',
                        word_est: '最高级',
                        word_proto: '原型',
                    }
                    for (let [k, v] of Object.entries(exchange)) {
                        let wordStr = ''
                        v.forEach(word => {
                            if (word) wordStr += `<a data-search="true">${word}</a>`
                        })
                        s += `<b>${exchangeObj[k] || '其他'}</b><u>${wordStr}</u>`
                    }
                    s += `</div>`
                }

                // 单词标签
                if (levelList && levelList.length > 0) {
                    s += `<div class="case_dd_tags">`
                    levelList.forEach(tag => {
                        if (tag) s += `<u>${tag}</u>`
                    })
                    s += `</div>`
                }
                s += `</div>`
            }

            return {text, srcLan, tarLan, lanTTS: null, data, extra: s}
        },
        async query(q, srcLan, tarLan) {
            return checkRetry(() => this.trans(q, srcLan, tarLan))
        },
        tts(q, lan) {
            lan = this.langMap[lan] || 'en'
            return new Promise((resolve) => {
                let getUrl = (s) => {
                    return `https://fanyi.sogou.com/reventondc/synthesis?text=${encodeURIComponent(s)}&speed=1&lang=${lan}&from=translateweb&speaker=1`
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
            tarLan = this.langMap[tarLan] || 'zh-CHS'
            return `https://fanyi.sogou.com/?keyword=${encodeURIComponent(q)}&transfrom=${srcLan}&transto=${tarLan}&model=general`
        },
    }
}
