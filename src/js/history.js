'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let db
let bg = B.getBackgroundPage()
document.addEventListener('DOMContentLoaded', async function () {
    await idb('history', 1, initHistory).then(r => db = r)

    historyList() // 展示列表
    selectAll() // 全选/取消全选
    deleteMultiple() // 批量删除
    openSetting() // 设置
})

function historyList() {
    db.count('history').then(n => $('historyNum').innerText = n)
    db.find('history', {direction: 'prev'}).then(arr => {
        let tbodyEl = S('#history_box tbody')
        if (arr.length < 1) {
            tbodyEl.innerHTML = `<tr><td class="table_empty" colspan="${D('#history_box thead th').length}">暂无内容</td></tr>`
            return
        }

        // console.log(JSON.stringify(arr))
        let s = ''
        arr.forEach((v, k) => {
            s += `<tr>
                <td class="tb_checkbox"><input type="checkbox" value="${v.id}"></td>
                <td class="tb_sentence">${HTMLEncode(v.content)}</td>
                <td class="tb_date" title="${getDate(v.createDate)}">${getDate(v.createDate, true)}</td>
                <td class="tb_operate2" data-id="${v.id}" data-key="${k}">
                    <a class="dmx_button dmx_button_default" title="${v.formTitle}" href="${v.formUrl}" target="_blank">来源</a>
                    <div class="dmx_button dmx_button_danger" data-action="delete">删除</div>
                </td>
            </tr>`
        })
        tbodyEl.innerHTML = s

        // 选中
        let eList = D('#history_body input[type="checkbox"]')
        eList.forEach(el => {
            el.addEventListener('click', () => {
                let len = 0
                eList.forEach(e => e.checked && len++)
                ;(len > 0 ? addClass : rmClass)($('extra_but'), 'dmx_show') // 是否显示批量删除按钮
            })
        })

        // 删除
        D('.dmx_button[data-action="delete"]').forEach(el => {
            el.addEventListener('click', () => {
                let id = Number(el.parentNode.dataset.id)
                dco(`删除不可恢复，您确认要删除吗？`, () => {
                    db.delete('history', id).then(_ => historyList()).catch(_ => dal('删除失败', 'error'))
                })
            })
        })
    })
}

// 批量删除
function deleteMultiple() {
    $('delete_multiple').addEventListener('click', function () {
        let eList = D('#history_body input[type="checkbox"]:checked')
        dco(`删除不可恢复，您确认要删除这 ${eList.length} 条数据吗？`, () => {
            eList.forEach(el => {
                db.delete('history', Number(el.value)).catch(_ => dal('删除失败', 'error'))
            })
            setTimeout(_ => historyList(), 1000)

            // 取消
            rmClass($('extra_but'), 'dmx_show')
            $('selectAll').checked = false
        })
    })
}

// 全选/取消全选
function selectAll() {
    $('selectAll').addEventListener('click', function () {
        let eList = D('#history_body input[type="checkbox"]')
        eList.forEach(el => el.checked = this.checked)
        ;(this.checked && eList.length > 0 ? addClass : rmClass)($('extra_but'), 'dmx_show') // 是否显示批量删除按钮
    })
}

// 设置
function openSetting() {
    $('setting').addEventListener('click', function () {
        ddi({
            title: '设置', body: `<div class="dmx_form_item">
            <div class="item_label">最大记录数</div>
                <div class="item_content number"><input id="history_max" type="number" value="${bg.historyMax}" min="0" class="item_input"></div>
            </div>
            <div class="dmx_right">
                <button class="dmx_button" id="save_but">保存</button>
            </div>`
        })
        $('save_but').addEventListener('click', () => {
            let maxNum = $('history_max').value
            bg.settingHistory(maxNum)
            removeDdi()
        })
    })
}
