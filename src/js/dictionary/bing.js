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
            let s = ''
            let phonetic = {} // 音标
            let sound = [] // 发音
            let el = r.querySelector('.lf_area')

            // 查询单词
            let wordEl = el.querySelector('#headword')
            if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText.trim()}</div>`

            // 音标
            let prUK = el.querySelector('.hd_pr')
            if (prUK) {
                let ph = prUK.innerText ? prUK.innerText.replace(/^UK|[\[\]美英]/g, '').trim() : ''
                if (ph) phonetic.uk = ph
            }
            let prUS = el.querySelector('.hd_prUS')
            if (prUS) {
                let ph = prUS.innerText ? prUS.innerText.replace(/^US|[\[\]美英]/g, '').trim() : ''
                if (ph) phonetic.us = ph
            }
            if (phonetic.us && phonetic.uk === phonetic.us) delete phonetic.us // 如果音标一样，只保留一个

            // 发音
            let tfEl = el.querySelectorAll('.hd_tf')
            if (tfEl && tfEl.length >= 2) {
                let getSoundUrl = function (e) {
                    let url = ''
                    let aEl = e.querySelector('a')
                    if (!aEl) return url
                    let str = aEl.getAttribute('onclick')
                    str && str.replace(/'(http[^']+)'/, r => url = r.replace(/'/g, ''))
                    return url
                }
                let ukUrl = getSoundUrl(tfEl[1])
                if (ukUrl) sound.push({type: 'uk', url: ukUrl})
                let usUrl = getSoundUrl(tfEl[0])
                if (usUrl) sound.push({type: 'us', url: usUrl})
            }

            // 释义
            let liEl = el.querySelectorAll('.qdef > ul > li')
            if (liEl && liEl.length > 0) {
                s += `<div class="case_dd_parts">`
                liEl.forEach(e => {
                    let bEl = e.querySelector('span.pos')
                    let tEl = e.querySelector('span.b_regtxt')
                    let bStr = bEl && bEl.innerText ? `<b>${bEl.innerText.trim()}</b>` : ''
                    let part = tEl && tEl.innerText ? tEl.innerText.trim() : ''
                    if (part) s += `<p>${bStr}${part}</p>`
                })
                s += `</div>`
            } else {
                let str = ''
                el.querySelectorAll('div[class^="p1-"]').forEach(e => {
                    let tex = e.textContent && e.textContent.trim()
                    if (tex) str += `<p>${tex}</p>`
                })
                if (str) s += `<div class="case_dd_parts">${str}</div>`
            }

            // 单词形态
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

            // 单词图片
            let imgEl = el.querySelectorAll('.img_area > .simg > a')
            if (imgEl && imgEl.length > 0) {
                let imgStr = ''
                imgEl.forEach(e => {
                    let url = e.getAttribute('href')
                    let iEl = e.querySelector('img')
                    if (url && iEl) {
                        let src = iEl.getAttribute('src')
                        imgStr += `<a href="https://cn.bing.com${url}" target="_blank" rel="noreferrer"><img src="${src}" rel="noreferrer"></a>`
                    }
                })
                if (imgStr) s += `<div class="case_dd_img">${imgStr}</div>`
            }

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                // if (q.length > 100) return reject('The text is too large!')
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
