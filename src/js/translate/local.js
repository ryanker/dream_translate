'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function localTranslate() {
    return {
        voiceList: null,
        init() {
            return this
        },
        tts(q, lan) {
            return new Promise(async (resolve, reject) => {
                if (!this.voiceList) await getVoices().then(r => this.voiceList = r)

                let ttsConf = setting.ttsConf || {}
                let lang = getJSONValue(conf, `ttsList.${lan}`)
                if (!lang || !this.voiceList || !this.voiceList[lang]) return reject('This language is not supported!')

                let options = {}
                if (ttsConf['speak_rate']) options.rate = Number(ttsConf['speak_rate'])
                if (ttsConf['speak_pitch']) options.pitch = Number(ttsConf['speak_pitch'])
                if (ttsConf[lang]) {
                    options.voiceName = ttsConf[lang]
                } else if (['en-US', 'es-ES', 'nl-NL'].includes(lang)) {
                    let a = {'en-US': 'en', 'es-ES': 'es', 'nl-NL': 'nl'}
                    lang = a[lang]
                    if (ttsConf[lang]) {
                        options.voiceName = ttsConf[lang]
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
                        B.tts.speak(v, options)
                    } else {
                        B.tts.speak(v, Object.assign({enqueue: true}, options))
                    }
                })
            })
        },
    }
}
