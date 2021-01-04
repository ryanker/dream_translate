'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function vocabularyDictionary() {
    return {
        url: 'https://www.vocabulary.com/dictionary/',
        init() {
            return this
        },
        unify(r, q) {
            let el = r.querySelector('.centeredContent')

            // 发音
            let sound = []
            let soundEl = r.querySelector('a.audio[data-audio]')
            if (soundEl) sound.push({type: 'us', url: `https://audio.vocab.com/1.0/us/${soundEl.dataset.audio}.mp3`})

            // 清理
            removeD(el.querySelectorAll('script,style,img'))
            cleanAttr(el, ['title', 'class'])
            el.querySelectorAll('.groupNumber').forEach(e => {
                e.style.marginTop = '10px'
                e.style.fontWeight = '700'
            })

            return {text: q, phonetic: {}, sound, html: el.innerHTML}
        },
        query(q) {
            return new Promise((resolve, reject) => {
                if (q.length > 100) return reject('The text is too large!')
                let url = this.url + encodeURIComponent(q)
                httpGet(url, 'document', null, true).then(r => {
                    if (r) {
                        resolve(this.unify(r, q))
                    } else {
                        reject('vocabulary.com error!')
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
