'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function hjdictDictionary() {
    return {
        isFirst: true,
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('.word-details')
            let s = ''
            let phonetic = {} // 音标
            let sound = [] // 发音

            // 没有找到结果
            if (!el) {
                let notEl = r.querySelector('.word-notfound-inner h2')
                if (notEl) return {text: q, phonetic, sound, html: notEl.innerText, error: true}
            }

            // 查询单词
            let wordEl = el.querySelector('.word-info .word-text h2')
            if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText.trim()}</div>`

            let pronEl = el.querySelector('.word-info .pronounces')
            if (pronEl && pronEl.childNodes.length > 0) {
                let ukEl = pronEl.querySelector('.pronounce-value-en')
                let usEl = pronEl.querySelector('.pronounce-value-us')
                let auEl = pronEl.querySelectorAll('.word-audio')
                if (ukEl && ukEl.innerText) phonetic.uk = ukEl.innerText.replace(/[\[\]]/g, '').trim()
                if (usEl && usEl.innerText) phonetic.us = usEl.innerText.replace(/[\[\]]/g, '').trim()
                if (auEl && auEl.length === 2) {
                    auEl.forEach((e, k) => {
                        let type = k === 0 ? 'uk' : 'us'
                        let url = e.dataset.src
                        if (url) sound.push({type, url})
                    })
                } else {
                    auEl.forEach(e => {
                        let type = e.className.includes('word-audio-us') ? 'us' : e.className.includes('word-audio-en') ? 'uk' : 'us'
                        let url = e.dataset.src
                        if (url) sound.push({type, url})
                    })
                }
            }
            if (phonetic.us && phonetic.uk === phonetic.us) delete phonetic.us // 如果音标一样，只保留一个

            // 释义
            let liEl = el.querySelectorAll('.simple > p')
            if (liEl && liEl.length > 0) {
                s += `<div class="case_dd_parts">`
                liEl.forEach(e => {
                    let part = e.innerText && e.innerText.trim()
                    part = part.replace(/^[a-zA-Z]+\.\s+/, function (str, k) {
                        return k === 0 ? `<b>${str.trim()}</b>` : str
                    })
                    if (part) s += `<p>${part}</p>`
                })
                s += `</div>`
            }

            // 详细释义
            /*let detailEl = el.querySelectorAll('.word-details-item-content > .detail-groups')
            if (detailEl && detailEl.length > 0) {
                detailEl.forEach(e => {
                    let str = e.innerHTML && e.innerHTML.trim()
                    if (str) s += str
                })
            }*/

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = `https://www.hjdict.com/w/${encodeURIComponent(q)}`
                httpGet(url, 'document', null, true).then(r => {
                    if (r) {
                        let d = this.unify(r, q)
                        if (!d.error) {
                            createTmpTab('hjDict', url)
                            setTimeout(() => reloadTmpTab('hjDict'), 200)
                            setTimeout(() => {
                                httpGet(url, 'document', null, true).then(r => {
                                    if (r) {
                                        resolve(this.unify(r, q))
                                    } else {
                                        reject('hjdict.com empty!')
                                    }
                                }).catch(e => {
                                    reject(e)
                                })
                            }, 500)
                        } else {
                            resolve(d)
                        }
                    } else {
                        reject('hjdict.com error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return `https://www.hjdict.com/w/${encodeURIComponent(q)}`
        },
    }
}
