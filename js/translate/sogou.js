'use strict'

function sogouTranslate() {
    return {
        init() {
            return this
        },
        trans(q, srcLan, tarLan) {
            return new Promise((resolve, reject) => {
                let w = chrome.webRequest

                // 取消 Frame 嵌入限制
                let onCompleted = function (details) {
                    for (let i = 0; i < details.responseHeaders.length; ++i) {
                        if (details.responseHeaders[i].name === 'X-Frame-Options') {
                            details.responseHeaders.splice(i, 1)
                            break
                        }
                    }
                    return {responseHeaders: details.requestHeaders}
                }
                w.onCompleted.addListener(onCompleted, {urls: ["*://fanyi.sogou.com/*"]}, Object.values(w.OnCompletedOptions))

                // Frame 请求
                let eid = 'soGouIframe'
                let src = this.link(q, srcLan, tarLan)
                let el = document.getElementById(eid)
                if (!el) {
                    el = document.createElement('iframe')
                    el.id = eid
                    el.src = src
                    document.body.appendChild(el)
                } else {
                    el.src = src
                }

                // 获取请求参数
                let isGet = false
                let urls = ['*://fanyi.sogou.com/reventondc/translateV*']
                let onBeforeRequest = function (details) {
                    if (isGet) return
                    isGet = true

                    let data = details.requestBody.formData
                    // console.log(data)
                    let url = details.url
                    setTimeout(() => {
                        post(url, data)
                    }, 200)
                    return {cancel: true}
                }
                w.onBeforeRequest.addListener(onBeforeRequest, {urls: urls}, Object.values(w.OnBeforeRequestOptions))

                // 销毁
                let removeListener = function () {
                    el.remove()
                    w.onCompleted.removeListener(onCompleted)
                    w.onBeforeSendHeaders.removeListener(onBeforeSendHeaders)
                    w.onBeforeRequest.removeListener(onBeforeRequest)
                }

                // 请求接口
                let onBeforeSendHeaders = function (details) {
                    let h = details.requestHeaders
                    h.push({name: 'Host', value: 'fanyi.sogou.com'})
                    h.push({name: 'Origin', value: 'https://fanyi.sogou.com'})
                    h.push({name: 'Referer', value: src})
                    h.push({name: 'Sec-Fetch-Site', value: 'same-origin'})
                    return {requestHeaders: h}
                }
                let post = (url, data) => {
                    w.onBeforeSendHeaders.addListener(onBeforeSendHeaders, {urls: urls}, Object.values(w.OnBeforeSendHeadersOptions))
                    let p = new URLSearchParams(data)
                    setTimeout(removeListener, 200)
                    httpPost({url: url, body: p.toString()}).then(r => {
                        if (r) {
                            resolve(this.unify(r, q, srcLan, tarLan))
                        } else {
                            reject('sogou trans error!')
                        }
                    }).catch(e => {
                        reject(e)
                    })
                }
            })
        },
        unify(r, q, srcLan, tarLan) {
            // console.log('sogou:', r, q, srcLan, tarLan)
            if (srcLan === 'auto' && r?.data?.detect?.detect) srcLan = r.data.detect.detect
            let ret = {text: q, srcLan: srcLan, tarLan: tarLan, lanTTS: null, data: []}
            let data = r && r.data
            let tar = data.translate && data.translate.dit
            if (tar) {
                let srcArr = q.split('\n')
                let tarArr = tar.split('\n')
                tarArr.forEach((tar, key) => {
                    if (tar) ret.data.push({srcText: srcArr[key] || '', tarText: tar})
                })
            }
            if (data.keywords) ret.keywords = data.keywords
            // if (data.keyword_dict) ret.keyword_dict = data.keyword_dict
            return ret
        },
        async query(q, srcLan, tarLan) {
            return this.trans(q, srcLan, tarLan)
        },
        tts(q, lan) {
            return new Promise((resolve) => {
                let getUrl = (s) => {
                    return `https://fanyi.sogou.com/reventondc/synthesis?text=${encodeURIComponent(s)}&speed=1&lang=${lan}&from=translateweb&speaker=1`
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
            return `https://fanyi.sogou.com/?keyword=${encodeURIComponent(q)}&transfrom=${srcLan}&transto=${tarLan}&model=general`
        },
    }
}
