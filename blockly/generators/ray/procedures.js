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
