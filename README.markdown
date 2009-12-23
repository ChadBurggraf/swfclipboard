# SWFClipboard
#### A JavaScript clipboard interface.

## Building

To build, simply run `compile.sh` from the command line (Mac/Linux). Prerequisites to building:

1.  The [Flex SDK](http://www.adobe.com/products/flex/flexdownloads/index.html)
    must be installed, with the `mxmlc` compiler available in your `PATH`.
2.  The [Java](http://java.com/en/download/manual.jsp) runtime must be installed,
    with the `java` executable available in your `PATH`.

If your system does not meet the above requirements, and you don't want it to, you can always
build `src/SWFClipboard.as` using whatever tools you'd like. Similarly, you can minify
`src/SWFClipboard.js` using whatever minifier you'd like.

## Using

**SWFClipboard** has no dependencies. To set up, include the JavaScript file in your document:

    <head>
        <script type="text/javascript" src="swfclipboard-1.2.js"></script>
    </head>

Make sure `swfclipboard-1.2.swf` is available in your web directory as well. By default,
the Flash movie is assumed to be located in the same directory as the HTML document itself,
but you can override this location during construction (see `options` below).

Instantiate a new instance of **SWFClipboard**:

    var clipboard = new SWFClipboard(my_target, text_to_copy, options);

Where `my_target` is the DOM element or ID that will invoke the copy action, `text_to_copy` is the
text that will be copied, and `options` is an options hash.

Note that either `my_target` or `text_to_copy` or both can be null, since they can be changed at 
any point during the `SWFClipboard` instance's lifetime.

The options available in the `options` hash are:

 - **css**: *(swfclipboard)* The CSS class to set on the `div` that the `object` element will be wrapped in.
 - **flashUrl**: *(swfclipboard-1.2.swf)* The URL to the `swfclipboard.swf` file, relative to the HTML document.
 - **onFlashReady**: *(null)* A function to be called when the Flash movie is loaded and ready.
 - **onTextCopied**: *(null)* A function to be called when a copy action has been invoked.
 - **waitForLoad**: *(false)* A value indicating whether to wait for a `window.onload` event
   before setting up the element references.

The available functions on an SWFClipboard instance are:

### `destroy()`
Destroys the SWFClipboard instance's DOM.

### `movie()`
Gets a reference to the actual Flash movie's DOM element.

### `setCopyText(copyText)`
Sets the text that will be copied when the clipboard is activated.

 - **copyText**: The text to copy, if copying is still desired. Can also be `null` or `undefined` to disable copying.

### `setTarget(target)`
Sets the target element the clipboard is intercepting clicks for.

 - **target**: The DOM element or ID that will invoke copy actions.

Note that if a clipboard instance's target element is a link (anchor tag), and that link has an `href` attribute
pointing to a valid URL, the clipboard will navigate to that URL after the text has been copied. This will not
happen if the URL begins with `javascript:`.