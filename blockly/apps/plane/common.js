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
 * @fileoverview Blocks for plane demo.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

Blockly.Language.plane_set_seats = {
  // Seat variable setter.
  helpUrl: Blockly.LANG_VARIABLES_SET_HELPURL,
  deletable: false,
  init: function() {
    this.setColour(330);
    this.appendValueInput('VALUE')
        .appendTitle(MSG.setSeats);
    this.setTooltip(Blockly.LANG_VARIABLES_SET_TOOLTIP);
  }
};

Blockly.JavaScript = Blockly.Generator.get('JavaScript');

Blockly.JavaScript.plane_set_seats = function() {
  // Seat variable setter.
  var argument0 = Blockly.JavaScript.valueToCode(this, 'VALUE',
      Blockly.JavaScript.ORDER_ASSIGNMENT) || 'NaN';
  return argument0 + ';';
};

/**
 * 'Set seat' block.
 * @type Blockly.BlocK
 */
var seatsBlock = null;

/**
 * Initialize Blockly and the SVG.
 */
function init() {
  var toolbox = document.getElementById('toolbox');
  Blockly.inject(document.getElementById('svgDiv'),
                 {path: '../../', toolbox: toolbox});

  // Load the editor with a starting block.
  var xml = Blockly.Xml.textToDom(
      '<xml>' +
      '  <block type="plane_set_seats" x="70" y="70"></block>' +
      '</xml>');
  Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
  seatsBlock = Blockly.mainWorkspace.getTopBlocks(false)[0];

  Blockly.addChangeListener(recalculate);

  //window.onbeforeunload = function() {
  //  return 'Leaving this page will result in the loss of your work.';
  //};
}

/**
 * Use the blocks to calculate the number of seats.
 * Display the calculated number.
 */
function recalculate() {
  if (!planeSvg || !seatsBlock) {
    return;
  }
  var seats = NaN;
  var rows = planeSvg.rows;

  var generator = Blockly.Generator.get('JavaScript');
  generator.init();
  var code = generator.blockToCode(seatsBlock);
  try {
    seats = eval(code);
  } catch (e) {
    // Allow seats to remain NaN.
  }
  planeSvg.setText('seatText',
      MSG.seats.replace('%1', isNaN(seats) ? '?' : seats));
  planeSvg.setCorrect(isNaN(seats) ? null : (answer() == seats));
}

/**
 * The SVG's window.
 * @type Window
 */
var planeSvg = null;

/**
 * Callback when the plane's SVG image has loaded.
 * @param {!Window} w The image's window.
 */
function planeLoaded(w) {
  planeSvg = w;
}
