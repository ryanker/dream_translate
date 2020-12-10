'use strict'

function bingDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('.lf_area')

            // 清理
            el.querySelectorAll('script,style').forEach(e => {
                e.remove()
            })
            return {text: q, phonetic: {}, sound: [], html: el.innerHTML}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = `https://cn.bing.com/dict/search?q=${encodeURIComponent(q)}`
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('bing error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return `https://cn.bing.com/dict/search?q=${encodeURIComponent(q)}`
        },
    }
}
