'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function icibaDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let s = ''
            let phonetic = {} // 音标
            let sound = [] // 发音
            let el = r.querySelector('#__next > main > div > div[class^=Content_center]')

            // JSON 数据
            let data = {}
            let basic = {}
            let jEl = r.querySelector('#__NEXT_DATA__')
            if (jEl) {
                try {
                    data = JSON.parse(jEl.textContent)
                    if (data) basic = getJSONValue(data, 'props.pageProps.initialReduxState.word.wordInfo.baesInfo', {})
                } catch (e) {
                }
            }

            // 查询单词
            let wordEl = el.querySelector('h1')
            if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText.trim()}</div>`

            el.querySelectorAll('ul[class^=Mean_symbols] > li').forEach(e => {
                let ph = e.innerText && e.innerText.replace(/[\[\]英美]/g, '').trim() || ''
                let type = ''
                if (e.innerText.includes('美')) {
                    if (ph) phonetic.us = ph
                    type = 'us'
                } else {
                    if (ph) phonetic.uk = ph
                    type = 'uk'
                }

                // 发音
                let symbols = getJSONValue(basic, 'symbols.0')
                if (symbols) {
                    let url = ''
                    let {ph_am_mp3, ph_am_mp3_bk, ph_en_mp3, ph_en_mp3_bk, ph_tts_mp3, ph_tts_mp3_bk} = symbols
                    if (type === 'us') {
                        url = ph_am_mp3 || ph_am_mp3_bk || ph_tts_mp3_bk
                    } else {
                        url = ph_en_mp3 || ph_en_mp3_bk || ph_tts_mp3
                    }
                    if (url) sound.push({type, url})
                }
            })
            if (phonetic.us && phonetic.uk === phonetic.us) delete phonetic.us // 如果音标一样，只保留一个

            // 释义
            let liEl = el.querySelectorAll('ul[class^=Mean_part] > li')
            if (liEl && liEl.length > 0) {
                s += `<div class="case_dd_parts">`
                liEl.forEach(e => {
                    let bEl = e.querySelector('i')
                    let tEl = e.querySelector('div')
                    let bStr = bEl && bEl.innerText ? `<b>${bEl.innerText.trim()}</b>` : ''
                    let part = tEl && tEl.innerText ? tEl.innerText.trim() : ''
                    if (bStr && part) {
                        s += `<p>${bStr}${part}</p>`
                    } else {
                        let part = e.innerText && e.innerText.trim()
                        if (part) s += `<p>${part}</p>`
                    }
                })
                s += `</div>`
            } else {
                let str = ''
                let senEl = el.querySelector('h2[class^=Mean_sentence]')
                if (senEl) str += `<p>${senEl.textContent}</p>`
                let transEl = el.querySelector('div[class^=Mean_trans] > p')
                if (transEl) str += `<p>${transEl.textContent}</p>`
                if (str) s += `<div class="case_dd_parts">${str}</div>`
            }

            // 单词形态
            let shapeEl = el.querySelector('ul[class^=Morphology_morphology]')
            if (shapeEl) {
                let shapeStr = shapeEl.innerText.trim()
                shapeStr = shapeStr.replace(/;/g, ' ')
                shapeStr = shapeStr.replace(/[a-z]+/ig, function (str) {
                    return `<a data-search="true">${str}</a>`
                })
                s += `<div class="case_dd_exchange">${shapeStr}</div>`
            }

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                // if (q.length > 100) return reject('The text is too large!')
                let url = `https://www.iciba.com/word?w=${encodeURIComponent(q)}`
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('iciba.com error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return `https://www.iciba.com/word?w=${encodeURIComponent(q)}`
        },
    }
}
