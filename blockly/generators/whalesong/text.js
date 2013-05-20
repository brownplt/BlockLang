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
