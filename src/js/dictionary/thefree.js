'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function thefreeDictionary() {
    return {
        url: 'https://www.thefreedictionary.com/',
        init() {
            return this
        },
        unify(r, q) {
            let s = ''
            let phonetic = {}
            let sound = []
            let el = r.querySelector('#content')

            // 音标
            let pronEl = r.querySelector('span.pron')
            if (pronEl) {
                let pron = pronEl.innerText && pronEl.innerText.replace(/^\(|\)$/g, '')
                if (pron) phonetic.uk = pron
            }

            // 发音
            let ukEl = el.querySelector('.snd2[data-snd^="en/UK/"]')
            let usEl = el.querySelector('.snd2[data-snd^="en/US/"]')
            if (ukEl) sound.push({type: 'uk', url: `https://img2.tfd.com/pron/mp3/${ukEl.dataset.snd}.mp3`})
            if (usEl) sound.push({type: 'us', url: `https://img2.tfd.com/pron/mp3/${usEl.dataset.snd}.mp3`})

            let defEl = el.querySelector('#Definition')
            if (defEl) {
                removeD(defEl.querySelectorAll('script,style,select.verbtables')) // 清理
                defEl.querySelectorAll('span.snd[data-snd]').forEach(e => {
                    e.className = 'dmx-icon dmx_ripple'
                    e.setAttribute('data-src-mp3', `https://img.tfd.com/hm/mp3/${e.dataset.snd}.mp3`)
                    e.setAttribute('data-type', 'en')
                })
                cleanAttr(defEl, ['title', 'class', 'href', 'data-snd', 'data-type', 'data-src-mp3'])
                defEl.querySelectorAll('span[class="hvr"]').forEach(e => {
                    e.setAttribute('data-search', 'true')
                })
                defEl.querySelectorAll('a[href]').forEach(e => {
                    e.setAttribute('data-search', 'true')
                    e.setAttribute('_href', e.href)
                    e.removeAttribute('href')
                })
                s += defEl.innerHTML
            } else {
                let txtEl = r.querySelector('#MainTxt')
                cleanAttr(txtEl, ['title', 'class', 'href'])
                txtEl.querySelectorAll('a[href]').forEach(e => {
                    e.setAttribute('data-search', 'true')
                    e.removeAttribute('href')
                })
                s += txtEl.innerHTML
            }

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = this.url + encodeURIComponent(q)
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('thefreedictionary.com error!')
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
