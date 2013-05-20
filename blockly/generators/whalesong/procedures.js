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
