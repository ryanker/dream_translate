'use strict'

/**
 * Dream Translate
 * https://github.com/ryanker/dream_translate
 * @Author Ryan <dream39999@gmail.com>
 * @license MIT License
 */

let u = new URL(location.href)
let video = document.createElement('video')
video.setAttribute('style', 'width:400px;height:224px;outline:0')
video.controls = true
video.poster = u.searchParams.get('thumbUrl')
video.src = u.searchParams.get('videoUrl')
document.body.appendChild(video)
