'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function baiduTranslate() {
    return {
        token: {
            gtk: '',
            token: '',
            date: 0,
        },
        lanTTS: ["en", "zh", "yue", "ara", "kor", "jp", "th", "pt", "spa", "fra", "ru", "de"],
        sign(t, e) {
            let ye = function (t, e) {
                for (let r = 0; r < e.length - 2; r += 3) {
                    let n = e.charAt(r + 2)
                    n = n >= "a" ? n.charCodeAt(0) - 87 : Number(n)
                    n = "+" === e.charAt(r + 1) ? t >>> n : t << n
                    t = "+" === e.charAt(r) ? t + n & 4294967295 : t ^ n
                }
                return t
            }
            let he = '', r = t.length
            r > 30 && (t = "" + t.substr(0, 10) + t.substr(Math.floor(r / 2) - 5, 10) + t.substr(-10, 10))
            let n = ('' !== he ? he : (he = e || "") || "").split("."), o = Number(n[0]) || 0, a = Number(n[1]) || 0
            let c = [], i = 0, u = 0
            for (; u < t.length; u++) {
                let s = t.charCodeAt(u)
                128 > s ? c[i++] = s : (2048 > s ? c[i++] = s >> 6 | 192 : (55296 === (64512 & s) && u + 1 < t.length && 56320 === (64512 & t.charCodeAt(u + 1)) ?
                    (s = 65536 + ((1023 & s) << 10) + (1023 & t.charCodeAt(++u)), c[i++] = s >> 18 | 240, c[i++] = s >> 12 & 63 | 128) :
                    c[i++] = s >> 12 | 224, c[i++] = s >> 6 & 63 | 128), c[i++] = 63 & s | 128)
            }
            let f = o, l = 0
            for (; l < c.length; l++) f = ye(f += c[l], "+-a^+6")
            return f = ye(f, "+-3^+b+-f"), 0 > (f ^= a) && (f = 2147483648 + (2147483647 & f)), (f %= 1e6).toString() + "." + (f ^ o)
        },
        init() {
            let str = localStorage.getItem('baiduToken')
            if (str) this.token = JSON.parse(str)
            return this
        },
        setToken(options) {
            this.token = Object.assign(this.token, options)
            localStorage.setItem('baiduToken', JSON.stringify(this.token))
        },
        getToken() {
            return new Promise((resolve, reject) => {
                httpGet('https://fanyi.baidu.com/').then(r => {
                    let arr = r.match(/window\.gtk\s=\s'([^']+)';/)
                    let tArr = r.match(/token:\s'([^']+)'/)
                    if (!arr) return reject('baidu gtk empty!')
                    if (!tArr) return reject('baidu token empty!')
                    let token = {gtk: arr[1], token: tArr[1], date: Math.floor(Date.now() / 36e5)}
                    this.setToken(token)
                    resolve(token)
                }).catch(e => {
                    reject(e)
                })
            })
        },
        trans(q, srcLan, tarLan) {
            return new Promise((resolve, reject) => {
                if (q.length > 5000) return reject('The text is too large!')
                if (!this.token.gtk) return reject('baidu gtk empty!')
                if (!this.token.token) return reject('baidu token empty!')
                let sign = this.sign(q, this.token.gtk)
                let token = this.token.token
                let p = new URLSearchParams(`from=${srcLan}&to=${tarLan}&query=${q}&simple_means_flag=3&sign=${sign}&token=${token}&domain=common`)
                httpPost({
                    url: `https://fanyi.baidu.com/v2transapi?from=${srcLan}&to=${tarLan}`,
                    body: p.toString()
                }).then(r => {
                    if (r) {
                        resolve(this.unify(r, q, srcLan, tarLan))
                    } else {
                        reject('baidu translate error!')
                    }
                }).catch(e => {
                    reject(e)
                })
            })
        },
        unify(r, text, srcLan, tarLan) {
            // console.log('baidu:', r, text, srcLan, tarLan)
            // console.log(JSON.stringify(r))
            let res = r && r.trans_result
            let data = [], keywords = []
            if (res.data) {
                res.data.forEach(v => {
                    if (v.src && v.dst) data.push({srcText: v.src, tarText: v.dst})
                })
            }
            if (res.keywords && res.keywords.length > 0) keywords = res.keywords

            // 百度支持牛津，格林斯，英英等，如果全显示，会很复杂，小框显示也会很乱，所以只显示最简单的部分即可。
            let s = ''
            let sm = r?.dict_result?.simple_means
            if (sm) {
                s += `<div class="case_means">`
                if (sm.word_name) s += `<div class="case_means_head">${sm.word_name}</div>`  // 查询的单词

                let getIconHTML = function (type, text, title) {
                    let lan = type === 'uk' ? 'uk' : 'en'
                    let src = `https://fanyi.baidu.com/gettts?lan=${lan}&text=${encodeURIComponent(text)}&spd=3&source=web`
                    return `<i class="dmx-icon dmx_ripple" data-type="${type}" data-src-mp3="${src}" title="${title}"></i>`
                }
                if (sm.symbols) {
                    sm.symbols.forEach(sym => {
                        // 音标
                        s += `<div class="case_means_ph">`
                        s += `[${sym.ph_en || ''}${sym.ph_am && sym.ph_am !== sym.ph_en ? ' $ ' + sym.ph_am : ''}]`
                        s += getIconHTML('uk', text, '英音')
                        s += getIconHTML('us', text, '美音')
                        s += `</div>`

                        // 释义
                        s += `<div class="case_means_parts">`
                        if (sym.parts) sym.parts.forEach(v => {
                            s += `<p>${v.part ? `<b>${v.part}</b>` : ''}${v.means.join('；')}</p>`
                        })
                        s += `</div>`
                    })
                } else if (sm.word_means) {
                    s += `<div class="case_means_parts"><p>${sm.word_means.join('；')}</p></div>`
                }

                // 单词形式
                if (sm.exchange) {
                    let exchangeObj = {
                        word_third: '第三人称单数',
                        word_pl: '复数',
                        word_ing: '现在分词',
                        word_past: '过去式',
                        word_done: '过去分词',
                        word_er: '比较级',
                        word_est: '最高级',
                        word_proto: '原型',
                    }
                    s += `<div class="case_means_exchange">`
                    for (let [k, v] of Object.entries(sm.exchange)) {
                        let wordStr = ''
                        v.forEach(word => wordStr += `<a data-search="true">${word}</a>`)
                        s += `<span>${exchangeObj[k] || '其他'}</span>${wordStr}`
                    }
                    s += `</div>`
                }

                // 单词标签
                if (sm.tags) {
                    s += `<div class="case_means_tags">`
                    for (let [k, v] of Object.entries(sm.tags)) {
                        let tagStr = ''
                        v.forEach(tag => tagStr += `<u>${tag}</u>`)
                        s += tagStr
                    }
                    s += `</div>`
                }
                s += `</div>`
            }

            return {text, srcLan, tarLan, lanTTS: this.lanTTS, data, keywords, word_means: s}
        },
        async query(q, srcLan, tarLan, noCache) {
            let t = Math.floor(Date.now() / 36e5)
            let d = this.token.date
            if (noCache || !d || Number(d) !== t) {
                await this.getToken().catch(err => {
                    debug(err)
                })
            }
            if (srcLan === 'auto') {
                srcLan = 'en' // 默认值
                await httpPost({
                    url: `https://fanyi.baidu.com/langdetect`,
                    body: `query=${encodeURIComponent(q)}`
                }).then(r => {
                    if (r.lan) srcLan = r.lan
                }).catch(err => {
                    debug(err)
                })
            }
            if (srcLan === tarLan) tarLan = srcLan === 'zh' ? 'en' : 'zh'
            return this.trans(q, srcLan, tarLan)
        },
        tts(q, lan) {
            return new Promise((resolve, reject) => {
                if (!inArray(lan, this.lanTTS)) return reject('This language is not supported!')
                if (lan === 'yue') lan = 'cte' // 粤语
                // https://tts.baidu.com/text2audio?tex=%E6%98%8E(ming2)%E7%99%BD(bai2)&cuid=baike&lan=ZH&ctp=1&pdt=31&vol=9&spd=4&per=4100
                let getUrl = (s) => {
                    return `https://fanyi.baidu.com/gettts?lan=${lan}&text=${encodeURIComponent(s)}&spd=3&source=web`
                }
                let r = []
                let arr = sliceStr(q, 128)
                arr.forEach(text => {
                    r.push(getUrl(text))
                })
                resolve(r)
            })
        },
        link(q, srcLan, tarLan) {
            return `https://fanyi.baidu.com/#${srcLan}/${tarLan}/${encodeURIComponent(q)}`
        },
    }
}
