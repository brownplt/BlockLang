/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Helper functions for generating Whalesong for blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Whalesong = Blockly.Generator.get('Whalesong');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
Blockly.Whalesong.addReservedWords(
    'Blockly,' +  // In case JS is evaled in the current window.
    // https://developer.mozilla.org/en/JavaScript/Reference/Reserved_Words
    'break,case,catch,continue,debugger,default,delete,do,else,finally,for,function,if,in,instanceof,new,return,switch,this,throw,try,typeof,var,void,while,with,' +
    'class,enum,export,extends,import,super,implements,interface,let,package,private,protected,public,static,yield,' +
    'const,null,true,false,' +
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects
    'Array,ArrayBuffer,Boolean,Date,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Error,eval,EvalError,Float32Array,Float64Array,Function,Infinity,Int16Array,Int32Array,Int8Array,isFinite,isNaN,Iterator,JSON,Math,NaN,Number,Object,parseFloat,parseInt,RangeError,ReferenceError,RegExp,StopIteration,String,SyntaxError,TypeError,Uint16Array,Uint32Array,Uint8Array,Uint8ClampedArray,undefined,uneval,URIError,' +
    // https://developer.mozilla.org/en/DOM/window
    'applicationCache,closed,Components,content,_content,controllers,crypto,defaultStatus,dialogArguments,directories,document,frameElement,frames,fullScreen,globalStorage,history,innerHeight,innerWidth,length,location,locationbar,localStorage,menubar,messageManager,mozAnimationStartTime,mozInnerScreenX,mozInnerScreenY,mozPaintCount,name,navigator,opener,outerHeight,outerWidth,pageXOffset,pageYOffset,parent,performance,personalbar,pkcs11,returnValue,screen,screenX,screenY,scrollbars,scrollMaxX,scrollMaxY,scrollX,scrollY,self,sessionStorage,sidebar,status,statusbar,toolbar,top,URL,window,' +
    'addEventListener,alert,atob,back,blur,btoa,captureEvents,clearImmediate,clearInterval,clearTimeout,close,confirm,disableExternalCapture,dispatchEvent,dump,enableExternalCapture,escape,find,focus,forward,GeckoActiveXObject,getAttention,getAttentionWithCycleCount,getComputedStyle,getSelection,home,matchMedia,maximize,minimize,moveBy,moveTo,mozRequestAnimationFrame,open,openDialog,postMessage,print,prompt,QueryInterface,releaseEvents,removeEventListener,resizeBy,resizeTo,restore,routeEvent,scroll,scrollBy,scrollByLines,scrollByPages,scrollTo,setCursor,setImmediate,setInterval,setResizable,setTimeout,showModalDialog,sizeToContent,stop,unescape,updateCommands,XPCNativeWrapper,XPCSafeJSObjectWrapper,' +
    'onabort,onbeforeunload,onblur,onchange,onclick,onclose,oncontextmenu,ondevicemotion,ondeviceorientation,ondragdrop,onerror,onfocus,onhashchange,onkeydown,onkeypress,onkeyup,onload,onmousedown,onmousemove,onmouseout,onmouseover,onmouseup,onmozbeforepaint,onpaint,onpopstate,onreset,onresize,onscroll,onselect,onsubmit,onunload,onpageshow,onpagehide,' +
    'Image,Option,Worker,' +
    // https://developer.mozilla.org/en/Gecko_DOM_Reference
    'Event,Range,File,FileReader,Blob,BlobBuilder,' +
    'Attr,CDATASection,CharacterData,Comment,console,DocumentFragment,DocumentType,DomConfiguration,DOMError,DOMErrorHandler,DOMException,DOMImplementation,DOMImplementationList,DOMImplementationRegistry,DOMImplementationSource,DOMLocator,DOMObject,DOMString,DOMStringList,DOMTimeStamp,DOMUserData,Entity,EntityReference,MediaQueryList,MediaQueryListListener,NameList,NamedNodeMap,Node,NodeFilter,NodeIterator,NodeList,Notation,Plugin,PluginArray,ProcessingInstruction,SharedWorker,Text,TimeRanges,Treewalker,TypeInfo,UserDataHandler,Worker,WorkerGlobalScope,' +
    'HTMLDocument,HTMLElement,HTMLAnchorElement,HTMLAppletElement,HTMLAudioElement,HTMLAreaElement,HTMLBaseElement,HTMLBaseFontElement,HTMLBodyElement,HTMLBRElement,HTMLButtonElement,HTMLCanvasElement,HTMLDirectoryElement,HTMLDivElement,HTMLDListElement,HTMLEmbedElement,HTMLFieldSetElement,HTMLFontElement,HTMLFormElement,HTMLFrameElement,HTMLFrameSetElement,HTMLHeadElement,HTMLHeadingElement,HTMLHtmlElement,HTMLHRElement,HTMLIFrameElement,HTMLImageElement,HTMLInputElement,HTMLKeygenElement,HTMLLabelElement,HTMLLIElement,HTMLLinkElement,HTMLMapElement,HTMLMenuElement,HTMLMetaElement,HTMLModElement,HTMLObjectElement,HTMLOListElement,HTMLOptGroupElement,HTMLOptionElement,HTMLOutputElement,HTMLParagraphElement,HTMLParamElement,HTMLPreElement,HTMLQuoteElement,HTMLScriptElement,HTMLSelectElement,HTMLSourceElement,HTMLSpanElement,HTMLStyleElement,HTMLTableElement,HTMLTableCaptionElement,HTMLTableCellElement,HTMLTableDataCellElement,HTMLTableHeaderCellElement,HTMLTableColElement,HTMLTableRowElement,HTMLTableSectionElement,HTMLTextAreaElement,HTMLTimeElement,HTMLTitleElement,HTMLTrackElement,HTMLUListElement,HTMLUnknownElement,HTMLVideoElement,' +
    'HTMLCanvasElement,CanvasRenderingContext2D,CanvasGradient,CanvasPattern,TextMetrics,ImageData,CanvasPixelArray,HTMLAudioElement,HTMLVideoElement,NotifyAudioAvailableEvent,HTMLCollection,HTMLAllCollection,HTMLFormControlsCollection,HTMLOptionsCollection,HTMLPropertiesCollection,DOMTokenList,DOMSettableTokenList,DOMStringMap,RadioNodeList,' +
    'SVGDocument,SVGElement,SVGAElement,SVGAltGlyphElement,SVGAltGlyphDefElement,SVGAltGlyphItemElement,SVGAnimationElement,SVGAnimateElement,SVGAnimateColorElement,SVGAnimateMotionElement,SVGAnimateTransformElement,SVGSetElement,SVGCircleElement,SVGClipPathElement,SVGColorProfileElement,SVGCursorElement,SVGDefsElement,SVGDescElement,SVGEllipseElement,SVGFilterElement,SVGFilterPrimitiveStandardAttributes,SVGFEBlendElement,SVGFEColorMatrixElement,SVGFEComponentTransferElement,SVGFECompositeElement,SVGFEConvolveMatrixElement,SVGFEDiffuseLightingElement,SVGFEDisplacementMapElement,SVGFEDistantLightElement,SVGFEFloodElement,SVGFEGaussianBlurElement,SVGFEImageElement,SVGFEMergeElement,SVGFEMergeNodeElement,SVGFEMorphologyElement,SVGFEOffsetElement,SVGFEPointLightElement,SVGFESpecularLightingElement,SVGFESpotLightElement,SVGFETileElement,SVGFETurbulenceElement,SVGComponentTransferFunctionElement,SVGFEFuncRElement,SVGFEFuncGElement,SVGFEFuncBElement,SVGFEFuncAElement,SVGFontElement,SVGFontFaceElement,SVGFontFaceFormatElement,SVGFontFaceNameElement,SVGFontFaceSrcElement,SVGFontFaceUriElement,SVGForeignObjectElement,SVGGElement,SVGGlyphElement,SVGGlyphRefElement,SVGGradientElement,SVGLinearGradientElement,SVGRadialGradientElement,SVGHKernElement,SVGImageElement,SVGLineElement,SVGMarkerElement,SVGMaskElement,SVGMetadataElement,SVGMissingGlyphElement,SVGMPathElement,SVGPathElement,SVGPatternElement,SVGPolylineElement,SVGPolygonElement,SVGRectElement,SVGScriptElement,SVGStopElement,SVGStyleElement,SVGSVGElement,SVGSwitchElement,SVGSymbolElement,SVGTextElement,SVGTextPathElement,SVGTitleElement,SVGTRefElement,SVGTSpanElement,SVGUseElement,SVGViewElement,SVGVKernElement,' +
    'SVGAngle,SVGColor,SVGICCColor,SVGElementInstance,SVGElementInstanceList,SVGLength,SVGLengthList,SVGMatrix,SVGNumber,SVGNumberList,SVGPaint,SVGPoint,SVGPointList,SVGPreserveAspectRatio,SVGRect,SVGStringList,SVGTransform,SVGTransformList,' +
    'SVGAnimatedAngle,SVGAnimatedBoolean,SVGAnimatedEnumeration,SVGAnimatedInteger,SVGAnimatedLength,SVGAnimatedLengthList,SVGAnimatedNumber,SVGAnimatedNumberList,SVGAnimatedPreserveAspectRatio,SVGAnimatedRect,SVGAnimatedString,SVGAnimatedTransformList,' +
    'SVGPathSegList,SVGPathSeg,SVGPathSegArcAbs,SVGPathSegArcRel,SVGPathSegClosePath,SVGPathSegCurvetoCubicAbs,SVGPathSegCurvetoCubicRel,SVGPathSegCurvetoCubicSmoothAbs,SVGPathSegCurvetoCubicSmoothRel,SVGPathSegCurvetoQuadraticAbs,SVGPathSegCurvetoQuadraticRel,SVGPathSegCurvetoQuadraticSmoothAbs,SVGPathSegCurvetoQuadraticSmoothRel,SVGPathSegLinetoAbs,SVGPathSegLinetoHorizontalAbs,SVGPathSegLinetoHorizontalRel,SVGPathSegLinetoRel,SVGPathSegLinetoVerticalAbs,SVGPathSegLinetoVerticalRel,SVGPathSegMovetoAbs,SVGPathSegMovetoRel,ElementTimeControl,TimeEvent,SVGAnimatedPathData,' +
    'SVGAnimatedPoints,SVGColorProfileRule,SVGCSSRule,SVGExternalResourcesRequired,SVGFitToViewBox,SVGLangSpace,SVGLocatable,SVGRenderingIntent,SVGStylable,SVGTests,SVGTextContentElement,SVGTextPositioningElement,SVGTransformable,SVGUnitTypes,SVGURIReference,SVGViewSpec,SVGZoomAndPan');

/**
 * Order of operation ENUMs.
 * I never actually use anything other function calls since even primitive operators are wrapped in a function call
 */
Blockly.Whalesong.ORDER_ATOMIC = 0;         // 0 "" ...
Blockly.Whalesong.ORDER_MEMBER = 1;         // . []
Blockly.Whalesong.ORDER_NEW = 1;            // new
Blockly.Whalesong.ORDER_FUNCTION_CALL = 2;  // ()
Blockly.Whalesong.ORDER_INCREMENT = 3;      // ++
Blockly.Whalesong.ORDER_DECREMENT = 3;      // --
Blockly.Whalesong.ORDER_LOGICAL_NOT = 4;    // !
Blockly.Whalesong.ORDER_BITWISE_NOT = 4;    // ~
Blockly.Whalesong.ORDER_UNARY_PLUS = 4;     // +
Blockly.Whalesong.ORDER_UNARY_NEGATION = 4; // -
Blockly.Whalesong.ORDER_TYPEOF = 4;         // typeof
Blockly.Whalesong.ORDER_VOID = 4;           // void
Blockly.Whalesong.ORDER_DELETE = 4;         // delete
Blockly.Whalesong.ORDER_MULTIPLICATION = 5; // *
Blockly.Whalesong.ORDER_DIVISION = 5;       // /
Blockly.Whalesong.ORDER_MODULUS = 5;        // %
Blockly.Whalesong.ORDER_ADDITION = 6;       // +
Blockly.Whalesong.ORDER_SUBTRACTION = 6;    // -
Blockly.Whalesong.ORDER_BITWISE_SHIFT = 7;  // << >> >>>
Blockly.Whalesong.ORDER_RELATIONAL = 8;     // < <= > >=
Blockly.Whalesong.ORDER_IN = 8;             // in
Blockly.Whalesong.ORDER_INSTANCEOF = 8;     // instanceof
Blockly.Whalesong.ORDER_EQUALITY = 9;       // == != === !==
Blockly.Whalesong.ORDER_BITWISE_AND = 10;   // &
Blockly.Whalesong.ORDER_BITWISE_XOR = 11;   // ^
Blockly.Whalesong.ORDER_BITWISE_OR = 12;    // |
Blockly.Whalesong.ORDER_LOGICAL_AND = 13;   // &&
Blockly.Whalesong.ORDER_LOGICAL_OR = 14;    // ||
Blockly.Whalesong.ORDER_CONDITIONAL = 15;   // ?:
Blockly.Whalesong.ORDER_ASSIGNMENT = 16;    // = += -= *= /= %= <<= >>= ...
Blockly.Whalesong.ORDER_COMMA = 17;         // ,
Blockly.Whalesong.ORDER_NONE = 99;          // (...)

/**
 * Arbitrary code to inject into locations that risk causing infinite loops.
 * Any instances of '%1' will be replaced by the block ID that failed.
 * E.g. '  checkTimeout(%1);\n'
 * @type ?string
 */
Blockly.Whalesong.INFINITE_LOOP_TRAP = null;

/**
 * @param {string} primitive the name of the primitive racket function we are calling
 * @param {...string} args these should be strings, generated by valueToCode
 */
Blockly.Whalesong.ws_prim = function(primitive) { 
    return 'ws_prim(' + Blockly.Whalesong.quote_(primitive) + ')';
};

Blockly.Whalesong.ws_lookup = function(/* varargs */) { 
  var quoted_args = Array.prototype.slice.call(arguments).map(Blockly.Whalesong.quote_);
  return 'ws_lookup(' + quoted_args.join(', ') + ')';
};

Blockly.Whalesong.call_primitive = function (primitive /*, arguments to function */) {
  if(!primitive) {
    throw { message: "Too few arguments provided, at least 1 needed" };
  } else {
      var prim_func = 'prim_to_js_prim(' + Blockly.Whalesong.quote_(primitive) + ')';
      var call = 'call_js_prim(';
      var args = Array.prototype.slice.call(arguments, 1);
      call += [prim_func].concat(args).join(', ') + ')';
      return call;
  }
};

Blockly.Whalesong.ws_apply = function(primitive /*, arguments to function */) { 
  if(!primitive) { 
    throw { message: "Too few arguments provided, at least 1 needed" };
  } else { 
    var prim_func = Blockly.Whalesong.quote_(primitive);
    var call = 'ws_apply(';
    var args = Array.prototype.slice.call(arguments, 1);
    call += [prim_func].concat(args).join(', ') + ')';
    return call;
  }
};

Blockly.Whalesong.ws_apply_with = function(names /*, arguments to function */) { 
  if(!names) { 
    throw { message: "Too few arguments provided, at least 1 needed" };
  } else { 
    var path = names.map(Blockly.Whalesong.quote_)
    var path_array = '[' + path.join(', ') + ']';
    var call = 'ws_apply_with(';
    var args = Array.prototype.slice.call(arguments, 1);
    call += [path_array].concat(args).join(', ') + ')';
    return call;
  }
};

Blockly.Whalesong.not_implemented = function(name) { 
    throw { message: "NOT YET IMPLEMENTED: " + name };
};

Blockly.Whalesong.lib_ = new Object();
Blockly.Whalesong.lib_["failure"] = 'function(v) { throw { message: "Failure!!!", value: v }; }';
Blockly.Whalesong.lib_["success"] = 'function(v) { _temp = v; }';
Blockly.Whalesong.lib_["name_to_js_prim"] = "\
function(name) {\n\
    return plt.baselib.functions.asJavaScriptFunction(plt.baselib.primitives.Primitives[name]);\n\
}";
Blockly.Whalesong.lib_["ws_prim_to_js_prim"] = "\
function(prim) {\n\
    return plt.baselib.functions.asJavaScriptFunction(prim);\n\
}";
Blockly.Whalesong.lib_["call_js_prim"] = "\
function(prim) {\n\
    var args = Array.prototype.slice.call(arguments, 1);\n\
    var continuations = [success, failure];\n\
    prim.apply(null, continuations.concat(args));\n\
    return _temp;\n\
}";
Blockly.Whalesong.lib_["ws_apply"] = "\
function(name) {\n\
    var args = Array.prototype.slice.call(arguments, 1);\n\
    var prim = name_to_js_prim(name);\n\
    return call_js_prim.apply(null, [prim].concat(args));\n\
}";
Blockly.Whalesong.lib_["ws_apply_with"] = "\
function(names /*, ...args */) {\n\
    var args = Array.prototype.slice.call(arguments, 1);\n\
    var prim = ws_prim_to_js_prim(ws_lookup.apply(null, names));\n\
    return call_js_prim.apply(null, [prim].concat(args));\n\
}";
Blockly.Whalesong.lib_["ws_prim"] = "\
function(name) {\n\
    return plt.baselib.primitives.Primitives[name];\n\
}";
Blockly.Whalesong.lib_["ws_lookup"] = "\
function(/* ...args */) {\n\
    var args = Array.prototype.slice.call(arguments);\n\
    var obj = plt.baselib;\n\
    args.forEach(function(arg) {\n\
        obj = obj[arg];\n\
    });\n\
    return obj;\n\
}";

/**
 * Initialise the database of variable names.
 */
Blockly.Whalesong.init = function() {
  // Create a dictionary of definitions to be printed before the code.
  Blockly.Whalesong.definitions_ = {};

  if (Blockly.Variables) {
    if (!Blockly.Whalesong.variableDB_) {
      Blockly.Whalesong.variableDB_ =
          new Blockly.Names(Blockly.Whalesong.RESERVED_WORDS_);
    } else {
      Blockly.Whalesong.variableDB_.reset();
    }

    var defvars = [];
    defvars[0] = "var _temp;";
    var variables = Blockly.Variables.allVariables();
    for (var x = 1; x <= variables.length; x++) {
      defvars[x] = 'var ' +
          Blockly.Whalesong.variableDB_.getName(variables[x],
          Blockly.Variables.NAME_TYPE) + ';';
    }

    Blockly.Whalesong.definitions_['variables'] = defvars.join('\n');
  }
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.Whalesong.finish = function(code) {
  // Convert the definitions dictionary into a list.
  var definitions = [];
  for (var name in Blockly.Whalesong.definitions_) {
    definitions.push(Blockly.Whalesong.definitions_[name]);
  }

  var lib = [];
  for (var lib_function in Blockly.Whalesong.lib_) {
    lib.push('var ' + lib_function + " = " + Blockly.Whalesong.lib_[lib_function] + ';');
  }
  return definitions.join('\n') + '\n\n' + lib.join('\n') + '\n\n' + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.Whalesong.scrubNakedValue = function(line) {
  return line + ';\n';
};

/**
 * Encode a string as a properly escaped Whalesong string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} Whalesong string.
 * @private
 */
Blockly.Whalesong.quote_ = function(string) {
  // TODO: This is a quick hack.  Replace with goog.string.quote
  string = string.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\\n')
                 .replace(/'/g, '\\\'');

  return '\'' + string + '\'';
};

/**
 * Common tasks for generating Whalesong from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The Whalesong code created for this block.
 * @return {string} Whalesong code with comments and subsequent blocks added.
 * @this {Blockly.CodeGenerator}
 * @private
 */
Blockly.Whalesong.scrub_ = function(block, code) {
  if (code === null) {
    // Block has handled code generation itself.
    return '';
  }
  var commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    var comment = block.getCommentText();
    if (comment) {
      commentCode += Blockly.Generator.prefixLines(comment, '// ') + '\n';
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var x = 0; x < block.inputList.length; x++) {
      if (block.inputList[x].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[x].connection.targetBlock();
        if (childBlock) {
          var comment = Blockly.Generator.allNestedComments(childBlock);
          if (comment) {
            commentCode += Blockly.Generator.prefixLines(comment, '// ');
          }
        }
      }
    }
  }
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = this.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};
/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Whalesong for colour blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Whalesong.colour = {};

Blockly.Whalesong.colour_picker = function() {
  // Colour picker.
  var code = '\'' + this.getTitleValue('COLOUR') + '\'';
  return [code, Blockly.Whalesong.ORDER_ATOMIC];
};

Blockly.Whalesong.colour_random = function() {
  // Generate a random colour.
  if (!Blockly.Whalesong.definitions_['colour_random']) {
    var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
        'colour_random', Blockly.Generator.NAME_TYPE);
    Blockly.Whalesong.colour_random.functionName = functionName;
    var func = [];
    func.push('function ' + functionName + '() {');
    func.push('  var num = Math.floor(Math.random() * Math.pow(2, 24));');
    func.push('  return \'#\' + (\'00000\' + num.toString(16)).substr(-6);');
    func.push('}');
    Blockly.Whalesong.definitions_['colour_random'] = func.join('\n');
  }
  var code = Blockly.Whalesong.colour_random.functionName + '()';
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.colour_rgb = function() {
  // Compose a colour from RGB components expressed as percentages.
  var red = Blockly.Whalesong.valueToCode(this, 'RED',
      Blockly.Whalesong.ORDER_COMMA) || 0;
  var green = Blockly.Whalesong.valueToCode(this, 'GREEN',
      Blockly.Whalesong.ORDER_COMMA) || 0;
  var blue = Blockly.Whalesong.valueToCode(this, 'BLUE',
      Blockly.Whalesong.ORDER_COMMA) || 0;

  if (!Blockly.Whalesong.definitions_['colour_rgb']) {
    var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
        'colour_rgb', Blockly.Generator.NAME_TYPE);
    Blockly.Whalesong.colour_rgb.functionName = functionName;
    var func = [];
    func.push('function ' + functionName + '(r, g, b) {');
    func.push('  r = Math.round(Math.max(Math.min(Number(r), 100), 0) * 2.55);');
    func.push('  g = Math.round(Math.max(Math.min(Number(g), 100), 0) * 2.55);');
    func.push('  b = Math.round(Math.max(Math.min(Number(b), 100), 0) * 2.55);');
    func.push('  r = (\'0\' + (r || 0).toString(16)).slice(-2);');
    func.push('  g = (\'0\' + (g || 0).toString(16)).slice(-2);');
    func.push('  b = (\'0\' + (b || 0).toString(16)).slice(-2);');
    func.push('  return \'#\' + r + g + b;');
    func.push('}');
    Blockly.Whalesong.definitions_['colour_rgb'] = func.join('\n');
  }
  var code = Blockly.Whalesong.colour_rgb.functionName +
      '(' + red + ', ' + green + ', ' + blue + ')';
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.colour_blend = function() {
  // Blend two colours together.
  var c1 = Blockly.Whalesong.valueToCode(this, 'COLOUR1',
      Blockly.Whalesong.ORDER_COMMA) || '\'#000000\'';
  var c2 = Blockly.Whalesong.valueToCode(this, 'COLOUR2',
      Blockly.Whalesong.ORDER_COMMA) || '\'#000000\'';
  var ratio = Blockly.Whalesong.valueToCode(this, 'RATIO',
      Blockly.Whalesong.ORDER_COMMA) || 0.5;

  if (!Blockly.Whalesong.definitions_['colour_blend']) {
    var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
        'colour_blend', Blockly.Generator.NAME_TYPE);
    Blockly.Whalesong.colour_blend.functionName = functionName;
    var func = [];
    func.push('function ' + functionName + '(c1, c2, ratio) {');
    func.push('  ratio = Math.max(Math.min(Number(ratio), 1), 0);');
    func.push('  var r1 = parseInt(c1.substring(1, 3), 16);');
    func.push('  var g1 = parseInt(c1.substring(3, 5), 16);');
    func.push('  var b1 = parseInt(c1.substring(5, 7), 16);');
    func.push('  var r2 = parseInt(c2.substring(1, 3), 16);');
    func.push('  var g2 = parseInt(c2.substring(3, 5), 16);');
    func.push('  var b2 = parseInt(c2.substring(5, 7), 16);');
    func.push('  var r = Math.round(r1 * (1 - ratio) + r2 * ratio);');
    func.push('  var g = Math.round(g1 * (1 - ratio) + g2 * ratio);');
    func.push('  var b = Math.round(b1 * (1 - ratio) + b2 * ratio);');
    func.push('  r = (\'0\' + (r || 0).toString(16)).slice(-2);');
    func.push('  g = (\'0\' + (g || 0).toString(16)).slice(-2);');
    func.push('  b = (\'0\' + (b || 0).toString(16)).slice(-2);');
    func.push('  return \'#\' + r + g + b;');
    func.push('}');
    Blockly.Whalesong.definitions_['colour_blend'] = func.join('\n');
  }
  var code = Blockly.Whalesong.colour_blend.functionName +
      '(' + c1 + ', ' + c2 + ', ' + ratio + ')';
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};
/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Whalesong for control blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Whalesong.control = {};

Blockly.Whalesong.controls_if = function() {
  // If/elseif/else condition.
  var n = 0;
  var argument = Blockly.Whalesong.valueToCode(this, 'IF' + n,
      Blockly.Whalesong.ORDER_NONE) || 'false';
  var branch = Blockly.Whalesong.statementToCode(this, 'DO' + n);
  var code = 'if (' + argument + ') {\n' + branch + '}';
  for (n = 1; n <= this.elseifCount_; n++) {
    argument = Blockly.Whalesong.valueToCode(this, 'IF' + n,
        Blockly.Whalesong.ORDER_NONE) || 'false';
    branch = Blockly.Whalesong.statementToCode(this, 'DO' + n);
    code += ' else if (' + argument + ') {\n' + branch + '}';
  }
  if (this.elseCount_) {
    branch = Blockly.Whalesong.statementToCode(this, 'ELSE');
    code += ' else {\n' + branch + '}';
  }
  return code + '\n';
};

Blockly.Whalesong.controls_repeat = function() {
  // Repeat n times.
  var repeats = Number(this.getTitleValue('TIMES'));
  var branch = Blockly.Whalesong.statementToCode(this, 'DO');
  if (Blockly.Whalesong.INFINITE_LOOP_TRAP) {
    branch = Blockly.Whalesong.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + this.id + '\'') + branch;
  }
  var loopVar = Blockly.Whalesong.variableDB_.getDistinctName(
      'count', Blockly.Variables.NAME_TYPE);
  var code = 'for (var ' + loopVar + ' = 0; ' +
      loopVar + ' < ' + repeats + '; ' +
      loopVar + '++) {\n' +
      branch + '}\n';
  return code;
};

Blockly.Whalesong.controls_whileUntil = function() {
  // Do while/until loop.
  var until = this.getTitleValue('MODE') == 'UNTIL';
  var argument0 = Blockly.Whalesong.valueToCode(this, 'BOOL',
      until ? Blockly.Whalesong.ORDER_LOGICAL_NOT :
      Blockly.Whalesong.ORDER_NONE) || 'false';
  var branch = Blockly.Whalesong.statementToCode(this, 'DO');
  if (Blockly.Whalesong.INFINITE_LOOP_TRAP) {
    branch = Blockly.Whalesong.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + this.id + '\'') + branch;
  }
  if (until) {
    argument0 = '!' + argument0;
  }
  return 'while (' + argument0 + ') {\n' + branch + '}\n';
};

Blockly.Whalesong.controls_for = function() {
  // For loop.
  var variable0 = Blockly.Whalesong.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Whalesong.valueToCode(this, 'FROM',
      Blockly.Whalesong.ORDER_ASSIGNMENT) || '0';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'TO',
      Blockly.Whalesong.ORDER_ASSIGNMENT) || '0';
  var branch = Blockly.Whalesong.statementToCode(this, 'DO');
  if (Blockly.Whalesong.INFINITE_LOOP_TRAP) {
    branch = Blockly.Whalesong.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + this.id + '\'') + branch;
  }
  var code;
  if (argument0.match(/^-?\d+(\.\d+)?$/) &&
      argument1.match(/^-?\d+(\.\d+)?$/)) {
    // Both arguments are simple numbers.
    var up = parseFloat(argument0) <= parseFloat(argument1);
    code = 'for (' + variable0 + ' = ' + argument0 + '; ' +
        variable0 + (up ? ' <= ' : ' >= ') + argument1 + '; ' +
        variable0 + (up ? '++' : '--') + ') {\n' +
        branch + '}\n';
  } else {
    code = '';
    // Cache non-trivial values to variables to prevent repeated look-ups.
    var startVar = argument0;
    if (!argument0.match(/^\w+$/) && !argument0.match(/^-?\d+(\.\d+)?$/)) {
      var startVar = Blockly.Whalesong.variableDB_.getDistinctName(
          variable0 + '_start', Blockly.Variables.NAME_TYPE);
      code += 'var ' + startVar + ' = ' + argument0 + ';\n';
    }
    var endVar = argument1;
    if (!argument1.match(/^\w+$/) && !argument1.match(/^-?\d+(\.\d+)?$/)) {
      var endVar = Blockly.Whalesong.variableDB_.getDistinctName(
          variable0 + '_end', Blockly.Variables.NAME_TYPE);
      code += 'var ' + endVar + ' = ' + argument1 + ';\n';
    }
    code += 'for (' + variable0 + ' = ' + startVar + ';\n' +
        '    (' + startVar + ' <= ' + endVar + ') ? ' +
        variable0 + ' <= ' + endVar + ' : ' +
        variable0 + ' >= ' + endVar + ';\n' +
        '    ' + variable0 +
        ' += (' + startVar + ' <= ' + endVar + ') ? 1 : -1) {\n' +
        branch + '}\n';
  }
  return code;
};

Blockly.Whalesong.controls_forEach = function() {
  // For each loop.
  var variable0 = Blockly.Whalesong.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Whalesong.valueToCode(this, 'LIST',
      Blockly.Whalesong.ORDER_ASSIGNMENT) || '[]';
  var branch = Blockly.Whalesong.statementToCode(this, 'DO');
  if (Blockly.Whalesong.INFINITE_LOOP_TRAP) {
    branch = Blockly.Whalesong.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + this.id + '\'') + branch;
  }
  var code;
  var indexVar = Blockly.Whalesong.variableDB_.getDistinctName(
      variable0 + '_index', Blockly.Variables.NAME_TYPE);
  if (argument0.match(/^\w+$/)) {
    branch = '  ' + variable0 + ' = ' + argument0 + '[' + indexVar + '];\n' +
        branch;
    code = 'for (var ' + indexVar + ' in  ' + argument0 + ') {\n' +
        branch + '}\n';
  } else {
    // The list appears to be more complicated than a simple variable.
    // Cache it to a variable to prevent repeated look-ups.
    var listVar = Blockly.Whalesong.variableDB_.getDistinctName(
        variable0 + '_list', Blockly.Variables.NAME_TYPE);
    branch = '  ' + variable0 + ' = ' + listVar + '[' + indexVar + '];\n' +
        branch;
    code = 'var ' + listVar + ' = ' + argument0 + ';\n' +
        'for (var ' + indexVar + ' in ' + listVar + ') {\n' +
        branch + '}\n';
  }
  return code;
};

Blockly.Whalesong.controls_flow_statements = function() {
  // Flow statements: continue, break.
  switch (this.getTitleValue('FLOW')) {
    case 'BREAK':
      return 'break;\n';
    case 'CONTINUE':
      return 'continue;\n';
  }
  throw 'Unknown flow statement.';
};
/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Whalesong for list blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Whalesong.lists = {};

Blockly.Whalesong.lists_create_empty = function() {
  // Create an empty list.
  return [Blockly.Whalesong.ws_prim('null'), Blockly.Whalesong.ORDER_MEMBER];
};

Blockly.Whalesong.lists_create_with = function() {
  // Create a list with any number of elements of any type.
  var args = new Array(this.itemCount_);
  for (var n = 0; n < this.itemCount_; n++) {
    args[n] = Blockly.Whalesong.valueToCode(this, 'ADD' + n,
        Blockly.Whalesong.ORDER_COMMA) || Blockly.Whalesong.ws_null;
  }
  var code = Blockly.Whalesong.ws_apply.apply(null, ['list'].concat(args));
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.lists_repeat = function() {
  /*
  var argument0 = Blockly.Whalesong.valueToCode(this, 'ITEM',
      Blockly.Whalesong.ORDER_COMMA) || 'null';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'NUM',
      Blockly.Whalesong.ORDER_COMMA) || '0';
   */
  return Blockly.Whalesong.not_implemented();
  /*
  var code = Blockly.Whalesong.ws_apply_with(['lists', 'makeList'], argument1, argument0);
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
   */
};

Blockly.Whalesong.lists_length = function() {
  // List length.
  var argument0 = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_COMMA) || '\'\'';
  return [Blockly.Whalesong.ws_apply('length', argument0), Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.lists_isEmpty = function() {
  // Is the list empty?
  var argument0 = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_COMMA) || '[]';
  return [Blockly.Whalesong.ws_apply('empty?', argument0), Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.lists_indexOf = function() {
  // Find an item in the list.
  var operator = this.getTitleValue('END') == 'FIRST' ?
      'indexOf' : 'lastIndexOf';
  var argument0 = Blockly.Whalesong.valueToCode(this, 'FIND',
      Blockly.Whalesong.ORDER_NONE) || '\'\'';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_MEMBER) || '[]';
  var code = argument1 + '.' + operator + '(' + argument0 + ') + 1';
  return [code, Blockly.Whalesong.ORDER_MEMBER];
};

Blockly.Whalesong.lists_getIndex = function() {
  // Get element at index.
  // Note: Until January 2013 this block did not have MODE or WHERE inputs.
  var mode = this.getTitleValue('MODE') || 'GET';
  var where = this.getTitleValue('WHERE') || 'FROM_START';
  var at = Blockly.Whalesong.valueToCode(this, 'AT',
      Blockly.Whalesong.ORDER_UNARY_NEGATION) || '1';
  var list = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_MEMBER) || '[]';

  if (where == 'FIRST') {
    if (mode == 'GET') {
      var code = list + '[0]';
      return [code, Blockly.Whalesong.ORDER_MEMBER];
    } else if (mode == 'GET_REMOVE') {
      var code = list + '.shift()';
      return [code, Blockly.Whalesong.ORDER_MEMBER];
    } else if (mode == 'REMOVE') {
      return list + '.shift();\n';
    }
  } else if (where == 'LAST') {
    if (mode == 'GET') {
      var code = list + '.slice(-1)[0]';
      return [code, Blockly.Whalesong.ORDER_MEMBER];
    } else if (mode == 'GET_REMOVE') {
      var code = list + '.pop()';
      return [code, Blockly.Whalesong.ORDER_MEMBER];
    } else if (mode == 'REMOVE') {
      return list + '.pop();\n';
    }
  } else if (where == 'FROM_START') {
    // Blockly uses one-based indicies.
    if (at.match(/^-?\d+$/)) {
      // If the index is a naked number, decrement it right now.
      at = parseInt(at, 10) - 1;
    } else {
      // If the index is dynamic, decrement it in code.
      at += ' - 1';
    }
    if (mode == 'GET') {
      var code = list + '[' + at + ']';
      return [code, Blockly.Whalesong.ORDER_MEMBER];
    } else if (mode == 'GET_REMOVE') {
      var code = list + '.splice(' + at + ', 1)[0]';
      return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
    } else if (mode == 'REMOVE') {
      return list + '.splice(' + at + ', 1);\n';
    }
  } else if (where == 'FROM_END') {
    if (mode == 'GET') {
      var code = list + '.slice(-' + at + ')[0]';
      return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
    } else if (mode == 'GET_REMOVE' || mode == 'REMOVE') {
      if (!Blockly.Whalesong.definitions_['lists_remove_from_end']) {
        var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
            'lists_remove_from_end', Blockly.Generator.NAME_TYPE);
        Blockly.Whalesong.lists_getIndex.lists_remove_from_end = functionName;
        var func = [];
        func.push('function ' + functionName + '(list, x) {');
        func.push('  x = list.length - x;');
        func.push('  return list.splice(x, 1)[0];');
        func.push('}');
        Blockly.Whalesong.definitions_['lists_remove_from_end'] =
            func.join('\n');
      }
      code = Blockly.Whalesong.lists_getIndex.lists_remove_from_end +
          '(' + list + ', ' + at + ')';
      if (mode == 'GET_REMOVE') {
        return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
      } else if (mode == 'REMOVE') {
        return code + ';\n';
      }
    }
  } else if (where == 'RANDOM') {
    if (!Blockly.Whalesong.definitions_['lists_get_random_item']) {
      var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
          'lists_get_random_item', Blockly.Generator.NAME_TYPE);
      Blockly.Whalesong.lists_getIndex.random = functionName;
      var func = [];
      func.push('function ' + functionName + '(list, remove) {');
      func.push('  var x = Math.floor(Math.random() * list.length);');
      func.push('  if (remove) {');
      func.push('    return list.splice(x, 1)[0];');
      func.push('  } else {');
      func.push('    return list[x];');
      func.push('  }');
      func.push('}');
      Blockly.Whalesong.definitions_['lists_get_random_item'] =
          func.join('\n');
    }
    code = Blockly.Whalesong.lists_getIndex.random +
        '(' + list + ', ' + (mode != 'GET') + ')';
    if (mode == 'GET' || mode == 'GET_REMOVE') {
      return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
    } else if (mode == 'REMOVE') {
      return code + ';\n';
    }
  }
  throw 'Unhandled combination (lists_getIndex).';
};

Blockly.Whalesong.lists_setIndex = function() {
  // Set element at index.
  // Note: Until February 2013 this block did not have MODE or WHERE inputs.
  var list = Blockly.Whalesong.valueToCode(this, 'LIST',
      Blockly.Whalesong.ORDER_MEMBER) || '[]';
  var mode = this.getTitleValue('MODE') || 'GET';
  var where = this.getTitleValue('WHERE') || 'FROM_START';
  var at = Blockly.Whalesong.valueToCode(this, 'AT',
      Blockly.Whalesong.ORDER_NONE) || '1';
  var value = Blockly.Whalesong.valueToCode(this, 'TO',
      Blockly.Whalesong.ORDER_ASSIGNMENT) || 'null';
  // Cache non-trivial values to variables to prevent repeated look-ups.
  // Closure, which accesses and modifies 'list'.
  function cacheList() {
    if (list.match(/^\w+$/)) {
      return '';
    }
    var listVar = Blockly.Whalesong.variableDB_.getDistinctName(
        'tmp_list', Blockly.Variables.NAME_TYPE);
    var code = 'var ' + listVar + ' = ' + list + ';\n';
    list = listVar;
    return code;
  }
  if (where == 'FIRST') {
    if (mode == 'SET') {
      return list + '[0] = ' + value + ';\n';
    } else if (mode == 'INSERT') {
      return list + '.unshift(' + value + ');\n';
    }
  } else if (where == 'LAST') {
    if (mode == 'SET') {
      var code = cacheList();
      code += list + '[' + list + '.length - 1] = ' + value + ';\n';
      return code;
    } else if (mode == 'INSERT') {
      return list + '.push(' + value + ');\n';
    }
  } else if (where == 'FROM_START') {
    // Blockly uses one-based indicies.
    if (at.match(/^\d+$/)) {
      // If the index is a naked number, decrement it right now.
      at = parseInt(at, 10) - 1;
    } else {
      // If the index is dynamic, decrement it in code.
      at += ' - 1';
    }
    if (mode == 'SET') {
      return list + '[' + at + '] = ' + value + ';\n';
    } else if (mode == 'INSERT') {
      return list + '.splice(' + at + ', 0, ' + value + ');\n';
    }
  } else if (where == 'FROM_END') {
    var code = cacheList();
    if (mode == 'SET') {
      code += list + '[' + list + '.length - ' + at + '] = ' + value + ';\n';
      return code;
    } else if (mode == 'INSERT') {
      code += list + '.splice(' + list + '.length - ' + at + ', 0, ' + value +
          ');\n';
      return code;
    }
  } else if (where == 'RANDOM') {
    var code = cacheList();
    var xVar = Blockly.Whalesong.variableDB_.getDistinctName(
        'tmp_x', Blockly.Variables.NAME_TYPE);
    code += 'var ' + xVar + ' = Math.floor(Math.random() * ' + list +
        '.length);\n';
    if (mode == 'SET') {
      code += list + '[' + xVar + '] = ' + value + ';\n';
      return code;
    } else if (mode == 'INSERT') {
      code += list + '.splice(' + xVar + ', 0, ' + value + ');\n';
      return code;
    }
  }
  throw 'Unhandled combination (lists_setIndex).';
};

Blockly.Whalesong.lists_getSublist = function() {
  // Get sublist.
  var list = Blockly.Whalesong.valueToCode(this, 'LIST',
      Blockly.Whalesong.ORDER_MEMBER) || '[]';
  var where1 = this.getTitleValue('WHERE1');
  var where2 = this.getTitleValue('WHERE2');
  var at1 = Blockly.Whalesong.valueToCode(this, 'AT1',
      Blockly.Whalesong.ORDER_NONE) || '1';
  var at2 = Blockly.Whalesong.valueToCode(this, 'AT2',
      Blockly.Whalesong.ORDER_NONE) || '1';
  if (where1 == 'FIRST' && where2 == 'LAST') {
    var code = list + '.concat()';
  } else {
    if (!Blockly.Whalesong.definitions_['lists_get_sublist']) {
      var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
          'lists_get_sublist', Blockly.Generator.NAME_TYPE);
      Blockly.Whalesong.lists_getSublist.func = functionName;
      var func = [];
      func.push('function ' + functionName +
          '(list, where1, at1, where2, at2) {');
      func.push('  function getAt(where, at) {');
      func.push('    if (where == \'FROM_START\') {');
      func.push('      at--;');
      func.push('    } else if (where == \'FROM_END\') {');
      func.push('      at = list.length - at;');
      func.push('    } else if (where == \'FIRST\') {');
      func.push('      at = 0;');
      func.push('    } else if (where == \'LAST\') {');
      func.push('      at = list.length - 1;');
      func.push('    } else {');
      func.push('      throw \'Unhandled option (lists_getSublist).\';');
      func.push('    }');
      func.push('    return at;');
      func.push('  }');
      func.push('  at1 = getAt(where1, at1);');
      func.push('  at2 = getAt(where2, at2) + 1;');
      func.push('  return list.slice(at1, at2);');
      func.push('}');
      Blockly.Whalesong.definitions_['lists_get_sublist'] =
          func.join('\n');
    }
    var code = Blockly.Whalesong.lists_getSublist.func + '(' + list + ', \'' +
        where1 + '\', ' + at1 + ', \'' + where2 + '\', ' + at2 + ')';
  }
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};
/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Whalesong for logic blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

Blockly.Whalesong.logic = {};

Blockly.Whalesong.logic_compare = function() {
  // Comparison operator.
  var mode = this.getTitleValue('OP');
  var operator = Blockly.Whalesong.logic_compare.OPERATORS[mode];
  var order = (operator == '==' || operator == '!=') ?
      Blockly.Whalesong.ORDER_EQUALITY : Blockly.Whalesong.ORDER_RELATIONAL;
  var argument0 = Blockly.Whalesong.valueToCode(this, 'A', order) || '0';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'B', order) || '0';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Whalesong.logic_compare.OPERATORS = {
  EQ: '==',
  NEQ: '!=',
  LT: '<',
  LTE: '<=',
  GT: '>',
  GTE: '>='
};

Blockly.Whalesong.logic_operation = function() {
  // Operations 'and', 'or'.
  var operator = (this.getTitleValue('OP') == 'AND') ? '&&' : '||';
  var order = (operator == '&&') ? Blockly.Whalesong.ORDER_LOGICAL_AND :
      Blockly.Whalesong.ORDER_LOGICAL_OR;
  var argument0 = Blockly.Whalesong.valueToCode(this, 'A', order) || 'false';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'B', order) || 'false';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Whalesong.logic_negate = function() {
  // Negation.
  var order = Blockly.Whalesong.ORDER_LOGICAL_NOT;
  var argument0 = Blockly.Whalesong.valueToCode(this, 'BOOL', order) ||
      'false';
  var code = '!' + argument0;
  return [code, order];
};

Blockly.Whalesong.logic_boolean = function() {
  // Boolean values true and false.
  var code = (this.getTitleValue('BOOL') == 'TRUE') ? 'true' : 'false';
  return [code, Blockly.Whalesong.ORDER_ATOMIC];
};

Blockly.Whalesong.logic_null = function() {
  // Null data type.
  return ['null', Blockly.Whalesong.ORDER_ATOMIC];
};

Blockly.Whalesong.logic_ternary = function() {
  // Ternary operator.
  var value_if = Blockly.Whalesong.valueToCode(this, 'IF',
      Blockly.Whalesong.ORDER_CONDITIONAL) || 'false';
  var value_then = Blockly.Whalesong.valueToCode(this, 'THEN',
      Blockly.Whalesong.ORDER_CONDITIONAL) || 'null';
  var value_else = Blockly.Whalesong.valueToCode(this, 'ELSE',
      Blockly.Whalesong.ORDER_CONDITIONAL) || 'null';
  var code = value_if + ' ? ' + value_then + ' : ' + value_else
  return [code, Blockly.Whalesong.ORDER_CONDITIONAL];
};
/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Whalesong for math blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

Blockly.Whalesong.math = {};

Blockly.Whalesong.math_number = function() {
  // Numeric value.
  var code = window.parseFloat(this.getTitleValue('NUM'));
  return [code, Blockly.Whalesong.ORDER_ATOMIC];
};

Blockly.Whalesong.math_arithmetic = function() {
  // Basic arithmetic operators, and power.
  var mode = this.getTitleValue('OP');
  var primitive_name = Blockly.Whalesong.math_arithmetic.BASIC_OPERATIONS[mode];
  var argument0 = Blockly.Whalesong.valueToCode(this, 'A', Blockly.Whalesong.ORDER_COMMA) || '0';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'B', Blockly.Whalesong.ORDER_COMMA) || '0';
  var code = Blockly.Whalesong.ws_apply(primitive_name, argument0, argument1);
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.math_arithmetic.BASIC_OPERATIONS = {
  ADD: '+',
  MINUS: '-',
  MULTIPLY: '*',
  DIVIDE: '/',
  POWER: 'expt'
};

Blockly.Whalesong.math_single = function() {
  // Math operators with single operand.
  var operator = this.getTitleValue('OP');
  var code;
  var arg;
  if (operator == 'NEG') {
    // Negation is a special case given its different operator precedence.
    arg = Blockly.Whalesong.valueToCode(this, 'NUM',
        Blockly.Whalesong.ORDER_UNARY_NEGATION) || '0';
    if (arg[0] == '-') {
      // --3 is not legal in JS.
      arg = ' ' + arg;
    }
    code = '-' + arg;
    return [code, Blockly.Whalesong.ORDER_UNARY_NEGATION];
  }
  if (operator == 'SIN' || operator == 'COS' || operator == 'TAN') {
    arg = Blockly.Whalesong.valueToCode(this, 'NUM',
        Blockly.Whalesong.ORDER_DIVISION) || '0';
  } else {
    arg = Blockly.Whalesong.valueToCode(this, 'NUM',
        Blockly.Whalesong.ORDER_NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
    case 'ROOT':
    case 'LN':
    case 'EXP':
    case 'ROUND':
    case 'ROUNDUP':
    case 'ROUNDDOWN':
      code = Blockly.Whalesong.ws_apply(Blockly.Whalesong.UNARY_OPERATORS[operator], arg);
      break;
    case 'SIN':
    case 'COS':
    case 'TAN':
      code = Blockly.Whalesong.ws_apply(Blockly.Whalesong.TRIGONOMETRIC_OPERATORS[operator], arg);
      break;
    case 'ASIN':
    case 'ACOS':
    case 'ATAN':
      code = Blockly.Whalesong.ws_apply(Blockly.Whalesong.TRIGONOMETRIC_OPERATORS[operator], arg);
      break;
    case 'POW10':
    case 'LOG10':
    default:
      throw 'Unknown math operator: ' + operator;
  }
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.UNARY_OPERATORS = {
    ABS: "abs",
    ROOT: "sqrt",
    LN: "log",
    EXP: "exp",
    ROUND: "round",
    ROUNDUP: "ceiling",
    ROUNDDOWN: "floor"
};

Blockly.Whalesong.TRIGONOMETRIC_OPERATORS = {
    SIN: "sin",
    COS: "cos",
    TAN: "tan",
    ASIN: "asin",
    ACOS: "acos",
    ATAN: "atan"
};

Blockly.Whalesong.math_constant = function() {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  var constant = this.getTitleValue('CONSTANT');
  if(constant === "GOLDEN_RATIO") {
    var code = Blockly.Whalesong.ws_apply('/', Blockly.Whalesong.ws_apply('+', 1, Blockly.Whalesong.ws_apply('sqrt', 5)), 2);
    return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
  } else {
    return Blockly.Whalesong.math_constant.CONSTANTS[constant];
  }

};

Blockly.Whalesong.math_constant.CONSTANTS = {
  PI: ['Math.PI', Blockly.Whalesong.ORDER_MEMBER],
  E: ['Math.E', Blockly.Whalesong.ORDER_MEMBER],
  SQRT2: ['Math.SQRT2', Blockly.Whalesong.ORDER_MEMBER],
  SQRT1_2: ['Math.SQRT1_2', Blockly.Whalesong.ORDER_MEMBER],
  INFINITY: ['Infinity', Blockly.Whalesong.ORDER_ATOMIC]
};


/**
 * I think that it's a bad idea to special-case prime and generate more complicated code for it.
 * I'm just going to add it as a function to the Whalesong runtime
 */
Blockly.Whalesong.math_number_property = function() {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  var number_to_check = Blockly.Whalesong.valueToCode(this, 'NUMBER_TO_CHECK',
      Blockly.Whalesong.ORDER_FUNCTION_CALL) || 'NaN';
  var dropdown_property = this.getTitleValue('PROPERTY');
  var code;
  if (dropdown_property == 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    return Blockly.Whalesong.not_implemented();
  }
  switch (dropdown_property) {
    case 'EVEN':
      code = Blockly.Whalesong.ws_apply("even?", number_to_check);
      break;
    case 'ODD':
      code = Blockly.Whalesong.ws_apply("odd?", number_to_check);
      break;
    case 'WHOLE':
      code = Blockly.Whalesong.ws_apply("equal?",
                                        Blockly.Whalesong.ws_apply("floor", number_to_check),
                                        Blockly.Whalesong.ws_apply("ceiling", number_to_check));
      break;
    case 'POSITIVE':
      code = Blockly.Whalesong.ws_apply(">", number_to_check, 0);
      break;
    case 'NEGATIVE':
      code = Blockly.Whalesong.ws_apply("<", number_to_check, 0);
      break;
    case 'DIVISIBLE_BY':
      var divisor = Blockly.Whalesong.valueToCode(this, 'DIVISOR',
          Blockly.Whalesong.ORDER_FUNCTION_CALL) || 'NaN';
      code = Blockly.Whalesong.ws_apply("equal?", Blockly.Whalesong.ws_apply("remainder", number_to_check, divisor), 0);
      break;
  }
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.math_change = function() {
  // Add to a variable in place.
  var argument0 = Blockly.Whalesong.valueToCode(this, 'DELTA',
      Blockly.Whalesong.ORDER_ADDITION) || '0';
  var varName = Blockly.Whalesong.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' = (typeof ' + varName + ' == \'number\' ? ' + varName +
      ' : 0) + ' + argument0 + ';\n';
};

// Rounding functions have a single operand.
Blockly.Whalesong.math_round = Blockly.Whalesong.math_single;
// Trigonometry functions have a single operand.
Blockly.Whalesong.math_trig = Blockly.Whalesong.math_single;

Blockly.Whalesong.math_on_list = function() {
  // Math functions for lists.
  var func = this.getTitleValue('OP');
  var list, code;
  switch (func) {
    case 'SUM':
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_MEMBER) || '[]';
      return Blockly.Whalesong.not_implemented()
      break;
    case 'MIN':
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_COMMA) || '[]';
      code = Blockly.Whalesong.ws_apply('apply', Blockly.Whalesong.ws_prim('min'), list);
      break;
    case 'MAX':
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_COMMA) || '[]';
      code = Blockly.Whalesong.ws_apply('apply', Blockly.Whalesong.ws_prim('max'), list);
      break;
    case 'AVERAGE':
      // math_median([null,null,1,3]) == 2.0.
      return Blockly.Whalesong.not_implemented();
      /*
      if (!Blockly.Whalesong.definitions_['math_mean']) {
        var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
            'math_mean', Blockly.Generator.NAME_TYPE);
        Blockly.Whalesong.math_on_list.math_mean = functionName;
        var func = [];
        func.push('function ' + functionName + '(myList) {');
        func.push('  return myList.reduce(function(x, y) {return x + y;}) / ' +
                  'myList.length;');
        func.push('}');
        Blockly.Whalesong.definitions_['math_mean'] = func.join('\n');
      }
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_NONE) || '[]';
      code = Blockly.Whalesong.math_on_list.math_mean + '(' + list + ')';
      */
      break;
    case 'MEDIAN':      
      // math_median([null,null,1,3]) == 2.0.
      return Blockly.Whalesong.not_implemented();
      /* 
      if (!Blockly.Whalesong.definitions_['math_median']) {
        var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
            'math_median', Blockly.Generator.NAME_TYPE);
        Blockly.Whalesong.math_on_list.math_median = functionName;
        var func = [];
        func.push('function ' + functionName + '(myList) {');
        func.push('  var localList = myList.filter(function (x) ' +
                  '{return typeof x == \'number\';});');
        func.push('  if (!localList.length) return null;');
        func.push('  localList.sort(function(a, b) {return b - a;});');
        func.push('  if (localList.length % 2 == 0) {');
        func.push('    return (localList[localList.length / 2 - 1] + ' +
                  'localList[localList.length / 2]) / 2;');
        func.push('  } else {');
        func.push('    return localList[(localList.length - 1) / 2];');
        func.push('  }');
        func.push('}');
        Blockly.Whalesong.definitions_['math_median'] = func.join('\n');
      }
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_NONE) || '[]';
      code = Blockly.Whalesong.math_on_list.math_median + '(' + list + ')';
      */
      break;
    case 'MODE':
      return Blockly.Whalesong.not_implemented();
      /* 
      if (!Blockly.Whalesong.definitions_['math_modes']) {
        var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
            'math_modes', Blockly.Generator.NAME_TYPE);
        Blockly.Whalesong.math_on_list.math_modes = functionName;
        // As a list of numbers can contain more than one mode,
        // the returned result is provided as an array.
        // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1].
        var func = [];
        func.push('function ' + functionName + '(values) {');
        func.push('  var modes = [];');
        func.push('  var counts = [];');
        func.push('  var maxCount = 0;');
        func.push('  for (var i = 0; i < values.length; i++) {');
        func.push('    var value = values[i];');
        func.push('    var found = false;');
        func.push('    var thisCount;');
        func.push('    for (var j = 0; j < counts.length; j++) {');
        func.push('      if (counts[j][0] === value) {');
        func.push('        thisCount = ++counts[j][1];');
        func.push('        found = true;');
        func.push('        break;');
        func.push('      }');
        func.push('    }');
        func.push('    if (!found) {');
        func.push('      counts.push([value, 1]);');
        func.push('      thisCount = 1;');
        func.push('    }');
        func.push('    maxCount = Math.max(thisCount, maxCount);');
        func.push('  }');
        func.push('  for (var j = 0; j < counts.length; j++) {');
        func.push('    if (counts[j][1] == maxCount) {');
        func.push('        modes.push(counts[j][0]);');
        func.push('    }');
        func.push('  }');
        func.push('  return modes;');
        func.push('}');
        Blockly.Whalesong.definitions_['math_modes'] = func.join('\n');
      }
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_NONE) || '[]';
      code = Blockly.Whalesong.math_on_list.math_modes + '(' + list + ')';
      */
      break;
    case 'STD_DEV':
      return Blockly.Whalesong.not_implemented();
      /* 
      if (!Blockly.Whalesong.definitions_['math_standard_deviation']) {
        var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
            'math_standard_deviation', Blockly.Generator.NAME_TYPE);
        Blockly.Whalesong.math_on_list.math_standard_deviation = functionName;
        var func = [];
        func.push('function ' + functionName + '(numbers) {');
        func.push('  var n = numbers.length;');
        func.push('  if (!n) return null;');
        func.push('  var mean = numbers.reduce(function(x, y) ' +
                  '{return x + y;}) / n;');
        func.push('  var variance = 0;');
        func.push('  for (var j = 0; j < n; j++) {');
        func.push('    variance += Math.pow(numbers[j] - mean, 2);');
        func.push('  }');
        func.push('  variance = variance / n;');
        func.push('  return Math.sqrt(variance);');
        func.push('}');
        Blockly.Whalesong.definitions_['math_standard_deviation'] =
            func.join('\n');
      }
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_NONE) || '[]';
      code = Blockly.Whalesong.math_on_list.math_standard_deviation +
          '(' + list + ')';
      */
      break;
    case 'RANDOM':
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_NONE) || '[]';
      code = Blockly.Whalesong.ws_apply('list-ref', list, 
					Blockly.Whalesong.ws_apply('random', 
								   Blockly.Whalesong.ws_apply('length', list)));
      break;
    default:
      return Blockly.Whalesong.not_implemented;
  }
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.math_modulo = function() {
  // Remainder computation.
  var argument0 = Blockly.Whalesong.valueToCode(this, 'DIVIDEND',
      Blockly.Whalesong.ORDER_FUNCTION_CALL) || '0';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'DIVISOR',
      Blockly.Whalesong.ORDER_FUNCTION_CALL) || '0';
  var code = Blockly.Whalesong.ws_apply("modulo", argument0, argument1);
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.math_constrain = function() {
  // Constrain a number between two limits.
  var argument0 = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_FUNCTION_CALL) || '0';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'LOW',
      Blockly.Whalesong.ORDER_FUNCTION_CALL) || '0';
  var argument2 = Blockly.Whalesong.valueToCode(this, 'HIGH',
      Blockly.Whalesong.ORDER_FUNCTION_CALL) || 'Infinity';
  var code = Blockly.Whalesong.ws_apply('min', Blockly.Whalesong.ws_apply('max', argument0, argument1), argument2);
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.math_random_int = function() {
  // Random integer between [X] and [Y].
  var argument0 = Blockly.Whalesong.valueToCode(this, 'FROM',
      Blockly.Whalesong.ORDER_COMMA) || '0';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'TO',
      Blockly.Whalesong.ORDER_COMMA) || '0';
  return [Blockly.Whalesong.ws_apply("random", argument0, argument1), Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.math_random_float = function() {
  // Random fraction between 0 and 1.
  return [Blockly.Whalesong.ws_apply("random"), Blockly.Whalesong.ORDER_FUNCTION_CALL];
};
/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Whalesong for procedure blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Whalesong.procedures = {};

Blockly.Whalesong.procedures_defreturn = function() {
  // Define a procedure with a return value.
  var funcName = Blockly.Whalesong.variableDB_.getName(
      this.getTitleValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.Whalesong.statementToCode(this, 'STACK');
  if (Blockly.Whalesong.INFINITE_LOOP_TRAP) {
    branch = Blockly.Whalesong.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + this.id + '\'') + branch;
  }
  var returnValue = Blockly.Whalesong.valueToCode(this, 'RETURN',
      Blockly.Whalesong.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = '  return ' + returnValue + ';\n';
  }
  var args = [];
  for (var x = 0; x < this.arguments_.length; x++) {
    args[x] = Blockly.Whalesong.variableDB_.getName(this.arguments_[x],
        Blockly.Variables.NAME_TYPE);
  }
  var code = 'function ' + funcName + '(' + args.join(', ') + ') {\n' +
      branch + returnValue + '}';
  code = Blockly.Whalesong.scrub_(this, code);
  Blockly.Whalesong.definitions_[funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.Whalesong.procedures_defnoreturn =
    Blockly.Whalesong.procedures_defreturn;

Blockly.Whalesong.procedures_callreturn = function() {
  // Call a procedure with a return value.
  var funcName = Blockly.Whalesong.variableDB_.getName(
      this.getTitleValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var x = 0; x < this.arguments_.length; x++) {
    args[x] = Blockly.Whalesong.valueToCode(this, 'ARG' + x,
        Blockly.Whalesong.ORDER_COMMA) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.procedures_callnoreturn = function() {
  // Call a procedure with no return value.
  var funcName = Blockly.Whalesong.variableDB_.getName(
      this.getTitleValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var x = 0; x < this.arguments_.length; x++) {
    args[x] = Blockly.Whalesong.valueToCode(this, 'ARG' + x,
        Blockly.Whalesong.ORDER_COMMA) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ');\n';
  return code;
};

Blockly.Whalesong.procedures_ifreturn = function() {
  // Conditionally return value from a procedure.
  var condition = Blockly.Whalesong.valueToCode(this, 'CONDITION',
      Blockly.Whalesong.ORDER_NONE) || 'false';
  var code = 'if (' + condition + ') {\n';
  if (this.hasReturnValue_) {
    var value = Blockly.Whalesong.valueToCode(this, 'VALUE',
        Blockly.Whalesong.ORDER_NONE) || 'null';
    code += '  return ' + value + ';\n';
  } else {
    code += '  return;\n';
  }
  code += '}\n';
  return code;
};
/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Whalesong for text blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Whalesong.text = {};

Blockly.Whalesong.text = function() {
  // Text value.
  var code = Blockly.Whalesong.quote_(this.getTitleValue('TEXT'));
  return [code, Blockly.Whalesong.ORDER_ATOMIC];
};

Blockly.Whalesong.text_join = function() {
  // Create a string made up of any number of elements of any type.
  var code;
  if (this.itemCount_ == 0) {
    return ['\'\'', Blockly.Whalesong.ORDER_ATOMIC];
  } else if (this.itemCount_ == 1) {
    var argument0 = Blockly.Whalesong.valueToCode(this, 'ADD0',
        Blockly.Whalesong.ORDER_NONE) || '\'\'';
    code = 'String(' + argument0 + ')';
    return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
  } else if (this.itemCount_ == 2) {
    var argument0 = Blockly.Whalesong.valueToCode(this, 'ADD0',
        Blockly.Whalesong.ORDER_NONE) || '\'\'';
    var argument1 = Blockly.Whalesong.valueToCode(this, 'ADD1',
        Blockly.Whalesong.ORDER_NONE) || '\'\'';
    code = 'String(' + argument0 + ') + String(' + argument1 + ')';
    return [code, Blockly.Whalesong.ORDER_ADDITION];
  } else {
    code = new Array(this.itemCount_);
    for (var n = 0; n < this.itemCount_; n++) {
      code[n] = Blockly.Whalesong.valueToCode(this, 'ADD' + n,
          Blockly.Whalesong.ORDER_COMMA) || '\'\'';
    }
    code = '[' + code.join(',') + '].join(\'\')';
    return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
  }
};

Blockly.Whalesong.text_append = function() {
  // Append to a variable in place.
  var varName = Blockly.Whalesong.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Whalesong.valueToCode(this, 'TEXT',
      Blockly.Whalesong.ORDER_NONE) || '\'\'';
  return varName + ' = String(' + varName + ') + String(' + argument0 + ');\n';
};

Blockly.Whalesong.text_length = function() {
  // String length.
  var argument0 = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_FUNCTION_CALL) || '\'\'';
  return [argument0 + '.length', Blockly.Whalesong.ORDER_MEMBER];
};

Blockly.Whalesong.text_isEmpty = function() {
  // Is the string null?
  var argument0 = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_MEMBER) || '\'\'';
  return ['!' + argument0, Blockly.Whalesong.ORDER_LOGICAL_NOT];
};

Blockly.Whalesong.text_indexOf = function() {
  // Search the text for a substring.
  var operator = this.getTitleValue('END') == 'FIRST' ?
      'indexOf' : 'lastIndexOf';
  var argument0 = Blockly.Whalesong.valueToCode(this, 'FIND',
      Blockly.Whalesong.ORDER_NONE) || '\'\'';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_MEMBER) || '\'\'';
  var code = argument1 + '.' + operator + '(' + argument0 + ') + 1';
  return [code, Blockly.Whalesong.ORDER_MEMBER];
};

Blockly.Whalesong.text_charAt = function() {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  var where = this.getTitleValue('WHERE') || 'FROM_START';
  var at = Blockly.Whalesong.valueToCode(this, 'AT',
      Blockly.Whalesong.ORDER_UNARY_NEGATION) || '1';
  var text = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_MEMBER) || '\'\'';
  switch (where) {
    case 'FIRST':
      var code = text + '.charAt(0)';
      return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
    case 'LAST':
      var code = text + '.slice(-1)';
      return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
    case 'FROM_START':
      // Blockly uses one-based indicies.
      if (at.match(/^-?\d+$/)) {
        // If the index is a naked number, decrement it right now.
        at = parseInt(at, 10) - 1;
      } else {
        // If the index is dynamic, decrement it in code.
        at += ' - 1';
      }
      var code = text + '.charAt(' + at + ')';
      return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
    case 'FROM_END':
      var code = text + '.slice(-' + at + ').charAt(0)';
      return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
    case 'RANDOM':
      if (!Blockly.Whalesong.definitions_['text_random_letter']) {
        var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
            'text_random_letter', Blockly.Generator.NAME_TYPE);
        Blockly.Whalesong.text_charAt.text_random_letter = functionName;
        var func = [];
        func.push('function ' + functionName + '(text) {');
        func.push('  var x = Math.floor(Math.random() * text.length);');
        func.push('  return text[x];');
        func.push('}');
        Blockly.Whalesong.definitions_['text_random_letter'] = func.join('\n');
      }
      code = Blockly.Whalesong.text_charAt.text_random_letter +
          '(' + text + ')';
      return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
  }
  throw 'Unhandled option (text_charAt).';
};

Blockly.Whalesong.text_getSubstring = function() {
  // Get substring.
  var text = Blockly.Whalesong.valueToCode(this, 'STRING',
      Blockly.Whalesong.ORDER_MEMBER) || '[]';
  var where1 = this.getTitleValue('WHERE1');
  var where2 = this.getTitleValue('WHERE2');
  var at1 = Blockly.Whalesong.valueToCode(this, 'AT1',
      Blockly.Whalesong.ORDER_NONE) || '1';
  var at2 = Blockly.Whalesong.valueToCode(this, 'AT2',
      Blockly.Whalesong.ORDER_NONE) || '1';
  if (where1 == 'FIRST' && where2 == 'LAST') {
    var code = text;
  } else {
    if (!Blockly.Whalesong.definitions_['text_get_substring']) {
      var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
          'text_get_substring', Blockly.Generator.NAME_TYPE);
      Blockly.Whalesong.text_getSubstring.func = functionName;
      var func = [];
      func.push('function ' + functionName +
          '(text, where1, at1, where2, at2) {');
      func.push('  function getAt(where, at) {');
      func.push('    if (where == \'FROM_START\') {');
      func.push('      at--;');
      func.push('    } else if (where == \'FROM_END\') {');
      func.push('      at = text.length - at;');
      func.push('    } else if (where == \'FIRST\') {');
      func.push('      at = 0;');
      func.push('    } else if (where == \'LAST\') {');
      func.push('      at = text.length - 1;');
      func.push('    } else {');
      func.push('      throw \'Unhandled option (text_getSubstring).\';');
      func.push('    }');
      func.push('    return at;');
      func.push('  }');
      func.push('  at1 = getAt(where1, at1);');
      func.push('  at2 = getAt(where2, at2) + 1;');
      func.push('  return text.slice(at1, at2);');
      func.push('}');
      Blockly.Whalesong.definitions_['text_get_substring'] =
          func.join('\n');
    }
    var code = Blockly.Whalesong.text_getSubstring.func + '(' + text + ', \'' +
        where1 + '\', ' + at1 + ', \'' + where2 + '\', ' + at2 + ')';
  }
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.text_changeCase = function() {
  // Change capitalization.
  var mode = this.getTitleValue('CASE');
  var operator = Blockly.Whalesong.text_changeCase.OPERATORS[mode];
  var code;
  if (operator) {
    // Upper and lower case are functions built into Whalesong.
    var argument0 = Blockly.Whalesong.valueToCode(this, 'TEXT',
        Blockly.Whalesong.ORDER_MEMBER) || '\'\'';
    code = argument0 + operator;
  } else {
    if (!Blockly.Whalesong.definitions_['text_toTitleCase']) {
      // Title case is not a native Whalesong function.  Define one.
      var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
          'text_toTitleCase', Blockly.Generator.NAME_TYPE);
      Blockly.Whalesong.text_changeCase.toTitleCase = functionName;
      var func = [];
      func.push('function ' + functionName + '(str) {');
      func.push('  return str.replace(/\\S+/g,');
      func.push('      function(txt) {return txt[0].toUpperCase() + ' +
                'txt.substring(1).toLowerCase();});');
      func.push('}');
      Blockly.Whalesong.definitions_['text_toTitleCase'] = func.join('\n');
    }
    var argument0 = Blockly.Whalesong.valueToCode(this, 'TEXT',
        Blockly.Whalesong.ORDER_NONE) || '\'\'';
    code = Blockly.Whalesong.text_changeCase.toTitleCase +
        '(' + argument0 + ')';
  }
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.text_changeCase.OPERATORS = {
  UPPERCASE: '.toUpperCase()',
  LOWERCASE: '.toLowerCase()',
  TITLECASE: null
};

Blockly.Whalesong.text_trim = function() {
  // Trim spaces.
  var mode = this.getTitleValue('MODE');
  var operator = Blockly.Whalesong.text_trim.OPERATORS[mode];
  var argument0 = Blockly.Whalesong.valueToCode(this, 'TEXT',
      Blockly.Whalesong.ORDER_MEMBER) || '\'\'';
  return [argument0 + operator, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.text_trim.OPERATORS = {
  LEFT: '.trimLeft()',
  RIGHT: '.trimRight()',
  BOTH: '.trim()'
};

Blockly.Whalesong.text_print = function() {
  // Print statement.
  var argument0 = Blockly.Whalesong.valueToCode(this, 'TEXT',
      Blockly.Whalesong.ORDER_NONE) || '\'\'';
  return 'window.alert(' + argument0 + ');\n';
};

Blockly.Whalesong.text_prompt = function() {
  // Prompt function.
  var msg = Blockly.Whalesong.quote_(this.getTitleValue('TEXT'));
  var code = 'window.prompt(' + msg + ')';
  var toNumber = this.getTitleValue('TYPE') == 'NUMBER';
  if (toNumber) {
    code = 'window.parseFloat(' + code + ')';
  }
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};
/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Whalesong for variable blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Whalesong.variables = {};

Blockly.Whalesong.variables_get = function() {
  // Variable getter.
  var code = Blockly.Whalesong.variableDB_.getName(this.getTitleValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return [code, Blockly.Whalesong.ORDER_ATOMIC];
};

Blockly.Whalesong.variables_set = function() {
  // Variable setter.
  var argument0 = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Whalesong.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' = ' + argument0 + ';\n';
};
