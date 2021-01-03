'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function merriamDictionary() {
    return {
        dUrl: 'https://www.learnersdictionary.com/definition/',
        mUrl: 'https://www.merriam-webster.com/dictionary/',
        init() {
            return this
        },
        unify(r, q) {
            let s = ''
            let phonetic = {}
            let sound = []
            let el = r.querySelector('#ld_entries_v2_all')

            // 音标
            let pronEl = el.querySelector('.hpron_word')
            if (pronEl) {
                let pron = pronEl.textContent && pronEl.textContent.replace(/\//g, '').trim()
                if (pron) phonetic.uk = pron
            }

            // 发音
            let pEl = el.querySelector('a.play_pron[data-file]')
            if (pEl) {
                let file = pEl.getAttribute('data-file')
                let pre = 'https://media.merriam-webster.com/audio/prons/en/us/mp3'
                sound.push({type: 'us', url: `${pre}/${file.substring(0, 1)}/${file}.mp3`})
            }

            // 释义
            let part = ''
            let deepCommentRemove = function (el) {
                for (let v of el.childNodes) {
                    if (v.nodeType === 8) v.remove() // 删除注释
                    if (v.childNodes.length > 0) deepCommentRemove(v)
                }
            }
            let v2El = el.querySelectorAll('.entry_v2')
            if (v2El && v2El.length > 0) {
                v2El.forEach(vEl => {
                    deepCommentRemove(vEl)
                    vEl.querySelectorAll('.vi_more,.d_hidden,a.play_pron').forEach(e => e.remove())
                    vEl.querySelectorAll('.sn_block_num').forEach(e => e.style.float = 'left')
                    vEl.querySelectorAll('.hw_d').forEach(e => {
                        e.style.color = '#0580e8'
                        e.style.fontSize = '110%'
                    })
                    vEl.querySelectorAll('.sblock_c').forEach(e => e.style.marginTop = '10px')
                    vEl.querySelectorAll('.sgram_internal').forEach(e => e.style.color = '#757575')
                    vEl.querySelectorAll('*').forEach(e => {
                        for (let v of e.attributes) {
                            let name = v.name.toLowerCase()
                            if (!['title', 'class', 'href', 'style', 'data-search'].includes(name)) e.removeAttribute(name) // 过滤白名单
                            if (name === 'href') {
                                // e.setAttribute('data-search', 'true')
                                e.setAttribute('_href', v.value)
                                e.removeAttribute('href')
                            }
                        }
                    })
                    part += vEl.innerHTML.replace(/\s+/g, ' ')
                })
            }
            if (part) s += `<div class="dict_cambridge">${part}</div>`

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = this.dUrl + encodeURIComponent(q)
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('merriam-webster.com error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return this.dUrl + encodeURIComponent(q)
        },
    }
}
