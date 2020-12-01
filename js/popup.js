let bg = chrome.extension.getBackgroundPage()
let setting = bg.setting

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector(`[name="scribble"][value="${setting.scribble}"]`).checked = true

    N('scribble').forEach(el => {
        el.addEventListener('change', function () {
            let val = this.value
            bg.setSetting('scribble', val)
        })
    })

    $('allow_select').addEventListener('click', function () {
        bg.currentTabMessage({action: 'allowSelect'})
    })
})

function $(id) {
    return document.getElementById(id)
}

function N(id) {
    return document.getElementsByName(id)
}
