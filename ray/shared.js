goog.provide('Ray.Shared');

goog.require('Blockly');

Ray.Shared.set_ray_instance = function(r) {
  Ray.Shared.Ray = r;
};

Ray.Shared.save_block_xml = function(block) {
  var block_xml = Blockly.Xml.blockToDom_(block);
  var xy = block.getRelativeToSurfaceXY();
  block_xml.setAttribute('x', Blockly.RTL ? -xy.x : xy.x);
  block_xml.setAttribute('y', xy.y);
  Ray.Shared.saved_block_xml_ = block_xml;
};

Ray.Shared.load_block_xml = function(Blockly, workspace) {
  var block_xml = Ray.Shared.saved_block_xml_;
  var block = Blockly.Xml.domToBlock_(workspace, block_xml);
  var blockX = parseInt(block_xml.getAttribute('x'), 10);
  var blockY = parseInt(block_xml.getAttribute('y'), 10);
  if (!isNaN(blockX) && !isNaN(blockY)) {
    block.moveBy(Blockly.RTL ? -blockX : blockX, blockY);
  }
  block.Blockly = Blockly;
  return block;
};

Ray.Shared.attach_to_blockly = function(Blockly) {
  Blockly.Ray_ = Ray;
};
