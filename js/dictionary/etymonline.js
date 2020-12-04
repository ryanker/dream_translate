'use strict'

function etymonlineDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('#root > div > div > div.main > div > div:nth-child(2) > div:nth-child(2) > object')

            // 清理
            el.querySelectorAll('script,style').forEach(e => {
                e.remove()
            })
            return {text: q, phonetic: {}, sound: [], html: el.innerHTML}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = `https://www.etymonline.com/search?q=${encodeURIComponent(q)}`
                httpGet(url, 'document').then(r => {
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
            return `https://www.etymonline.com/search?q=${encodeURIComponent(q)}`
        },
    }
}
