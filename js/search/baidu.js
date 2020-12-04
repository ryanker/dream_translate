'use strict'

function baiduSearch() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('#content_left')

            // 清理
            el.querySelectorAll('script,style').forEach(e => {
                e.remove()
            })
            return {text: q, html: el.innerHTML}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('baidu.com error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`
        },
    }
}
