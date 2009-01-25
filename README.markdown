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

Instantiate a new instance of **SWFClipboard**:

    var clipboard = new SWFClipboard(my_target, text_to_copy, options);

Where `my_target` is the DOM element or ID that will invoke the copy action, `text_to_copy` is the
text that will be copied, and `options` is an options hash.

Note that none of the constructor parameters are required, since they can all be changed at 
any point during the `SWFClipboard` instance's lifetime.

The options available in the `options` hash are:

*  **css**: *(swfclipboard)* The CSS class to set on the `span` that the `object` element will be wrapped in.
*  **flashUrl**: *(swfclipboard.swf)* The URL to the `swfclipboard.swf` file.
*  **navigate**: *(true)* A value indicating whether to perform a navigation operation when
   a copy action is invoked.
*  **navigateUrl**: *(null)* The URL to navigate to if `navigate` is `true`.
*  **navigateTarget**: *(_blank)* The target window to point the navigation action at.
*  **onFlashReady**: *(null)* A function to be called when the Flash movie is loaded and ready.
*  **onTextCopied**: *(null)* A function to be called when a copy action has been invoked.
*  **waitForLoad**: *(false)* A value indicating whether to wait for a `window.onload` event
   before setting up the element references.

The most common instance methods that you'll use are:

    setCopyText(copyText)

*  **copyText**: The text to copy, if copying is still desired. Can also be 
   `null` or `undefined` to disable copying.

    setNavigate(navigateUrl, navigateTarget, navigate)

*  **navigateUrl**: The URL to navigate to, if applicable. Can be `null` or empty if disabling navigation.
*  **navigateTarget**: The navigation behavior to use. Possible values are 
   `_self`, `_blank`, `_parent` and `_top`.
*  **navigate**: A boolean value indicating whether to perform navigation operations. **Truthiness does
   not equal true for this value.** A strict equality operation is used against `true`.

    setTarget(target, prevent)

*  **target**: The DOM element or ID that will invoke copy actions.
*  **prevent**: A value indicating whether to prevent automatic inference 
   `navigateUrl` and `navigateTarget` values from `target` if `target` is an anchor element.