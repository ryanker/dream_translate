'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

document.addEventListener('DOMContentLoaded', function () {
    $('trans_window').addEventListener('click', () => sendMessage({action: 'transWindow'}))
    $('allow_select').addEventListener('click', () => {
        sendMessage({action: 'onAllowSelect'}).then(_ => {
            if (new URL(location.href).searchParams.get('isSome') === 'true') parent.window.close()
        })
    })
    D('[data-href]').forEach(e => e.addEventListener('click', () => {
        let url = e.dataset.href
        if (url.substr(0, 4) !== 'http') url = B.root + 'html/' + url
        sendMessage({action: 'openUrl', url})
    }))
    if (isFirefox) S('[data-href="speak.html"]').remove() // Firefox 不支持这个功能
})
