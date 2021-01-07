'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let u = new URL(location.href)
let videoEl = document.getElementById('video')
videoEl.src = u.searchParams.get('videoUrl')
videoEl.poster = u.searchParams.get('thumbUrl')
