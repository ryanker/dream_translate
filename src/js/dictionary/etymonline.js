'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function etymonlineDictionary() {
    return {
        url: 'https://www.etymonline.com/word/',
        // url: 'https://www.etymonline.com/search?q=',
        init() {
            return this
        },
        unify(r, q) {
            // let el = r.querySelector('#root > div > div > div.main > div > div:nth-child(2) > div:nth-child(2) > object')
            let s = ''
            r.querySelectorAll('#root div.main div[class^="word--"] > object').forEach(el => {
                el.querySelectorAll('[style]').forEach(e => e.removeAttribute('style'))
                el.querySelectorAll('*').forEach(e => {
                    for (let v of e.attributes) {
                        let name = v.name.toLowerCase()
                        if (!['title', 'class'].includes(name)) e.removeAttribute(name) // 过滤白名单
                    }
                })
                s += el.innerHTML
            })
            if (!s) s += `The ${q} you're looking for can't be found.`
            return {text: q, phonetic: {}, sound: [], html: `<div class="dict_etymonline">${s}</div>`}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = this.url + encodeURIComponent(q)
                httpGet(url, 'document', null, true).then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('etymonline.com error!')
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
