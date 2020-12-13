'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let setting = {}
document.addEventListener('DOMContentLoaded', async function () {
    await storageSyncGet(['setting']).then(function (r) {
        setting = r.setting
    })

    // 初始值
    document.querySelector(`[name="scribble"][value="${setting.scribble}"]`).checked = true

    // 修改设置
    N('scribble').forEach(el => {
        el.addEventListener('change', function () {
            setting.scribble = this.value
            B.getBackgroundPage().saveSettingAll(setting, true)
        })
    })

    // 解除页面限制
    $('allow_select').addEventListener('click', function () {
        getActiveTabId().then(tabId => {
            tabId && sendTabMessage(tabId, {action: 'allowSelect'})
        })
    })
})

function $(id) {
    return document.getElementById(id)
}

function N(id) {
    return document.getElementsByName(id)
}
