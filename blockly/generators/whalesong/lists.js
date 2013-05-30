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
  return Blockly.Whalesong.not_implemented();
};

Blockly.Whalesong.lists_getIndex = function() {
  // Get element at index.
  var mode = this.getTitleValue('MODE') || 'GET';
  var where = this.getTitleValue('WHERE') || 'FROM_START';
  var at = Blockly.Whalesong.valueToCode(this, 'AT',
      Blockly.Whalesong.ORDER_COMMA) || '1';
  var list = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_COMMA) || '[]';
  if(mode === 'GET' && where === 'FROM_START') { 
    return [Blockly.Whalesong.ws_apply('list-ref', list, at), 
	    Blockly.Whalesong.ORDER_FUNCTION_CALL];
  } else { 
    return Blockly.Whalesong.not_implemented();
  }
};

Blockly.Whalesong.lists_setIndex = function() {
  // Set element at index.
  return Blockly.Whalesong.not_implemented();
};

Blockly.Whalesong.lists_getSublist = function() {
  // Get sublist.
  return Blockly.Whalesong.not_implemented();
};
