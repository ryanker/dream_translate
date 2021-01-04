'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function dictionaryDictionary() {
    return {
        url: 'https://www.dictionary.com/browse/',
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('#base-pw > main > section > section > div')

            // 音标
            let phonetic = {}
            let pronEl = r.querySelector('.pron-spell-content')
            if (pronEl) phonetic.us = pronEl.textContent.replace(/\[|]/g, '').trim()

            // 发音
            let sound = []
            let soundEl = r.querySelector('source[type="audio/mpeg"]')
            if (soundEl) sound.push({type: 'us', url: soundEl.src})

            removeD(el.querySelectorAll('script,style,img,#top-definitions-section,.expandable-control')) // 清理
            cleanAttr(el, ['title'])

            return {text: q, phonetic, sound, html: el.innerHTML}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = this.url + encodeURIComponent(q)
                httpGet(url, 'document', null, true).then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('dictionary.com error!')
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
