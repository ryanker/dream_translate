'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function macmillanDictionary() {
    return {
        url: 'https://www.macmillandictionary.com/search/british/direct/?auto=complete&q=',
        init() {
            return this
        },
        unify(r, q) {
            let s = ''
            let phonetic = {}
            let sound = []
            let el = r.querySelector('#entryContent > div > div.left-content')

            // 查询单词
            let wordEl = el.querySelector('.big-title .BASE')
            if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText.trim()}</div>`

            // 音标
            let pronEl = r.querySelector('.PRON')
            if (pronEl) {
                pronEl.querySelectorAll('span').forEach(e => e.remove())
                let pronStr = pronEl.textContent && pronEl.textContent.trim()
                if (pronStr) phonetic.uk = pronStr
            }

            // 发音
            let soundEl = r.querySelector('.PRONS span[data-src-mp3]')
            if (soundEl) sound.push({type: 'uk', url: soundEl.dataset.srcMp3})

            // 释义
            let sensesEl = el.querySelector('.senses')
            if (sensesEl) {
                removeD(sensesEl.querySelectorAll('script,style,button'))
                cleanAttr(sensesEl, ['title', 'class', 'href'])
                sensesEl.querySelectorAll('a[href]').forEach(e => {
                    // e.setAttribute('data-search', 'true')
                    e.removeAttribute('href')
                })
                s += sensesEl.innerHTML
            }

            return {text: q, phonetic, sound, html: `<ol class="dict_macmillan">${s}</ol>`}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = this.url + encodeURIComponent(q)
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('macmillandictionary.com error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return this.url + encodeURIComponent(q)
        },
    }
}
