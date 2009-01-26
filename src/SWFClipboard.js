/*
 * Copyright (c) 2009 Chad Burggraf
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

//
// Creates a JavaScript/Flash bridge for copying text to a user's clipboard.
// Version: 1.0, 2008/12/01
//
var SWFClipboard = function(target, copyText, options) {
	this.target = target;
	this.copyText = copyText || "";
	this.eventQueue = [];
	this.isFlashReady = false;
	this.movieName = SWFClipboard.getNextMovieName();

	this.options = {
		css: "swfclipboard",
		flashUrl: "swfclipboard.swf",
		navigate: true,
		navigateUrl: null,
		navigateTarget: "_blank",
		onFlashReady: null,
		onTextCopied: null,
		waitForLoad: false
	};
    
	for(var prop in options) {
		if (options.hasOwnProperty(prop)) {
			this.options[prop] = options[prop];
		}
	}
    
	SWFClipboard.add(this.movieName, this);
    
	if (this.options.waitForLoad) {
		var that = this, f = function() { that.setup(); };

		if (window.addEventListener) {
			window.addEventListener("load", f);
		} else {
			window.attachEvent("onload", f);
		}
	} else {
		this.setup();
	}
};

//
// Instance function definitions.
//

SWFClipboard.prototype = {	
	// Calls a flash function.
    callFlash:function(callee, args) {
        if (this.element) {
            if (!this.isFlashReady) {
				var that = this;
				
				setTimeout(function() {
					that.callFlash(callee, args);
				}, 10);
            } else {
                args = args || [];
                
                // We'll get fits here and there if we just use
                // apply() or call(), so unfortunately an eval()
                // is the best we've got.
                if (typeof this.movie()[callee] === "function") {
					var js = 'this.movie()[callee](';
                
                    for(var i = 0, n = args.length; i < n; i++) {
                        if (i > 0) {
                            js += ",";
                        }
                        
                        js += "args[" + i + "]";
                    }
                    
                    return eval(js + ")");
                } else {
                    throw "There is no Flash \"" + callee + "\" function defined.";
                }
            }
        }
    },
    
    // Destroys this instance and all of its DOM references.
    destroy:function() {
        SWFClipboard.remove(this.movieName);
        
        if (this.movieElement) {
            this.movieElement = null;
        }
        
        if (this.element) {
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
        
        this.isFlashReady = false;
    },

	// Executes the next event in the event queue.
    executeEvent:function() {
        if (this.eventQueue.length > 0) {
            var f = this.eventQueue.shift();

            if (typeof f === "function") {
                f();
            }
        }
    },
	
	// Gets a reference to this intance's movie element.
    movie:function() {
        if (this.element) {
            if (!this.movieElement) {
                this.movieElement = document.getElementById(this.movieName);

                if (!this.movieElement) {
                    throw "Could not get a reference to movie \"" + this.movieName + "\".";
                }
            }
        }

        return this.movieElement;
    },

	// Queues an event. The handler must be an event handler 
    // that is an instance member of SWFClipboard.
    queueEvent:function(handler, args) {
        args = args || [];

        if (typeof this[handler] === "function") {
			var that = this;
			
            this.eventQueue.push(function() {
				that[handler].apply(that, args);
            });

            setTimeout(function() {
                that.executeEvent();
            }, 0);
        } else {
            throw "There is no \"" + handler + "\" event handler defined.";
        }
    },

	// Refreshes the movie element to match the size
	// and position of the target element.
	refreshSize:function() {
		// Gets the cumulative offset of an element.
		function co(element) {
			var t = 0, l = 0;
			
			do {
				t += element.offsetTop || 0;
				l += element.offsetLeft || 0;
				element = element.offsetParent;
			} while(element);
			
			return {top:t, left:l};
		}
		
	    if (this.element) {
		    if (this.isFlashReady && this.target) {
			    var size = {width:this.target.offsetWidth, height:this.target.offsetHeight};
			    var pSize = {width:this.target.parentNode.offsetWidth, height:this.target.parentNode.offsetHeight};
			    var location = co(this.target);
			
			    if (size.width > pSize.width) {
			        size.width = pSize.width;
			    }
			    
			    if (size.height > pSize.height) {
			        size.height = pSize.height;
			    }
    			
				this.element.style.width = size.width + "px";
				this.element.style.height = size.height + "px";
				this.element.style.left = location.left + "px";
				this.element.style.top = location.top + "px";

			    this.callFlash("setButtonSize", [size.width, size.height]);
		    } else {
				this.element.style.width = "1px";
				this.element.style.height = "1px";
				this.element.style.top = "0px";
				this.element.style.left = "0px";
		    }
		}
	},
	
	// Sets the text that will be copied 
	// when the clipboard is activated.
	setCopyText:function(copyText) {
		this.copyText = copyText || "";
		this.callFlash("setCopyText", [this.copyText]);
	},
	
	// Sets the navigate behavior to use
	// when the clipboard is activated.
	setNavigate:function(navigateUrl, navigateTarget, navigate) {
		this.options.navigateUrl = navigateUrl || "";
		this.options.navigateTarget = navigateTarget || "";
		this.options.navigate = navigate === true;

	    this.callFlash("setNavigate", [
	        this.options.navigateUrl, 
	        this.options.navigateTarget, 
	        this.options.navigate
	    ]);
	},
	
	// Sets the element this instance is targeting.
	setTarget:function(target, prevent) {
        this.target = target ?
			(typeof target === "string" ? document.getElementById(target) : target) :
			null;
        
        if (this.target) {
            if (!prevent && this.options.navigate) {
                
				if (this.target.tagName.toLowerCase() === "a") {
					this.options.navigateUrl = !this.target.href.match(/^javascript/i) ? this.target.href || "" : null;
	                this.options.navigateTarget = this.target.target || "_blank";
				} else {
					this.options.navigateUrl = null;
				}

                this.callFlash("setNavigate", [
	                this.options.navigateUrl, 
	                this.options.navigateTarget, 
	                this.options.navigate === true
	            ]);
            }
        }
        
        this.refreshSize();
	},
	
	// Sets up the DOM.
	setup:function() {
		if (this.target && typeof this.target === "string") {
			this.target = document.getElementById(this.target);
		}
		
		this.options.navigate = this.options.navigate === true;
		
		this.element = document.createElement("div");
		document.body.appendChild(this.element);
		
		this.element.className = this.options.css;
		this.element.style.position = "absolute";
		this.element.style.display = "block";
		this.element.style.width = "1px";
		this.element.style.height = "1px";
		this.element.style.left = "0px";
		this.element.style.top = "0px";

		this.element.innerHTML = ['<object id="', this.movieName, '" type="application/x-shockwave-flash" data="', this.options.flashUrl, '" width="100%" height="100%">',
		    '<param name="wmode" value="transparent" />',
		    '<param name="movie" value="', this.options.flashUrl, '" />',
		    '<param name="quality" value="high" />',
		    '<param name="menu" value="false" />',
		    '<param name="allowscriptaccess" value="always" />',
		    '<param name="flashvars" value="',
		        "movieName=", encodeURIComponent(this.movieName),
		        "&amp;copyText=", encodeURIComponent(this.copyText || ""),
		        "&amp;navigateUrl=", encodeURIComponent(this.options.navigateUrl || ""),
		        "&amp;navigateTarget=", encodeURIComponent(this.options.navigateTarget || "_blank"),
		        "&amp;navigate=", this.options.navigate.toString(), '" />',
		    '</object>'].join("");
	},
	
	//
    // Flash callbacks. These are called directly by Flash.
    //

    flashReady:function() {
        if (!window[this.movieName]) {
            window[this.movieName] = this.movie();
        }

        this.queueEvent("onFlashReady");
    },

    textCopied:function() {
        this.queueEvent("onTextCopied");
    },

	//
    // Flash callback event handlers. These are called after
    // their corresponding callbacks have been called and
    // a bug-fix timeout has been executed.
    //

    onFlashReady:function() {
        this.isFlashReady = true;
        this.setTarget(this.target);

        if (typeof this.options.onFlashReady === "function") {
            this.options.onFlashReady(this);
        }
    },

    onTextCopied:function() {
        if (typeof this.options.onTextCopied === "function") {
            this.options.onTextCopied(this);
        }
    }
};

//
// Static functions and properties.
//

SWFClipboard.count = 0;
SWFClipboard.instances = {};

// Adds an instance to the instance collection.
SWFClipboard.add = function(movieName, instance) {
    if (!SWFClipboard.instances[movieName]) {
		SWFClipboard.instances[movieName] = instance;
        SWFClipboard.count++;
    }
};

// Gets the name to use for the next SWFClipboard instance.
SWFClipboard.getNextMovieName = function() {
	return "SWFClipboard_" + SWFClipboard.count;
};

// Removes an instance from the instance collection.
SWFClipboard.remove = function(movieName) {
	if (SWFClipboard.instances[movieName]) {
		SWFClipboard.instances[movieName] = null;
		delete SWFClipboard.instances[movieName];
		--SWFClipboard.count;
	}
};