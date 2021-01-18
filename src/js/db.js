'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

function idb(dbName, version, onupgradeneeded) {
    return new Promise((resolve, reject) => {
        let req = window.indexedDB.open(dbName, version)
        req.onupgradeneeded = onupgradeneeded // 首次创建或更高版本号时执行
        req.onerror = (e) => reject(e)
        req.onsuccess = () => {
            let db = req.result
            resolve({
                db,
                rStore(storeName) {
                    return db.transaction([storeName], 'readonly').objectStore(storeName)
                },
                wStore(storeName) {
                    return db.transaction([storeName], 'readwrite').objectStore(storeName)
                },
                read(storeName, id) {
                    return new Promise((resolve, reject) => {
                        let row = this.rStore(storeName).get(id)
                        row.onsuccess = () => resolve(row.result)
                        row.onerror = (e) => reject(e)
                    })
                },
                create(storeName, data) {
                    return new Promise((resolve, reject) => {
                        let row = this.wStore(storeName).add(data)
                        row.onsuccess = (e) => resolve(e)
                        row.onerror = (e) => reject(e)
                    })
                },
                update(storeName, id, data) {
                    return new Promise((resolve, reject) => {
                        let wStore = this.wStore(storeName)
                        let row = wStore.get(id)
                        row.onsuccess = () => {
                            let newData = Object.assign(row.result, data) // 覆盖
                            let r = wStore.put(newData)
                            r.onsuccess = (e) => resolve(e)
                            r.onerror = (e) => reject(e)
                        }
                        row.onerror = (e) => reject(e)
                    })
                },
                delete(storeName, id) {
                    return new Promise((resolve, reject) => {
                        let r = this.wStore(storeName).delete(id)
                        r.onsuccess = (e) => resolve(e)
                        r.onerror = (e) => reject(e)
                    })
                },
                count(storeName, cond) {
                    return new Promise((resolve, reject) => {
                        let r = this.rStore(storeName).count(cond)
                        r.onsuccess = (e) => resolve(e)
                        r.onerror = (e) => reject(e)
                    })
                },
                getAll(storeName) {
                    return new Promise((resolve, reject) => {
                        let arr = []
                        let cursor = this.rStore(storeName).openCursor()
                        cursor.onsuccess = (e) => {
                            let row = e.target.result
                            if (row) {
                                arr.push(row)
                                row.continue()
                            } else {
                                resolve(arr)
                            }
                        }
                        cursor.onerror = (e) => reject(e)
                    })
                },
            })
        }
    })
}

// 创建存储对象
function initFavorite(e) {
    let store, db = e.target.result

    // sentence
    store = db.createObjectStore('sentence', {keyPath: 'id', autoIncrement: true})
    store.createIndex('id', 'id', {unique: true})
    store.createIndex('cateId', 'cateId', {unique: false}) // 分类ID
    store.createIndex('sentence', 'sentence', {unique: true}) // 句子
    store.createIndex('words', 'words', {unique: false}) // 生词，一行一个
    store.createIndex('remark', 'remark') // 备注
    store.createIndex('records', 'records', {unique: false}) // 练习次数
    store.createIndex('days', 'days', {unique: false}) // 练习天数
    store.createIndex('url', 'url') // 音频 URL
    store.createIndex('blob', 'blob') // 音频二进制文件
    store.createIndex('createDate', 'createDate', {unique: false}) // 创建时间

    // cate
    store = db.createObjectStore('cate', {keyPath: 'cateId', autoIncrement: true})
    store.createIndex('cateId', 'cateId', {unique: true}) // 分类ID
    store.createIndex('cateName', 'cateName', {unique: true}) // 分类名称
    store.createIndex('createDate', 'createDate', {unique: false}) // 创建时间

    // cate 初始分类
    setTimeout(() => {
        let row = {cateId: 0, cateName: '最新收藏', createDate: new Date().toJSON()}
        db.transaction(['cate'], 'readwrite').objectStore('cate').add(row)
    }, 500)
}
