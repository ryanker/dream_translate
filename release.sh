#!/bin/bash

DIST=./dist
DIST2=./dist_firefox

# ======== Chrome & Edge ========
# 拷贝
echo "cp to ... $DIST"
mkdir -p $DIST
\cp -af ./src/ $DIST

# 打包 (Chrome Edge)
sed -i "" -e "s/const isDebug = true/const isDebug = false/g" $DIST/js/common.js
zip -rq dist.zip $DIST

# ======== Firefox ========
# 拷贝
echo "cp to ... $DIST2"
mkdir -p $DIST2
\cp -af ./src/ $DIST2

# 替换
sed -i "" -e "s/const isDebug = true/const isDebug = false/g" $DIST2/js/common.js
sed -i "" -e '16,21d' $DIST2/css/content.css # 清理 CSS 样式
sed -i "" -e '/"tts",/d' $DIST2/manifest.json
sed -i "" -e '/"global": true,/d' $DIST2/manifest.json

# 打包 (Firefox)
zip -rq dist_firefox.zip $DIST2

# 清理目录
rm -rf $DIST
rm -rf $DIST2
