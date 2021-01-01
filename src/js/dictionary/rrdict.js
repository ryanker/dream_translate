'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function rrdictDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('section.content')
            let s = ''

            // 查询单词
            let wordEl = el.querySelector('.text')
            if (wordEl) s = `<div class="case_dd_head">${wordEl.innerText.trim()}</div>`

            let phonetic = {} // 音标
            let sound = [] // 发音
            el.querySelectorAll('.vos > span').forEach((e, k) => {
                let ph = e.innerText && e.innerText.replace(/[\[\]英美]/g, '').trim() || ''
                if (!ph) return
                let type = ''
                if (k === 0) {
                    phonetic.uk = ph
                    type = 'uk'
                } else {
                    phonetic.us = ph
                    type = 'us'
                }
                let auEl = e.querySelector('audio[src]')
                if (!auEl) return
                sound.push({type, url: auEl.src})
            })
            if (phonetic.us && phonetic.uk === phonetic.us) delete phonetic.us // 如果音标一样，只保留一个

            // 释义
            let liEl = el.querySelector('.tmInfo .listBox')
            if (liEl && liEl.childNodes.length > 0) {
                s += `<div class="case_dd_parts">`
                let liHtml = liEl.innerHTML.trim()
                for (let part of liHtml.split('<br>')) {
                    if (part.includes('<a href=')) continue
                    part = part.replace(/^[a-zA-Z]+\.\s+/, function (str, k) {
                        return k === 0 ? `<b>${str.trim()}</b>` : str
                    })
                    if (part) s += `<p>${part}</p>`
                }
                s += `</div>`
            }

            // 单词形态
            let transEl = el.querySelector('.tmInfo .listBox:nth-child(2)')
            if (transEl) {
                let shapeStr = transEl.innerText.trim()
                shapeStr = shapeStr.replace(/[a-z]+/ig, function (str) {
                    return `<a data-search="true">${str}</a>`
                })
                s += `<div class="case_dd_exchange">${shapeStr}</div>`
            }

            // 场景例句
            let flexEl = el.querySelectorAll('#flexslider_2 ul li')
            if (flexEl && flexEl.length > 0) {
                s += `<div class="case_dd_example">`
                flexEl.forEach(e => {
                    let imgBox = e.querySelector('.imgMainbox')
                    if (imgBox) {
                        // let imgEl = imgBox.querySelector('img[src]')
                        let auEl = imgBox.querySelector('audio[src]')
                        let enEl = imgBox.querySelector('.mBottom')
                        let zhEl = imgBox.querySelector('.mFoot')
                        let url = auEl.src
                        if (url && enEl && zhEl) {
                            s += `<p><i class="dmx-icon dmx_ripple" data-type="en" data-src-mp3="${url}"></i>${enEl.innerHTML}</p><p>${zhEl.innerText}</p>`
                        }
                    }
                    // e.querySelectorAll('.mTextend > .box').forEach(bEl => {
                    //     let tEl = bEl.querySelector('.sty1')
                    //     let cEl = bEl.querySelector('.sty2')
                    // })
                })
                s += `</div>`
            }

            // 单词标签
            let tagEl = el.querySelectorAll('.tag > a')
            if (tagEl && tagEl.length > 0) {
                s += `<div class="case_dd_tags">`
                tagEl.forEach(e => {
                    let tag = e.innerText && e.innerText.trim()
                    if (tag) s += `<u>${tag}</u>`
                })
                s += `</div>`
            }

            return {text: q, phonetic, sound, html: s}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = `https://www.91dict.com/words?w=${encodeURIComponent(q)}`
                httpGet(url, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('91dict.com error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return `https://www.91dict.com/words?w=${encodeURIComponent(q)}`
        },
    }
}
