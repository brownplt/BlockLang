
goog.provide('Ray.FunDefBlockly');

goog.require('Blockly');
goog.require('Blockly.Xml');

function loadFunDefBlockly() {
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
  Ray.Shared.registerFunDefBlockly(Blockly);
  var funDefInfo = window.parent._funDefInfo;
  var initialWorkspaceXml = window.parent._initialWorkspaceXml;

  Blockly.funArgBlockProtos = funDefInfo.funArgBlockProtos;
  Blockly.funAppBlockProto = funDefInfo.funAppBlockProto;
  Blockly.funSpec = funDefInfo.funSpec;
  Blockly.funId = funDefInfo.funId;
  Blockly.funDef = true;

  Blockly.inject(document.body,
                 {path: "../../blockly/", toolbox:
                   Ray.Shared.getToolbox(true)});

  if(initialWorkspaceXml) {
    Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, initialWorkspaceXml);
  }

  var signature = new Blockly.Signature();

  Blockly.mainWorkspace.signature_ = signature;
  var signatureSvg = signature.createDom();
  Blockly.mainWorkspace.signature_.init(Blockly.mainWorkspace,
                                        Blockly.getMainWorkspaceMetrics,
                                        true);
  goog.dom.insertSiblingAfter(signatureSvg, Blockly.mainWorkspace.getBubbleCanvas());

  var funDefTab = Ray.UI.addFunDefWorkspaceTab(Blockly.funSpec.funId);
  Ray.UI.tabBar.setSelectedTab(funDefTab);
  /**
   * I have to open the signature after I've switched to the workspace since Firefox (<= 23.0.1)
   * will throw an exception if I try to call getBBox on an SVGElement that is hidden,
   * so I have to make sure that the whole tab is being shown in order to computer the
   * rendering for the signature.
   */
  Blockly.mainWorkspace.signature_.open();

}