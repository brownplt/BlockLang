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
 * @fileoverview Generating Whalesong for math blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

Blockly.Whalesong.math = {};

Blockly.Whalesong.math_number = function() {
  // Numeric value.
  var code = window.parseFloat(this.getTitleValue('NUM'));    
  return [code, Blockly.Whalesong.ORDER_ATOMIC];
};

Blockly.Whalesong.math_arithmetic = function() {
  // Basic arithmetic operators, and power.
  var mode = this.getTitleValue('OP');
  var primitive_name = Blockly.Whalesong.math_arithmetic.BASIC_OPERATIONS[mode];
  var argument0 = Blockly.Whalesong.valueToCode(this, 'A', Blockly.Whalesong.ORDER_FUNCTION_CALL) || '0';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'B', Blockly.Whalesong.ORDER_FUNCTION_CALL) || '0';
  var code = Blockly.Whalesong.call_primitive(primitive_name, argument0, argument1);
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.math_arithmetic.BASIC_OPERATIONS = {
  ADD: '+',
  MINUS: '-',
  MULTIPLY: '*',
  DIVIDE: '/',
  POWER: 'expt'
};

Blockly.Whalesong.math_single = function() {
  // Math operators with single operand.
  var operator = this.getTitleValue('OP');
  var code;
  var arg;
  if (operator == 'NEG') {
    // Negation is a special case given its different operator precedence.
    arg = Blockly.Whalesong.valueToCode(this, 'NUM',
        Blockly.Whalesong.ORDER_UNARY_NEGATION) || '0';
    if (arg[0] == '-') {
      // --3 is not legal in JS.
      arg = ' ' + arg;
    }
    code = '-' + arg;
    return [code, Blockly.Whalesong.ORDER_UNARY_NEGATION];
  }
  if (operator == 'SIN' || operator == 'COS' || operator == 'TAN') {
    arg = Blockly.Whalesong.valueToCode(this, 'NUM',
        Blockly.Whalesong.ORDER_DIVISION) || '0';
  } else {
    arg = Blockly.Whalesong.valueToCode(this, 'NUM',
        Blockly.Whalesong.ORDER_NONE) || '0';
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
      code = Blockly.Whalesong.call_primitive(Blockly.Whalesong.UNARY_OPERATORS[operator], arg);
      break;
    case 'SIN':
    case 'COS':
    case 'TAN':
      var arg_in_radians = Blockly.Whalesong.call_primitive("degrees->radians", arg);
      code = Blockly.Whalesong.call_primitive(Blockly.Whalesong.TRIGONOMETRIC_OPERATORS[operator], arg_in_radians);
      break;
    case 'ASIN':
    case 'ACOS':
    case 'ATAN':
      var result_in_radians = Blockly.Whalesong.call_primitive(Blockly.Whalesong.TRIGONOMETRIC_OPERATORS[operate], arg);
      code = Blockly.Whalesong.call_primitive("radians->degrees", result_in_radians);
      break;
    case 'POW10':
    case 'LOG10':
    default:
      throw 'Unknown math operator: ' + operator;
  }
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.UNARY_OPERATORS = { 
    ABS: "abs",
    ROOT: "sqrt",
    LN: "log",
    EXP: "exp",
    ROUND: "round",
    ROUNDUP: "ceiling",
    ROUNDDOWN: "floor"
};

Blockly.Whalesong.TRIGONOMETRIC_OPERATORS = { 
    SIN: "sin",
    COS: "cos",
    TAN: "tan",
    ASIN: "asin",
    ACOS: "acos",
    ATAN: "atan"
};

Blockly.Whalesong.math_constant = function() {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  var constant = this.getTitleValue('CONSTANT');
  return Blockly.Whalesong.math_constant.CONSTANTS[constant];
};

Blockly.Whalesong.math_constant.CONSTANTS = {
  PI: ['Math.PI', Blockly.Whalesong.ORDER_MEMBER],
  E: ['Math.E', Blockly.Whalesong.ORDER_MEMBER],
  GOLDEN_RATIO: ['(1 + Math.sqrt(5)) / 2', Blockly.Whalesong.ORDER_DIVISION],
  SQRT2: ['Math.SQRT2', Blockly.Whalesong.ORDER_MEMBER],
  SQRT1_2: ['Math.SQRT1_2', Blockly.Whalesong.ORDER_MEMBER],
  INFINITY: ['Infinity', Blockly.Whalesong.ORDER_ATOMIC]
};

Blockly.Whalesong.math_number_property = function() {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  var number_to_check = Blockly.Whalesong.valueToCode(this, 'NUMBER_TO_CHECK',
      Blockly.Whalesong.ORDER_MODULUS) || 'NaN';
  var dropdown_property = this.getTitleValue('PROPERTY');
  var code;
  if (dropdown_property == 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    if (!Blockly.Whalesong.definitions_['isPrime']) {
      var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
          'isPrime', Blockly.Generator.NAME_TYPE);
      Blockly.Whalesong.logic_prime= functionName;
      var func = [];
      func.push('function ' + functionName + '(n) {');
      func.push('  // http://en.wikipedia.org/wiki/Primality_test#Naive_methods');
      func.push('  if (n == 2 || n == 3) {');
      func.push('    return true;');
      func.push('  }');
      func.push('  // False if n is NaN, negative, is 1, or not whole.');
      func.push('  // And false if n is divisible by 2 or 3.');
      func.push('  if (isNaN(n) || n <= 1 || n % 1 != 0 || n % 2 == 0 ||' +
                ' n % 3 == 0) {');
      func.push('    return false;');
      func.push('  }');
      func.push('  // Check all the numbers of form 6k +/- 1, up to sqrt(n).');
      func.push('  for (var x = 6; x <= Math.sqrt(n) + 1; x += 6) {');
      func.push('    if (n % (x - 1) == 0 || n % (x + 1) == 0) {');
      func.push('      return false;');
      func.push('    }');
      func.push('  }');
      func.push('  return true;');
      func.push('}');
      Blockly.Whalesong.definitions_['isPrime'] = func.join('\n');
    }
    code = Blockly.Whalesong.logic_prime + '(' + number_to_check + ')';
    return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
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
      var divisor = Blockly.Whalesong.valueToCode(this, 'DIVISOR',
          Blockly.Whalesong.ORDER_MODULUS) || 'NaN';
      code = number_to_check + ' % ' + divisor + ' == 0';
      break;
  }
  return [code, Blockly.Whalesong.ORDER_EQUALITY];
};

Blockly.Whalesong.math_change = function() {
  // Add to a variable in place.
  var argument0 = Blockly.Whalesong.valueToCode(this, 'DELTA',
      Blockly.Whalesong.ORDER_ADDITION) || '0';
  var varName = Blockly.Whalesong.variableDB_.getName(
      this.getTitleValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' = (typeof ' + varName + ' == \'number\' ? ' + varName +
      ' : 0) + ' + argument0 + ';\n';
};

// Rounding functions have a single operand.
Blockly.Whalesong.math_round = Blockly.Whalesong.math_single;
// Trigonometry functions have a single operand.
Blockly.Whalesong.math_trig = Blockly.Whalesong.math_single;

Blockly.Whalesong.math_on_list = function() {
  // Math functions for lists.
  var func = this.getTitleValue('OP');
  var list, code;
  switch (func) {
    case 'SUM':
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_MEMBER) || '[]';
      code = list + '.reduce(function(x, y) {return x + y;})';
      break;
    case 'MIN':
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_COMMA) || '[]';
      code = 'Math.min.apply(null, ' + list + ')';
      break;
    case 'MAX':
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_COMMA) || '[]';
      code = 'Math.max.apply(null, ' + list + ')';
      break;
    case 'AVERAGE':
      // math_median([null,null,1,3]) == 2.0.
      if (!Blockly.Whalesong.definitions_['math_mean']) {
        var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
            'math_mean', Blockly.Generator.NAME_TYPE);
        Blockly.Whalesong.math_on_list.math_mean = functionName;
        var func = [];
        func.push('function ' + functionName + '(myList) {');
        func.push('  return myList.reduce(function(x, y) {return x + y;}) / ' +
                  'myList.length;');
        func.push('}');
        Blockly.Whalesong.definitions_['math_mean'] = func.join('\n');
      }
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_NONE) || '[]';
      code = Blockly.Whalesong.math_on_list.math_mean + '(' + list + ')';
      break;
    case 'MEDIAN':
      // math_median([null,null,1,3]) == 2.0.
      if (!Blockly.Whalesong.definitions_['math_median']) {
        var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
            'math_median', Blockly.Generator.NAME_TYPE);
        Blockly.Whalesong.math_on_list.math_median = functionName;
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
        Blockly.Whalesong.definitions_['math_median'] = func.join('\n');
      }
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_NONE) || '[]';
      code = Blockly.Whalesong.math_on_list.math_median + '(' + list + ')';
      break;
    case 'MODE':
      if (!Blockly.Whalesong.definitions_['math_modes']) {
        var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
            'math_modes', Blockly.Generator.NAME_TYPE);
        Blockly.Whalesong.math_on_list.math_modes = functionName;
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
        Blockly.Whalesong.definitions_['math_modes'] = func.join('\n');
      }
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_NONE) || '[]';
      code = Blockly.Whalesong.math_on_list.math_modes + '(' + list + ')';
      break;
    case 'STD_DEV':
      if (!Blockly.Whalesong.definitions_['math_standard_deviation']) {
        var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
            'math_standard_deviation', Blockly.Generator.NAME_TYPE);
        Blockly.Whalesong.math_on_list.math_standard_deviation = functionName;
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
        Blockly.Whalesong.definitions_['math_standard_deviation'] =
            func.join('\n');
      }
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_NONE) || '[]';
      code = Blockly.Whalesong.math_on_list.math_standard_deviation +
          '(' + list + ')';
      break;
    case 'RANDOM':
      if (!Blockly.Whalesong.definitions_['math_random_item']) {
        var functionName = Blockly.Whalesong.variableDB_.getDistinctName(
            'math_random_item', Blockly.Generator.NAME_TYPE);
        Blockly.Whalesong.math_on_list.math_random_item = functionName;
        var func = [];
        func.push('function ' + functionName + '(list) {');
        func.push('  var x = Math.floor(Math.random() * list.length);');
        func.push('  return list[x];');
        func.push('}');
        Blockly.Whalesong.definitions_['math_random_item'] = func.join('\n');
      }
      list = Blockly.Whalesong.valueToCode(this, 'LIST',
          Blockly.Whalesong.ORDER_NONE) || '[]';
      code = Blockly.Whalesong.math_on_list.math_random_item +
          '(' + list + ')';
      break;
    default:
      throw 'Unknown operator: ' + func;
  }
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.math_modulo = function() {
  // Remainder computation.
  var argument0 = Blockly.Whalesong.valueToCode(this, 'DIVIDEND',
      Blockly.Whalesong.ORDER_MODULUS) || '0';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'DIVISOR',
      Blockly.Whalesong.ORDER_MODULUS) || '0';
  var code = argument0 + ' % ' + argument1;
  return [code, Blockly.Whalesong.ORDER_MODULUS];
};

Blockly.Whalesong.math_constrain = function() {
  // Constrain a number between two limits.
  var argument0 = Blockly.Whalesong.valueToCode(this, 'VALUE',
      Blockly.Whalesong.ORDER_COMMA) || '0';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'LOW',
      Blockly.Whalesong.ORDER_COMMA) || '0';
  var argument2 = Blockly.Whalesong.valueToCode(this, 'HIGH',
      Blockly.Whalesong.ORDER_COMMA) || 'Infinity';
  var code = 'Math.min(Math.max(' + argument0 + ', ' + argument1 + '), ' +
      argument2 + ')';
  return [code, Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.math_random_int = function() {
  // Random integer between [X] and [Y].
  var argument0 = Blockly.Whalesong.valueToCode(this, 'FROM',
      Blockly.Whalesong.ORDER_COMMA) || '0';
  var argument1 = Blockly.Whalesong.valueToCode(this, 'TO',
      Blockly.Whalesong.ORDER_COMMA) || '0';
  return [Blockly.Whalesong.call_primitive("random", argument0, argument1), Blockly.Whalesong.ORDER_FUNCTION_CALL];
};

Blockly.Whalesong.math_random_float = function() {
  // Random fraction between 0 and 1.
  return [Blockly.Whalesong.call_primitive("random"), Blockly.Whalesong.ORDER_FUNCTION_CALL];
};
