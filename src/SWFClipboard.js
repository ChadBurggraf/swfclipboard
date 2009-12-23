/*
 * Copyright (c) 2009 Chad Burggraf
	 * Version: 1.2, 2009/12/22
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

(function () {
	var SWFClipboard,
		count = 0,
		instances = {},
		flashReadyTimeoutInvoked = false;
		
	/*
	 * Utility functions.
	 */

	// Adds an SWFClipboard instance to the instance collection.
	function addInstance(movieName, instance) {
		if (!instances[movieName]) {
			instances[movieName] = instance;
			count = count + 1;
		}
	}

	// Gets the cumulative offset of an element.
	function cumulativeOffset(element) {
		var t = 0,
			l = 0;

		do {
			t = t + (element.offsetTop || 0);
			l = l + (element.offsetLeft || 0);
			element = element.offsetParent;
		} while (element);

		return {top: t, left: l};
	}

	// Extends a destination object by the source object.
	function extend(dest, source) {
		source = source || {};
		dest = dest || {};

		var prop;

		for (prop in source) {
			if (source.hasOwnProperty(prop) && typeof source[prop] !== "undefined") {
				dest[prop] = source[prop];
			}
		}

		return dest;
	}

	// Gets the name to use for the next SWFClipboard instance created.
	function getNextMovieName() {
		return "SWFClipboard_" + count;
	}

	// Removes an SWFClipboard instance from the instance collection.
	function removeInstance(movieName) {
		if (instances[movieName]) {
			instances[movieName] = null;
			delete instances[movieName];
			count = count - 1;
		}
	}
	
	//
	// Constructor. Creates a JavaScript/Flash bridge for copying text to a user's clipboard.
	//
	SWFClipboard = function (target, copyText, options) {
		target = target || "";
		copyText = copyText || "";
		options = extend({
			css: "swfclipboard",
			flashUrl: "swfclipboard-1.2.swf",
			onFlashReady: null,
			onTextCopied: null,
			waitForLoad: false
		}, options);
		
		var obj = {},
			element,
			movieElement,
			eventQueue = [],
			isFlashReady = false,
			movieName = getNextMovieName();	
		
		/*
		 * Private members.
		 */
		
		// Calls a Flash function.
		function callFlash(callee, args, callTryCount) {
			var js,
				i,
				n;
				
			if (element) {
				if (!isFlashReady) {
				    if (typeof callTryCount == "undefined") {
				        callTryCount = 0;
				    }
				    
					if (callTryCount < 10) {
						callTryCount = callTryCount + 1;
						
						setTimeout(function () {
							callFlash(callee, args, callTryCount);
						}, 500);
					} else {
					    if (!flashReadyTimeoutInvoked) {
					        if (typeof SWFClipboard.onFlashReadyTimeout === "function") {
					            SWFClipboard.onFlashReadyTimeout(obj);
					        }
					        
					        flashReadyTimeoutInvoked = true;
					    }
					    
					    return;
					}
				} else {
					args = args || [];
					callTryCount = 0;
					
					// We're going to get Flash fits if we use apply() or call(),
					// so eval() is the best we've got.
					if (typeof obj.movie()[callee] === "function") {
						js = 'obj.movie()[callee](';
						
						for (i = 0, n = args.length; i < n; i = i + 1) {
							if (i > 0) {
								js = js + ",";
							}
							
							js = js + "args[" + i + "]";
						}

						return eval(js + ")");
					}
				}
			}
		}
		
		// Executes the next event in the event queue.
		function executeEvent() {
			if (eventQueue.length > 0) {
				var f = eventQueue.shift();
				
				if (typeof f === "function") {
					f();
				}
			}
		}
		
		// Queues an event.
		function queueEvent(handler, args) {
			args = args || [];
			
			if (typeof handler === "function") {
				eventQueue.push(function () {
					handler.apply(null, args);
				});
				
				setTimeout(function () {
					executeEvent();
				}, 0);
			}
		}
		
		// Refreshes the movie element to match the size and position of the target element.
		function refreshSize() {
			if (element) {
				if (isFlashReady && target) {
					var size = {width: target.offsetWidth, height: target.offsetHeight},
						pSize = {width: target.parentNode.offsetWidth, height: target.parentNode.offsetHeight},
						location = cumulativeOffset(target);
						
					if (size.width > pSize.width) {
						size.width = pSize.width;
					}
					
					if (size.height > pSize.height) {
						size.height = pSize.height;
					}
					
					element.style.width = size.width + "px";
					element.style.height = size.height + "px";
					element.style.left = location.left + "px";
					element.style.top = location.top + "px";
					
					callFlash("setButtonSize", [size.width, size.height]);
				} else {
					element.style.width = "1px";
					element.style.height = "1px";
					element.style.top = "0px";
					element.style.left = "0px";
				}
			}
		}
		
		// Sets up the DOM.
		function setup() {
			if (!element) {
				if (typeof target === "string") {
					target = document.getElementById(target);
				}
				
				element = document.createElement("div");
				document.body.appendChild(element);
				
				element.className = options.css;
				element.style.position = "absolute";
				element.style.display = "block";
				element.style.width = "1px";
				element.style.height = "1px";
				element.style.left = "0px";
				element.style.top = "0px";
				
				element.innerHTML = ['<object id="', movieName, '" type="application/x-shockwave-flash" data ="', options.flashUrl, '" width="100%" height="100%">',
					'<param name="wmode" value="transparent"/>',
					'<param name="movie" value="', options.flashUrl, '"/>',
					'<param name="quality" value="high"/>',
					'<param name="menu" value="false"/>',
					'<param name="allowscriptaccess" value="always"/>',
					'<param name="flashvars" value="',
						"movieName=", encodeURIComponent(movieName),
						"&amp;copyText=", encodeURIComponent(copyText || ""), '"/>"',
					'</object>'].join("");
			}
		}
		
		/*
		 * Event handlers.
		 */
		
		function onFlashReady() {
			isFlashReady = true;
			obj.setTarget(target);
			
			if (typeof options.onFlashReady === "function") {
				options.onFlashReady(obj);
			}
		}
		
		function onTextCopied() {
			if (typeof options.onTextCopied === "function") {
				options.onTextCopied(obj);
			}
		}
		
		/*
		 * Public members.
		 */
		
		extend(obj, {
			// Destroys this instance and all of its DOM references.
			destroy: function () {
				removeInstance(movieName);
				
				if (movieElement) {
					movieElement = null;
				}
				
				if (element) {
					element.parentNode.removeChild(element);
					element = null;
				}
				
				isFlashReady = false;
			},
			
			// Called by Flash when the movie is ready.
			flashReady: function () {
				if (!window[movieName]) {
					window[movieName] = this.movie();
				}
				
				queueEvent(onFlashReady);
			},
			
			// Gets a reference to this instance's movie element.
			movie: function () {
				if (element) {
					if (!movieElement) {
						movieElement = document.getElementById(movieName);
						
						if (!movieElement) {
							throw "Could not get a reference to movie \"" + movieName + "\".";
						}
					}
				}
				
				return movieElement;
			},
			
			// Sets the text that will be copied with the clipboard is activated.
			setCopyText: function (newCopyText) {
				copyText = newCopyText || "";
				callFlash("setCopyText", [copyText]);
			},
			
			// Sets the element this instance is targeting.
			setTarget: function (newTarget) {
				target = newTarget ? (typeof newTarget === "string" ? document.getElementById(newTarget) : newTarget) : null;
				
				var navigateUrl = "",
					navigateTarget = "";

				if (target && target.tagName.toLowerCase() === "a" && target.href) {
					navigateUrl = target.href;
					navigateTarget = target.target || "_blank";
				}
				
				callFlash("setNavigate", [navigateUrl, navigateTarget]);
				refreshSize();
			},
			
			// Called by Flash when text has been copied.
			textCopied: function () {
				queueEvent(onTextCopied);
			}
		});

		if (options.waitForLoad) {
			if (window.addEventListener) {
				window.addEventListener("load", setup);
			} else {
				window.attachEvent("onload", setup);
			}
		} else {
			setup();
		}
		
		addInstance(movieName, obj);
		return obj;
	};
	
	// Static callback for Flash ready timeout.
	SWFClipboard.onFlashReadyTimeout = function() { };
	
	// Tell the world about ourselves.
	window.SWFClipboard = SWFClipboard;
	window.SWFClipboard.instances = instances;
}());