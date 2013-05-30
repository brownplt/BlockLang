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
  return Blockly.Whalesong.not_implemented();
};

Blockly.Whalesong.text_append = function() {
  // Append to a variable in place.
  return Blockly.Whalesong.not_implemented();
  var varName = Blockly.Whalesong.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Whalesong.valueToCode(this, 'TEXT',
      Blockly.Whalesong.ORDER_NONE) || '\'\'';
  return varName + ' = String(' + varName + ') + String(' + argument0 + ');\n';
};

Blockly.Whalesong.text_length = function() {
  // String length.
  var argument0 = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_COMMA) || '\'\'';
  return [Blockly.Whalesong.ws_apply('string-length', argument0), Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.text_isEmpty = function() {
  // Is the string null?
  var argument0 = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_COMMA) || '\'\'';
  return [Blockly.Whalesong.ws_apply('=', Blockly.Whalesong.ws_apply('string-length', argument0), 0), 
	  Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.text_indexOf = function() {
  // Search the text for a substring.
  return Blockly.Whalesong.not_implemented();
};

Blockly.Whalesong.text_charAt = function() {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  var where = this.getTitleValue('WHERE') || 'FROM_START';
  var at = Blockly.Whalesong.valueToCode(this, 'AT',
      Blockly.Whalesong.ORDER_UNARY_NEGATION) || '1';
  var text = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_COMMA) || '\'\'';
  if(where === 'FIRST') { 
    return [Blockly.Whalesong.ws_apply('string-ref', at, text), 
	    Blockly.Whalesong.ORDER_FUNCTION_CALL];
  } else { 
    return Blockly.Whalesong.not_implemented();
  }
};

Blockly.Whalesong.text_getSubstring = function() {
  // Get substring.
  var text = Blockly.Whalesong.valueToCode(this, 'STRING',
      Blockly.Whalesong.ORDER_COMMA) || '[]';
  var where1 = this.getTitleValue('WHERE1');
  var where2 = this.getTitleValue('WHERE2');
  var at1 = Blockly.Whalesong.valueToCode(this, 'AT1',
      Blockly.Whalesong.ORDER_NONE) || '1';
  var at2 = Blockly.Whalesong.valueToCode(this, 'AT2',
      Blockly.Whalesong.ORDER_NONE) || '1';
  if(where1 === 'FROM_START' && where2 === 'FROM_START') { 
    return [Blockly.Whalesong.ws_apply('substring', at1, at2),
	    Blockly.Whalesong.ORDER_FUNCTION_CALL];
  } else { 
    return Blockly.Whalesong.not_implemented();
  }
};

Blockly.Whalesong.text_changeCase = function() {
  // Change capitalization.
  var mode = this.getTitleValue('CASE');
  var func = Blockly.Whalesong.text_changeCase.OPERATORS[mode];
  var argument0 = Blockly.Whalesong.text_trim.(this, 'TEXT', 
      Blockly.Whalesong.ORDER_COMMA) || '\'\'';
  if(!func) { 
    return Blockly.Whalesong.not_implemented();
  } else { 
    return [Blockly.Whalesong.ws_apply(func, argument0),
	    Blockly.Whalesong.ORDER_FUNCTION_CALL];
  }
};

Blockly.Whalesong.text_changeCase.OPERATORS = {
  UPPERCASE: 'string-upcase',
  LOWERCASE: 'string-downcase',
  TITLECASE: 'string-titlecase'
};

Blockly.Whalesong.text_trim = function() {
  // Trim spaces.
  return Blockly.Whalesong.not_implemented();
};

Blockly.Whalesong.text_trim.OPERATORS = {
  LEFT: '.trimLeft()',
  RIGHT: '.trimRight()',
  BOTH: '.trim()'
};

Blockly.Whalesong.text_print = function() {
  // Print statement.
  return Blockly.Whalesong.not_implemented();
};

Blockly.Whalesong.text_prompt = function() {
  // Prompt function.
  return Blockly.Whalesong.not_implemented();
};
