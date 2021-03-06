
goog.provide('Ray.ReadOnlyBlockly');

goog.require('Blockly');
goog.require('Blockly.Xml');

function loadReadOnlyBlockly() {
  // Context menus.
  Blockly.MSG_DUPLICATE_BLOCK = 'Duplicate';
  Blockly.MSG_REMOVE_COMMENT = 'Remove Comment';
  Blockly.MSG_ADD_COMMENT = 'Add Comment';
  Blockly.MSG_EXTERNAL_INPUTS = 'External Inputs';
  Blockly.MSG_INLINE_INPUTS = 'Inline Inputs';
  Blockly.MSG_DELETE_BLOCK = 'Delete Block';
  Blockly.MSG_DELETE_X_BLOCKS = 'Delete %1 Blocks';
  Blockly.MSG_COLLAPSE_BLOCK = 'Collapse Block';
  Blockly.MSG_EXPAND_BLOCK = 'Expand Block';
  Blockly.MSG_DISABLE_BLOCK = 'Disable Block';
  Blockly.MSG_ENABLE_BLOCK = 'Enable Block';
  Blockly.MSG_HELP = 'Help';
  Blockly.MSG_COLLAPSE_ALL = 'Collapse Blocks';
  Blockly.MSG_EXPAND_ALL = 'Expand Blocks';

  var Ray = window.parent.Ray;
  Ray.Shared.attachToBlockly(Blockly);

  Blockly.inject(document.body, {
    'readOnly': true,
    'path': "../../blockly/"
  });

  var callback = window.parent._callback;
  callback(Blockly);
}
