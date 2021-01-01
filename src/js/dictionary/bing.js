'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function bingDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('.lf_area')
            let s = ''

            // 查询单词
            let wordEl = el.querySelector('#headword')
            if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText.trim()}</div>`

            let phonetic = {} // 音标
            let sound = [] // 发音
            el.querySelectorAll('.hd_tf_lh .b_primtxt').forEach(e => {
                let ph = e.innerText && e.innerText.replace(/[\[\]美英]/g, '').trim() || ''
                let type = ''
                if (e.innerText.includes('美')) {
                    type = 'uk'
                    if (ph) phonetic.uk = ph
                } else {
                    type = 'en'
                    if (ph) phonetic.uk = ph
                }

                // 发音链接
                if (e.nextElementSibling && e.nextElementSibling.className === 'hd_tf') {
                    let aEl = e.nextElementSibling.querySelector('a')
                    if (aEl) {
                        let clickStr = aEl.getAttribute('onclick')
                        clickStr && clickStr.replace(/'(http[^']+)'/, url => {
                            sound.push({type, url})
                        })
                    }
                }
            })
            if (phonetic.us && phonetic.uk === phonetic.us) delete phonetic.us // 如果音标一样，只保留一个

            // 释义
            let liEl = el.querySelectorAll('.qdef > ul > li')
            if (liEl) {
                s += `<div class="case_dd_parts">`
                liEl.forEach(e => {
                    let bEl = e.querySelector('span.pos')
                    let tEl = e.querySelector('span.b_regtxt')
                    let bStr = bEl && bEl.innerText ? `<b>${bEl.innerText.trim()}</b>` : ''
                    let part = tEl && tEl.innerText ? tEl.innerText.trim() : ''
                    if (part) s += `<p>${bStr}${part}</p>`
                })
                s += `</div>`
            }

            // 单词形式
            let shapeEl = el.querySelector('.hd_div1')
            if (shapeEl) {
                let shapeStr = ''
                shapeEl.querySelectorAll('span,a').forEach(e => {
                    if (e.tagName === 'SPAN') {
                        shapeStr += `<b>${e.innerText}</b>`
                    } else if (e.tagName === 'A') {
                        shapeStr += `<u><a data-search="true">${e.innerText}</a></u>`
                    }
                })
                if (shapeStr) s += `<div class="case_dd_exchange">${shapeStr}</div>`
            }

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = `https://cn.bing.com/dict/search?q=${encodeURIComponent(q)}`
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('bing error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return `https://cn.bing.com/dict/search?q=${encodeURIComponent(q)}`
        },
    }
}
