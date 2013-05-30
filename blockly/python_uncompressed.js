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
 * @fileoverview Helper functions for generating Python for blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Python = Blockly.Generator.get('Python');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
Blockly.Python.addReservedWords(
    // import keyword
    // print ','.join(keyword.kwlist)
    // http://docs.python.org/reference/lexical_analysis.html#keywords
    'and,as,assert,break,class,continue,def,del,elif,else,except,exec,finally,for,from,global,if,import,in,is,lambda,not,or,pass,print,raise,return,try,while,with,yield,' +
    //http://docs.python.org/library/constants.html
    'True,False,None,NotImplemented,Ellipsis,__debug__,quit,exit,copyright,license,credits,' +
    // http://docs.python.org/library/functions.html
    'abs,divmod,input,open,staticmethod,all,enumerate,int,ord,str,any,eval,isinstance,pow,sum,basestring,execfile,issubclass,print,super,bin,file,iter,property,tuple,bool,filter,len,range,type,bytearray,float,list,raw_input,unichr,callable,format,locals,reduce,unicode,chr,frozenset,long,reload,vars,classmethod,getattr,map,repr,xrange,cmp,globals,max,reversed,zip,compile,hasattr,memoryview,round,__import__,complex,hash,min,set,apply,delattr,help,next,setattr,buffer,dict,hex,object,slice,coerce,dir,id,oct,sorted,intern');

/**
 * Order of operation ENUMs.
 * http://docs.python.org/reference/expressions.html#summary
 */
Blockly.Python.ORDER_ATOMIC = 0;            // 0 "" ...
Blockly.Python.ORDER_COLLECTION = 1;        // tuples, lists, dictionaries
Blockly.Python.ORDER_STRING_CONVERSION = 1; // `expression...`
Blockly.Python.ORDER_MEMBER = 2;            // . []
Blockly.Python.ORDER_FUNCTION_CALL = 2;     // ()
Blockly.Python.ORDER_EXPONENTIATION = 3;    // **
Blockly.Python.ORDER_UNARY_SIGN = 4;        // + -
Blockly.Python.ORDER_BITWISE_NOT = 4;       // ~
Blockly.Python.ORDER_MULTIPLICATIVE = 5;    // * / // %
Blockly.Python.ORDER_ADDITIVE = 6;          // + -
Blockly.Python.ORDER_BITWISE_SHIFT = 7;     // << >>
Blockly.Python.ORDER_BITWISE_AND = 8;       // &
Blockly.Python.ORDER_BITWISE_XOR = 9;       // ^
Blockly.Python.ORDER_BITWISE_OR = 10;       // |
Blockly.Python.ORDER_RELATIONAL = 11;       // in, not in, is, is not,
                                            //     <, <=, >, >=, <>, !=, ==
Blockly.Python.ORDER_LOGICAL_NOT = 12;      // not
Blockly.Python.ORDER_LOGICAL_AND = 13;      // and
Blockly.Python.ORDER_LOGICAL_OR = 14;       // or
Blockly.Python.ORDER_CONDITIONAL = 15;      // if else
Blockly.Python.ORDER_LAMBDA = 16;           // lambda
Blockly.Python.ORDER_NONE = 99;             // (...)

/**
 * Arbitrary code to inject into locations that risk causing infinite loops.
 * Any instances of '%1' will be replaced by the block ID that failed.
 * E.g. '  checkTimeout(%1)\n'
 * @type ?string
 */
Blockly.Python.INFINITE_LOOP_TRAP = null;

/**
 * Initialise the database of variable names.
 */
Blockly.Python.init = function() {
  // Create a dictionary of definitions to be printed before the code.
  Blockly.Python.definitions_ = {};

  if (Blockly.Variables) {
    if (!Blockly.Python.variableDB_) {
      Blockly.Python.variableDB_ =
          new Blockly.Names(Blockly.Python.RESERVED_WORDS_);
    } else {
      Blockly.Python.variableDB_.reset();
    }

    var defvars = [];
    var variables = Blockly.Variables.allVariables();
    for (var x = 0; x < variables.length; x++) {
      defvars[x] = Blockly.Python.variableDB_.getName(variables[x],
          Blockly.Variables.NAME_TYPE) + ' = None';
    }
    Blockly.Python.definitions_['variables'] = defvars.join('\n');
  }
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.Python.finish = function(code) {
  // Convert the definitions dictionary into a list.
  var imports = [];
  var definitions = [];
  for (var name in Blockly.Python.definitions_) {
    var def = Blockly.Python.definitions_[name];
    if (def.match(/^(from\s+\S+\s+)?import\s+\S+/)) {
      imports.push(def);
    } else {
      definitions.push(def);
    }
  }
  var allDefs = imports.join('\n') + '\n\n' + definitions.join('\n\n');
  return allDefs.replace(/\n\n+/g, '\n\n').replace(/\n*$/, '\n\n\n') + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.Python.scrubNakedValue = function(line) {
  return line + '\n';
};

/**
 * Encode a string as a properly escaped Python string, complete with quotes.
 * @param {string} string Text to encode.
 * @return {string} Python string.
 * @private
 */
Blockly.Python.quote_ = function(string) {
  // TODO: This is a quick hack.  Replace with goog.string.quote
  string = string.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\\n')
                 .replace(/\%/g, '\\%')
                 .replace(/'/g, '\\\'');
  return '\'' + string + '\'';
};

/**
 * Common tasks for generating Python from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The Python code created for this block.
 * @return {string} Python code with comments and subsequent blocks added.
 * @this {Blockly.CodeGenerator}
 * @private
 */
Blockly.Python.scrub_ = function(block, code) {
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
      commentCode += Blockly.Generator.prefixLines(comment, '# ') + '\n';
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var x = 0; x < block.inputList.length; x++) {
      if (block.inputList[x].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[x].connection.targetBlock();
        if (childBlock) {
          var comment = Blockly.Generator.allNestedComments(childBlock);
          if (comment) {
            commentCode += Blockly.Generator.prefixLines(comment, '# ');
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
 * @fileoverview Generating Python for text blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

Blockly.Python.text = {};

Blockly.Python.text = function() {
  // Text value.
  var code = Blockly.Python.quote_(this.getTitleValue('TEXT'));
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python.text_join = function() {
  // Create a string made up of any number of elements of any type.
  //Should we allow joining by '-' or ',' or any other characters?
  var code;
  if (this.itemCount_ == 0) {
    return ['\'\'', Blockly.Python.ORDER_ATOMIC];
  } else if (this.itemCount_ == 1) {
    var argument0 = Blockly.Python.valueToCode(this, 'ADD0',
        Blockly.Python.ORDER_NONE) || '\'\'';
    code = 'str(' + argument0 + ')';
    return [code, Blockly.Python.ORDER_FUNCTION_CALL];
  } else if (this.itemCount_ == 2) {
    var argument0 = Blockly.Python.valueToCode(this, 'ADD0',
        Blockly.Python.ORDER_NONE) || '\'\'';
    var argument1 = Blockly.Python.valueToCode(this, 'ADD1',
        Blockly.Python.ORDER_NONE) || '\'\'';
    var code = 'str(' + argument0 + ') + str(' + argument1 + ')';
    return [code, Blockly.Python.ORDER_UNARY_SIGN];
  } else {
    var code = [];
    for (var n = 0; n < this.itemCount_; n++) {
      code[n] = Blockly.Python.valueToCode(this, 'ADD' + n,
          Blockly.Python.ORDER_NONE) || '\'\'';
    }
    var tempVar = Blockly.Python.variableDB_.getDistinctName('temp_value',
        Blockly.Variables.NAME_TYPE);
    code = '\'\'.join([str(' + tempVar + ') for ' + tempVar + ' in [' +
        code.join(', ') + ']])';
    return [code, Blockly.Python.ORDER_FUNCTION_CALL];
  }
};

Blockly.Python.text_append = function() {
  // Append to a variable in place.
  var varName = Blockly.Python.variableDB_.getName(this.getTitleValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Python.valueToCode(this, 'TEXT',
      Blockly.Python.ORDER_NONE) || '\'\'';
  return varName + ' = str(' + varName + ') + str(' + argument0 + ')\n';
};

Blockly.Python.text_length = function() {
  // String length.
  var argument0 = Blockly.Python.valueToCode(this, 'VALUE',
      Blockly.Python.ORDER_NONE) || '\'\'';
  return ['len(' + argument0 + ')', Blockly.Python.ORDER_FUNCTION_CALL];
};

Blockly.Python.text_isEmpty = function() {
  // Is the string null?
  var argument0 = Blockly.Python.valueToCode(this, 'VALUE',
      Blockly.Python.ORDER_NONE) || '\'\'';
  var code = 'not len(' + argument0 + ')';
  return [code, Blockly.Python.ORDER_LOGICAL_NOT];
};

Blockly.Python.text_indexOf = function() {
  // Search the text for a substring.
  // Should we allow for non-case sensitive???
  var operator = this.getTitleValue('END') == 'FIRST' ? 'find' : 'rfind';
  var argument0 = Blockly.Python.valueToCode(this, 'FIND',
      Blockly.Python.ORDER_NONE) || '\'\'';
  var argument1 = Blockly.Python.valueToCode(this, 'VALUE',
      Blockly.Python.ORDER_MEMBER) || '\'\'';
  var code = argument1 + '.' + operator + '(' + argument0 + ') + 1';
  return [code, Blockly.Python.ORDER_MEMBER];
};

Blockly.Python.text_charAt = function() {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  var where = this.getTitleValue('WHERE') || 'FROM_START';
  var at = Blockly.Python.valueToCode(this, 'AT',
      Blockly.Python.ORDER_UNARY_SIGN) || '1';
  var text = Blockly.Python.valueToCode(this, 'VALUE',
      Blockly.Python.ORDER_MEMBER) || '\'\'';
  switch (where) {
    case 'FIRST':
      var code = text + '[0]';
      return [code, Blockly.Python.ORDER_MEMBER];
    case 'LAST':
      var code = text + '[-1]';
      return [code, Blockly.Python.ORDER_MEMBER];
    case 'FROM_START':
      // Blockly uses one-based indicies.
      if (at.match(/^-?\d+$/)) {
        // If the index is a naked number, decrement it right now.
        at = parseInt(at, 10) - 1;
      } else {
        // If the index is dynamic, decrement it in code.
        at += ' - 1';
      }
      var code = text + '[' + at + ']';
      return [code, Blockly.Python.ORDER_MEMBER];
    case 'FROM_END':
      var code = text + '[-' + at + ']';
      return [code, Blockly.Python.ORDER_MEMBER];
    case 'RANDOM':
      if (!Blockly.Python.definitions_['text_random_letter']) {
        Blockly.Python.definitions_['import_random'] = 'import random';
        var functionName = Blockly.Python.variableDB_.getDistinctName(
            'text_random_letter', Blockly.Generator.NAME_TYPE);
        Blockly.Python.text_charAt.text_random_letter = functionName;
        var func = [];
        func.push('def ' + functionName + '(text):');
        func.push('  x = int(random.random() * len(text))');
        func.push('  return text[x];');
        Blockly.Python.definitions_['text_random_letter'] = func.join('\n');
      }
      code = Blockly.Python.text_charAt.text_random_letter +
          '(' + text + ')';
      return [code, Blockly.Python.ORDER_FUNCTION_CALL];
  }
  throw 'Unhandled option (text_charAt).';
};

Blockly.Python.text_getSubstring = function() {
  // Get substring.
  var text = Blockly.Python.valueToCode(this, 'STRING',
      Blockly.Python.ORDER_MEMBER) || '\'\'';
  var where1 = this.getTitleValue('WHERE1');
  var where2 = this.getTitleValue('WHERE2');
  var at1 = Blockly.Python.valueToCode(this, 'AT1',
      Blockly.Python.ORDER_ADDITIVE) || '1';
  var at2 = Blockly.Python.valueToCode(this, 'AT2',
      Blockly.Python.ORDER_ADDITIVE) || '1';
  if (where1 == 'FIRST' || (where1 == 'FROM_START' && at1 == '1')) {
    at1 = '';
  } else if (where1 == 'FROM_START') {
    // Blockly uses one-based indicies.
    if (at1.match(/^-?\d+$/)) {
      // If the index is a naked number, decrement it right now.
      at1 = parseInt(at1, 10) - 1;
    } else {
      // If the index is dynamic, decrement it in code.
      at1 += ' - 1';
    }
  } else if (where1 == 'FROM_END') {
    at1 = '-' + at1;
  }
  if (where2 == 'LAST' || (where2 == 'FROM_END' && at2 == '1')) {
    at2 = '';
  } else if (where1 == 'FROM_START') {
    at2 = at2;
  } else if (where1 == 'FROM_END') {
    if (at2.match(/^-?\d+$/)) {
      // If the index is a naked number, increment it right now.
      at2 = 1 - parseInt(at2, 10);
    } else {
      // If the index is dynamic, increment it in code.
      at2 = '1 - ' + at2;
    }
    Blockly.Python.definitions_['import_sys'] = 'import sys';
    at2 += ' or sys.maxsize';
  }
  var code = text + '[' + at1 + ' : ' + at2 + ']';
  return [code, Blockly.Python.ORDER_MEMBER];
};

Blockly.Python.text_changeCase = function() {
  // Change capitalization.
  var mode = this.getTitleValue('CASE');
  var operator = Blockly.Python.text_changeCase.OPERATORS[mode];
  var argument0 = Blockly.Python.valueToCode(this, 'TEXT',
      Blockly.Python.ORDER_MEMBER) || '\'\'';
  var code = argument0 + operator;
  return [code, Blockly.Python.ORDER_MEMBER];
};

Blockly.Python.text_changeCase.OPERATORS = {
  UPPERCASE: '.upper()',
  LOWERCASE: '.lower()',
  TITLECASE: '.title()'
};

Blockly.Python.text_trim = function() {
  // Trim spaces.
  var mode = this.getTitleValue('MODE');
  var operator = Blockly.Python.text_trim.OPERATORS[mode];
  var argument0 = Blockly.Python.valueToCode(this, 'TEXT',
      Blockly.Python.ORDER_MEMBER) || '\'\'';
  var code = argument0 + operator;
  return [code, Blockly.Python.ORDER_MEMBER];
};

Blockly.Python.text_trim.OPERATORS = {
  LEFT: '.lstrip()',
  RIGHT: '.rstrip()',
  BOTH: '.strip()'
};

Blockly.Python.text_print = function() {
  // Print statement.
  var argument0 = Blockly.Python.valueToCode(this, 'TEXT',
      Blockly.Python.ORDER_NONE) || '\'\'';
  return 'print(' + argument0 + ')\n';
};

Blockly.Python.text_prompt = function() {
  // Prompt function.
  if (!Blockly.Python.definitions_['text_prompt']) {
    var functionName = Blockly.Python.variableDB_.getDistinctName(
        'text_prompt', Blockly.Generator.NAME_TYPE);
    Blockly.Python.text_prompt.text_prompt = functionName;
    var func = [];
    func.push('def ' + functionName + '(msg):');
    func.push('  try:');
    func.push('    return raw_input(msg)');
    func.push('  except NameError:');
    func.push('    return input(msg)');
    Blockly.Python.definitions_['text_prompt'] = func.join('\n');
  }
  var msg = Blockly.Python.quote_(this.getTitleValue('TEXT'));
  var code = Blockly.Python.text_prompt.text_prompt + '(' + msg + ')';
  var toNumber = this.getTitleValue('TYPE') == 'NUMBER';
  if (toNumber) {
    code = 'float(' + code + ')';
  }
  return [code, Blockly.Python.ORDER_FUNCTION_CALL];
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
 * @fileoverview Generating Python for variable blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

Blockly.Python.variables = {};

Blockly.Python.variables_get = function() {
  // Variable getter.
  var code = Blockly.Python.variableDB_.getName(this.getTitleValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python.variables_set = function() {
  // Variable setter.
  var argument0 = Blockly.Python.valueToCode(this, 'VALUE',
      Blockly.Python.ORDER_NONE) || '0';
  var varName = Blockly.Python.variableDB_.getName(this.getTitleValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return varName + ' = ' + argument0 + '\n';
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
 * @fileoverview Generating Python for math blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

Blockly.Python.math = {};

// If any new block imports any library, add that library name here.
Blockly.Python.addReservedWords('math,random');

Blockly.Python.math_number = function() {
  // Numeric value.
  var code = window.parseFloat(this.getTitleValue('NUM'));
  var order = code < 0 ? Blockly.Python.ORDER_UNARY_SIGN :
              Blockly.Python.ORDER_ATOMIC;
  return [code, order];
};

Blockly.Python.math_arithmetic = function() {
  // Basic arithmetic operators, and power.
  var mode = this.getTitleValue('OP');
  var tuple = Blockly.Python.math_arithmetic.OPERATORS[mode];
  var operator = tuple[0];
  var order = tuple[1];
  var argument0 = Blockly.Python.valueToCode(this, 'A', order) || '0';
  var argument1 = Blockly.Python.valueToCode(this, 'B', order) || '0';
  var code = argument0 + operator + argument1;
  return [code, order];
  // In case of 'DIVIDE', division between integers returns different results
  // in Python 2 and 3. However, is not an issue since Blockly does not
  // guarantee identical results in all languages.  To do otherwise would
  // require every operator to be wrapped in a function call.  This would kill
  // legibility of the generated code.  See:
  // http://code.google.com/p/blockly/wiki/Language
};

Blockly.Python.math_arithmetic.OPERATORS = {
  ADD: [' + ', Blockly.Python.ORDER_ADDITIVE],
  MINUS: [' - ', Blockly.Python.ORDER_ADDITIVE],
  MULTIPLY: [' * ', Blockly.Python.ORDER_MULTIPLICATIVE],
  DIVIDE: [' / ', Blockly.Python.ORDER_MULTIPLICATIVE],
  POWER: [' ** ', Blockly.Python.ORDER_EXPONENTIATION]
};

Blockly.Python.math_single = function() {
  // Math operators with single operand.
  var operator = this.getTitleValue('OP');
  var code;
  var arg;
  if (operator == 'NEG') {
    // Negation is a special case given its different operator precedence.
    var code = Blockly.Python.valueToCode(this, 'NUM',
        Blockly.Python.ORDER_UNARY_SIGN) || '0';
    return ['-' + code, Blockly.Python.ORDER_UNARY_SIGN];
  }
  Blockly.Python.definitions_['import_math'] = 'import math';
  if (operator == 'SIN' || operator == 'COS' || operator == 'TAN') {
    arg = Blockly.Python.valueToCode(this, 'NUM',
        Blockly.Python.ORDER_MULTIPLICATIVE) || '0';
  } else {
    arg = Blockly.Python.valueToCode(this, 'NUM',
        Blockly.Python.ORDER_NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'math.fabs(' + arg + ')';
      break;
    case 'ROOT':
      code = 'math.sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'math.log(' + arg + ')';
      break;
    case 'LOG10':
      code = 'math.log10(' + arg + ')';
      break;
    case 'EXP':
      code = 'math.exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'math.pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = 'round(' + arg + ')';
      break;
    case 'ROUNDUP':
      code = 'math.ceil(' + arg + ')';
      break;
    case 'ROUNDDOWN':
      code = 'math.floor(' + arg + ')';
      break;
    case 'SIN':
      code = 'math.sin(' + arg + ' / 180.0 * math.pi)';
      break;
    case 'COS':
      code = 'math.cos(' + arg + ' / 180.0 * math.pi)';
      break;
    case 'TAN':
      code = 'math.tan(' + arg + ' / 180.0 * math.pi)';
      break;
  }
  if (code) {
    return [code, Blockly.Python.ORDER_FUNCTION_CALL];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ASIN':
      code = 'math.asin(' + arg + ') / math.pi * 180';
      break;
    case 'ACOS':
      code = 'math.acos(' + arg + ') / math.pi * 180';
      break;
    case 'ATAN':
      code = 'math.atan(' + arg + ') / math.pi * 180';
      break;
    default:
      throw 'Unknown math operator: ' + operator;
  }
  return [code, Blockly.Python.ORDER_MULTIPLICATIVE];
};

Blockly.Python.math_constant = function() {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  var constant = this.getTitleValue('CONSTANT');
  if (constant != 'INFINITY') {
    Blockly.Python.definitions_['import_math'] = 'import math';
  }
  return Blockly.Python.math_constant.CONSTANTS[constant];
};

Blockly.Python.math_constant.CONSTANTS = {
  PI: ['math.pi', Blockly.Python.ORDER_MEMBER],
  E: ['math.e', Blockly.Python.ORDER_MEMBER],
  GOLDEN_RATIO: ['(1 + math.sqrt(5)) / 2', Blockly.Python.ORDER_MULTIPLICATIVE],
  SQRT2: ['math.sqrt(2)', Blockly.Python.ORDER_MEMBER],
  SQRT1_2: ['math.sqrt(1 / 2)', Blockly.Python.ORDER_MEMBER],
  INFINITY: ['float(\'inf\')', Blockly.Python.ORDER_ATOMIC]
};

Blockly.Python.math_number_property = function() {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  var number_to_check = Blockly.Python.valueToCode(this, 'NUMBER_TO_CHECK',
      Blockly.Python.ORDER_MULTIPLICATIVE);
  if (!number_to_check) {
    return ['False', Blockly.Python.ORDER_ATOMIC];
  }
  var dropdown_property = this.getTitleValue('PROPERTY');
  var code;
  if (dropdown_property == 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    if (!Blockly.Python.definitions_['isPrime']) {
      var functionName = Blockly.Python.variableDB_.getDistinctName(
          'isPrime', Blockly.Generator.NAME_TYPE);
      Blockly.Python.logic_prime= functionName;
      var func = [];
      func.push('def ' + functionName + '(n):');
      func.push('  # http://en.wikipedia.org/wiki/Primality_test#Naive_methods');
      func.push('  # If n is not a number but a string, try parsing it.');
      func.push('  if type(n) not in (int, float, long):');
      func.push('    try:');
      func.push('      n = float(n)');
      func.push('    except:');
      func.push('      return False');
      func.push('  if n == 2 or n == 3:');
      func.push('    return True');
      func.push('  # False if n is negative, is 1, or not whole,' +
                ' or if n is divisible by 2 or 3.');
      func.push('  if n <= 1 or n % 1 != 0 or n % 2 == 0 or n % 3 == 0:');
      func.push('    return False');
      func.push('  # Check all the numbers of form 6k +/- 1, up to sqrt(n).');
      func.push('  for x in range(6, int(math.sqrt(n)) + 2, 6):');
      func.push('    if n % (x - 1) == 0 or n % (x + 1) == 0:');
      func.push('      return False');
      func.push('  return True');
      Blockly.Python.definitions_['isPrime'] = func.join('\n');
    }
    code = Blockly.Python.logic_prime + '(' + number_to_check + ')';
    return [code, Blockly.Python.ORDER_FUNCTION_CALL];
  }
  switch (dropdown_property) {
    case 'EVEN':
      code = number_to_check + ' % 2 == 0';
      break;
    case 'ODD':
      code = number_to_check + ' % 2 == 1';
      break;
    case 'WHOLE':
      code = number_to_check + ' % 1 == 0';
      break;
    case 'POSITIVE':
      code = number_to_check + ' > 0';
      break;
    case 'NEGATIVE':
      code = number_to_check + ' < 0';
      break;
    case 'DIVISIBLE_BY':
      var divisor = Blockly.Python.valueToCode(this, 'DIVISOR',
          Blockly.Python.ORDER_MULTIPLICATIVE);
      // If 'divisor' is some code that evals to 0, Python will raise an error.
      if (!divisor || divisor == '0') {
        return ['False', Blockly.Python.ORDER_ATOMIC];
      }
      code = number_to_check + ' % ' + divisor + ' == 0';
      break;
  }
  return [code, Blockly.Python.ORDER_RELATIONAL];
};

Blockly.Python.math_change = function() {
  // Add to a variable in place.
  var argument0 = Blockly.Python.valueToCode(this, 'DELTA',
      Blockly.Python.ORDER_ADDITIVE) || '0';
  var varName = Blockly.Python.variableDB_.getName(this.getTitleValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return varName + ' = (' + varName + ' if type(' + varName +
      ') in (int, float, long) else 0) + ' + argument0 + '\n';
};

// Rounding functions have a single operand.
Blockly.Python.math_round = Blockly.Python.math_single;
// Trigonometry functions have a single operand.
Blockly.Python.math_trig = Blockly.Python.math_single;

Blockly.Python.math_on_list = function() {
  // Math functions for lists.
  var func = this.getTitleValue('OP');
  var list = Blockly.Python.valueToCode(this, 'LIST',
      Blockly.Python.ORDER_NONE) || '[]';
  var code;
  switch (func) {
    case 'SUM':
      code = 'sum(' + list + ')';
      break;
    case 'MIN':
      code = 'min(' + list + ')';
      break;
    case 'MAX':
      code = 'max(' + list + ')';
      break;
    case 'AVERAGE':
      if (!Blockly.Python.definitions_['math_mean']) {
        // This operation exclude null and values that are not int or float:
        //   math_mean([null,null,"aString",1,9]) == 5.0.
        var functionName = Blockly.Python.variableDB_.getDistinctName(
            'math_mean', Blockly.Generator.NAME_TYPE);
        Blockly.Python.math_on_list.math_mean = functionName;
        var func = [];
        func.push('def ' + functionName + '(myList):');
        func.push('  localList = [e for e in myList ' +
            'if type(e) in (int, float, long)]');
        func.push('  if not localList: return');
        func.push('  return float(sum(localList)) / len(localList)');
        Blockly.Python.definitions_['math_mean'] = func.join('\n');
      }
      code = Blockly.Python.math_on_list.math_mean + '(' + list + ')';
      break;
    case 'MEDIAN':
      if (!Blockly.Python.definitions_['math_median']) {
        // This operation exclude null values:
        //   math_median([null,null,1,3]) == 2.0.
        var functionName = Blockly.Python.variableDB_.getDistinctName(
            'math_median', Blockly.Generator.NAME_TYPE);
        Blockly.Python.math_on_list.math_median = functionName;
        var func = [];
        func.push('def ' + functionName + '(myList):');
        func.push('  localList = sorted([e for e in myList ' +
            'if type(e) in (int, float, long)])');
        func.push('  if not localList: return');
        func.push('  if len(localList) % 2 == 0:');
        func.push('    return (localList[len(localList) / 2 - 1] + ' +
            'localList[len(localList) / 2]) / 2.0');
        func.push('  else:');
        func.push('    return localList[(len(localList) - 1) / 2]');
        Blockly.Python.definitions_['math_median'] = func.join('\n');
      }
      code = Blockly.Python.math_on_list.math_median + '(' + list + ')';
      break;
    case 'MODE':
      if (!Blockly.Python.definitions_['math_modes']) {
        // As a list of numbers can contain more than one mode,
        // the returned result is provided as an array.
        // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1].
        var functionName = Blockly.Python.variableDB_.getDistinctName(
            'math_modes', Blockly.Generator.NAME_TYPE);
        Blockly.Python.math_on_list.math_modes = functionName;
        var func = [];
        func.push('def ' + functionName + '(some_list):');
        func.push('  modes = []');
        func.push('  # Using a lists of [item, count] to keep count rather ' +
                  'than dict');
        func.push('  # to avoid "unhashable" errors when the counted item is ' +
                  'itself a list or dict.');
        func.push('  counts = []');
        func.push('  maxCount = 1');
        func.push('  for item in some_list:');
        func.push('    found = False');
        func.push('    for count in counts:');
        func.push('      if count[0] == item:');
        func.push('        count[1] += 1');
        func.push('        maxCount = max(maxCount, count[1])');
        func.push('        found = True');
        func.push('    if not found:');
        func.push('      counts.append([item, 1])');
        func.push('  for counted_item, item_count in counts:');
        func.push('    if item_count == maxCount:');
        func.push('      modes.append(counted_item)');
        func.push('  return modes');
        Blockly.Python.definitions_['math_modes'] = func.join('\n');
      }
      code = Blockly.Python.math_on_list.math_modes + '(' + list + ')';
      break;
    case 'STD_DEV':
      if (!Blockly.Python.definitions_['math_standard_deviation']) {
        Blockly.Python.definitions_['import_math'] = 'import math';
        var functionName = Blockly.Python.variableDB_.getDistinctName(
            'math_standard_deviation', Blockly.Generator.NAME_TYPE);
        Blockly.Python.math_on_list.math_standard_deviation = functionName;
        var func = [];
        func.push('def ' + functionName + '(numbers):');
        func.push('  n = len(numbers)');
        func.push('  if n == 0: return');
        func.push('  mean = float(sum(numbers)) / n');
        func.push('  variance = sum((x - mean) ** 2 for x in numbers) / n');
        func.push('  return math.sqrt(variance)');
        Blockly.Python.definitions_['math_standard_deviation'] =
            func.join('\n');
      }
      code = Blockly.Python.math_on_list.math_standard_deviation +
          '(' + list + ')';
      break;
    case 'RANDOM':
      Blockly.Python.definitions_['import_random'] = 'import random';
      code = 'random.choice(' + list + ')';
      break;
    default:
      throw 'Unknown operator: ' + func;
  }
  return [code, Blockly.Python.ORDER_FUNCTION_CALL];
};

Blockly.Python.math_modulo = function() {
  // Remainder computation.
  var argument0 = Blockly.Python.valueToCode(this, 'DIVIDEND',
      Blockly.Python.ORDER_MULTIPLICATIVE) || '0';
  var argument1 = Blockly.Python.valueToCode(this, 'DIVISOR',
      Blockly.Python.ORDER_MULTIPLICATIVE) || '0';
  var code = argument0 + ' % ' + argument1;
  return [code, Blockly.Python.ORDER_MULTIPLICATIVE];
};

Blockly.Python.math_constrain = function() {
  // Constrain a number between two limits.
  var argument0 = Blockly.Python.valueToCode(this, 'VALUE',
      Blockly.Python.ORDER_NONE) || '0';
  var argument1 = Blockly.Python.valueToCode(this, 'LOW',
      Blockly.Python.ORDER_NONE) || '0';
  var argument2 = Blockly.Python.valueToCode(this, 'HIGH',
      Blockly.Python.ORDER_NONE) || 'float(\'inf\')';
  var code = 'min(max(' + argument0 + ', ' + argument1 + '), ' +
      argument2 + ')';
  return [code, Blockly.Python.ORDER_FUNCTION_CALL];
};

Blockly.Python.math_random_int = function() {
  // Random integer between [X] and [Y].
  Blockly.Python.definitions_['import_random'] = 'import random';
  var argument0 = Blockly.Python.valueToCode(this, 'FROM',
      Blockly.Python.ORDER_NONE) || '0';
  var argument1 = Blockly.Python.valueToCode(this, 'TO',
      Blockly.Python.ORDER_NONE) || '0';
  var code = 'random.randint(' + argument0 + ', ' + argument1 + ')';
  return [code, Blockly.Python.ORDER_FUNCTION_CALL];
};

Blockly.Python.math_random_float = function() {
  // Random fraction between 0 and 1.
  Blockly.Python.definitions_['import_random'] = 'import random';
  return ['random.random()', Blockly.Python.ORDER_FUNCTION_CALL];
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
 * @fileoverview Generating Python for variable blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Python.procedures = {};

Blockly.Python.procedures_defreturn = function() {
  // Define a procedure with a return value.
  // First, add a 'global' statement for every variable that is assigned.
  var globals = Blockly.Variables.allVariables(this);
  for (var i = globals.length - 1; i >= 0; i--) {
    var varName = globals[i];
    if (this.arguments_.indexOf(varName) == -1) {
      globals[i] = Blockly.Python.variableDB_.getName(varName,
          Blockly.Variables.NAME_TYPE);
    } else {
      // This variable is actually a parameter name.  Do not include it in
      // the list of globals, thus allowing it be of local scope.
      globals.splice(i, 1);
    }
  }
  globals = globals.length ? '  global ' + globals.join(', ') + '\n' : '';
  var funcName = Blockly.Python.variableDB_.getName(this.getTitleValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.Python.statementToCode(this, 'STACK');
  if (Blockly.Python.INFINITE_LOOP_TRAP) {
    branch = Blockly.Python.INFINITE_LOOP_TRAP.replace(/%1/g,
        '"' + this.id + '"') + branch;
  }
  var returnValue = Blockly.Python.valueToCode(this, 'RETURN',
      Blockly.Python.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = '  return ' + returnValue + '\n';
  } else if (!branch) {
    branch = '  pass';
  }
  var args = [];
  for (var x = 0; x < this.arguments_.length; x++) {
    args[x] = Blockly.Python.variableDB_.getName(this.arguments_[x],
        Blockly.Variables.NAME_TYPE);
  }
  var code = 'def ' + funcName + '(' + args.join(', ') + '):\n' +
      globals + branch + returnValue;
  code = Blockly.Python.scrub_(this, code);
  Blockly.Python.definitions_[funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.Python.procedures_defnoreturn =
    Blockly.Python.procedures_defreturn;

Blockly.Python.procedures_callreturn = function() {
  // Call a procedure with a return value.
  var funcName = Blockly.Python.variableDB_.getName(this.getTitleValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var x = 0; x < this.arguments_.length; x++) {
    args[x] = Blockly.Python.valueToCode(this, 'ARG' + x,
        Blockly.Python.ORDER_NONE) || 'None';
  }
  var code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.Python.ORDER_FUNCTION_CALL];
};

Blockly.Python.procedures_callnoreturn = function() {
  // Call a procedure with no return value.
  var funcName = Blockly.Python.variableDB_.getName(this.getTitleValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var x = 0; x < this.arguments_.length; x++) {
    args[x] = Blockly.Python.valueToCode(this, 'ARG' + x,
        Blockly.Python.ORDER_NONE) || 'None';
  }
  var code = funcName + '(' + args.join(', ') + ')\n';
  return code;
};

Blockly.Python.procedures_ifreturn = function() {
  // Conditionally return value from a procedure.
  var condition = Blockly.Python.valueToCode(this, 'CONDITION',
      Blockly.Python.ORDER_NONE) || 'False';
  var code = 'if ' + condition + ':\n';
  if (this.hasReturnValue_) {
    var value = Blockly.Python.valueToCode(this, 'VALUE',
        Blockly.Python.ORDER_NONE) || 'None';
    code += '  return ' + value + '\n';
  } else {
    code += '  return\n';
  }
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
 * @fileoverview Generating Python for logic blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

Blockly.Python.logic = {};

Blockly.Python.logic_compare = function() {
  // Comparison operator.
  var mode = this.getTitleValue('OP');
  var operator = Blockly.Python.logic_compare.OPERATORS[mode];
  var order = Blockly.Python.ORDER_RELATIONAL;
  var argument0 = Blockly.Python.valueToCode(this, 'A', order) || '0';
  var argument1 = Blockly.Python.valueToCode(this, 'B', order) || '0';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Python.logic_compare.OPERATORS = {
  EQ: '==',
  NEQ: '!=',
  LT: '<',
  LTE: '<=',
  GT: '>',
  GTE: '>='
};

Blockly.Python.logic_operation = function() {
  // Operations 'and', 'or'.
  var operator = (this.getTitleValue('OP') == 'AND') ? 'and' : 'or';
  var order = (operator == 'and') ? Blockly.Python.ORDER_LOGICAL_AND :
      Blockly.Python.ORDER_LOGICAL_OR;
  var argument0 = Blockly.Python.valueToCode(this, 'A', order) || 'False';
  var argument1 = Blockly.Python.valueToCode(this, 'B', order) || 'False';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Python.logic_negate = function() {
  // Negation.
  var argument0 = Blockly.Python.valueToCode(this, 'BOOL',
      Blockly.Python.ORDER_LOGICAL_NOT) || 'False';
  var code = 'not ' + argument0;
  return [code, Blockly.Python.ORDER_LOGICAL_NOT];
};

Blockly.Python.logic_boolean = function() {
  // Boolean values true and false.
  var code = (this.getTitleValue('BOOL') == 'TRUE') ? 'True' : 'False';
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python.logic_null = function() {
  // Null data type.
  return ['None', Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python.logic_ternary = function() {
  // Ternary operator.
  var value_if = Blockly.Python.valueToCode(this, 'IF',
      Blockly.Python.ORDER_CONDITIONAL) || 'False';
  var value_then = Blockly.Python.valueToCode(this, 'THEN',
      Blockly.Python.ORDER_CONDITIONAL) || 'None';
  var value_else = Blockly.Python.valueToCode(this, 'ELSE',
      Blockly.Python.ORDER_CONDITIONAL) || 'None';
  var code = value_then + ' if ' + value_if + ' else ' + value_else
  return [code, Blockly.Python.ORDER_CONDITIONAL];
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
 * @fileoverview Generating Python for list blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

Blockly.Python.lists = {};

Blockly.Python.lists_create_empty = function() {
  // Create an empty list.
  return ['[]', Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python.lists_create_with = function() {
  // Create a list with any number of elements of any type.
  var code = new Array(this.itemCount_);
  for (var n = 0; n < this.itemCount_; n++) {
    code[n] = Blockly.Python.valueToCode(this, 'ADD' + n,
        Blockly.Python.ORDER_NONE) || 'None';
  }
  code = '[' + code.join(', ') + ']';
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python.lists_repeat = function() {
  // Create a list with one element repeated.
  var argument0 = Blockly.Python.valueToCode(this, 'ITEM',
      Blockly.Python.ORDER_NONE) || 'None';
  var argument1 = Blockly.Python.valueToCode(this, 'NUM',
      Blockly.Python.ORDER_MULTIPLICATIVE) || '0';
  var code = '[' + argument0 + '] * ' + argument1;
  return [code, Blockly.Python.ORDER_MULTIPLICATIVE];
};

Blockly.Python.lists_length = function() {
  // List length.
  var argument0 = Blockly.Python.valueToCode(this, 'VALUE',
      Blockly.Python.ORDER_NONE) || '[]';
  return ['len(' + argument0 + ')', Blockly.Python.ORDER_FUNCTION_CALL];
};

Blockly.Python.lists_isEmpty = function() {
  // Is the list empty?
  var argument0 = Blockly.Python.valueToCode(this, 'VALUE',
      Blockly.Python.ORDER_NONE) || '[]';
  var code = 'not len(' + argument0 + ')';
  return [code, Blockly.Python.ORDER_LOGICAL_NOT];
};

Blockly.Python.lists_indexOf = function() {
  // Find an item in the list.
  var argument0 = Blockly.Python.valueToCode(this, 'FIND',
      Blockly.Python.ORDER_NONE) || '[]';
  var argument1 = Blockly.Python.valueToCode(this, 'VALUE',
      Blockly.Python.ORDER_MEMBER) || '\'\'';
  var code;
  if (this.getTitleValue('END') == 'FIRST') {
    if (!Blockly.Python.definitions_['first_index']) {
      var functionName = Blockly.Python.variableDB_.getDistinctName(
          'first_index', Blockly.Generator.NAME_TYPE);
      Blockly.Python.lists_indexOf.first_index = functionName;
      var func = [];
      func.push('def ' + functionName + '(myList, elem):');
      func.push('  try: theIndex = myList.index(elem) + 1');
      func.push('  except: theIndex = 0');
      func.push('  return theIndex');
      Blockly.Python.definitions_['first_index'] = func.join('\n');
    }
    code = Blockly.Python.lists_indexOf.first_index + '(' +
        argument1 + ', ' + argument0 + ')';
    return [code, Blockly.Python.ORDER_MEMBER];
  } else {
    if (!Blockly.Python.definitions_['last_index']) {
      var functionName = Blockly.Python.variableDB_.getDistinctName(
          'last_index', Blockly.Generator.NAME_TYPE);
      Blockly.Python.lists_indexOf.last_index = functionName;
      var func = [];
      func.push('def ' + functionName + '(myList, elem):');
      func.push('  try: theIndex = len(myList) - myList[::-1].index(elem)');
      func.push('  except: theIndex = 0');
      func.push('  return theIndex');
      Blockly.Python.definitions_['last_index'] = func.join('\n');
    }
    code = Blockly.Python.lists_indexOf.last_index + '(' +
        argument1 + ', ' + argument0 + ')';
    return [code, Blockly.Python.ORDER_MEMBER];
  }
};

Blockly.Python.lists_getIndex = function() {
  // Get element at index.
  // Note: Until January 2013 this block did not have MODE or WHERE inputs.
  var mode = this.getTitleValue('MODE') || 'GET';
  var where = this.getTitleValue('WHERE') || 'FROM_START';
  var at = Blockly.Python.valueToCode(this, 'AT',
      Blockly.Python.ORDER_UNARY_SIGN) || '1';
  var list = Blockly.Python.valueToCode(this, 'VALUE',
      Blockly.Python.ORDER_MEMBER) || '[]';

  if (where == 'FIRST') {
    if (mode == 'GET') {
      var code = list + '[0]';
      return [code, Blockly.Python.ORDER_MEMBER];
    } else {
      var code = list + '.pop(0)';
      if (mode == 'GET_REMOVE') {
        return [code, Blockly.Python.ORDER_FUNCTION_CALL];
      } else if (mode == 'REMOVE') {
        return code + '\n';
      }
    }
  } else if (where == 'LAST') {
    if (mode == 'GET') {
      var code = list + '[-1]';
      return [code, Blockly.Python.ORDER_MEMBER];
    } else {
      var code = list + '.pop()';
      if (mode == 'GET_REMOVE') {
        return [code, Blockly.Python.ORDER_FUNCTION_CALL];
      } else if (mode == 'REMOVE') {
        return code + '\n';
      }
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
      return [code, Blockly.Python.ORDER_MEMBER];
    } else {
      var code = list + '.pop(' + at + ')';
      if (mode == 'GET_REMOVE') {
        return [code, Blockly.Python.ORDER_FUNCTION_CALL];
      } else if (mode == 'REMOVE') {
        return code + '\n';
      }
    }
  } else if (where == 'FROM_END') {
    if (mode == 'GET') {
      var code = list + '[-' + at + ']';
      return [code, Blockly.Python.ORDER_MEMBER];
    } else {
      var code = list + '.pop(-' + at + ')';
      if (mode == 'GET_REMOVE') {
        return [code, Blockly.Python.ORDER_FUNCTION_CALL];
      } else if (mode == 'REMOVE') {
        return code + '\n';
      }
    }
  } else if (where == 'RANDOM') {
    Blockly.Python.definitions_['import_random'] = 'import random';
    if (mode == 'GET') {
      code = 'random.choice(' + list + ')';
      return [code, Blockly.Python.ORDER_FUNCTION_CALL];
    } else {
      if (!Blockly.Python.definitions_['lists_remove_random_item']) {
        var functionName = Blockly.Python.variableDB_.getDistinctName(
            'lists_remove_random_item', Blockly.Generator.NAME_TYPE);
        Blockly.Python.lists_getIndex.random = functionName;
        var func = [];
        func.push('def ' + functionName + '(myList):');
        func.push('  x = int(random.random() * len(myList))');
        func.push('  return myList.pop(x)');
        Blockly.Python.definitions_['lists_remove_random_item'] = func.join('\n');
      }
      code = Blockly.Python.lists_getIndex.random + '(' + list + ')';
      if (mode == 'GET' || mode == 'GET_REMOVE') {
        return [code, Blockly.Python.ORDER_FUNCTION_CALL];
      } else if (mode == 'REMOVE') {
        return code + '\n';
      }
    }
  }
  throw 'Unhandled combination (lists_getIndex).';
};

Blockly.Python.lists_setIndex = function() {
  // Set element at index.
  // Note: Until February 2013 this block did not have MODE or WHERE inputs.
  var list = Blockly.Python.valueToCode(this, 'LIST',
      Blockly.Python.ORDER_MEMBER) || '[]';
  var mode = this.getTitleValue('MODE') || 'GET';
  var where = this.getTitleValue('WHERE') || 'FROM_START';
  var at = Blockly.Python.valueToCode(this, 'AT',
      Blockly.Python.ORDER_NONE) || '1';
  var value = Blockly.Python.valueToCode(this, 'TO',
      Blockly.Python.ORDER_NONE) || 'None';
  // Cache non-trivial values to variables to prevent repeated look-ups.
  // Closure, which accesses and modifies 'list'.
  function cacheList() {
    if (list.match(/^\w+$/)) {
      return '';
    }
    var listVar = Blockly.Python.variableDB_.getDistinctName(
        'tmp_list', Blockly.Variables.NAME_TYPE);
    var code = listVar + ' = ' + list + '\n';
    list = listVar;
    return code;
  }
  if (where == 'FIRST') {
    if (mode == 'SET') {
      return list + '[0] = ' + value + '\n';
    } else if (mode == 'INSERT') {
      return list + '.insert(0, ' + value + ')\n';
    }
  } else if (where == 'LAST') {
    if (mode == 'SET') {
      return list + '[-1] = ' + value + '\n';
    } else if (mode == 'INSERT') {
      return list + '.append(' + value + ')\n';
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
    if (mode == 'SET') {
      return list + '[' + at + '] = ' + value + '\n';
    } else if (mode == 'INSERT') {
      return list + '.insert(' + at + ', ' + value + ')\n';
    }
  } else if (where == 'FROM_END') {
    if (mode == 'SET') {
      return list + '[-' + at + '] = ' + value + '\n';
    } else if (mode == 'INSERT') {
      return list + '.insert(-' + at + ', ' + value + ')\n';
    }
  } else if (where == 'RANDOM') {
    Blockly.Python.definitions_['import_random'] = 'import random';
    var code = cacheList();
    var xVar = Blockly.Python.variableDB_.getDistinctName(
        'tmp_x', Blockly.Variables.NAME_TYPE);
    code += xVar + ' = int(random.random() * len(' + list + '))\n';
    if (mode == 'SET') {
      code += list + '[' + xVar + '] = ' + value + '\n';
      return code;
    } else if (mode == 'INSERT') {
      code += list + '.insert(' + xVar + ', ' + value + ')\n';
      return code;
    }
  }
  throw 'Unhandled combination (lists_setIndex).';
};

Blockly.Python.lists_getSublist = function() {
  // Get sublist.
  var list = Blockly.Python.valueToCode(this, 'LIST',
      Blockly.Python.ORDER_MEMBER) || '[]';
  var where1 = this.getTitleValue('WHERE1');
  var where2 = this.getTitleValue('WHERE2');
  var at1 = Blockly.Python.valueToCode(this, 'AT1',
      Blockly.Python.ORDER_ADDITIVE) || '1';
  var at2 = Blockly.Python.valueToCode(this, 'AT2',
      Blockly.Python.ORDER_ADDITIVE) || '1';
  if (where1 == 'FIRST' || (where1 == 'FROM_START' && at1 == '1')) {
    at1 = '';
  } else if (where1 == 'FROM_START') {
    // Blockly uses one-based indicies.
    if (at1.match(/^-?\d+$/)) {
      // If the index is a naked number, decrement it right now.
      at1 = parseInt(at1, 10) - 1;
    } else {
      // If the index is dynamic, decrement it in code.
      at1 += ' - 1';
    }
  } else if (where1 == 'FROM_END') {
    at1 = '-' + at1;
  }
  if (where2 == 'LAST' || (where2 == 'FROM_END' && at2 == '1')) {
    at2 = '';
  } else if (where1 == 'FROM_START') {
    at2 = at2;
  } else if (where1 == 'FROM_END') {
    if (at2.match(/^-?\d+$/)) {
      // If the index is a naked number, increment it right now.
      at2 = 1 - parseInt(at2, 10);
    } else {
      // If the index is dynamic, increment it in code.
      at2 = '1 - ' + at2;
    }
    Blockly.Python.definitions_['import_sys'] = 'import sys';
    at2 += ' or sys.maxsize';
  }
  var code = list + '[' + at1 + ' : ' + at2 + ']';
  return [code, Blockly.Python.ORDER_MEMBER];
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
 * @fileoverview Generating Python for control blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

Blockly.Python.control = {};

Blockly.Python.controls_if = function() {
  // If/elseif/else condition.
  var n = 0;
  var argument = Blockly.Python.valueToCode(this, 'IF' + n,
      Blockly.Python.ORDER_NONE) || 'False';
  var branch = Blockly.Python.statementToCode(this, 'DO' + n) || '  pass\n';
  var code = 'if ' + argument + ':\n' + branch;
  for (n = 1; n <= this.elseifCount_; n++) {
    argument = Blockly.Python.valueToCode(this, 'IF' + n,
        Blockly.Python.ORDER_NONE) || 'False';
    branch = Blockly.Python.statementToCode(this, 'DO' + n) || '  pass\n';
    code += 'elif ' + argument + ':\n' + branch;
  }
  if (this.elseCount_) {
    branch = Blockly.Python.statementToCode(this, 'ELSE') || '  pass\n';
    code += 'else:\n' + branch;
  }
  return code;
};

Blockly.Python.controls_repeat = function() {
  // Repeat n times.
  var repeats = Number(this.getTitleValue('TIMES'));
  var branch = Blockly.Python.statementToCode(this, 'DO') || '  pass\n';
  if (Blockly.Python.INFINITE_LOOP_TRAP) {
    branch = Blockly.Python.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + this.id + '\'') + branch;
  }
  var loopVar = Blockly.Python.variableDB_.getDistinctName(
      'count', Blockly.Variables.NAME_TYPE);
  var code = 'for ' + loopVar + ' in range(' + repeats + '):\n' + branch;
  return code;
};

Blockly.Python.controls_whileUntil = function() {
  // Do while/until loop.
  var until = this.getTitleValue('MODE') == 'UNTIL';
  var argument0 = Blockly.Python.valueToCode(this, 'BOOL',
      until ? Blockly.Python.ORDER_LOGICAL_NOT :
      Blockly.Python.ORDER_NONE) || 'False';
  var branch = Blockly.Python.statementToCode(this, 'DO') || '  pass\n';
  if (Blockly.Python.INFINITE_LOOP_TRAP) {
    branch = Blockly.Python.INFINITE_LOOP_TRAP.replace(/%1/g,
        '"' + this.id + '"') + branch;
  }
  if (this.getTitleValue('MODE') == 'UNTIL') {
    if (!argument0.match(/^\w+$/)) {
      argument0 = '(' + argument0 + ')';
    }
    argument0 = 'not ' + argument0;
  }
  return 'while ' + argument0 + ':\n' + branch;
};

Blockly.Python.controls_for = function() {
  // For loop.
  var variable0 = Blockly.Python.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Python.valueToCode(this, 'FROM',
      Blockly.Python.ORDER_NONE) || '0';
  var argument1 = Blockly.Python.valueToCode(this, 'TO',
      Blockly.Python.ORDER_NONE) || '0';
  var branch = Blockly.Python.statementToCode(this, 'DO') || '  pass\n';
  if (Blockly.Python.INFINITE_LOOP_TRAP) {
    branch = Blockly.Python.INFINITE_LOOP_TRAP.replace(/%1/g,
        '"' + this.id + '"') + branch;
  }

  var code = '';
  var range;
  if (argument0.match(/^-?\d+$/) &&
      argument1.match(/^-?\d+$/)) {
    // Both arguments are simple integers.
    argument0 = parseInt(argument0, 10);
    argument1 = parseInt(argument1, 10);
    if (argument0 <= argument1) {
      // Count up.
      argument1++;
      if (argument0 == 0) {
        // If starting index is 0, omit it.
        range = argument1;
      } else {
        range = argument0 + ', ' + argument1;
      }
    } else {
      // Count down.
      argument1--;
      range = argument0 + ', ' + argument1 + ', -1';
    }
    range = 'range(' + range + ')';
  } else {
    // Cache non-trivial values to variables to prevent repeated look-ups.
    var startVar = argument0;
    if (!argument0.match(/^\w+$/) && !argument0.match(/^-?\d+$/)) {
      var startVar = Blockly.Python.variableDB_.getDistinctName(
          variable0 + '_start', Blockly.Variables.NAME_TYPE);
      code += startVar + ' = ' + argument0 + '\n';
    }
    var endVar = argument1;
    if (!argument1.match(/^\w+$/) && !argument1.match(/^-?\d+$/)) {
      var endVar = Blockly.Python.variableDB_.getDistinctName(
          variable0 + '_end', Blockly.Variables.NAME_TYPE);
      code += endVar + ' = ' + argument1 + '\n';
    }
    range = '(' + startVar + ' <= ' + endVar + ') and ' +
        'range(' + startVar + ', ' + endVar + ' + 1) or ' +
        'range(' + startVar + ', ' + endVar + ' - 1, -1)';
  }
  code += 'for ' + variable0 + ' in ' + range + ':\n' +
      branch;
  return code;
};

Blockly.Python.controls_forEach = function() {
  // For each loop.
  var variable0 = Blockly.Python.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Python.valueToCode(this, 'LIST',
      Blockly.Python.ORDER_RELATIONAL) || '[]';
  var branch = Blockly.Python.statementToCode(this, 'DO') || '  pass\n';
  if (Blockly.Python.INFINITE_LOOP_TRAP) {
    branch = Blockly.Python.INFINITE_LOOP_TRAP.replace(/%1/g,
        '"' + this.id + '"') + branch;
  }
  var code = 'for ' + variable0 + ' in ' + argument0 + ':\n' + branch;
  return code;
};

Blockly.Python.controls_flow_statements = function() {
  // Flow statements: continue, break.
  switch (this.getTitleValue('FLOW')) {
    case 'BREAK':
      return 'break\n';
    case 'CONTINUE':
      return 'continue\n';
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
 * @fileoverview Generating Python for colour blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Python.colour = {};

Blockly.Python.colour_picker = function() {
  // Colour picker.
  var code = '\'' + this.getTitleValue('COLOUR') + '\'';
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python.colour_random = function() {
  // Generate a random colour.
  Blockly.Python.definitions_['import_random'] = 'import random';
  var code = '\'#%06x\' % random.randint(0, 2**24 - 1)';
  return [code, Blockly.Python.ORDER_FUNCTION_CALL];
};

Blockly.Python.colour_rgb = function() {
  // Compose a colour from RGB components.
  if (!Blockly.Python.definitions_['colour_rgb']) {
    var functionName = Blockly.Python.variableDB_.getDistinctName('colour_rgb',
        Blockly.Generator.NAME_TYPE);
    Blockly.Python.colour_rgb.functionName = functionName;
    var func = [];
    func.push('def ' + functionName + '(r, g, b):');
    func.push('  r = round(min(100, max(0, r)) * 2.55)');
    func.push('  g = round(min(100, max(0, g)) * 2.55)');
    func.push('  b = round(min(100, max(0, b)) * 2.55)');
    func.push('  return \'#%02x%02x%02x\' % (r, g, b)');
    Blockly.Python.definitions_['colour_rgb'] = func.join('\n');
  }
  var r = Blockly.Python.valueToCode(this, 'RED',
                                     Blockly.Python.ORDER_NONE) || 0;
  var g = Blockly.Python.valueToCode(this, 'GREEN',
                                     Blockly.Python.ORDER_NONE) || 0;
  var b = Blockly.Python.valueToCode(this, 'BLUE',
                                     Blockly.Python.ORDER_NONE) || 0;
  var code = Blockly.Python.colour_rgb.functionName +
      '(' + r + ', ' + g + ', ' + b + ')';
  return [code, Blockly.Python.ORDER_FUNCTION_CALL];
};

Blockly.Python.colour_blend = function() {
  // Blend two colours together.
  if (!Blockly.Python.definitions_['colour_blend']) {
    var functionName = Blockly.Python.variableDB_.getDistinctName('colour_blend',
        Blockly.Generator.NAME_TYPE);
    Blockly.Python.colour_blend.functionName = functionName;
    var func = [];
    func.push('def ' + functionName + '(colour1, colour2, ratio):');
    func.push('  r1, r2 = int(colour1[1:3], 16), int(colour2[1:3], 16)');
    func.push('  g1, g2 = int(colour1[3:5], 16), int(colour2[3:5], 16)');
    func.push('  b1, b2 = int(colour1[5:7], 16), int(colour2[5:7], 16)');
    func.push('  ratio = min(1, max(0, ratio))');
    func.push('  r = round(r1 * (1 - ratio) + r2 * ratio)');
    func.push('  g = round(g1 * (1 - ratio) + g2 * ratio)');
    func.push('  b = round(b1 * (1 - ratio) + b2 * ratio)');
    func.push('  return \'#%02x%02x%02x\' % (r, g, b)');
    Blockly.Python.definitions_['colour_blend'] = func.join('\n');
  }
  var colour1 = Blockly.Python.valueToCode(this, 'COLOUR1',
      Blockly.Python.ORDER_NONE) || '\'#000000\'';
  var colour2 = Blockly.Python.valueToCode(this, 'COLOUR2',
      Blockly.Python.ORDER_NONE) || '\'#000000\'';
  var ratio = Blockly.Python.valueToCode(this, 'RATIO',
      Blockly.Python.ORDER_NONE) || 0;
  var code = Blockly.Python.colour_blend.functionName +
      '(' + colour1 + ', ' + colour2 + ', ' + ratio + ')';
  return [code, Blockly.Python.ORDER_FUNCTION_CALL];
};
