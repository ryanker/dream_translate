'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function eudicDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('#dict-body')
            let s = ''

            // 查询单词
            let wordEl = el.querySelector('h1.explain-Word .word')
            if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText.trim()}</div>`

            let phonetic = {} // 音标
            el.querySelectorAll('.phonitic-line .Phonitic').forEach((e, k) => {
                let ph = e.innerText && e.innerText.replace(/\//g, '').trim() || ''
                if (!ph) return
                if (k === 0) phonetic.uk = ph
                else phonetic.us = ph
            })
            if (phonetic.us && phonetic.uk === phonetic.us) delete phonetic.us // 如果音标一样，只保留一个

            let sound = [] // 发音
            el.querySelectorAll('.phonitic-line a.voice-button-en').forEach(e => {
                let rel = e.getAttribute('data-rel')
                if (!rel) return
                let type = 'en'
                if (rel.includes('_uk_')) type = 'uk'
                else if (rel.includes('_us_')) type = 'us'
                sound.push({type, url: 'https://api.frdic.com/api/v2/speech/speakweb?' + rel})
            })

            // 释义
            let liEl = el.querySelectorAll('#ExpFCChild li')
            let partStr = ''
            if (liEl && liEl.length > 0) {
                liEl.forEach(e => {
                    let str = e.innerText && e.innerText.trim()
                    str = str.replace(/^[a-zA-Z]+\.\s+/, function (str, k) {
                        return k === 0 ? `<b>${str.trim()}</b>` : str
                    })
                    if (str) partStr += `<p>${str}</p>`
                })
            }
            if (!partStr) {
                let expEl = el.querySelector('#ExpFCChild .exp')
                if (expEl) {
                    let str = expEl.textContent && expEl.textContent.trim()
                    if (str) partStr += `<p>${str}</p>`
                }
            }
            if (!partStr) s += '查不到该词'
            if (partStr) s += `<div class="case_dd_parts">${partStr}</div>`

            // 单词形态
            let transEl = el.querySelector('#trans')
            if (transEl) {
                let shapeStr = transEl.innerText.trim()
                shapeStr = shapeStr.replace(/[a-z]+/ig, function (str) {
                    return `<a data-search="true">${str}</a>`
                })
                s += `<div class="case_dd_exchange">${shapeStr}</div>`
            }

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = `https://dict.eudic.net/dicts/en/${encodeURIComponent(q)}`
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('dict.eudic.net error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return `https://dict.eudic.net/dicts/en/${encodeURIComponent(q)}`
        },
    }
}
