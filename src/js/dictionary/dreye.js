'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function dreyeDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('.q_middle')
            let s = ''

            // 查询单词
            let wordEl = el.querySelector('#display_word > span')
            if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText.trim()}</div>`

            let phonetic = {} // 音标
            let phEl = el.querySelector('.q_m_left > .phonetic')
            if (phEl) {
                let phStr = phEl.innerText && phEl.innerText.trim()
                if (phStr) {
                    // 这词典太老了，不想弄~~~
                    let ukArr = phStr.match(/DJ:\[(.+?)]/)
                    let usArr = phStr.match(/KK:\[(.+?)]/)
                    if (ukArr && ukArr.length === 2) phonetic.uk = ukArr[1]
                    if (usArr && usArr.length === 2) phonetic.us = usArr[1]
                    if (phonetic.uk === phonetic.us) delete phonetic.us // 如果音标一样，只保留一个
                }
            }

            let sound = [] // 发音
            let scrEl = r.querySelector('script[language="javascript"]')
            if (scrEl) {
                let scrStr = scrEl.textContent || ''
                let ukArr = scrStr.match(/var RealSoundPath = "(.+?)";/)
                let usArr = scrStr.match(/var F_RealSoundPath = "(.+?)";/)
                let roUrl = 'https://www.dreye.com.cn'
                if (ukArr && ukArr.length === 2) sound.push({type: 'uk', url: roUrl + ukArr[1]})
                if (usArr && usArr.length === 2) sound.push({type: 'us', url: roUrl + usArr[1]})
            }

            // 释义
            let liEl = el.querySelectorAll('#digest > ul > li')
            let partStr = ''
            if (liEl && liEl.length > 0) {
                liEl.forEach(e => {
                    let part = e.innerText && e.innerText.trim()
                    part = part.replace(/^[a-zA-Z]+\.\s+/, function (str, k) {
                        return k === 0 ? `<b>${str.trim()}</b>` : str
                    })
                    if (part) partStr += `<p>${part}</p>`
                })
            } else {
                el.querySelectorAll('.q_middle_bd > .ews_sys_msg').forEach(e => {
                    let str = e.textContent
                    if (str) {
                        str = str.replace(/[a-z]+'?[a-z]+/ig, function (str) {
                            return `<a data-search="true">${str}</a>`
                        })
                        partStr += `<p>${str}</p>`
                    }
                })
            }
            if (partStr) s += `<div class="case_dd_parts">${partStr}</div>`

            // 单词形态
            let pEl = el.querySelectorAll('#digest > p')
            if (pEl && pEl.length > 0) {
                let str = ''
                pEl.forEach(e => {
                    let s2 = e.innerText.trim()
                    s2 = s2.replace(/[a-z]+/ig, function (s3) {
                        return `<a data-search="true">${s3}</a>`
                    })
                    if (s2) str += `<p>${s2}</p>`
                })
                if (str) s += `<div class="case_dd_exchange">${str}</div>`
            }

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = `https://www.dreye.com.cn/dict_new/dict.php?w=${encodeURIComponent(q)}`
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('dreye.com.cn error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return `https://www.dreye.com.cn/dict_new/dict.php?w=${encodeURIComponent(q)}`
        },
    }
}
