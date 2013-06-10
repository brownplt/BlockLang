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
