
goog.provide('Ray.UI.ResultsBox');

goog.require('goog.style');
goog.require('goog.dom');
goog.require('goog.dom.classes');

// Do not put anything above this function, or else it will be erased when this function is defined.
Ray.UI.ResultsBox = function(div) {
  this.div_ = div;
  goog.style.setInlineBlock(div);
  goog.dom.setTextContent(this.div_, '...');
};

Ray.UI.ResultsBox.ERROR_CLASS = 'results_box-error';

Ray.UI.ResultsBox.prototype.showError = function(errorMsg) {
  goog.dom.classes.add(this.div_, Ray.UI.ResultsBox.ERROR_CLASS);
  goog.dom.setTextContent(this.div_, errorMsg);
};

Ray.UI.ResultsBox.prototype.showValue = function(valueMsg) {
  goog.dom.classes.remove(this.div_, Ray.UI.ResultsBox.ERROR_CLASS);
  goog.dom.setTextContent(this.div_, valueMsg);
};
