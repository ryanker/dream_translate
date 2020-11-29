'use strict'

function localTranslate() {
    return {
        init() {
            return this
        },
        tts(q, lan) {
            return new Promise((resolve, reject) => {
                let lang = conf.ttsList[lan]
                if (!lang || !voiceList[lang]) return reject('This language is not supported!')

                let options = {}
                if (localTTSConf['speak_rate']) options.rate = Number(localTTSConf['speak_rate'])
                if (localTTSConf['speak_pitch']) options.pitch = Number(localTTSConf['speak_pitch'])
                if (localTTSConf[lang]) {
                    options.voiceName = localTTSConf[lang]
                } else if (['en-US', 'es-ES', 'nl-NL'].includes(lang)) {
                    let a = {'en-US': 'en', 'es-ES': 'es', 'nl-NL': 'nl'}
                    lang = a[lang]
                    if (localTTSConf[lang]) {
                        options.voiceName = localTTSConf[lang]
                    } else {
                        options.lang = lang
                    }
                } else {
                    options.lang = lang
                }
                let arr = sliceStr(q, 128)
                let lastKey = arr.length - 1
                arr.forEach((v, k) => {
                    options.onEvent = function (e) {
                        // console.log('onEvent:', lastKey, k, v, e.type, options)
                        if (e.type === 'end') {
                            if (k === lastKey) resolve()
                        } else if (e.type === 'error') {
                            debug('tts.speak error:', e.errorMessage)
                            reject(e.errorMessage)
                        }
                    }
                    if (k === 0) {
                        chrome.tts.speak(v, options)
                    } else {
                        chrome.tts.speak(v, Object.assign({enqueue: true}, options))
                    }
                })
            })
        },
    }
}
