'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function youdaoDictionary() {
    return {
        init() {
            return this
        },
        unify(r, text) {
            let s = ''
            let phonetic = {} // 音标
            let sound = [] // 发音
            let el = r.querySelector('#results-contents')

            // 查询单词
            let wordEl = el.querySelector('.wordbook-js .keyword')
            if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText}</div>`

            el.querySelectorAll('.wordbook-js .baav .pronounce').forEach(e => {
                let pEl = e.querySelector('.phonetic')
                let aEl = e.querySelector('a')
                if (!aEl) return
                let phStr = pEl && pEl.innerText && pEl.innerText.replace(/(^\[|]$)/g, '')
                let rel = aEl.getAttribute('data-rel') || ''
                let voice = aEl.getAttribute('data-4log') || ''
                let url = 'https://dict.youdao.com/dictvoice?audio=' + rel
                let type = ''
                if (voice.includes('.uk.')) {
                    type = 'uk'
                    if (phStr) phonetic.uk = phStr
                } else if (voice.includes('.us.')) {
                    type = 'us'
                    if (phStr) phonetic.us = phStr
                } else {
                    type = 'en'
                    if (phStr) phonetic.uk = phStr
                }
                sound.push({type, url})
            })
            if (phonetic.us && phonetic.uk === phonetic.us) delete phonetic.us // 如果音标一样，只保留一个

            // 释义
            let transEl = el.querySelector('#phrsListTab .trans-container')
            if (transEl) {
                let str = ''
                let liEl = transEl.querySelectorAll('li')
                if (liEl && liEl.length > 0) {
                    liEl.forEach(e => {
                        let part = e.innerText && e.innerText.trim()
                        part = part.replace(/^[a-zA-Z]+\.\s+/, function (str, k) {
                            return k === 0 ? `<b>${str.trim()}</b>` : str
                        })
                        if (part) str += `<p>${part}</p>`
                    })
                } else {
                    let wordEl = el.querySelector('.wordGroup')
                    if (wordEl) {
                        let part = wordEl.innerText && wordEl.innerText.trim()
                        part = part.replace(/^[a-zA-Z]+\.\s+/, function (str, k) {
                            return k === 0 ? `<b>${str.trim()}</b>` : str
                        })
                        if (part) str += `<p>${part}</p>`
                    }
                }
                if (str) s += `<div class="case_dd_parts">${str}</div>`

                // 单词形态
                let addiEl = transEl.querySelector('.additional')
                if (addiEl) {
                    let shapeStr = addiEl.innerText.trim()
                    shapeStr = shapeStr.replace(/^\[|]$/g, '')
                    shapeStr = shapeStr.trim()
                    shapeStr = shapeStr.replace(/[a-z]+/ig, function (str) {
                        return `<a data-search="true">${str}</a>`
                    })
                    s += `<div class="case_dd_exchange">${shapeStr}</div>`
                }
            } else {
                let transEl = el.querySelector('#fanyiToggle .trans-container')
                if (transEl) {
                    transEl.querySelectorAll('p:last-child').forEach(e => e.remove()) // 清理最后一行
                    s += `<div class="case_dd_exchange">${transEl.innerHTML}</div>`
                }
            }

            return {text, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                // if (q.length > 100) return reject('The text is too large!')
                let url = `https://www.youdao.com/w/eng/${encodeURIComponent(q)}`
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('youdao.com error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return `https://www.youdao.com/w/eng/${encodeURIComponent(q)}`
        },
    }
}
