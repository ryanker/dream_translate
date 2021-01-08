'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

document.addEventListener('DOMContentLoaded', function () {
    $('trans_window').addEventListener('click', onTransWindow)
    $('allow_select').addEventListener('click', onAllowSelect)
    D('[data-href]').forEach(e => e.addEventListener('click', () => onOpenUrl(e)))
})

function onTransWindow() {
    let screen = window.screen
    let o = {type: 'popup', width: 600, height: 520, url: B.root + 'html/popup.html?fullscreen=1'}
    if (screen.width) o.left = (screen.width - o.width) / 2
    if (screen.height) o.top = (screen.height - o.height) / 2
    B.windows.create(o)
}

function onAllowSelect() {
    getActiveTabId().then(tabId => {
        tabId && sendTabMessage(tabId, {action: 'allowSelect'})
    })
}

function onOpenUrl(e) {
    B.tabs.create({url: 'html/' + e.dataset.href})
}
