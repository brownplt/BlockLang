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
