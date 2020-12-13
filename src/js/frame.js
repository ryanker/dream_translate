'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let frame = window.frameElement
if (frame) {
    let top = window.top
    document.addEventListener('mouseup', function (e) {
        let bcr = frame.getBoundingClientRect()
        let clientX = e.clientX + bcr.left
        let clientY = e.clientY + bcr.top
        let text = window.getSelection().toString().trim()
        if (text) top.postMessage({text: text, clientX: clientX, clientY: clientY}, '*')
    })
    document.addEventListener('mouseup', function () {
        top._MxDialog && top._MxDialog.hide()
    })
}
