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

package {
	import flash.display.BlendMode;
	import flash.display.DisplayObjectContainer;
	import flash.display.Loader;
	import flash.display.Stage;
	import flash.display.Sprite;
	import flash.display.StageAlign;
	import flash.display.StageScaleMode;
	import flash.net.navigateToURL;
	import flash.net.URLRequest;
	import flash.net.URLRequestMethod;
	import flash.net.URLVariables;
	import flash.events.*;
	import flash.external.ExternalInterface;
	import flash.system.Security;
	import flash.system.System;
	import flash.text.AntiAliasType;
	import flash.text.GridFitType;
	import flash.text.StaticText;
	import flash.text.StyleSheet;
	import flash.text.TextDisplayMode;
	import flash.text.TextField;
	import flash.text.TextFieldType;
	import flash.text.TextFieldAutoSize;
	import flash.text.TextFormat;
	import flash.ui.Mouse;

	/*
	 *	Creates a Flash/JavaScript bridge for copying text to a user's clipboard.
	 *  Version: 1.0, 2008/12/01
	 */
	public class SWFClipboard extends Sprite {
		// Callbacks.
		private var flashReady_Callback:String;
		private var textCopied_Callback:String;
		
		// Flasvars.
		private var movieName:String;
		private var copyText:String;
		private var navigateUrl:String;
		private var navigateTarget:String;
		private var navigate:Boolean;
		
		// Members.
		private var buttonSprite:Sprite;
		
		/*
		 *	@constructor
		 */
		public function SWFClipboard() {
			super();
			stage.addEventListener(Event.ENTER_FRAME, initialize);
		}

		/*
		 *	Initialization and setup.
		 */
		private function initialize(event:Event):void {
			stage.removeEventListener(Event.ENTER_FRAME, initialize);
			
			// Setup the stage.
			this.stage.align = StageAlign.TOP_LEFT;
			this.stage.scaleMode = StageScaleMode.NO_SCALE;
			
			// Create the button sprite.
			this.buttonSprite = new Sprite();
			this.buttonSprite.graphics.beginFill(0xFFFFFF, 0);
			this.buttonSprite.graphics.drawRect(0, 0, 1, 1);
			this.buttonSprite.graphics.endFill();
			this.buttonSprite.buttonMode = true;
			this.buttonSprite.x = 0;
			this.buttonSprite.y = 0;
			this.buttonSprite.addEventListener(MouseEvent.CLICK, function():void {});
			this.buttonSprite.useHandCursor = true;
			this.stage.addChild(this.buttonSprite);
			
			// Instantiate the flashvars.
			this.movieName = root.loaderInfo.parameters.movieName;
			this.copyText = root.loaderInfo.parameters.copyText || "";
			this.navigateUrl = root.loaderInfo.parameters.navigateUrl || "";
			this.navigateTarget = root.loaderInfo.parameters.navigateTarget || "_blank";
			this.navigate = root.loaderInfo.parameters.navigate === "true";
			
			// Setup the JavaScript callbacks.
			this.flashReady_Callback = "SWFClipboard.instances[\"" + this.movieName + "\"].flashReady";
			this.textCopied_Callback = "SWFClipboard.instances[\"" + this.movieName + "\"].textCopied";
			
			// Setup the external interfaces.
			ExternalInterface.addCallback("setButtonSize", this.setButtonSize);
			ExternalInterface.addCallback("setCopyText", this.setCopyText);
			ExternalInterface.addCallback("setNavigate", this.setNavigate);
			
			// Stage click listener for performing a copy.
			stage.addEventListener(MouseEvent.CLICK, onStageClick);
			
			// Notify JavaScript that we're ready.
			ExternalInterface.call(this.flashReady_Callback);
		}
		
		/*********************************************************
		 * JavaScript-visible functions.
		 *********************************************************/
		
		/*
		 * Sets the size of the button sprite.
		 */
		private function setButtonSize(buttonWidth:String, buttonHeight:String):void {
			var w:Number = 1, h:Number = 1;

			try {
				w = Number(buttonWidth);
			} catch(ex:Object) {
				w = 1;
			}

			try {
				h = Number(buttonHeight);
			} catch(ex:Object) {
				h = 1;
			}

			this.buttonSprite.width = w;
			this.buttonSprite.height = h;
		}
		
		/*
		 * Sets the text that will be copied when the clipboard
		 * is activated.
		 */
		private function setCopyText(copyText:String):void {
			this.copyText = copyText || "";
		}
		
		/*
		 * Sets the navigation behavior of the button when
		 * a copy is initiated.
		 */
		private function setNavigate(navigateUrl:String, navigateTarget:String, navigate:Boolean):void {
			this.navigateUrl = navigateUrl;
			this.navigateTarget = navigateTarget;
			this.navigate = navigate;
		}
		
		/*********************************************************
		 * Event handlers.
		 *********************************************************/
		
		private function onStageClick(event:MouseEvent):void {
			if (this.copyText != "") {
				System.setClipboard(this.copyText);
				
				if (this.navigate && this.navigateUrl != "" && !(/^javascript/i.test(this.navigateUrl))) {
					var nt:String = /^_self|_blank|_parent|_top$/i.test(this.navigateTarget) ? this.navigateTarget : "_blank";
					navigateToURL(new URLRequest(this.navigateUrl), nt);
				}
				
				ExternalInterface.call(this.textCopied_Callback);
			}
		}
	}
}
