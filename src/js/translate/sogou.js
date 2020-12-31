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
        transOld(q, srcLan, tarLan) {
            return new Promise((resolve, reject) => {
                if (q.length > 5000) return reject('The text is too large!')

                // 取消 Frame 嵌入限制
                onCompletedAddListener(onRemoveFrame, {urls: ["*://fanyi.sogou.com/*"]})

                // Frame 请求
                let url = this.link(q, srcLan, tarLan)
                let el = this.openIframe(url)

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
                    onCompletedRemoveListener(onRemoveFrame)
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
        },
        openIframe(url) {
            let eid = 'soGouIframe'
            let el = document.getElementById(eid)
            if (!el) {
                el = document.createElement('iframe')
                el.id = eid
                el.src = url
                document.body.appendChild(el)
            } else {
                el.src = url
            }

            // 超时删除，减小内容占用
            if (this.timeoutId) {
                clearTimeout(this.timeoutId)
                this.timeoutId = null
            }
            this.timeoutId = setTimeout(() => {
                el && el.remove()
            }, 300000) // 5分钟后释放

            return el
        },
        trans(q, srcLan, tarLan) {
            srcLan = this.langMap[srcLan] || 'auto'
            tarLan = this.langMap[tarLan] || 'zh-CHS'
            return new Promise((resolve, reject) => {
                if (q.length > 5000) return reject('The text is too large!')

                let url = this.link(q, srcLan, tarLan)
                this.openIframe(url)
                httpGet(url, 'document').then(r => {
                    let transOld = function () {
                        this.transOld(q, srcLan, tarLan).then((rOld) => {
                            resolve(rOld)
                        }).catch(e => {
                            reject(e)
                        })
                    }
                    if (!r) {
                        transOld()
                        return
                    }

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
                        }
                    }
                    // console.log(data)
                    if (data?.translate?.translateData?.translate) {
                        let d = {}
                        d.data = data.translate.translateData
                        d.data.keywords = data.translate.keyword
                        // console.log(d)
                        resolve(this.unify(d, q, srcLan, tarLan))
                    } else {
                        transOld()
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        unify(r, text, srcLan, tarLan) {
            // console.log('sogou:', r, q, srcLan, tarLan)
            // console.log(JSON.stringify(r))
            if (srcLan === 'auto' && r?.data?.detect?.detect) srcLan = r.data.detect.detect
            let map = this.langMapInvert
            srcLan = map[srcLan] || 'auto'
            tarLan = map[tarLan] || ''
            let res = r && r.data
            let tar = res.translate && res.translate.dit
            let data = []
            if (tar) {
                let srcArr = text.split('\n')
                let tarArr = tar.split('\n')
                tarArr.forEach((tar, key) => {
                    if (tar) data.push({srcText: srcArr[key] || '', tarText: tar})
                })
            }

            // 重点词汇
            let s = ''
            if (res.keywords && res.keywords.length > 0) {
                s += `<div class="case_dd"><div class="case_dd_head">重点词汇</div>`
                s += `<div class="case_dd_parts">`
                res.keywords.forEach(v => {
                    if (v.key && v.value) s += `<p><b data-search="true">${v.key}</b>${v.value.join('')}</p>`
                })
                s += `</div></div>`
            }

            // 搜狗用的牛津词典
            let dict = res.common_dict?.dict[0]?.content[0]?.value
            if (dict && dict.length > 0) {
                s += `<div class="case_dd">`
                s += `<div class="case_dd_head">${text}</div>`  // 查询的单词
                let getIconHTML = function (type, filename) {
                    if (type !== 'uk') type = 'us'
                    let title = type === 'uk' ? '英音' : '美音'
                    return `<i class="dmx-icon dmx_ripple" data-type="${type}" data-src-mp3="https:${filename}" title="${title}"></i>`
                }
                dict.forEach(lv => {
                    let {phonetic, usual, info_from_exam_dict, exchange_info, levelList} = lv

                    // 音标
                    if (phonetic && phonetic.length > 0) {
                        let ph_uk = '', ph_us = '', ph_mp3 = ''
                        phonetic.forEach(v => {
                            if (!v.text || !v.type || !v.filename) return
                            if (v.type === 'uk') ph_uk = v.text
                            if (v.type === 'usa') ph_us = v.text
                            ph_mp3 += getIconHTML(v.type, v.filename)
                        })
                        if (ph_uk && ph_mp3) s += `<div class="case_dd_ph">[${ph_uk}${ph_uk !== ph_us ? ' $ ' + ph_us : ''}]${ph_mp3}</div>`
                    }

                    // 释义
                    if (usual && usual.length > 0) {
                        s += `<div class="case_dd_parts">`
                        usual.forEach(v => {
                            s += `<p>${v.pos ? `<b>${v.pos}</b>` : ''}${v.values}</p>`
                        })
                        s += `</div>`
                    } else if (info_from_exam_dict?.word_family?.mean) {
                        s += `<div class="case_dd_parts"><p>${info_from_exam_dict.word_family.mean}</p></div>`
                    }

                    // 单词形式
                    if (exchange_info) {
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
                        for (let [k, v] of Object.entries(exchange_info)) {
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
                })
                s += `</div>`
            }

            return {text, srcLan, tarLan, lanTTS: null, data, extra: s}
        },
        async query(q, srcLan, tarLan) {
            return this.trans(q, srcLan, tarLan)
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
