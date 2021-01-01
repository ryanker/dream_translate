'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function dictcnDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('#content > .main')

            // 查询单词
            let s = ''
            let wordEl = el.querySelector('.word-cont > .keyword')
            if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText}</div>`

            let phonetic = {} // 音标
            let sound = [] // 发音
            el.querySelectorAll('.phonetic > span').forEach(spanEl => {
                let spStr = spanEl.innerText || ''
                let bdoEl = spanEl.querySelector('bdo')
                let ph = bdoEl && bdoEl.innerText && bdoEl.innerText.replace(/(^\[|]$)/g, '')
                let type = ''
                if (spStr.includes('英')) {
                    type = 'uk'
                    if (ph) phonetic.uk = ph
                } else if (spStr.includes('美')) {
                    type = 'us'
                    if (ph) phonetic.us = ph
                } else {
                    type = 'en'
                    if (ph) phonetic.uk = ph
                }

                spanEl.querySelectorAll('.sound').forEach(e => {
                    let title = e.getAttribute('title') || ''
                    let url = 'http://audio.dict.cn/' + e.getAttribute('naudio')
                    let isWoman = e.className && e.className.includes('fsound')
                    sound.push({type, title, url, isWoman})
                })
            })
            if (phonetic.us && phonetic.uk === phonetic.us) delete phonetic.us // 如果音标一样，只保留一个

            // 释义
            let basicEl = el.querySelector('.basic')
            if (basicEl) {
                let liEl = basicEl.querySelectorAll('ul.dict-basic-ul li')
                if (liEl) {
                    s += `<div class="case_dd_parts">`
                    liEl.forEach(e => {
                        let bEl = e.querySelector('span')
                        let tEl = e.querySelector('strong')
                        let bStr = bEl && bEl.innerText ? `<b>${bEl.innerText.trim()}</b>` : ''
                        let part = tEl && tEl.innerText ? tEl.innerText.trim() : ''
                        if (part) s += `<p>${bStr}${part}</p>`
                    })
                    s += `</div>`
                }
            }

            // 单词形式
            let shapeEl = el.querySelector('.shape')
            if (shapeEl) s += `<div class="case_dd_exchange">${shapeEl.innerText}</div>`

            // 单词标签
            let levelEl = el.querySelector('span.level-title')
            if (levelEl) {
                let level = levelEl.getAttribute('level') || ''
                if (level) s += `<div class="case_dd_tags"><u>${level}</u></div>`
            }

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                httpGet(`http://dict.cn/${encodeURIComponent(q)}`, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('dict.cn error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return `http://dict.cn/${encodeURIComponent(q)}`
        },
    }
}
