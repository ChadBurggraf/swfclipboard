#!/bin/bash

if [ "$1" == "--nocompress" ]; then
	cat src/SWFClipboard.js > build/swfclipboard-1.2.js
else
	java -jar lib/yuicompressor-2.4.1.jar src/SWFClipboard.js -o build/swfclipboard-1.2.js
fi

cp -f build/swfclipboard-1.2.js demo/swfclipboard-1.2.js

"mxmlc" \
	-benchmark="false" \
	-debug="false" \
	-incremental="true" \
	-optimize="true" \
	-warnings="true" \
	-file-specs="src/SWFClipboard.as" \
	-o="build/swfclipboard-1.2.swf"
	
cp -f build/swfclipboard-1.2.swf demo/swfclipboard-1.2.swf