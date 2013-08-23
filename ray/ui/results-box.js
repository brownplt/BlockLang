
goog.provide('Ray.UI.ResultsBox');

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

Ray.UI.ResultsBox.prototype.showValue = function(valueMsg) {
  goog.style.setElementShown(this.errorMessageSpan_, false);
  goog.style.setElementShown(this.blocklyContainer_, false);
  goog.style.setElementShown(this.messageSpan_, true);
  goog.dom.setTextContent(this.messageSpan_, valueMsg);
};
