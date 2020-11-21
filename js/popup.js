let bg = chrome.extension.getBackgroundPage()
let setting = bg.setting

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector(`[name="scribble"][value="${setting.scribble}"]`).checked = true

    N('scribble').forEach(el => {
        el.addEventListener('change', function () {
            let val = this.value
            setSetting('scribble', val)
            bg.setBrowserAction(val === 'off' ? 'OFF' : '')
        })
    })

    $('allow_select').addEventListener('click', function () {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            // alert(JSON.stringify(tabs))
            if (!tabs[0] || !tabs[0].url) return
            chrome.tabs.sendMessage(tabs[0].id, {action: 'allowSelect'})
        })
    })
})

function $(id) {
    return document.getElementById(id)
}

function N(id) {
    return document.getElementsByName(id)
}

function setSetting(name, value) {
    setting[name] = value
    chrome.storage.sync.set({'setting': setting})
}
