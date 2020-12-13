'use strict'
/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function oxfordDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('#entryContent')

            // 清理
            el.querySelectorAll('script,style').forEach(e => {
                e.remove()
            })
            return {text: q, phonetic: {}, sound: [], html: el.innerHTML}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = `https://www.oxfordlearnersdictionaries.com/definition/english/${encodeURIComponent(q)}`
                httpGet(url, 'document').then(r => {
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
            return `https://www.oxfordlearnersdictionaries.com/definition/english/${encodeURIComponent(q)}`
        },
    }
}
