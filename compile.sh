#!/bin/bash

java -jar lib/yuicompressor-2.4.1.jar --nomunge src/SWFClipboard.js -o build/swfclipboard.js

"mxmlc" \
	-benchmark="false" \
	-debug="false" \
	-incremental="true" \
	-optimize="true" \
	-warnings="true" \
	-file-specs="src/SWFClipboard.as" \
	-o="build/swfclipboard.swf"