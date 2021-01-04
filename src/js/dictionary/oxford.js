'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function oxfordDictionary() {
    return {
        url: 'https://www.oxfordlearnersdictionaries.com/search/english/?q=',
        init() {
            return this
        },
        unify(r, q) {
            let s = ''
            let phonetic = {}
            let sound = []
            let el = r.querySelector('#entryContent')
            if (!el) {
                let el = r.querySelector('#main_column')
                cleanAttr(el, ['title', 'class', 'href'])
                el.querySelectorAll('a[href]').forEach(e => {
                    e.setAttribute('data-search', 'true')
                    e.removeAttribute('href')
                })
                return {text: q, phonetic, sound, html: el.innerHTML}
            }

            // 查询单词
            let wordEl = el.querySelector('.headword')
            if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText.trim()}</div>`

            // 音标 && 发音
            let ukEl = el.querySelector('.webtop .phonetics .phons_br')
            let usEl = el.querySelector('.webtop .phonetics .phons_n_am')
            if (ukEl) {
                let pron = ukEl.textContent.replace(/\//g, '').trim()
                if (pron) phonetic.uk = pron
                let srcEl = ukEl.querySelector('.sound[data-src-mp3]')
                if (srcEl) sound.push({type: 'uk', url: srcEl.getAttribute('data-src-mp3')})
            }
            if (usEl) {
                let pron = usEl.textContent.replace(/\//g, '').trim()
                if (pron) phonetic.us = pron
                let srcEl = ukEl.querySelector('.sound[data-src-mp3]')
                if (srcEl) sound.push({type: 'us', url: srcEl.getAttribute('data-src-mp3')})
            }

            // 释义
            let part = ''
            let sensesEl = el.querySelector('.senses_multiple')
            if (!sensesEl) sensesEl = el.querySelector('.sense_single')
            if (sensesEl) {
                sensesEl.querySelectorAll('script,style,span.sensetop').forEach(e => e.remove()) // 清理
                cleanAttr(sensesEl, ['title', 'class', 'href'])
                el.querySelectorAll('a[href]').forEach(e => {
                    e.setAttribute('data-search', 'true')
                    e.removeAttribute('href')
                })
                part += sensesEl.innerHTML.replace(/\s+/g, ' ')
            }
            if (part) s += `<div class="dict_oxford">${part}</div>`

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = this.url + encodeURIComponent(q)
                httpGet(url, 'document', null, true).then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('oxfordlearnersdictionaries.com error!')
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
