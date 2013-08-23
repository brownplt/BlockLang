
goog.provide('Ray.UI.ResultsBox');

goog.require('Ray.Blocks');
goog.require('Ray.Shared');

goog.require('goog.style');
goog.require('goog.dom');
goog.require('goog.dom.classes');

// Do not put anything above this function, or else it will be erased when this function is defined.
Ray.UI.ResultsBox = function(div) {
  this.div_ = div;

  goog.style.setInlineBlock(div);
  //goog.dom.setTextContent(this.div_, '...');

  this.errorMessageSpan_ = goog.dom.createDom('span', {'class': Ray.UI.ResultsBox.ERROR_CLASS});
  goog.dom.appendChild(this.div_, this.errorMessageSpan_);
  goog.style.setElementShown(this.errorMessageSpan_, false);

  this.messageSpan_ = goog.dom.createDom('span', {});
  goog.dom.appendChild(this.div_, this.messageSpan_);
  goog.style.setElementShown(this.messageSpan_, false);



  this.blocklyContainer_ = goog.dom.createDom('iframe', {'src': "Javascript:''"});
  goog.dom.appendChild(this.div_, this.blocklyContainer_);
  goog.style.setElementShown(this.blocklyContainer_, false);
  goog.style.setSize(this.blocklyContainer_,
                     Ray.UI.ResultsBox.INITIAL_BLOCKLY_WIDTH,
                     Ray.UI.ResultsBox.INITIAL_BLOCKLY_HEIGHT);
  Ray.UI.Util.loadBlocklyAsObjField(this, this.blocklyContainer_);
};

Ray.UI.ResultsBox.ERROR_CLASS = 'results_box-error';

Ray.UI.ResultsBox.INITIAL_BLOCKLY_WIDTH = 200;
Ray.UI.ResultsBox.INITIAL_BLOCKLY_HEIGHT = 80;

Ray.UI.ResultsBox.prototype.showError = function(errorMsg) {
  goog.style.setElementShown(this.blocklyContainer_, false);
  goog.style.setElementShown(this.messageSpan_, false);
  goog.dom.setTextContent(this.errorMessageSpan_, errorMsg);
  goog.style.setElementShown(this.errorMessageSpan_, true);
};

Ray.UI.ResultsBox.prototype.showValue = function(value) {
  if(!this.Blockly_) {
    setTimeout(goog.bind(this.showValue, this), 200);
    return;
  }

  var block = this.getPrimitiveDataBlockFromValue(value);
  block.initSvg();
  block.render();
  this.Blockly_.svgResize();
  var xy = block.getRelativeToSurfaceXY();
  block.moveBy(this.Blockly_.BlockSvg.SEP_SPACE_X + this.Blockly_.BlockSvg.TAB_WIDTH - xy.x, this.Blockly_.BlockSvg.SEP_SPACE_Y - xy.y);

  goog.style.setElementShown(this.errorMessageSpan_, false);
  goog.style.setElementShown(this.blocklyContainer_, true);
  goog.style.setElementShown(this.messageSpan_, true);
};

Ray.UI.ResultsBox.prototype.getPrimitiveDataBlockFromValue = function(value) {
  var blockProto = null;
  switch (Ray.Runtime.valueType(value)) {
    case Ray.Globals.Values.Boolean:
    case Ray.Globals.Values.Num:
    case Ray.Globals.Values.Str:
    case Ray.Globals.Values.Char:
      var type = Ray.UI.ResultsBox.getTypeFromValue(value);
      blockProto = Ray.Shared.getSavedBlock(Ray.Blocks.primitiveDataBlockName(type.display()));
      break;
    default:
      throw 'No primitive data block for this kind of value';
      break;
  }

  if(!blockProto) {
    throw 'No prototype found!';
  }

  var block = new this.Blockly_.Block(this.Blockly_.mainWorkspace, blockProto);

  switch (Ray.Runtime.valueType(value)) {
    case Ray.Globals.Values.Boolean:
      block.getTitle_('B').setValue(value.b ? 'TRUE' : 'FALSE');
      break;
    case Ray.Globals.Values.Num:
      block.getTitle_('N').setText(value.n.toString());
      break;
    case Ray.Globals.Values.Str:
      block.getTitle_('S').setText(value.s);
      break;
    case Ray.Globals.Values.Char:
      block.getTitle_('C').setText(value.c);
      break;
    default:
      throw 'Unknown value type';
      break;
  }

  return block;

};

Ray.UI.ResultsBox.getTypeFromValue = function(value) {
  switch (Ray.Runtime.valueType(value)) {
    case Ray.Globals.Values.Boolean:
      return new Ray.Types.Boolean();
      break;
    case Ray.Globals.Values.Num:
      return new Ray.Types.Num();
      break;
    case Ray.Globals.Values.Str:
      return new Ray.Types.Str();
      break;
    case Ray.Globals.Values.Char:
      return new Ray.Types.Char();
      break;
    default:
      throw 'No type found for this value!';
      break;
  }
};
