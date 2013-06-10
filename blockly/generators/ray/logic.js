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
