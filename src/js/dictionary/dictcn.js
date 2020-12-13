'use strict'
/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function dictcnDictionary() {
    return {
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('.main')

            // 音标
            let phonetic = {}
            el.querySelectorAll('.phonetic > span > bdo').forEach((v, k) => {
                if (k === 0) phonetic.uk = v.innerText.replace(/(^\[|]$)/g, '')
                else if (k === 1) phonetic.us = v.innerText.replace(/(^\[|]$)/g, '')
            })
            if (phonetic.uk === phonetic.us) delete phonetic.us // 如果音标一样，只保留一个

            // 发音
            let sound = []
            el.querySelectorAll('.phonetic > span > .sound').forEach((v, k) => {
                let title = v.getAttribute('title')
                let src = 'http://audio.dict.cn/' + v.getAttribute('naudio')
                sound.push({type: k < 2 ? 'uk' : 'us', title: title, url: src, isWoman: v.className.includes('fsound')})
            })

            // 清理
            el.querySelectorAll('script,style,#dshared,.copyright').forEach(e => {
                e.remove()
            })
            return {text: q, phonetic: phonetic, sound: sound, html: el.innerHTML}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                httpGet(`http://dict.cn/${encodeURIComponent(q)}`, 'document').then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('dict.cn error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        link(q) {
            return `http://dict.cn/${encodeURIComponent(q)}`
        },
    }
}
