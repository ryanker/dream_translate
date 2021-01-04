'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function lexicoDictionary() {
    return {
        ukUrl: 'https://www.thefreedictionary.com/',
        usUrl: 'https://www.lexico.com/en/definition/',
        init() {
            return this
        },
        unify(r, q) {
            let s = ''
            let phonetic = {}
            let sound = []
            let el = r.querySelector('.entryWrapper')

            // 查询单词
            let wordEl = el.querySelector('.hwg > .hw')
            if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText.trim()}</div>`

            // 音标
            let pronEl = el.querySelector('.pronunciations .phoneticspelling')
            if (pronEl) {
                let pron = pronEl.innerText && pronEl.innerText.replace(/\//g, '')
                if (pron) phonetic.us = pron
            }

            // 发音
            let mp3El = el.querySelector('.pronunciations audio[src]')
            if (mp3El) sound.push({type: 'us', url: mp3El.src})

            // 释义
            let liEl = el.querySelectorAll('.gramb')
            if (liEl && liEl.length > 0) {
                liEl.forEach(e => {
                    removeD(e.querySelectorAll('script,style,.moreInfo')) // 清理
                    cleanAttr(e, ['title', 'class'])
                    s += e.innerHTML
                })
            } else {
                let simEl = el.querySelector('.similar-results')
                if (simEl) {
                    cleanAttr(simEl, ['title', 'class', 'href'])
                    simEl.querySelectorAll('a[href]').forEach(e => {
                        e.setAttribute('data-search', 'true')
                        e.removeAttribute('href')
                    })
                    s += simEl.innerHTML
                }
            }

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = this.usUrl + encodeURIComponent(q)
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('lexico.com error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return this.usUrl + encodeURIComponent(q)
        },
    }
}
