'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let db, cateId = 0
let sentenceData = {}
let listen, record, record2, compare
document.addEventListener('DOMContentLoaded', async function () {
    await idb('favorite', 1, initFavorite).then(r => db = r)

    createCate()
    updateCate()
    deleteCate()
    moveSentence()
    deleteBatchSentence()
    initCate()
    selectAll()
    exportZip() // 导出
    importZip() // 导入
    openSetting() // 设置
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
            let d = new Date().toJSON()
            db.create('cate', {cateName, updateDate: d, createDate: d}).then(_ => {
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

    let orderBy = localStorage['orderBy']
    let direction = orderBy === 'reverse' ? 'prev' : 'next'
    db.find('sentence', {indexName: 'cateId', query: cateId, direction}).then(arr => {
        let tbodyEl = S('#sentence_box tbody')
        if (arr.length < 1) {
            tbodyEl.innerHTML = `<tr><td class="table_empty" colspan="${D('#sentence_box thead th').length}">暂无内容</td></tr>`
            return
        }

        if (orderBy === 'random') shuffle(arr) // 随机

        // console.log(JSON.stringify(arr))
        let s = ''
        arr.forEach((v, k) => {
            s += `<tr>
                <td class="tb_checkbox"><input type="checkbox" value="${v.id}"></td>
                <td class="tb_sentence">${pointSentence(v.sentence, v.words)}</td>
                <td class="tb_records">${v.records}</td>
                <td class="tb_days">${v.days}</td>
                <td class="tb_date" title="${getDate(v.createDate)}">${getDate(v.createDate, true)}</td>
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
                    initSentence(cateId)
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
                        s += '<div id="player_listen"></div><div id="player_record2"></div><div id="player_compare"></div>'
                    } else if (type === 'listen') {
                        s += '<div id="player_listen"></div>'
                    }
                    s += `<div class="divider"><b><span id="practice_num">0</span> 次</b></div></div>`
                    s += `<div class="dmx_center${type === 'listen' ? ' dmx_hide' : ''}"><button class="dmx_button medium" id="next_but">下一句 (<span>${key + 1}</span>/${len})</button></div>`
                    if (type === 'listen') {
                        s += `<div class="dmx_left dmx_form_item">
                            <div class="item_label">播放次数</div>
                            <div class="item_content number"><input id="player_num" type="number" value="2" class="item_input"></div>
                            <div class="ml_1"><div class="dmx_button dmx_button_danger medium" id="stop_but">停止播放</div></div>
                        </div>`
                    }
                    s += window.playerTips
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

// 加载播放器
function playerInit(key, type) {
    let maxDuration = 5000
    let practiceNum = 0
    let row = sentenceData[key] || {}
    let sentence = row.sentence || ''
    let words = row.words || ''
    let records = row.records || 0
    let days = row.days || 0
    let practiceDate = row.practiceDate || ''

    let senEl = $('player_sentence')
    let nextEl = $('next_but')

    // 显示句子
    senEl.innerHTML = pointSentence(sentence, words, type === 'record')

    // 练习次数
    let setPracticeNum = function (n, isUpdate) {
        let el = $('practice_num')
        if (el) el.innerText = n

        // 更新 DB
        if (isUpdate) {
            records++
            if (practiceDate) {
                let oldDate = getDate(practiceDate, true).replace(/\D/g, '')
                let nowDate = getDate(null, true).replace(/\D/g, '')
                if (oldDate < nowDate) days++
            } else {
                days++
            }
            practiceDate = new Date().toJSON()
            db.update('sentence', row.id, {records, days, practiceDate})
        }
    }

    // 加载完成
    if (type === 'skill') {
        listen = playerListen('player_listen', {
            onReady: function (duration) {
                let times = 2
                if (duration > 10) times *= 2.5 // 时间越长，模仿越难
                maxDuration = Math.ceil(duration * times) * 1000
                record.setMaxDuration(maxDuration)
            }
        })
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
                            setPracticeNum(++practiceNum, true) // 练习次数
                            if (practiceNum > 10) addClass(senEl, 'hide') // 提升难度，隐藏文字
                        })
                    }, 100)
                })
            },
        })
        compare = playerCompare('player_compare')
    } else if (type === 'record') {
        listen = playerListen('player_listen', {
            onReady: function (duration) {
                let times = 2
                if (duration > 10) times *= 2.5 // 时间越长，模仿越难
                maxDuration = Math.ceil(duration * times) * 1000
                record2.setMaxDuration(maxDuration)
            },
            onPlay: () => nextEl.disabled = true,
            onFinish: () => record2.start(), // 开始录音
        })
        listen.loadBlob(row.blob)
        record2 = playerRecord('player_record2', {
            maxDuration,
            onStop: () => {
                compare.loadBlob(row.blob)
                compare.once('finish', () => {
                    let t = setTimeout(() => listen.showControls(), maxDuration + 1000) // 显示开始录音按钮
                    setTimeout(() => {
                        compare.loadBlob(record2.blob)
                        compare.once('finish', () => {
                            clearTimeout(t)
                            listen.showControls() // 显示播放按钮
                            nextEl.disabled = false // 解除禁用
                            setPracticeNum(++practiceNum, true) // 练习次数
                            if (practiceNum === 5) senEl.innerHTML = pointSentence(sentence, words) // 降低难度，显示文字
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

// 解析重点词汇
function pointSentence(sentence, words, isUnderscore) {
    let arr = words.split('\n')

    // 过滤 HTML，防止XSS
    let d = document.createElement('div')
    d.innerText = sentence

    let s = d.innerText
    for (let v of arr) {
        v = v.trim()
        if (!v) continue
        s = s.replace(new RegExp(`(^${v}\\W|\\W${v}\\W|\\W${v}$|^${v}$)`, 'g'), (word) => {
            if (isUnderscore) {
                return word.replace(/\S+/g, '___')
            } else {
                return word.replace(/(\S+)/g, `<span class="point">$1</span>`)
            }
        })
    }
    return s
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

// 导出
function exportZip() {
    $('export').addEventListener('click', async function () {
        loading('打包下载...')
        let zip = new JSZip()

        // cate
        await db.find('cate').then(arr => {
            zip.file(`cate.json`, JSON.stringify(arr))
        })

        // sentence
        let sentence = {}
        let typeArr = {}
        await db.find('sentence').then(arr => {
            for (let v of arr) {
                // zip.file(`${v.id}.json`, JSON.stringify(v))
                zip.file(`mp3/${v.id}.mp3`, v.blob)
                typeArr[v.id] = v.blob.type
                delete v.blob
            }
            sentence = arr
        })
        zip.file(`sentence.json`, JSON.stringify(sentence))
        zip.file(`mp3Type.json`, JSON.stringify(typeArr))

        debug('zip generateAsync ...')
        await zip.generateAsync({type: 'blob'}).then(function (blob) {
            downloadZip(blob)
            removeDdi()
        }).catch(err => console.warn('zip generateAsync error:', err))
    })
}

// 下载 ZIP
function downloadZip(blob) {
    let el = document.createElement('a')
    el.href = URL.createObjectURL(blob)
    el.download = `梦想划词翻译-${getDate().replace(/\D/g, '')}.zip`
    el.click()
}

// 导入
function importZip() {
    $('import').addEventListener('click', function () {
        ddi({
            title: '导入', body: `<div class="dmx_form_item">
                <div class="item_label">清空数据</div>
                <div class="item_content"><input type="checkbox" id="import_clear"></div>
            </div>
            <div class="dmx_form_item">
                <div class="item_label">初始统计</div>
                <div class="item_content"><input type="checkbox" id="import_initial"></div>
            </div>
            <div class="dmx_form_item" style="padding:5px 0 15px">
                <button class="dmx_button" id="upload_but">选择文件...</button>
            </div>`
        })
        let butEl = $('upload_but')
        butEl.addEventListener('click', () => {
            let inp = document.createElement('input')
            inp.type = 'file'
            inp.accept = 'application/zip'
            inp.onchange = function () {
                let files = this.files
                if (files.length < 1) return
                let f = files[0]
                if (f.type !== 'application/zip') return

                butEl.disabled = true
                butEl.innerText = '正在导入...'

                let tStart = new Date()
                let isClear = $('import_clear').checked
                let isInitial = $('import_initial').checked
                JSZip.loadAsync(f).then(async function (zip) {
                    // zip.forEach((filename, file) => console.log(filename, file)) // zip 详情

                    let errStr = ''
                    let errNum = 0
                    let errAppend = (e) => {
                        errNum++
                        errStr += e + JSON.stringify(e) + '\n'
                    }

                    // mp3Type
                    let mp3TypeObj = {}
                    try {
                        let mp3Type = await zip.file('mp3Type.json').async('text')
                        mp3TypeObj = JSON.parse(mp3Type)
                    } catch (e) {
                        errAppend(e)
                    }

                    // cate
                    let cateArr = []
                    try {
                        let cate = await zip.file('cate.json').async('text')
                        cateArr = JSON.parse(cate)
                    } catch (e) {
                        errAppend(e)
                    }

                    // sentence
                    let sentenceNum = 0
                    let sentenceRepeat = 0 // 重复的句子
                    let sentenceArr = []
                    try {
                        let sentence = await zip.file('sentence.json').async('text')
                        sentenceArr = JSON.parse(sentence)
                    } catch (e) {
                        errAppend(e)
                    }

                    if (isClear) {
                        // 清空数据
                        db.clear('sentence').then(_ => debug('sentence clear finish.')).catch(e => errAppend(e))
                        db.clear('cate').then(_ => debug('cate clear ok.')).catch(e => errAppend(e))

                        // cate
                        for (let v of cateArr) db.create('cate', v).catch(e => errAppend(e))

                        // sentence
                        for (let v of sentenceArr) {
                            await zip.file(`mp3/${v.id}.mp3`).async('blob').then(b => {
                                v.blob = b.slice(0, b.size, mp3TypeObj[v.id] || 'audio/mpeg') // 设置 blob 类型
                            })
                            if (isInitial) {
                                v.records = 0
                                v.days = 0
                            }
                            await db.create('sentence', v).then(r => {
                                sentenceNum++
                                debug('sentence create:', v.id, r)
                            }).catch(e => errAppend(e))
                        }
                    } else {
                        // cate 对应表
                        let cateMap = {}
                        for (let v of cateArr) {
                            let row = null
                            await db.readByIndex('cate', 'cateName', v.cateName.trim()).then(r => row = r).catch(e => errAppend(e))
                            if (!row) {
                                // 不存在就创建
                                let oldId = v.cateId
                                delete v.cateId
                                await db.create('cate', v).then(r => {
                                    cateMap[oldId] = r.target.result // 对应新创建的ID
                                }).catch(e => errAppend(e))
                            } else {
                                cateMap[v.cateId] = row.cateId // 存在就记录对应的ID
                            }
                        }

                        // sentence
                        for (let v of sentenceArr) {
                            // 判断句子是否存在
                            let sentence = null
                            await db.readByIndex('sentence', 'sentence', v.sentence.trim()).then(r => sentence = r).catch(e => errAppend(e))
                            if (sentence) {
                                sentenceRepeat++
                                continue // 如果存在，就跳过
                            }

                            // 初始统计
                            if (isInitial) {
                                v.records = 0
                                v.days = 0
                            }

                            // 获取音频
                            await zip.file(`mp3/${v.id}.mp3`).async('blob').then(b => {
                                v.blob = b.slice(0, b.size, mp3TypeObj[v.id] || 'audio/mpeg') // 设置 blob 类型
                            })

                            // 写入数据库
                            v.cateId = cateMap[v.cateId] || 0
                            delete v.id
                            await db.create('sentence', v).then(r => {
                                sentenceNum++
                                debug('create sentenceId:', r.target.result)
                            }).catch(e => errAppend(e))
                        }
                    }

                    let okMsg = `导入完成<br> 导入：${sentenceNum} 条`
                    if (sentenceRepeat > 0) okMsg += `，重复：${sentenceRepeat} 条`
                    if (errNum > 0) {
                        okMsg += `，错误：${errNum} 次`
                        console.warn('errStr:', errStr)
                    }
                    okMsg += `<br>耗时：${new Date() - tStart} ms`
                    dal(okMsg, 'success', () => {
                        // location.reload()
                        removeDdi()
                        initCate(cateId)
                        initSentence(cateId)
                    })
                }).catch(e => {
                    dal('读取压缩包失败', 'error', () => removeDdi())
                    debug('loadAsync error:', e)
                })
            }
            inp.click()
        })
    })
}

// 设置
function openSetting() {
    $('setting').addEventListener('click', function () {
        ddi({
            title: '设置', body: `<div class="dmx_form_item">
            <div class="item_label">展示顺序</div>
                <div class="item_content number">
                    <select id="order_by">
                        <option value="obverse">正序</option>
                        <option value="reverse">倒序</option>
                        <option value="random">随机</option>
                    </select>
                </div>
            </div>
            <div class="dmx_right">
                <button class="dmx_button" id="save_but">保存</button>
            </div>`
        })
        $('order_by').value = localStorage['orderBy'] || 'obverse'
        $('save_but').addEventListener('click', () => {
            localStorage.setItem('orderBy', $('order_by').value)
            removeDdi()
            initSentence(cateId)
        })
    })
}

// 全选/取消全选
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

// 随机数组
function shuffle(arr) {
    for (let k = 0; k < arr.length; k++) {
        let i = Math.floor(Math.random() * arr.length);
        [arr[k], arr[i]] = [arr[i], arr[k]]
    }
    return arr
}
