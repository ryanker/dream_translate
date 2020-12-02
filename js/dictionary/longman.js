'use strict'

function longmanDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            // console.log(r)
            // let arr = r.match(/<div class="dictionary">([\s\S]*?)<\/div><!-- End of DIV dictionary-->/m)
            // console.log(arr)
            let el = r.querySelector('.dictionary')
            el.className = 'longman_dict'
            el.querySelector('.dictionary_intro').remove()
            el.querySelectorAll('a').forEach(e => {
                e.removeAttribute('href')
            })
            el.querySelectorAll('[id]').forEach(e => {
                e.removeAttribute('id')
            })
            el.querySelectorAll('script').forEach(e => {
                e.remove()
            })
            return {type: 'html', text: q, html: el.outerHTML}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = `https://www.ldoceonline.com/search/english/direct/?q=${encodeURIComponent(q)}`
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('longman error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            // return `https://www.ldoceonline.com/dictionary/${encodeURIComponent(q)}`
            return `https://www.ldoceonline.com/search/english/direct/?q=${encodeURIComponent(q)}`
        },
    }
}
