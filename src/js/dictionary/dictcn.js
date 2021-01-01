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
            let s = ''

            // 查询单词
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

            let getChart = function (sel) {
                try {
                    let d = el.querySelector(sel).getAttribute('data')
                    d = decodeURIComponent(d)
                    d = JSON.parse(d)
                    let arr = Object.values(d)
                    if (arr && arr.length > 0) {
                        let str = ''
                        for (let v of arr) {
                            let {sense, percent, pos} = v
                            str += `${sense || pos || ''}<u>${percent}%</u>`
                        }
                        if (str) s += `<div class="case_dd_chart">${str}</div>`
                    }
                } catch (e) {
                }
            }
            getChart('#dict-chart-basic') // 单词常用度
            getChart('#dict-chart-examples') // 词性常用度

            // 单词形态
            let shapeEl = el.querySelector('.shape')
            if (shapeEl) {
                let shapeStr = ''
                shapeEl.querySelectorAll('label,a').forEach(e => {
                    if (e.tagName === 'LABEL') {
                        shapeStr += `<b>${e.innerText}</b>`
                    } else if (e.tagName === 'A') {
                        shapeStr += `<a data-search="true">${e.innerText}</a>`
                    }
                })
                if (shapeStr) s += `<div class="case_dd_exchange">${shapeStr}</div>`
            }

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
