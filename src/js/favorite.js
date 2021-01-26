'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let db, cateId = 0
let sentenceData = {}
let listen = {}, record, compare
document.addEventListener('DOMContentLoaded', async function () {
    await idb('favorite', 1, initFavorite).then(r => db = r)

    createCate()
    updateCate()
    deleteCate()
    moveSentence()
    deleteBatchSentence()
    initCate()
    selectAll()
})

// 添加分类
function createCate() {
    $('create_cate_but').addEventListener('click', function () {
        ddi({
            title: '新增分类', body: `<div class="dmx_form_item">
            <div class="item_label">分类名称</div>
                <div class="item_content"><input id="create_cateName" type="text" autocomplete="off" required class="item_input"></div>
            </div>
            <div class="dmx_right">
                <button class="dmx_button" id="create_cate">添加</button>
            </div>`
        })
        $('create_cate').addEventListener('click', () => {
            let cateName = $('create_cateName').value.trim()
            if (!cateName) return dal('请填写分类名称', 'error')
            db.create('cate', {cateName, createDate: new Date().toJSON()}).then(_ => {
                removeDdi()
                initCate()
            }).catch(e => {
                let err = e.target.error.message
                let msg = '添加失败'
                if (err && err.includes('uniqueness requirements')) msg = '分类已存在，请勿重复添加'
                dal(msg, 'error')
            })
        })
    })
}

// 编辑分类
function updateCate() {
    $('cate_edit').addEventListener('click', function () {
        ddi({
            title: '编辑分类', body: `<div class="dmx_form_item">
            <div class="item_label">分类名称</div>
                <div class="item_content"><input id="update_cateName" type="text" autocomplete="off" required class="item_input"></div>
            </div>
            <div class="dmx_right">
                <button class="dmx_button" id="update_cate">保存</button>
            </div>`
        })
        let updateEl = $('update_cateName')
        updateEl.value = $('cate_name').innerText
        $('update_cate').addEventListener('click', () => {
            let cateName = updateEl.value.trim()
            if (!cateName) return dal('分类名称不能为空', 'error')
            db.update('cate', cateId, {cateName}).then(_ => {
                removeDdi()
                initCate()
            }).catch(e => {
                let err = e.target.error.message
                let msg = '修改失败'
                if (err && err.includes('uniqueness requirements')) msg = '分类名称不允许重名'
                dal(msg, 'error')
            })
        })
    })
}

// 删除分类
function deleteCate() {
    $('cate_delete').addEventListener('click', function () {
        dco('删除分类不可恢复，确认删除吗？', () => {
            if (cateId < 1) return dal('系统分类不允许删除', 'error')
            db.count('sentence', 'cateId', cateId).then(n => {
                if (n > 0) return dal('分类存在数据，请先清空数据', 'error')
                db.delete('cate', cateId).then(_ => initCate(0)).catch(_ => dal('删除失败', 'error'))
            })
        })
    })
}

// 批量移动句子
function moveSentence() {
    $('sentence_move').addEventListener('click', function () {
        db.getAll('cate').then(arr => {
            let s = '<option value="-1">选择分类</option>'
            arr.forEach(v => {
                if (v.cateId === cateId) return // 排除当前分类
                s += `<option value="${v.cateId}">${v.cateName}</option>`
            })

            ddi({
                title: '移动到', body: `<div class="dmx_form_item">
                <div class="item_label">分类</div>
                    <div class="item_content"><select id="move_cateId">${s}</select></div>
                </div>
                <div class="dmx_right">
                    <button class="dmx_button" id="move_cate_but">确认</button>
                </div>`
            })
            $('move_cate_but').addEventListener('click', () => {
                let cateId = Number($('move_cateId').value)
                if (cateId < 0) return dal('请选择分类', 'error')

                let eList = D('td.tb_checkbox input[type="checkbox"]:checked')
                eList.forEach(el => {
                    db.update('sentence', Number(el.value), {cateId}).catch(_ => dal('移动失败', 'error'))
                })
                setTimeout(() => {
                    removeDdi()
                    initCate(cateId)
                    selectCancel()
                }, 1000)
            })
        })
    })
}

// 批量删除句子
function deleteBatchSentence() {
    $('sentence_delete').addEventListener('click', function () {
        let eList = D('td.tb_checkbox input[type="checkbox"]:checked')
        dco(`删除不可恢复，您确认要删除这 ${eList.length} 条数据吗？`, () => {
            eList.forEach(el => {
                db.delete('sentence', Number(el.value)).catch(_ => dal('删除失败', 'error'))
            })
            setTimeout(() => {
                initCate()
                selectCancel()
            }, 1000)
        })
    })
}

// 加载分类
function initCate(id) {
    db.getAll('cate').then(arr => {
        let s = ''
        arr.forEach(v => {
            s += `<li data-id="${v.cateId}"><a><i class="dmx-icon dmx-icon-folder"></i>${v.cateName}</a></li>`
        })
        $('cate_box').innerHTML = s

        // 分类筛选
        D('#cate_box li').forEach(el => {
            el.addEventListener('click', () => {
                cateId = Number(el.dataset.id)
                initSentence(cateId)
                D('#cate_box li.active').forEach(e => rmClass(e, 'active'))
                addClass(el, 'active')
            })
        })

        // 初始
        let firstEl = S(`#cate_box li[data-id="${typeof id === 'number' ? id : cateId || 0}"]`)
        if (firstEl) firstEl.click()
    })
}

// 加载句子
function initSentence(cateId) {
    db.read('cate', cateId).then(cate => $('cate_name').innerText = cate.cateName)
    db.count('sentence', 'cateId', cateId).then(n => $('sentences').innerText = n)
    db.find('sentence', {indexName: 'cateId', query: cateId}).then(arr => {
        let tbodyEl = S('#sentence_box tbody')
        if (arr.length < 1) {
            tbodyEl.innerHTML = `<tr><td class="table_empty" colspan="${D('#sentence_box thead th').length}">暂无内容</td></tr>`
            return
        }

        // console.log(JSON.stringify(arr))
        let s = ''
        arr.forEach((v, k) => {
            s += `<tr>
                <td class="tb_checkbox"><input type="checkbox" value="${v.id}"></td>
                <td class="tb_index">${v.id}</td>
                <td class="tb_sentence">${v.sentence}</td>
                <td class="tb_words">${v.words.replace(/\n/g, '; ')}</td>
                <td class="tb_records">${v.records}</td>
                <td class="tb_days">${v.days}</td>
                <td class="tb_date">${v.createDate}</td>
                <td class="tb_operate" data-id="${v.id}" data-key="${k}">
                    <div class="dmx_button" data-action="skill">练习</div>
                    <div class="dmx_button dmx_button_warning" data-action="edit">修改</div>
                    <div class="dmx_button dmx_button_danger" data-action="delete">删除</div>
                </td>
            </tr>`
        })
        tbodyEl.innerHTML = s
        sentenceData = arr
        selectBind()
        reviewSentence()
        editSentence()
        deleteSentence()
    })
}

// 复习句子
function reviewSentence() {
    D('.dmx_button[data-action="skill"]').forEach(el => {
        el.addEventListener('click', () => {
            ddi({
                fullscreen: true,
                title: '',
                body: `<div class="player_box">
                        <div class="tab fx">
                            <u data-type="skill" class="active">朗读练习</u>
                            <u data-type="record">发音练习</u>
                            <u data-type="listen">听力练习</u>
                        </div>
                        <div id="skill_box"></div>
                    </div>`,
                onClose: () => {
                    listen.stop()
                }
            })

            // 绑定事件
            let tabEl = D('.player_box u[data-type]')
            let boxEl = $('skill_box')
            tabEl.forEach(e => {
                e.addEventListener('click', () => {
                    let len = sentenceData.length
                    let key = Number(el.parentNode.dataset.key)
                    let type = e.dataset.type
                    let s = '<div id="player_sentence"></div>'
                    if (type === 'skill') {
                        s += '<div id="player_listen" style="display:none"></div><div id="player_record"></div><div id="player_compare"></div>'
                    } else if (type === 'record') {
                        s += '<div id="player_listen"></div><div id="player_record"></div><div id="player_compare"></div>'
                    } else if (type === 'listen') {
                        s += '<div id="player_listen"></div>'
                    }
                    s += `<div class="divider"><b><span id="practice_num">0</span> 次</b></div></div>`
                    s += `<div class="dmx_center${type === 'listen' ? ' dmx_hide' : ''}"><button class="dmx_button medium" id="next_but">下一句 (<span>${key + 1}</span>/${len})</button></div>`
                    if (type === 'listen') {
                        s += `<div class="dmx_form_item">
                            <div class="item_label">播放次数</div>
                            <div class="item_content number"><input id="player_num" type="number" value="2" class="item_input"></div>
                            <div class="ml_1"><div class="dmx_button dmx_button_danger medium" id="stop_but">停止播放</div></div>
                        </div>`
                    }
                    boxEl.innerHTML = s
                    rmClassD(tabEl, 'active')
                    addClass(e, 'active')
                    playerInit(key, type)

                    // 下一句
                    $('next_but').addEventListener('click', function () {
                        let nextKey = Number(el.parentNode.dataset.key) + 1
                        let newKey = nextKey >= len ? 0 : nextKey
                        el.parentNode.dataset.key = String(newKey)
                        this.querySelector('span').innerText = String(newKey + 1)
                        $('practice_num').innerText = 0
                        rmClass($('player_sentence'), 'hide')
                        playerInit(newKey, type)
                    })

                    // 停止播放
                    if (type === 'listen') {
                        $('stop_but').addEventListener('click', () => {
                            listen.stop()
                            listen.showControls()
                        })
                    }
                })
            })

            // 初始
            setTimeout(() => {
                let el = S('.player_box u[data-type="skill"]')
                if (el) el.click()
            }, 100)
        })
    })
}

function playerInit(key, type) {
    let maxDuration = 5000
    let practiceNum = 0
    let row = sentenceData[key] || {}

    let senEl = $('player_sentence')
    let nextEl = $('next_but')
    senEl.innerText = row.sentence || ''

    let setPracticeNum = function (n) {
        let el = $('practice_num')
        if (el) el.innerText = n
    }
    let onReady = function (duration) {
        let times = 2
        if (duration > 10) times *= 2.5 // 时间越长，模仿越难
        maxDuration = Math.ceil(duration * times) * 1000
        record.setMaxDuration(maxDuration)
    }
    if (type === 'skill') {
        listen = playerListen('player_listen', {onReady})
        listen.loadBlob(row.blob)
        record = playerRecord('player_record', {
            showStartBut: true,
            maxDuration,
            onStart: () => nextEl.disabled = true,
            onStop: () => {
                compare.loadBlob(row.blob)
                compare.once('finish', () => {
                    let t = setTimeout(() => record.showStartBut(), maxDuration)
                    setTimeout(() => {
                        compare.loadBlob(record.blob)
                        compare.once('finish', () => {
                            clearTimeout(t)
                            record.showStartBut()
                            nextEl.disabled = false // 解除禁用
                            setPracticeNum(++practiceNum) // 练习次数
                            if (practiceNum > 10) addClass(senEl, 'hide') // 提升难度，隐藏文字
                        })
                    }, 100)
                })
            },
        })
        compare = playerCompare('player_compare')
    } else if (type === 'record') {
        listen = playerListen('player_listen', {
            onReady,
            onPlay: () => nextEl.disabled = true,
            onFinish: () => record.start(), // 开始录音
        })
        listen.loadBlob(row.blob)
        record = playerRecord('player_record', {
            maxDuration,
            onStop: () => {
                compare.loadBlob(row.blob)
                compare.once('finish', () => {
                    let t = setTimeout(() => listen.showControls(), maxDuration + 1000) // 显示开始录音按钮
                    setTimeout(() => {
                        compare.loadBlob(record.blob)
                        compare.once('finish', () => {
                            clearTimeout(t)
                            listen.showControls() // 显示播放按钮
                            nextEl.disabled = false // 解除禁用
                            setPracticeNum(++practiceNum) // 练习次数
                            if (practiceNum > 10) addClass(senEl, 'hide') // 提升难度，隐藏文字
                        })
                    }, 100)
                })
            }
        })
        compare = playerCompare('player_compare')
    } else if (type === 'listen') {
        listen = playerListen('player_listen', {
            onFinish: () => {
                listen.play()
                let nEl = $('player_num')
                let n = nEl && nEl.value ? Number(nEl.value) : 2
                setPracticeNum(++practiceNum) // 练习次数
                if (practiceNum > 10) addClass(senEl, 'hide') // 提升难度，隐藏文字
                if (practiceNum >= n) {
                    $('next_but').click()
                    setTimeout(() => listen.play(), 100)
                }
            }
        })
        listen.loadBlob(row.blob)
    }
}

// 修改句子
function editSentence() {
    D('.dmx_button[data-action="edit"]').forEach(el => {
        el.addEventListener('click', () => {
            ddi({
                title: '修改',
                body: `<div id="sentence_form">
        <div class="dmx_form_item">
            <div class="item_label">句子</div>
            <div class="item_content"><input name="sentence" type="text" autocomplete="off" required class="item_input"></div>
        </div>
        <div class="dmx_form_item">
            <div class="item_label">生词</div>
            <div class="item_content"><textarea name="words" autocomplete="off" class="item_textarea"></textarea></div>
        </div>
        <div class="dmx_form_item">
            <div class="item_label">备注</div>
            <div class="item_content"><textarea name="remark" autocomplete="off" class="item_textarea"></textarea></div>
        </div>
        <div class="dmx_right">
            <button class="dmx_button" type="submit">确认</button>
        </div>
    </div>`
            })
            let id = Number(el.parentNode.dataset.id)
            let formEl = $('sentence_form')
            let sentenceEl = formEl.querySelector('[name="sentence"]')
            let wordsEl = formEl.querySelector('[name="words"]')
            let remarkEl = formEl.querySelector('[name="remark"]')
            let submitEl = formEl.querySelector('button[type="submit"]')
            db.read('sentence', id).then(row => {
                sentenceEl.value = row.sentence
                wordsEl.value = row.words
                remarkEl.value = row.remark
            })
            submitEl.addEventListener('click', () => {
                let sentence = sentenceEl.value.trim()
                if (!sentence) return dal('句子内容不能为空', 'error')
                db.update('sentence', id, {
                    sentence,
                    words: wordsEl.value,
                    remark: remarkEl.value,
                }).then(_ => {
                    removeDdi()
                    initSentence(cateId)
                }).catch(_ => dal('修改失败', 'error'))
            })
        })
    })
}

// 删除句子
function deleteSentence() {
    D('.dmx_button[data-action="delete"]').forEach(el => {
        el.addEventListener('click', () => {
            let id = Number(el.parentNode.dataset.id)
            dco(`删除不可恢复，您确认要删除吗？`, () => {
                db.delete('sentence', id).then(_ => initSentence(cateId)).catch(_ => dal('删除失败', 'error'))
            })
        })
    })
}

// 显示批量操作按钮
function selectBind() {
    let eList = D('td.tb_checkbox input[type="checkbox"]')
    eList.forEach(el => {
        el.addEventListener('click', () => {
            let len = 0
            eList.forEach(e => e.checked && len++)
            ;(len > 0 ? addClass : rmClass)($('extra_but'), 'dmx_show')
        })
    })
}

// 全选/不全选
function selectAll() {
    $('selectAll').addEventListener('click', function () {
        let eList = D('td.tb_checkbox input[type="checkbox"]')
        eList.forEach(el => el.checked = this.checked)
        ;(this.checked && eList.length > 0 ? addClass : rmClass)($('extra_but'), 'dmx_show')
    })
}

// 取消选中
function selectCancel() {
    $('selectAll').checked = false
    rmClass($('extra_but'), 'dmx_show')
}
