'use strict'

function collinsDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('.res_cell_center_content')

            // 清理
            el.querySelectorAll('script,style').forEach(e => {
                e.remove()
            })
            return {text: q, phonetic: {}, sound: [], html: el.innerHTML}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = `https://www.collinsdictionary.com/dictionary/english/${encodeURIComponent(q)}`
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('collinsdictionary.com error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return `https://www.collinsdictionary.com/dictionary/english/${encodeURIComponent(q)}`
        },
    }
}
