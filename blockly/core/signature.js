/**
 * Visual Blocks Editor
 *
 * Copyright 2011 Google Inc.
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
 * @fileoverview Signature tray containing blocks which may be created.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Signature');

goog.require('Blockly.Block');
goog.require('Blockly.Comment');


/**
 * Class for a signature.
 * @constructor
 */
Blockly.Signature = function(argBlockNames, appBlockName) {
  /**
   * @type {!Blockly.Workspace}
   * @private
   */
  this.workspace_ = new Blockly.Workspace(false);

  /**
   * Opaque data that can be passed to removeChangeListener.
   * @type {Array.<!Array>}
   * @private
   */
  this.changeWrapper_ = null;

  /**
   * @type {number}
   * @private
   */
  this.width_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.height_ = 0;

  /**
   * List of background buttons that lurk behind each block to catch clicks
   * landing in the blocks' lakes and bays.
   * @type {!Array.<!Element>}
   * @private
   */
  this.buttons_ = [];

  this.argBlockNames_ = argBlockNames;
  this.appBlockName_ = appBlockName;
};

/**
 * Does the signature automatically close when a block is created?
 * @type {boolean}
 */
Blockly.Signature.prototype.autoClose = false;

/**
 * Corner radius of the signature background.
 * @type {number}
 * @const
 */
Blockly.Signature.prototype.CORNER_RADIUS = 8;

/**
 * Wrapper function called when a resize occurs.
 * @type {Array.<!Array>}
 * @private
 */
Blockly.Signature.prototype.onResizeWrapper_ = null;

/**
 * Creates the signature's DOM.  Only needs to be called once.
 * @return {!Element} The signature's SVG group.
 */
Blockly.Signature.prototype.createDom = function() {
  /*
  <g>
    <path class="blocklySignatureBackground"/>
    <g></g>
  </g>
  */
  this.svgGroup_ = Blockly.createSvgElement('g', {}, null);
  this.svgBackground_ = Blockly.createSvgElement('path',
      {'class': 'blocklySignatureBackground'}, this.svgGroup_);
  this.svgOptions_ = Blockly.createSvgElement('g', {}, this.svgGroup_);
  this.svgOptions_.appendChild(this.workspace_.createDom());
  return this.svgGroup_;
};

/**
 * Dispose of this signature.
 * Unlink from all DOM elements to prevent memory leaks.
 */
Blockly.Signature.prototype.dispose = function() {
  if (this.onResizeWrapper_) {
    Blockly.unbindEvent_(this.onResizeWrapper_);
    this.onResizeWrapper_ = null;
  }
  if (this.changeWrapper_) {
    Blockly.unbindEvent_(this.changeWrapper_);
    this.changeWrapper_ = null;
  }
  if (this.scrollbar_) {
    this.scrollbar_.dispose();
    this.scrollbar_ = null;
  }
  this.workspace_ = null;
  if (this.svgGroup_) {
    goog.dom.removeNode(this.svgGroup_);
    this.svgGroup_ = null;
  }
  this.svgBackground_ = null;
  this.svgOptions_ = null;
  this.targetWorkspace_ = null;
  this.targetWorkspaceMetrics_ = null;
  this.buttons_.splice(0);
};

/**
 * Return an object with all the metrics required to size scrollbars for the
 * signature.  The following properties are computed:
 * .viewHeight: Height of the visible rectangle,
 * .viewWidth: Width of the visible rectangle,
 * .contentHeight: Height of the contents,
 * .viewTop: Offset of top edge of visible rectangle from parent,
 * .contentTop: Offset of the top-most content from the y=0 coordinate,
 * .absoluteTop: Top-edge of view.
 * .absoluteLeft: Left-edge of view.
 * @return {Object} Contains size and position metrics of the signature.
 */
Blockly.Signature.prototype.getMetrics = function() {
  if (!this.isVisible()) {
    // Signature is hidden.
    return null;
  }
  var viewHeight = this.height_;
  var viewWidth = this.width_  - 2 * this.CORNER_RADIUS;
  try {
    var optionBox = this.svgOptions_.getBBox();
  } catch (e) {
    // Firefox has trouble with hidden elements (Bug 528969).
    var optionBox = {width: 0, x: 0};
  }
  return {
    viewHeight: viewHeight,
    viewWidth: viewWidth,
    contentWidth: optionBox.width + optionBox.x,
    viewLeft: -this.svgOptions_.scrollX,
    contentTop: 0,
    absoluteTop: 0,
    absoluteLeft: this.CORNER_RADIUS
  };
};

/**
 * Sets the Y translation of the signature to match the scrollbars.
 * @param {!Object} yRatio Contains a y property which is a float
 *     between 0 and 1 specifying the degree of scrolling.
 */
Blockly.Signature.prototype.setMetrics = function(xRatio) {
  var metrics = this.getMetrics();
  if (goog.isNumber(xRatio.x)) {
    this.svgOptions_.scrollX =
        -metrics.contentWidth * xRatio.x - metrics.contentLeft;
  }
  var x = this.svgOptions_.scrollX + metrics.absoluteLeft;
  this.svgOptions_.setAttribute('transform', 'translate(' + x + ', 0)');
};

/**
 * Initializes the signature.
 * @param {!Blockly.Workspace} workspace The workspace in which to create new
 *     blocks.
 * @param {!Function} workspaceMetrics Function which returns size information
 *     regarding the signature's target workspace.
 * @param {boolean} withScrollbar True if a scrollbar should be displayed.
 */
Blockly.Signature.prototype.init =
    function(workspace, workspaceMetrics, withScrollbar) {
  this.targetWorkspace_ = workspace;
  this.targetWorkspaceMetrics_ = workspaceMetrics;
  // Add scrollbar.
  var signature = this;
  if (withScrollbar) {
    this.scrollbar_ = new Blockly.Scrollbar(this.svgOptions_,
        function() {return signature.getMetrics();},
        function(ratio) {return signature.setMetrics(ratio);},
        true, false); // Horizontal, not vertical
  }

  this.hide();

  // If the document resizes, reposition the signature.
  this.onResizeWrapper_ = Blockly.bindEvent_(window,
      goog.events.EventType.RESIZE, this, this.position_);
  this.position_();
  this.changeWrapper_ = Blockly.bindEvent_(this.targetWorkspace_.getCanvas(),
      'blocklyWorkspaceChange', this, this.filterForCapacity_);
};

/**
 * Move the toolbox to the edge of the workspace.
 * @private
 */
Blockly.Signature.prototype.position_ = function() {
  if (!this.isVisible()) {
    return;
  }
  var metrics = this.targetWorkspaceMetrics_();
  if (!metrics) {
    // Hidden components will return null.
    return;
  }
  var edgeHeight = this.height_ - this.CORNER_RADIUS;

  var path = ['M ' + '0,0'];
  path.push('v', edgeHeight);
  path.push('a', this.CORNER_RADIUS, this.CORNER_RADIUS, 0, 0,
       0,
       this.CORNER_RADIUS,
       this.CORNER_RADIUS);
  path.push('h', Math.max(0, metrics.viewWidth - this.CORNER_RADIUS * 2));
  path.push('a', this.CORNER_RADIUS, this.CORNER_RADIUS, 0, 0,
       0,
       this.CORNER_RADIUS,
       -this.CORNER_RADIUS);
  path.push('v', -edgeHeight);
  path.push('z');
  this.svgBackground_.setAttribute('d', path.join(' '));

  var y = metrics.absoluteTop;

  this.svgGroup_.setAttribute('transform',
      'translate(' + metrics.absoluteLeft + ',' + y + ')');

  // Record the height for Blockly.Signature.getMetrics.
  this.width_ = metrics.viewWidth;
};

/**
 * Is the signature visible?
 * @return {boolean} True if visible.
 */
Blockly.Signature.prototype.isVisible = function() {
  return this.svgGroup_.style.display == 'block';
};

/**
 * Hide and empty the signature.
 */
Blockly.Signature.prototype.hide = function() {
  if (!this.isVisible()) {
    return;
  }
  this.svgGroup_.style.display = 'none';
  // Delete all the blocks.
  var blocks = this.workspace_.getTopBlocks(false);
  for (var x = 0, block; block = blocks[x]; x++) {
    block.dispose(false, false);
  }
  // Delete all the background buttons.
  for (var x = 0, rect; rect = this.buttons_[x]; x++) {
    Blockly.unbindEvent_(rect.wrapper_);
    goog.dom.removeNode(rect);
  }
  this.buttons_.splice(0);
};

Blockly.Signature.prototype.makeTextAt = function(text, cursorX, margin) {
  var funTitle = Blockly.createSvgElement('text', {
    'class': 'blocklyText blocklySignatureText',
    'x': cursorX,
    'y': margin + Blockly.BlockSvg.TAB_HEIGHT + Blockly.BlockSvg.MIN_BLOCK_Y
  }, this.svgGroup_);
  var funTitleText = document.createTextNode(text);
  goog.dom.appendChild(funTitle, funTitleText);
  return funTitle;
};

Blockly.Signature.prototype.advanceCursor = function(text, margin) {
  return text.getComputedTextLength() + margin * 2;
};

Blockly.Signature.prototype.markChildrenInSignature = function(block) {
  var allBlocks = block.getDescendants();
  for (var j = 0, child; child = allBlocks[j]; j++) {
    // Mark blocks as being inside a signature.  This is used to detect and prevent
    // the closure of the signature if the user right-clicks on such a block.
    child.isInSignature = true;
    // There is no good way to handle comment bubbles inside the signature.
    // Blocks shouldn't come with predefined comments, but someone will
    // try this, I'm sure.  Kill the comment.
    Blockly.Comment && child.setCommentText(null);
  }
};

/**
 * Show and populate the signature.
 * @param {!Array|string} xmlList List of blocks to show.
 *     Variables and procedures have a custom set of blocks.
 */
Blockly.Signature.prototype.show = function() {
  this.hide();
  var margin = this.CORNER_RADIUS;
  this.svgGroup_.style.display = 'block';

  // Create the blocks to be shown in this signature.
  var blocks = [];
  var gaps = [];

  goog.array.forEach(this.argBlockNames_, function(argBlockName) {
    var block = new Blockly.Block(this.workspace_, argBlockName);
    block.initSvg();
    blocks.push(block);
    gaps.push(margin);
  }, this);

  // Lay out the blocks horizontally.
  var signatureHeight = 0;
  var cursorX = margin + Blockly.BlockSvg.NOTCH_WIDTH;

  //var funTitle = this.makeTextAt(Blockly.FunName, cursorX, margin);
  //cursorX += this.advanceCursor(funTitle, margin);

  var appBlock = new Blockly.Block(this.workspace_, this.appBlockName_);
  appBlock.initSvg();

  this.markChildrenInSignature(appBlock);
  appBlock.render();
  var bBox = appBlock.getSvgRoot().getBBox();
  var y = margin + Blockly.BlockSvg.TAB_HEIGHT;
  appBlock.moveBy(cursorX, y);
  signatureHeight = Math.max(signatureHeight, bBox.height);
  cursorX += bBox.width;// + gaps[i];
  Blockly.bindEvent_(appBlock.getSvgRoot(), 'mousedown', null,
                     Blockly.Signature.createBlockFunc_(this,block));


  var consumes = this.makeTextAt('consumes', cursorX, margin);
  cursorX += this.advanceCursor(consumes, margin);

  for (var i = 0, block; block = blocks[i]; i++) {
    this.markChildrenInSignature(block);
    block.render();
    var bBox = block.getSvgRoot().getBBox();
    var y = margin + Blockly.BlockSvg.TAB_HEIGHT;
    block.moveBy(cursorX, y);
    signatureHeight = Math.max(signatureHeight, bBox.height);
    cursorX += bBox.width;// + gaps[i];
    if (!block.disabled) {
      Blockly.bindEvent_(block.getSvgRoot(), 'mousedown', null,
                         Blockly.Signature.createBlockFunc_(this, block));
    }

    if(i != blocks.length - 1) {
      var comma = this.makeTextAt(',', cursorX, margin);
      cursorX += this.advanceCursor(comma, margin);
    }

  }

  var produces = this.makeTextAt('produces', cursorX, margin);
  cursorX += this.advanceCursor(produces, margin);

  var typeBlock = Blockly.Ray_.Blocks.typeNameBlock(Blockly.FunSpec.returnType);
  block = new Blockly.Block(this.workspace_, typeBlock);
  block.initSvg();

  this.markChildrenInSignature(block);
  block.render();
  var bBox = block.getSvgRoot().getBBox();
  var y = margin + Blockly.BlockSvg.TAB_HEIGHT;
  block.moveBy(cursorX, y);
  signatureHeight = Math.max(signatureHeight, bBox.height);
  cursorX += bBox.width;// + gaps[i];

  signatureHeight += margin + Blockly.BlockSvg.TAB_HEIGHT + margin / 2 +
                     Blockly.Scrollbar.scrollbarThickness;



  for (var i = 0, block; block = blocks[i]; i++) {

    // Create an invisible rectangle over the block to act as a button.  Just
    // using the block as a button is poor, since blocks have holes in them.
    var bBox = block.getSvgRoot().getBBox();
    var xy = block.getRelativeToSurfaceXY();
    var rect = Blockly.createSvgElement('rect',
        {'width': bBox.width, 'height': bBox.height,
        'x': xy.x + bBox.x, 'y': xy.y + bBox.y,
        'fill-opacity': 0}, null);
    // Add the rectangles under the blocks, so that the blocks' tooltips work.
    this.svgOptions_.insertBefore(rect, this.svgOptions_.firstChild);
    rect.wrapper_ = Blockly.bindEvent_(rect, 'mousedown', null,
        Blockly.Signature.createBlockFunc_(this, block));
    this.buttons_[i] = rect;
  }
  // Record the width for .getMetrics and .position_.
  this.height_ = signatureHeight;

  this.filterForCapacity_();

  // Fire a resize event to update the signature's scrollbar.
  Blockly.fireUiEvent(window, 'resize');
};

/**
 * Create a copy of this block on the workspace.
 * @param {!Blockly.Signature} signature Instance of the signature.
 * @param {!Blockly.Block} originBlock The signature block to copy.
 * @return {!Function} Function to call when block is clicked.
 * @private
 */
Blockly.Signature.createBlockFunc_ = function(signature, originBlock) {
  return function(e) {
    if (Blockly.isRightButton(e)) {
      // Right-click.  Don't create a block, let the context menu show.
      return;
    }
    if (originBlock.disabled) {
      // Beyond capacity.
      return;
    }
    // Create the new block by cloning the block in the signature (via XML).
    var xml = Blockly.Xml.blockToDom_(originBlock);
    var block = Blockly.Xml.domToBlock_(signature.targetWorkspace_, xml);
    // Place it in the same spot as the signature copy.
    var svgRoot = originBlock.getSvgRoot();
    if (!svgRoot) {
      throw 'originBlock is not rendered.';
    }
    var xyOld = Blockly.getSvgXY_(svgRoot);
    var xyNew = Blockly.getSvgXY_(signature.targetWorkspace_.getCanvas());
    block.moveBy(xyOld.x - xyNew.x, xyOld.y - xyNew.y);
    block.render();
    if (signature.autoClose) {
      signature.hide();
    } else {
      signature.filterForCapacity_();
    }
    // Start a dragging operation on the new block.
    block.onMouseDown_(e);
  };
};

/**
 * Filter the blocks on the signature to disable the ones that are above the
 * capacity limit.
 */
Blockly.Signature.prototype.filterForCapacity_ = function() {
  var remainingCapacity = this.targetWorkspace_.remainingCapacity();
  var blocks = this.workspace_.getTopBlocks(false);
  for (var i = 0, block; block = blocks[i]; i++) {
    var allBlocks = block.getDescendants();
    var disabled = allBlocks.length > remainingCapacity;
    block.setDisabled(disabled);
  }
};
