'use strict'

function macmillanDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('#entryContent > div > div.left-content')

            // 清理
            el.querySelectorAll('script,style').forEach(e => {
                e.remove()
            })
            return {text: q, phonetic: {}, sound: [], html: el.innerHTML}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = `https://www.macmillandictionary.com/dictionary/british/${encodeURIComponent(q)}`
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
            return `https://www.macmillandictionary.com/dictionary/british/${encodeURIComponent(q)}`
        },
    }
}
