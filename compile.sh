#!/bin/bash

if [ "$1" == "--nocompress" ]; then
	cat src/SWFClipboard2.js > build/swfclipboard.js
else
	java -jar lib/yuicompressor-2.4.1.jar src/SWFClipboard2.js -o build/swfclipboard.js
fi

cp -f build/swfclipboard.js demo/swfclipboard.js

"mxmlc" \
	-benchmark="false" \
	-debug="false" \
	-incremental="true" \
	-optimize="true" \
	-warnings="true" \
	-file-specs="src/SWFClipboard.as" \
	-o="build/swfclipboard.swf"
	
cp -f build/swfclipboard.swf demo/swfclipboard.swf