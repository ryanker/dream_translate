'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function wordreferenceDictionary() {
    return {
        url: 'https://www.wordreference.com/definition/',
        init() {
            return this
        },
        unify(r, q) {
            let s = ''
            let el = r.querySelector('#centercolumn')

            // 发音
            let sound = []
            let ukEl = r.querySelector('source[src^="/audio/en/uk"]')
            let usEl = r.querySelector('source[src^="/audio/en/us"]')
            if (ukEl) sound.push({type: 'uk', url: ukEl.src})
            if (usEl) sound.push({type: 'us', url: usEl.src})

            // 清理
            let artEl = el.querySelector('#article')
            if (artEl) {
                removeD(artEl.querySelectorAll('script,style,img,br,.small1'))
                cleanAttr(artEl, ['title', 'class'])
                let artStr = artEl.innerHTML
                artStr = artStr.trim()
                artStr = artStr.replace(/^\s*<br>\s*<br>/g, '')
                s += artStr
            }

            return {text: q, phonetic: {}, sound, html: `<div class="dict_wr">${s}</div>`}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = this.url + encodeURIComponent(q)
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('wordreference.com error!')
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
