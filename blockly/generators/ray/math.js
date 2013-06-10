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
