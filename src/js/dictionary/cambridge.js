'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function cambridgeDictionary() {
    return {
        enUrl: 'https://dictionary.cambridge.org/dictionary/english/',
        zHUrl: 'https://dictionary.cambridge.org/dictionary/english-chinese-simplified/',
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('.entry-body')
            let s = ''
            let phonetic = {} // 音标
            let sound = [] // 发音

            let posHeadEl = el.querySelector('.pos-header')
            if (posHeadEl) {
                // 查询单词
                let wordEl = posHeadEl.querySelector('.di-title')
                if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText}</div>`

                posHeadEl.querySelectorAll('.dpron-i').forEach(e => {
                    let pEl = e.querySelector('.ipa')
                    let mEl = e.querySelector('source[type="audio/mpeg"]')
                    let ph = pEl && pEl.innerText && pEl.innerText.trim()
                    let src = mEl && mEl.getAttribute('src') || ''
                    let pre = 'https://dictionary.cambridge.org/'
                    let type = ''
                    if (e.className.includes('uk')) {
                        type = 'uk'
                        if (ph) phonetic.uk = ph
                    } else if (e.className.includes('us')) {
                        type = 'us'
                        if (ph) phonetic.us = ph
                    } else {
                        type = 'en'
                        if (ph) phonetic.uk = ph
                    }
                    if (src) sound.push({type, url: pre + src})
                })
                if (phonetic.us && phonetic.uk === phonetic.us) delete phonetic.us // 如果音标一样，只保留一个
            }

            // 释义
            let part = ''
            let posEl = el.querySelector('.pos-header .posgram')
            if (posEl) part += `<div>${posEl.innerText}</div>`
            let transEl = el.querySelectorAll('.pos-body .dsense')
            if (transEl && transEl.length > 0) {
                transEl.forEach(tEl => {
                    tEl.querySelectorAll('*').forEach(e => {
                        for (let v of e.attributes) {
                            let name = v.name.toLowerCase()
                            if (!['title', 'class', 'href', 'data-search'].includes(name)) e.removeAttribute(name) // 过滤白名单
                            if (name === 'href') {
                                if (v.value.includes('dictionary/english-chinese-simplified/')) e.setAttribute('data-search', 'true')
                                // e.setAttribute('_href', v.value)
                                e.removeAttribute('href')
                            }
                        }
                    })
                    part += tEl.innerHTML
                })
            }
            if (part) s += `<div class="dict_cambridge">${part}</div>`

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = this.zHUrl + encodeURIComponent(q)
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('dictionary.cambridge.org error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return this.zHUrl + encodeURIComponent(q)
        },
    }
}
