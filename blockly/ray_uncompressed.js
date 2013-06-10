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
 * @fileoverview Helper functions for generating Ray for blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Ray = Blockly.Generator.get('Ray');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
Blockly.Ray.addReservedWords(
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
Blockly.Ray.ORDER_ATOMIC = 0;         // 0 "" ...
Blockly.Ray.ORDER_MEMBER = 1;         // . []
Blockly.Ray.ORDER_NEW = 1;            // new
Blockly.Ray.ORDER_FUNCTION_CALL = 2;  // ()
Blockly.Ray.ORDER_INCREMENT = 3;      // ++
Blockly.Ray.ORDER_DECREMENT = 3;      // --
Blockly.Ray.ORDER_LOGICAL_NOT = 4;    // !
Blockly.Ray.ORDER_BITWISE_NOT = 4;    // ~
Blockly.Ray.ORDER_UNARY_PLUS = 4;     // +
Blockly.Ray.ORDER_UNARY_NEGATION = 4; // -
Blockly.Ray.ORDER_TYPEOF = 4;         // typeof
Blockly.Ray.ORDER_VOID = 4;           // void
Blockly.Ray.ORDER_DELETE = 4;         // delete
Blockly.Ray.ORDER_MULTIPLICATION = 5; // *
Blockly.Ray.ORDER_DIVISION = 5;       // /
Blockly.Ray.ORDER_MODULUS = 5;        // %
Blockly.Ray.ORDER_ADDITION = 6;       // +
Blockly.Ray.ORDER_SUBTRACTION = 6;    // -
Blockly.Ray.ORDER_BITWISE_SHIFT = 7;  // << >> >>>
Blockly.Ray.ORDER_RELATIONAL = 8;     // < <= > >=
Blockly.Ray.ORDER_IN = 8;             // in
Blockly.Ray.ORDER_INSTANCEOF = 8;     // instanceof
Blockly.Ray.ORDER_EQUALITY = 9;       // == != === !==
Blockly.Ray.ORDER_BITWISE_AND = 10;   // &
Blockly.Ray.ORDER_BITWISE_XOR = 11;   // ^
Blockly.Ray.ORDER_BITWISE_OR = 12;    // |
Blockly.Ray.ORDER_LOGICAL_AND = 13;   // &&
Blockly.Ray.ORDER_LOGICAL_OR = 14;    // ||
Blockly.Ray.ORDER_CONDITIONAL = 15;   // ?:
Blockly.Ray.ORDER_ASSIGNMENT = 16;    // = += -= *= /= %= <<= >>= ...
Blockly.Ray.ORDER_COMMA = 17;         // ,
Blockly.Ray.ORDER_NONE = 99;          // (...)

/**
 * Arbitrary code to inject into locations that risk causing infinite loops.
 * Any instances of '%1' will be replaced by the block ID that failed.
 * E.g. '  checkTimeout(%1);\n'
 * @type ?string
 */
Blockly.Ray.INFINITE_LOOP_TRAP = null;

Blockly.Ray.not_implemented = function(name) {
    throw { message: "NOT YET IMPLEMENTED: " + name };
};

Blockly.Ray.lib_ = new Object();
Blockly.Ray.initialization_code = '\
goog.require("ray.ray");\n\
goog.require("ray.lib");\n\
';
//Blockly.Ray.lib_["r"] = 'ray.lib.initialize(new ray.ray())';
Blockly.Ray.ray_apply = function(name /*, args */) {
  var args = Array.prototype.slice.call(arguments, 1);
  var ray_name = 'r.name(' + Blockly.Ray.quote_(name) + ')';
  var ray_args = 'r.p_args(' + args.join(', ') + ')';
  return 'r.app(' + [ray_name, ray_args].join(', ') + ')';
};
/**
 * Initialise the database of variable names.
 */
Blockly.Ray.init = function() {
  // Create a dictionary of definitions to be printed before the code.
  Blockly.Ray.definitions_ = {};

  if (Blockly.Variables) {
    if (!Blockly.Ray.variableDB_) {
      Blockly.Ray.variableDB_ =
          new Blockly.Names(Blockly.Ray.RESERVED_WORDS_);
    } else {
      Blockly.Ray.variableDB_.reset();
    }

    var defvars = [];
    defvars[0] = "var _temp;";
    var variables = Blockly.Variables.allVariables();
    for (var x = 1; x <= variables.length; x++) {
      defvars[x] = 'var ' +
          Blockly.Ray.variableDB_.getName(variables[x],
          Blockly.Variables.NAME_TYPE) + ';';
    }

    Blockly.Ray.definitions_['variables'] = defvars.join('\n');
  }
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.Ray.finish = function(code) {
  // Convert the definitions dictionary into a list.
  var definitions = [];
  for (var name in Blockly.Ray.definitions_) {
    definitions.push(Blockly.Ray.definitions_[name]);
  }

  var lib = [];
  for (var lib_function in Blockly.Ray.lib_) {
    lib.push('var ' + lib_function + " = " + Blockly.Ray.lib_[lib_function] + ';');
  }
  return definitions.join('\n') + '\n\n' + lib.join('\n') + '\n\n' + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.Ray.scrubNakedValue = function(line) {
  return line + ';\n';
};

/**
 * Encode a string as a properly escaped Ray string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} Ray string.
 * @private
 */
Blockly.Ray.quote_ = function(string) {
  // TODO: This is a quick hack.  Replace with goog.string.quote
  string = string.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\\n')
                 .replace(/'/g, '\\\'');

  return '\'' + string + '\'';
};

/**
 * Common tasks for generating Ray from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The Ray code created for this block.
 * @return {string} Ray code with comments and subsequent blocks added.
 * @this {Blockly.CodeGenerator}
 * @private
 */
Blockly.Ray.scrub_ = function(block, code) {
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
 * @fileoverview Generating Ray for colour blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Ray.colour = {};

Blockly.Ray.colour_picker = function() {
  // Colour picker.
  var code = '\'' + this.getTitleValue('COLOUR') + '\'';
  return [code, Blockly.Ray.ORDER_ATOMIC];
};

Blockly.Ray.colour_random = function() {
  // Generate a random colour.
  if (!Blockly.Ray.definitions_['colour_random']) {
    var functionName = Blockly.Ray.variableDB_.getDistinctName(
        'colour_random', Blockly.Generator.NAME_TYPE);
    Blockly.Ray.colour_random.functionName = functionName;
    var func = [];
    func.push('function ' + functionName + '() {');
    func.push('  var num = Math.floor(Math.random() * Math.pow(2, 24));');
    func.push('  return \'#\' + (\'00000\' + num.toString(16)).substr(-6);');
    func.push('}');
    Blockly.Ray.definitions_['colour_random'] = func.join('\n');
  }
  var code = Blockly.Ray.colour_random.functionName + '()';
  return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.colour_rgb = function() {
  // Compose a colour from RGB components expressed as percentages.
  var red = Blockly.Ray.valueToCode(this, 'RED',
      Blockly.Ray.ORDER_COMMA) || 0;
  var green = Blockly.Ray.valueToCode(this, 'GREEN',
      Blockly.Ray.ORDER_COMMA) || 0;
  var blue = Blockly.Ray.valueToCode(this, 'BLUE',
      Blockly.Ray.ORDER_COMMA) || 0;

  if (!Blockly.Ray.definitions_['colour_rgb']) {
    var functionName = Blockly.Ray.variableDB_.getDistinctName(
        'colour_rgb', Blockly.Generator.NAME_TYPE);
    Blockly.Ray.colour_rgb.functionName = functionName;
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
    Blockly.Ray.definitions_['colour_rgb'] = func.join('\n');
  }
  var code = Blockly.Ray.colour_rgb.functionName +
      '(' + red + ', ' + green + ', ' + blue + ')';
  return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.colour_blend = function() {
  // Blend two colours together.
  var c1 = Blockly.Ray.valueToCode(this, 'COLOUR1',
      Blockly.Ray.ORDER_COMMA) || '\'#000000\'';
  var c2 = Blockly.Ray.valueToCode(this, 'COLOUR2',
      Blockly.Ray.ORDER_COMMA) || '\'#000000\'';
  var ratio = Blockly.Ray.valueToCode(this, 'RATIO',
      Blockly.Ray.ORDER_COMMA) || 0.5;

  if (!Blockly.Ray.definitions_['colour_blend']) {
    var functionName = Blockly.Ray.variableDB_.getDistinctName(
        'colour_blend', Blockly.Generator.NAME_TYPE);
    Blockly.Ray.colour_blend.functionName = functionName;
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
    Blockly.Ray.definitions_['colour_blend'] = func.join('\n');
  }
  var code = Blockly.Ray.colour_blend.functionName +
      '(' + c1 + ', ' + c2 + ', ' + ratio + ')';
  return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
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
 * @fileoverview Generating Ray for control blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Ray.control = {};

Blockly.Ray.controls_if = function() {
  // If/elseif/else condition.
  var n = 0;
  var argument = Blockly.Ray.valueToCode(this, 'IF' + n,
      Blockly.Ray.ORDER_NONE) || 'false';
  var branch = Blockly.Ray.statementToCode(this, 'DO' + n);
  var code = 'if (' + argument + ') {\n' + branch + '}';
  for (n = 1; n <= this.elseifCount_; n++) {
    argument = Blockly.Ray.valueToCode(this, 'IF' + n,
        Blockly.Ray.ORDER_NONE) || 'false';
    branch = Blockly.Ray.statementToCode(this, 'DO' + n);
    code += ' else if (' + argument + ') {\n' + branch + '}';
  }
  if (this.elseCount_) {
    branch = Blockly.Ray.statementToCode(this, 'ELSE');
    code += ' else {\n' + branch + '}';
  }
  return code + '\n';
};

Blockly.Ray.controls_repeat = function() {
  // Repeat n times.
  var repeats = Number(this.getTitleValue('TIMES'));
  var branch = Blockly.Ray.statementToCode(this, 'DO');
  if (Blockly.Ray.INFINITE_LOOP_TRAP) {
    branch = Blockly.Ray.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + this.id + '\'') + branch;
  }
  var loopVar = Blockly.Ray.variableDB_.getDistinctName(
      'count', Blockly.Variables.NAME_TYPE);
  var code = 'for (var ' + loopVar + ' = 0; ' +
      loopVar + ' < ' + repeats + '; ' +
      loopVar + '++) {\n' +
      branch + '}\n';
  return code;
};

Blockly.Ray.controls_whileUntil = function() {
  // Do while/until loop.
  var until = this.getTitleValue('MODE') == 'UNTIL';
  var argument0 = Blockly.Ray.valueToCode(this, 'BOOL',
      until ? Blockly.Ray.ORDER_LOGICAL_NOT :
      Blockly.Ray.ORDER_NONE) || 'false';
  var branch = Blockly.Ray.statementToCode(this, 'DO');
  if (Blockly.Ray.INFINITE_LOOP_TRAP) {
    branch = Blockly.Ray.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + this.id + '\'') + branch;
  }
  if (until) {
    argument0 = '!' + argument0;
  }
  return 'while (' + argument0 + ') {\n' + branch + '}\n';
};

Blockly.Ray.controls_for = function() {
  // For loop.
  var variable0 = Blockly.Ray.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Ray.valueToCode(this, 'FROM',
      Blockly.Ray.ORDER_ASSIGNMENT) || '0';
  var argument1 = Blockly.Ray.valueToCode(this, 'TO',
      Blockly.Ray.ORDER_ASSIGNMENT) || '0';
  var branch = Blockly.Ray.statementToCode(this, 'DO');
  if (Blockly.Ray.INFINITE_LOOP_TRAP) {
    branch = Blockly.Ray.INFINITE_LOOP_TRAP.replace(/%1/g,
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
      var startVar = Blockly.Ray.variableDB_.getDistinctName(
          variable0 + '_start', Blockly.Variables.NAME_TYPE);
      code += 'var ' + startVar + ' = ' + argument0 + ';\n';
    }
    var endVar = argument1;
    if (!argument1.match(/^\w+$/) && !argument1.match(/^-?\d+(\.\d+)?$/)) {
      var endVar = Blockly.Ray.variableDB_.getDistinctName(
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

Blockly.Ray.controls_forEach = function() {
  // For each loop.
  var variable0 = Blockly.Ray.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Ray.valueToCode(this, 'LIST',
      Blockly.Ray.ORDER_ASSIGNMENT) || '[]';
  var branch = Blockly.Ray.statementToCode(this, 'DO');
  if (Blockly.Ray.INFINITE_LOOP_TRAP) {
    branch = Blockly.Ray.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + this.id + '\'') + branch;
  }
  var code;
  var indexVar = Blockly.Ray.variableDB_.getDistinctName(
      variable0 + '_index', Blockly.Variables.NAME_TYPE);
  if (argument0.match(/^\w+$/)) {
    branch = '  ' + variable0 + ' = ' + argument0 + '[' + indexVar + '];\n' +
        branch;
    code = 'for (var ' + indexVar + ' in  ' + argument0 + ') {\n' +
        branch + '}\n';
  } else {
    // The list appears to be more complicated than a simple variable.
    // Cache it to a variable to prevent repeated look-ups.
    var listVar = Blockly.Ray.variableDB_.getDistinctName(
        variable0 + '_list', Blockly.Variables.NAME_TYPE);
    branch = '  ' + variable0 + ' = ' + listVar + '[' + indexVar + '];\n' +
        branch;
    code = 'var ' + listVar + ' = ' + argument0 + ';\n' +
        'for (var ' + indexVar + ' in ' + listVar + ') {\n' +
        branch + '}\n';
  }
  return code;
};

Blockly.Ray.controls_flow_statements = function() {
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
 * @fileoverview Generating Ray for list blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Ray.lists = {};

Blockly.Ray.lists_create_empty = function() {
  // Create an empty list.
  return ['r.null()', Blockly.Ray.ORDER_MEMBER];
};

Blockly.Ray.lists_create_with = function() {
  // Create a list with any number of elements of any type.
  var args = new Array(this.itemCount_);
  for (var n = 0; n < this.itemCount_; n++) {
    args[n] = Blockly.Ray.valueToCode(this, 'ADD' + n,
        Blockly.Ray.ORDER_COMMA) || 'r.null()';
  }
  var code = Blockly.Ray.ray_apply.apply(null, ['list'].concat(args));
  return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.lists_repeat = function() {
  /*
  var argument0 = Blockly.Ray.valueToCode(this, 'ITEM',
      Blockly.Ray.ORDER_COMMA) || 'null';
  var argument1 = Blockly.Ray.valueToCode(this, 'NUM',
      Blockly.Ray.ORDER_COMMA) || '0';
   */
  return Blockly.Ray.not_implemented();
};

Blockly.Ray.lists_length = function() {
  // List length.
  var argument0 = Blockly.Ray.valueToCode(this, 'VALUE',
      Blockly.Ray.ORDER_COMMA) || '\'\'';
  return [Blockly.Ray.ray_apply('length', argument0), Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.lists_isEmpty = function() {
  // Is the list empty?
  var argument0 = Blockly.Ray.valueToCode(this, 'VALUE',
      Blockly.Ray.ORDER_COMMA) || '[]';
  return [Blockly.Ray.ray_apply('empty?', argument0), Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.lists_indexOf = function() {
  // Find an item in the list.
  return Blockly.Ray.not_implemented();
};

Blockly.Ray.lists_getIndex = function() {
  // Get element at index.
  var mode = this.getTitleValue('MODE') || 'GET';
  var where = this.getTitleValue('WHERE') || 'FROM_START';
  var at = Blockly.Ray.valueToCode(this, 'AT',
      Blockly.Ray.ORDER_COMMA) || '1';
  var list = Blockly.Ray.valueToCode(this, 'VALUE',
      Blockly.Ray.ORDER_COMMA) || '[]';
  if(mode === 'GET' && where === 'FROM_START') {
    return [Blockly.Ray.ray_apply('list-ref', list, at),
	    Blockly.Ray.ORDER_FUNCTION_CALL];
  } else {
    return Blockly.Ray.not_implemented();
  }
};

Blockly.Ray.lists_setIndex = function() {
  // Set element at index.
  return Blockly.Ray.not_implemented();
};

Blockly.Ray.lists_getSublist = function() {
  // Get sublist.
  return Blockly.Ray.not_implemented();
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
 * @fileoverview Generating Ray for logic blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

Blockly.Ray.logic = {};

Blockly.Ray.logic_compare = function() {
  // Comparison operator.
  var mode = this.getTitleValue('OP');
  var operator = Blockly.Ray.logic_compare.OPERATORS[mode];
  var argument0 = Blockly.Ray.valueToCode(this, 'A', order) || '0';
  var argument1 = Blockly.Ray.valueToCode(this, 'B', order) || '0';
  var code;
  switch(mode) {
    case NEQ:
      code = Blockly.Ray.ray_apply('not', Blockly.Ray.ray_apply('=', argument0, argument1));
      break;
    case EQ:
    case LT:
    case LTE:
    case GT:
    case GTE:
      code = Blockly.Ray.ray_apply(Blockly.Ray.logic_compare[mode], argument0, argument1);
      break;
    default:
      return Blockly.Ray.not_implemented("Unsupported operator for comparison!");
      break;
  }
  return [code, Blockly.Ray.ORDER_COMMA];
};

Blockly.Ray.logic_compare.OPERATORS = {
  EQ: '==',
  NEQ: '!=',
  LT: '<',
  LTE: '<=',
  GT: '>',
  GTE: '>='
};

Blockly.Ray.logic_operation = function() {
  // Operations 'and', 'or'.
  var mode = this.getTitleValue('OP').toLocaleLowerCase();
  var argument0 = Blockly.Ray.valueToCode(this, 'A', order) || 'false';
  var argument1 = Blockly.Ray.valueToCode(this, 'B', order) || 'false';
  return [Blockly.Ray.ray_apply(mode, argument0, argument1), Blockly.Ray.ORDER_COMMA];
};

Blockly.Ray.logic_negate = function() {
  // Negation
  var argument0 = Blockly.Ray.valueToCode(this, 'BOOL', order) ||
      'false';
  return [Blockly.Ray.ray_apply('not', argument0), Blockly.Ray.ORDER_COMMA];
};

Blockly.Ray.logic_boolean = function() {
  // Boolean values true and false.
  var b = (this.getTitleValue('BOOL') == 'TRUE') ? 'true' : 'false';
  return ['r.bool(' + b + ')', Blockly.Ray.ORDER_ATOMIC];
};

Blockly.Ray.logic_null = function() {
  // Null data type.
  return ['r.null()', Blockly.Ray.ORDER_ATOMIC];
};

Blockly.Ray.logic_ternary = function() {
  // Ternary operator.
  return Blockly.Ray.not_implemented();
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
 * @fileoverview Generating Ray for math blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

Blockly.Ray.math = {};

Blockly.Ray.math_number = function() {
  // Numeric value.
  var code = window.parseFloat(this.getTitleValue('NUM'));
  return ['r.num(' + code + ')', Blockly.Ray.ORDER_ATOMIC];
};

Blockly.Ray.math_arithmetic = function() {
  // Basic arithmetic operators, and power.
  var mode = this.getTitleValue('OP');
  var primitive_name = Blockly.Ray.math_arithmetic.BASIC_OPERATIONS[mode];
  var argument0 = Blockly.Ray.valueToCode(this, 'A', Blockly.Ray.ORDER_COMMA) || '0';
  var argument1 = Blockly.Ray.valueToCode(this, 'B', Blockly.Ray.ORDER_COMMA) || '0';
  var code = Blockly.Ray.ray_apply(primitive_name, argument0, argument1);
  return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.math_arithmetic.BASIC_OPERATIONS = {
  ADD: '+',
  MINUS: '-',
  MULTIPLY: '*',
  DIVIDE: '/',
  POWER: 'expt'
};

Blockly.Ray.math_single = function() {
  // Math operators with single operand.
  var operator = this.getTitleValue('OP');
  var code;
  var arg;
  if (operator == 'NEG') {
    // Negation is a special case given its different operator precedence.
    arg = Blockly.Ray.valueToCode(this, 'NUM',
        Blockly.Ray.ORDER_UNARY_NEGATION) || '0';
    if (arg[0] == '-') {
      // --3 is not legal in JS.
      arg = ' ' + arg;
    }
    code = '-' + arg;
    return [code, Blockly.Ray.ORDER_UNARY_NEGATION];
  }
  if (operator == 'SIN' || operator == 'COS' || operator == 'TAN') {
    arg = Blockly.Ray.valueToCode(this, 'NUM',
        Blockly.Ray.ORDER_DIVISION) || '0';
  } else {
    arg = Blockly.Ray.valueToCode(this, 'NUM',
        Blockly.Ray.ORDER_NONE) || '0';
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
      code = Blockly.Ray.ray_apply(Blockly.Ray.UNARY_OPERATORS[operator], arg);
      break;
    case 'SIN':
    case 'COS':
    case 'TAN':
      code = Blockly.Ray.ray_apply(Blockly.Ray.TRIGONOMETRIC_OPERATORS[operator], arg);
      break;
    case 'ASIN':
    case 'ACOS':
    case 'ATAN':
      code = Blockly.Ray.ray_apply(Blockly.Ray.TRIGONOMETRIC_OPERATORS[operator], arg);
      break;
    case 'POW10':
    case 'LOG10':
    default:
      throw 'Unknown math operator: ' + operator;
  }
  return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.UNARY_OPERATORS = {
    ABS: "abs",
    ROOT: "sqrt",
    LN: "log",
    EXP: "exp",
    ROUND: "round",
    ROUNDUP: "ceiling",
    ROUNDDOWN: "floor"
};

Blockly.Ray.TRIGONOMETRIC_OPERATORS = {
    SIN: "sin",
    COS: "cos",
    TAN: "tan",
    ASIN: "asin",
    ACOS: "acos",
    ATAN: "atan"
};

Blockly.Ray.math_constant = function() {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  var constant = this.getTitleValue('CONSTANT');
  if(constant === "GOLDEN_RATIO") {
    var code = Blockly.Ray.ray_apply('/', Blockly.Ray.ray_apply('+', 1, Blockly.Ray.ray_apply('sqrt', 5)), 2);
    return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
  } else {
    return Blockly.Ray.math_constant.CONSTANTS[constant];
  }

};

Blockly.Ray.math_constant.CONSTANTS = {
  PI: ['Math.PI', Blockly.Ray.ORDER_MEMBER],
  E: ['Math.E', Blockly.Ray.ORDER_MEMBER],
  SQRT2: ['Math.SQRT2', Blockly.Ray.ORDER_MEMBER],
  SQRT1_2: ['Math.SQRT1_2', Blockly.Ray.ORDER_MEMBER],
  INFINITY: ['Infinity', Blockly.Ray.ORDER_ATOMIC]
};


/**
 * I think that it's a bad idea to special-case prime and generate more complicated code for it.
 * I'm just going to add it as a function to the Ray runtime
 */
Blockly.Ray.math_number_property = function() {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  var number_to_check = Blockly.Ray.valueToCode(this, 'NUMBER_TO_CHECK',
      Blockly.Ray.ORDER_FUNCTION_CALL) || 'NaN';
  var dropdown_property = this.getTitleValue('PROPERTY');
  var code;
  if (dropdown_property == 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    return Blockly.Ray.not_implemented();
  }
  switch (dropdown_property) {
    case 'EVEN':
      code = Blockly.Ray.ray_apply("even?", number_to_check);
      break;
    case 'ODD':
      code = Blockly.Ray.ray_apply("odd?", number_to_check);
      break;
    case 'WHOLE':
      code = Blockly.Ray.ray_apply("equal?",
                                        Blockly.Ray.ray_apply("floor", number_to_check),
                                        Blockly.Ray.ray_apply("ceiling", number_to_check));
      break;
    case 'POSITIVE':
      code = Blockly.Ray.ray_apply(">", number_to_check, 0);
      break;
    case 'NEGATIVE':
      code = Blockly.Ray.ray_apply("<", number_to_check, 0);
      break;
    case 'DIVISIBLE_BY':
      var divisor = Blockly.Ray.valueToCode(this, 'DIVISOR',
          Blockly.Ray.ORDER_FUNCTION_CALL) || 'NaN';
      code = Blockly.Ray.ray_apply("equal?", Blockly.Ray.ray_apply("remainder", number_to_check, divisor), 0);
      break;
  }
  return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.math_change = function() {
  // Add to a variable in place.
  var argument0 = Blockly.Ray.valueToCode(this, 'DELTA',
      Blockly.Ray.ORDER_ADDITION) || '0';
  var varName = Blockly.Ray.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' = (typeof ' + varName + ' == \'number\' ? ' + varName +
      ' : 0) + ' + argument0 + ';\n';
};

// Rounding functions have a single operand.
Blockly.Ray.math_round = Blockly.Ray.math_single;
// Trigonometry functions have a single operand.
Blockly.Ray.math_trig = Blockly.Ray.math_single;

Blockly.Ray.math_on_list = function() {
  // Math functions for lists.
  var func = this.getTitleValue('OP');
  var list, code;
  switch (func) {
    case 'SUM':
      list = Blockly.Ray.valueToCode(this, 'LIST',
          Blockly.Ray.ORDER_MEMBER) || '[]';
      return Blockly.Ray.not_implemented();
      break;
    case 'MIN':
      list = Blockly.Ray.valueToCode(this, 'LIST',
          Blockly.Ray.ORDER_COMMA) || '[]';
      code = Blockly.Ray.ray_apply('apply', Blockly.Ray.ray_prim('min'), list);
      break;
    case 'MAX':
      list = Blockly.Ray.valueToCode(this, 'LIST',
          Blockly.Ray.ORDER_COMMA) || '[]';
      code = Blockly.Ray.ray_apply('apply', Blockly.Ray.ray_prim('max'), list);
      break;
    case 'AVERAGE':
      // math_median([null,null,1,3]) == 2.0.
      return Blockly.Ray.not_implemented();
      /*
      if (!Blockly.Ray.definitions_['math_mean']) {
        var functionName = Blockly.Ray.variableDB_.getDistinctName(
            'math_mean', Blockly.Generator.NAME_TYPE);
        Blockly.Ray.math_on_list.math_mean = functionName;
        var func = [];
        func.push('function ' + functionName + '(myList) {');
        func.push('  return myList.reduce(function(x, y) {return x + y;}) / ' +
                  'myList.length;');
        func.push('}');
        Blockly.Ray.definitions_['math_mean'] = func.join('\n');
      }
      list = Blockly.Ray.valueToCode(this, 'LIST',
          Blockly.Ray.ORDER_NONE) || '[]';
      code = Blockly.Ray.math_on_list.math_mean + '(' + list + ')';
      */
      break;
    case 'MEDIAN':
      // math_median([null,null,1,3]) == 2.0.
      return Blockly.Ray.not_implemented();
      /*
      if (!Blockly.Ray.definitions_['math_median']) {
        var functionName = Blockly.Ray.variableDB_.getDistinctName(
            'math_median', Blockly.Generator.NAME_TYPE);
        Blockly.Ray.math_on_list.math_median = functionName;
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
        Blockly.Ray.definitions_['math_median'] = func.join('\n');
      }
      list = Blockly.Ray.valueToCode(this, 'LIST',
          Blockly.Ray.ORDER_NONE) || '[]';
      code = Blockly.Ray.math_on_list.math_median + '(' + list + ')';
      */
      break;
    case 'MODE':
      return Blockly.Ray.not_implemented();
      /*
      if (!Blockly.Ray.definitions_['math_modes']) {
        var functionName = Blockly.Ray.variableDB_.getDistinctName(
            'math_modes', Blockly.Generator.NAME_TYPE);
        Blockly.Ray.math_on_list.math_modes = functionName;
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
        Blockly.Ray.definitions_['math_modes'] = func.join('\n');
      }
      list = Blockly.Ray.valueToCode(this, 'LIST',
          Blockly.Ray.ORDER_NONE) || '[]';
      code = Blockly.Ray.math_on_list.math_modes + '(' + list + ')';
      */
      break;
    case 'STD_DEV':
      return Blockly.Ray.not_implemented();
      /*
      if (!Blockly.Ray.definitions_['math_standard_deviation']) {
        var functionName = Blockly.Ray.variableDB_.getDistinctName(
            'math_standard_deviation', Blockly.Generator.NAME_TYPE);
        Blockly.Ray.math_on_list.math_standard_deviation = functionName;
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
        Blockly.Ray.definitions_['math_standard_deviation'] =
            func.join('\n');
      }
      list = Blockly.Ray.valueToCode(this, 'LIST',
          Blockly.Ray.ORDER_NONE) || '[]';
      code = Blockly.Ray.math_on_list.math_standard_deviation +
          '(' + list + ')';
      */
      break;
    case 'RANDOM':
      list = Blockly.Ray.valueToCode(this, 'LIST',
          Blockly.Ray.ORDER_NONE) || '[]';
      code = Blockly.Ray.ray_apply('list-ref', list,
					Blockly.Ray.ray_apply('random',
								   Blockly.Ray.ray_apply('length', list)));
      break;
    default:
      return Blockly.Ray.not_implemented();
  }
  return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.math_modulo = function() {
  // Remainder computation.
  var argument0 = Blockly.Ray.valueToCode(this, 'DIVIDEND',
      Blockly.Ray.ORDER_FUNCTION_CALL) || '0';
  var argument1 = Blockly.Ray.valueToCode(this, 'DIVISOR',
      Blockly.Ray.ORDER_FUNCTION_CALL) || '0';
  var code = Blockly.Ray.ray_apply("modulo", argument0, argument1);
  return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.math_constrain = function() {
  // Constrain a number between two limits.
  var argument0 = Blockly.Ray.valueToCode(this, 'VALUE',
      Blockly.Ray.ORDER_FUNCTION_CALL) || '0';
  var argument1 = Blockly.Ray.valueToCode(this, 'LOW',
      Blockly.Ray.ORDER_FUNCTION_CALL) || '0';
  var argument2 = Blockly.Ray.valueToCode(this, 'HIGH',
      Blockly.Ray.ORDER_FUNCTION_CALL) || 'Infinity';
  var code = Blockly.Ray.ray_apply('min', Blockly.Ray.ray_apply('max', argument0, argument1), argument2);
  return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.math_random_int = function() {
  // Random integer between [X] and [Y].
  var argument0 = Blockly.Ray.valueToCode(this, 'FROM',
      Blockly.Ray.ORDER_COMMA) || '0';
  var argument1 = Blockly.Ray.valueToCode(this, 'TO',
      Blockly.Ray.ORDER_COMMA) || '0';
  return [Blockly.Ray.ray_apply("random", argument0, argument1), Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.math_random_float = function() {
  // Random fraction between 0 and 1.
  return [Blockly.Ray.ray_apply("random"), Blockly.Ray.ORDER_FUNCTION_CALL];
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
 * @fileoverview Generating Ray for procedure blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Ray.procedures = {};

Blockly.Ray.procedures_defreturn = function() {
  // Define a procedure with a return value.
  var funcName = Blockly.Ray.variableDB_.getName(
      this.getTitleValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.Ray.statementToCode(this, 'STACK');
  if (Blockly.Ray.INFINITE_LOOP_TRAP) {
    branch = Blockly.Ray.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + this.id + '\'') + branch;
  }
  var returnValue = Blockly.Ray.valueToCode(this, 'RETURN',
      Blockly.Ray.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = '  return ' + returnValue + ';\n';
  }
  var args = [];
  for (var x = 0; x < this.arguments_.length; x++) {
    args[x] = Blockly.Ray.variableDB_.getName(this.arguments_[x],
        Blockly.Variables.NAME_TYPE);
  }
  var code = 'function ' + funcName + '(' + args.join(', ') + ') {\n' +
      branch + returnValue + '}';
  code = Blockly.Ray.scrub_(this, code);
  Blockly.Ray.definitions_[funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.Ray.procedures_defnoreturn =
    Blockly.Ray.procedures_defreturn;

Blockly.Ray.procedures_callreturn = function() {
  // Call a procedure with a return value.
  var funcName = Blockly.Ray.variableDB_.getName(
      this.getTitleValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var x = 0; x < this.arguments_.length; x++) {
    args[x] = Blockly.Ray.valueToCode(this, 'ARG' + x,
        Blockly.Ray.ORDER_COMMA) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.procedures_callnoreturn = function() {
  // Call a procedure with no return value.
  var funcName = Blockly.Ray.variableDB_.getName(
      this.getTitleValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var x = 0; x < this.arguments_.length; x++) {
    args[x] = Blockly.Ray.valueToCode(this, 'ARG' + x,
        Blockly.Ray.ORDER_COMMA) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ');\n';
  return code;
};

Blockly.Ray.procedures_ifreturn = function() {
  // Conditionally return value from a procedure.
  var condition = Blockly.Ray.valueToCode(this, 'CONDITION',
      Blockly.Ray.ORDER_NONE) || 'false';
  var code = 'if (' + condition + ') {\n';
  if (this.hasReturnValue_) {
    var value = Blockly.Ray.valueToCode(this, 'VALUE',
        Blockly.Ray.ORDER_NONE) || 'null';
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
 * @fileoverview Generating Ray for text blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Ray.text = {};

Blockly.Ray.text = function() {
  // Text value.
  var code = Blockly.Ray.quote_(this.getTitleValue('TEXT'));
  return [code, Blockly.Ray.ORDER_ATOMIC];
};

Blockly.Ray.text_join = function() {
  // Create a string made up of any number of elements of any type.
  return Blockly.Ray.not_implemented();
};

Blockly.Ray.text_append = function() {
  // Append to a variable in place.
  return Blockly.Ray.not_implemented();
  var varName = Blockly.Ray.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Ray.valueToCode(this, 'TEXT',
      Blockly.Ray.ORDER_NONE) || '\'\'';
  return varName + ' = String(' + varName + ') + String(' + argument0 + ');\n';
};

Blockly.Ray.text_length = function() {
  // String length.
  var argument0 = Blockly.Ray.valueToCode(this, 'VALUE',
      Blockly.Ray.ORDER_COMMA) || '\'\'';
  return [Blockly.Ray.ray_apply('string-length', argument0), Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.text_isEmpty = function() {
  // Is the string null?
  var argument0 = Blockly.Ray.valueToCode(this, 'VALUE',
      Blockly.Ray.ORDER_COMMA) || '\'\'';
  return [Blockly.Ray.ray_apply('=', Blockly.Ray.ray_apply('string-length', argument0), 0),
	  Blockly.Ray.ORDER_FUNCTION_CALL];
};

Blockly.Ray.text_indexOf = function() {
  // Search the text for a substring.
  return Blockly.Ray.not_implemented();
};

Blockly.Ray.text_charAt = function() {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  var where = this.getTitleValue('WHERE') || 'FROM_START';
  var at = Blockly.Ray.valueToCode(this, 'AT',
      Blockly.Ray.ORDER_UNARY_NEGATION) || '1';
  var text = Blockly.Ray.valueToCode(this, 'VALUE',
      Blockly.Ray.ORDER_COMMA) || '\'\'';
  if(where === 'FIRST') {
    return [Blockly.Ray.ray_apply('string-ref', at, text),
	    Blockly.Ray.ORDER_FUNCTION_CALL];
  } else {
    return Blockly.Ray.not_implemented();
  }
};

Blockly.Ray.text_getSubstring = function() {
  // Get substring.
  var text = Blockly.Ray.valueToCode(this, 'STRING',
      Blockly.Ray.ORDER_COMMA) || '[]';
  var where1 = this.getTitleValue('WHERE1');
  var where2 = this.getTitleValue('WHERE2');
  var at1 = Blockly.Ray.valueToCode(this, 'AT1',
      Blockly.Ray.ORDER_NONE) || '1';
  var at2 = Blockly.Ray.valueToCode(this, 'AT2',
      Blockly.Ray.ORDER_NONE) || '1';
  if(where1 === 'FROM_START' && where2 === 'FROM_START') {
    return [Blockly.Ray.ray_apply('substring', at1, at2),
	    Blockly.Ray.ORDER_FUNCTION_CALL];
  } else {
    return Blockly.Ray.not_implemented();
  }
};

Blockly.Ray.text_changeCase = function() {
  // Change capitalization.
  var mode = this.getTitleValue('CASE');
  var func = Blockly.Ray.text_changeCase.OPERATORS[mode];
  var argument0 = Blockly.Ray.text_trim(this, 'TEXT',
      Blockly.Ray.ORDER_COMMA) || '\'\'';
  if(!func) {
    return Blockly.Ray.not_implemented();
  } else {
    return [Blockly.Ray.ray_apply(func, argument0),
	    Blockly.Ray.ORDER_FUNCTION_CALL];
  }
};

Blockly.Ray.text_changeCase.OPERATORS = {
  UPPERCASE: 'string-upcase',
  LOWERCASE: 'string-downcase',
  TITLECASE: 'string-titlecase'
};

Blockly.Ray.text_trim = function() {
  // Trim spaces.
  return Blockly.Ray.not_implemented();
};

Blockly.Ray.text_trim.OPERATORS = {
  LEFT: '.trimLeft()',
  RIGHT: '.trimRight()',
  BOTH: '.trim()'
};

Blockly.Ray.text_print = function() {
  // Print statement.
  return Blockly.Ray.not_implemented();
};

Blockly.Ray.text_prompt = function() {
  // Prompt function.
  return Blockly.Ray.not_implemented();
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
 * @fileoverview Generating Ray for variable blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Ray.variables = {};

Blockly.Ray.variables_get = function() {
  // Variable getter.
  var code = Blockly.Ray.variableDB_.getName(this.getTitleValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return [code, Blockly.Ray.ORDER_ATOMIC];
};

Blockly.Ray.variables_set = function() {
  // Variable setter.
  var argument0 = Blockly.Ray.valueToCode(this, 'VALUE',
      Blockly.Ray.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Ray.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' = ' + argument0 + ';\n';
};
