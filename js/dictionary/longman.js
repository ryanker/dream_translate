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
            let headEl = el.querySelector('.Head')

            // 音标
            headEl.querySelector('.PronCodes > .AMEVARPRON > .neutral')?.remove()
            let ukPron = headEl.querySelector('.PronCodes > .PRON')?.innerText?.trim()
            let usPron = headEl.querySelector('.PronCodes > .AMEVARPRON')?.innerText?.trim()
            headEl.querySelector('.PronCodes')?.remove()
            let phonetic = {}
            if (ukPron) phonetic.uk = ukPron
            if (usPron) phonetic.us = usPron

            // 发音
            let sound = []
            headEl.querySelectorAll('[data-src-mp3]').forEach(e => {
                let title = e.getAttribute('title')
                let src = e.getAttribute('data-src-mp3')
                if (title && src) {
                    if (title.includes('British')) sound.push({type: 'uk', title: title, url: src})
                    else if (title.includes('American')) sound.push({type: 'us', title: title, url: src})
                }
                e.remove()
            })

            // 喇叭
            el.querySelectorAll('[data-src-mp3]').forEach(e => {
                e.className = 'dmx-icon dmx_ripple'
                e.setAttribute('data-type', 'more')
                e.innerHTML = '&#xe67a;'
            })

            // 图片
            el.querySelectorAll('img').forEach(e => {
                e.setAttribute('referrerPolicy', 'no-referrer')
            })

            // 清理
            el.querySelectorAll('a').forEach(e => {
                e.removeAttribute('href')
            })
            el.querySelectorAll('[id]').forEach(e => {
                e.removeAttribute('id')
            })
            el.querySelectorAll('script,style,.dictionary_intro').forEach(e => {
                e.remove()
            })
            el.className = 'longman_dict'
            return {type: 'html', text: q, phonetic: phonetic, sound: sound, html: el.outerHTML}
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
