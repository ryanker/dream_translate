'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function collinsDictionary() {
    return {
        enUrl: 'https://www.collinsdictionary.com/dictionary/english/',
        init() {
            return this
        },
        unify(r, q) {
            let s = ''
            let phonetic = {}
            let sound = []
            let el = r.querySelector('.page')

            // 图片
            let part = ''
            let imgEl = el.querySelector('#images img[data-image]')
            if (imgEl) {
                part += `<img class="imageRight" src="https://www.collinsdictionary.com${imgEl.dataset.image}">`
            }

            // 释义
            let dEl = el.querySelectorAll('.dictionaries > .dictentry')
            if (dEl && dEl.length > 0) {
                dEl.forEach(vEl => {
                    // 类型
                    let type = ''
                    let tEl = vEl.querySelector('.title_container .dictname')
                    if (tEl) {
                        let tStr = tEl.innerText
                        if (tStr.includes('in British English')) type = 'uk'
                        else if (tStr.includes('in American English')) type = 'us'
                        else type = 'en'
                    }

                    // 音标
                    let pEl = vEl.querySelector('.mini_h2 .pron')
                    if (pEl) {
                        let pStr = pEl.innerText && pEl.innerText.trim()
                        if (pStr) {
                            if (type === 'uk') phonetic.uk = pStr
                            else if (type === 'us') phonetic.us = pStr
                        }
                        let srcEl = pEl.querySelector('a[data-src-mp3]')
                        if (srcEl && ['uk', 'us'].includes(type)) {
                            let url = srcEl.getAttribute('data-src-mp3')
                            sound.push({type, url})
                        }
                    }

                    vEl.querySelectorAll('a.share-button,.share-overlay,.popup-overlay').forEach(e => e.remove())
                    vEl.querySelectorAll('.word-frequency-img > .roundRed').forEach(e => addClass(e, 'dmx-icon dmx-icon-star'))

                    // 喇叭
                    vEl.querySelectorAll('[data-src-mp3]').forEach(e => {
                        e.className = 'dmx-icon dmx_ripple'
                        e.setAttribute('data-type', 'en')
                    })

                    vEl.querySelectorAll('*').forEach(e => {
                        for (let v of e.attributes) {
                            let name = v.name.toLowerCase()
                            if (!['title', 'class', 'href', '_href', 'data-search', 'data-src-mp3'].includes(name)) e.removeAttribute(name) // 过滤白名单
                            if (name === 'href') {
                                // e.setAttribute('data-search', 'true')
                                e.setAttribute('_href', v.value)
                                e.removeAttribute('href')
                            }
                        }
                    })
                    part += vEl.innerHTML
                })
            }
            if (part) s += `<div class="dict_collins">${part}</div>`
            if (phonetic.us && phonetic.uk === phonetic.us) delete phonetic.us // 如果音标一样，只保留一个

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = this.enUrl + encodeURIComponent(q)
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
            return this.enUrl + encodeURIComponent(q)
        },
    }
}
