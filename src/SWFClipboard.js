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
var SWFClipboard = Class.create({
	// Constructor.
	initialize:function(target, copyText, options) {
		this.target = target;
        this.copyText = copyText || "";
        this.eventQueue = [];
        this.isFlashReady = false;
        this.movieName = SWFClipboard.getNextMovieName();

        this.options = Object.extend({
            css: "swfclipboard",
            flashUrl: "swfclipboard.swf",
            navigate: true,
            navigateUrl: null,
            navigateTarget: "_blank",
            onFlashReady: null,
            onTextCopied: null,
            waitForLoad: false
        }, options);

        SWFClipboard.add(this.movieName, this);

        if (this.options.waitForLoad) {
            document.observe("dom:loaded", this.setup.bind(this));
        } else {
            this.setup();
        }
	},
	
	// Calls a flash function.
    callFlash:function(callee, args) {
        if (this.element) {
            if (!this.isFlashReady) {
                setTimeout(this.callFlash.bind(this, callee, args), 10);
            } else {
                args = args || [];

                if (typeof this.movie()[callee] === "function") {
                    var str = "this.movie()[callee](";

                    for(var i = 0, n = args.length; i < n; i++) {
                        if (i > 0) {
                            str += ",";
                        }

                        str += "args[" + i + "]";
                    }

                    return eval(str + ")");
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
            this.element.remove();
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
                this.movieElement = $(this.movieName);

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
            this.eventQueue.push(function() {
                this[handler].apply(this, args);
            }.bind(this));

            setTimeout(function() {
                this.executeEvent();
            }.bind(this), 0);
        } else {
            throw "There is no \"" + handler + "\" event handler defined.";
        }
    },

	// Refreshes the movie element to match the size
	// and position of the target element.
	refreshSize:function() {
	    if (this.element) {
		    if (this.isFlashReady && this.target) {
			    var size = this.target.getDimensions();
			    var pSize = this.target.up().getDimensions();
			    var location = this.target.cumulativeOffset();
			    
			    if (size.width > pSize.width) {
			        size.width = pSize.width;
			    }
			    
			    if (size.height > pSize.height) {
			        size.height = pSize.height;
			    }
    			
			    this.element.setStyle({
				    width: size.width + "px",
				    height: size.height + "px",
				    left: location.left + "px",
				    top: location.top + "px"
			    });
    			
			    this.callFlash("setButtonSize", [size.width, size.height]);
		    } else {
		        this.element.setStyle({
		            width: "1px",
		            height: "1px",
		            top: "0px",
		            left: "0px"
		        });
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
	    Object.extend(this.options, {
	        navigateUrl: navigateUrl || "",
	        navigateTarget: navigateTarget || "_blank",
	        navigate: navigate === true
	    });
	    
	    this.callFlash("setNavigate", [
	        this.options.navigateUrl, 
	        this.options.navigateTarget, 
	        this.options.navigate
	    ]);
	},
	
	// Sets the element this instance is targeting.
	setTarget:function(target, prevent) {
        this.target = $(target);
        
        if (this.target) {
            if (!prevent && this.options.navigate && this.target.tagName.toLowerCase() === "a") {
                this.options.navigateUrl = this.target.readAttribute("href");
                this.options.navigateTarget = this.target.readAttribute("target") || "_blank";

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
		this.target = $(this.target);
		this.options.navigate = this.options.navigate === true;
		
		this.element = new Element("span", {"class":this.options.css, style:"position:absolute;display:block;width:1px;height:1px;"});
		document.body.appendChild(this.element);

		this.element.update(['<object id="', this.movieName, '" type="application/x-shockwave-flash" data="', this.options.flashUrl, '" width="100%" height="100%">',
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
		    '</object>'].join(""));
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
		this.refreshSize();

        if (Object.isFunction(this.options.onFlashReady)) {
            this.options.onFlashReady(this);
        }
    },

    onTextCopied:function() {
        if (Object.isFunction(this.options.onTextCopied)) {
            this.options.onTextCopied(this);
        }
    }
});

//
// Static functions and properties.
//
Object.extend(SWFClipboard, {
	count: 0,
    instances: {},

    // Adds an instance to the instance collection.
    add:function(movieName, instance) {
        if (!SWFClipboard.instances[movieName]) {
            SWFClipboard.instances[movieName] = instance;
            SWFClipboard.count++;
        }
    },

    // Gets the name to use for the next SWFClipboard instance.
    getNextMovieName:function() {
        return "SWFClipboard_" + SWFClipboard.count;
    },

    // Removes an instance from the instance collection.
    remove:function(movieName) {
        if (SWFClipboard.instances[movieName]) {
            SWFClipboard.instances[movieName] = null;
            delete SWFClipboard.instances[movieName];
            --SWFClipboard.count;
        }
    }
});