
goog.provide('Ray.UI');

goog.require('Ray.UI.FunDef');
goog.require('Ray.UI.FunTab');
goog.require('Ray.UI.ResultsBox');
goog.require('Ray.UI.RunButton');
goog.require('Ray.UI.Util');

goog.require('Ray.Evaluation');
goog.require('Ray.Shared');
goog.require('Ray.UserFun');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.dom.dataset');
goog.require('goog.dom.xml');
goog.require('goog.net.XhrIo');
goog.require('goog.ui.ControlRenderer');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.FlatButtonRenderer');
goog.require('goog.ui.Button');
goog.require('goog.ui.LinkButtonRenderer');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.Tab');
goog.require('goog.ui.TabBar');
goog.require('goog.Uri.QueryData');



Ray.UI.serialize = function() {
  console.log('Serializing!');
  var xml = goog.dom.createDom('xml');
  var mainWorkspaceXml = Blockly.Xml.workspaceToDom(Ray.Shared.MainBlockly.mainWorkspace);
  goog.dom.xml.setAttributes(mainWorkspaceXml, {'kind' : 'main'});
  goog.dom.appendChild(xml, mainWorkspaceXml);
  goog.array.forEach(Ray.Shared.FunDefBlocklys, function(Blockly) {
    var userFunXml = goog.dom.createDom('user_function');
    goog.dom.xml.setAttributes(userFunXml, {'fun_id': String(Blockly.funId) });

    var funSpecXml = Ray.UserFun.funSpecToXml(Blockly);
    goog.dom.appendChild(userFunXml, funSpecXml);

    var funDefWorkspaceXml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    goog.dom.xml.setAttributes(funDefWorkspaceXml, {'kind' : 'user_function', 'fun_id' : String(Blockly.funId) });
    goog.dom.appendChild(userFunXml, funDefWorkspaceXml);

    goog.dom.appendChild(xml, userFunXml);
  }, this);
  console.log(xml);
  return xml;
};

Ray.UI.loadXmlString = function(xmlString) {
  var xml = goog.dom.xml.loadXml(xmlString);
  Ray.UI.deserialize(xml.childNodes[0]);
};

Ray.UI.toXmlString = function() {
  var xml = Ray.UI.serialize();
  var xmlString = goog.dom.xml.serialize(xml);
  return xmlString;
};

Ray.UI.deserialize = function(xml) {
  console.log('Deserializing');
  var mainWorkspaceXml = goog.dom.getFirstElementChild(xml);
  var userFuns = goog.array.toArray(goog.dom.getChildren(xml)).slice(1);
  goog.array.forEach(userFuns, function(userFun) {
    if(userFun.tagName !== 'user_function') {
      throw 'Unknown tag!';
    }
    var funSpecXml = userFun.childNodes[0];
    var funSpec = Ray.UserFun.xmlToFunSpec(funSpecXml);

    var funDefWorkspaceXml = userFun.childNodes[1];
    Ray.UI.createFunBlockly(funSpec, funDefWorkspaceXml);
  });
  Ray.Shared.MainBlockly.Xml.domToWorkspace(Ray.Shared.MainBlockly.mainWorkspace, mainWorkspaceXml);
  Ray.UI.tabBar.setSelectedTab(Ray.UI.mainTab);

};

Ray.UI.saveCurrentProgram = function() {
  var post = new goog.net.XhrIo();
  var queryData = new goog.Uri.QueryData();
  queryData.add('source', Ray.UI.toXmlString());
  post.send('/', 'POST', queryData.toString());
};


Ray.UI.VISIBLE_CONTAINER_CLASS = "container";
Ray.UI.HIDDEN_CONTAINER_CLASS = "hidden_container";

Ray.UI.isDisplayedContainer = function(workspace) {
  return goog.dom.classes.has(goog.dom.getParentElement(workspace), 'container');
};

Ray.UI.mainDom = function() {
  return goog.dom.getElement('blockly_main');
};

Ray.UI.resetTabBarPadding = function() {
  var tabBar = Ray.UI.tabBar;
  goog.style.setStyle(tabBar.getContentElement(), 'padding-top', '');
};

Ray.UI.setTabBarPadding = function(height) {
  var tabBar = Ray.UI.tabBar;
  goog.style.setStyle(tabBar.getContentElement(), 'paddingTop', height);

};

Ray.UI.getTabBarPadding = function() {
  var tabBar = Ray.UI.tabBar;
  return goog.style.getCascadedStyle(tabBar.getContentElement(), 'padding-top');
};

Ray.UI.resizePage = function() {

  /*
   * Set the height of the header, by adjusting either the results box or the left-hand side to match the opposite side
   */
  Ray.UI.resultsBox.resetSize();
  Ray.UI.resetTabBarPadding();

  var headerLeftHeight = goog.dom.getElement('header-left').offsetHeight;
  var headerRightHeight = goog.dom.getElement('header-right').offsetHeight;
  var headerRightWidth = goog.dom.getElement('header-right').offsetWidth;

  var difference;
  if(headerLeftHeight <= headerRightHeight) {
    difference = headerRightHeight - headerLeftHeight;
    Ray.UI.setTabBarPadding(Ray.UI.getTabBarPadding() + difference);
  } else {
    difference = headerLeftHeight - headerRightHeight;
    var resultsBoxSize = Ray.UI.resultsBox.getSize();
    Ray.UI.resultsBox.setSize(resultsBoxSize.width, resultsBoxSize.height + difference);
  }

  var resultsBoxSize = Ray.UI.resultsBox.getSize();
  var resultBoxMarginWidth = Ray.UI.resultsBox.getMarginWidth();
  Ray.UI.resultsBox.setSize(headerRightWidth - resultBoxMarginWidth, resultsBoxSize.height);

  /*
   * Set the height of the content area
   */
  var viewportHeight = window.innerHeight;
  var headerHeight = Ray.UI.header.offsetHeight;
  var contentHeight = viewportHeight - headerHeight;
  goog.style.setHeight(Ray.UI.workspaceContainer, contentHeight);

  /*
   * Set the height of the tabs so that they are all the same size
   */
};
Ray.UI.setupResizeListener = function() {
  goog.events.listen(window, goog.events.EventType.RESIZE, Ray.UI.resizePage);
};


Ray.UI.saveWorkspaceHeaderTabsContainer = function(header, tabs, container) {
  Ray.UI.header = header;
  Ray.UI.tabs = tabs;
  Ray.UI.workspaceContainer = container;
};


Ray.UI.setupTabBar = function(tabDivId, initialSelectedTabDivId) {
  var tabBar = new goog.ui.TabBar();
  tabBar.decorate(goog.dom.getElement(tabDivId));
  tabBar.getSelectedTab().workspaceId_ = initialSelectedTabDivId;
  Ray.UI.mainBlocklyTabId = initialSelectedTabDivId;
  Ray.UI.tabBar = tabBar;
  Ray.UI.mainTab = tabBar.getSelectedTab();
  Ray.UI.currentTab = tabBar.getSelectedTab();
  return tabBar;
};

Ray.UI.setMainBlockly = function(Blockly) {
  Ray.UI.mainTab.Blockly = Blockly;
  Ray.UI.runButton.watchMainWorkspace(Ray.UI.mainTab);
};

Ray.UI.listenForTabChanges = function() {
  goog.events.listen(Ray.UI.tabBar, goog.ui.Component.EventType.SELECT, function(e) {
    Ray.UI.selectTab(e.target);
  });
  goog.events.listen(Ray.UI.tabBar, goog.ui.Component.EventType.UNSELECT, function(e) {
    Ray.UI.deselectTab(e.target);
  });
};

Ray.UI.setupFunDefDialog = function(domHelper) {
  var dialog = Ray.UI.FunDef.makeDialog(domHelper);
  dialog.createDom();
  dialog.testPopulate_();
  Ray.UI.funDefDialog = dialog;
  return dialog;
};
Ray.UI.setupDialogCreateFunListener = function() {
  Ray.UI.funDefDialog.onCreate(Ray.UI.createFunBlockly);
};

Ray.UI.setupCreateFunButton = function(div) {
  var createFunButton = new goog.ui.Button(undefined, goog.ui.FlatButtonRenderer.getInstance());
  createFunButton.decorate(div);
  createFunButton.setContent(Ray.UI.Util.CREATE_FUN_BUTTON_TEXT);
  createFunButton.setTooltip(Ray.UI.Util.CREATE_FUN_BUTTON_TOOLTIP);
  goog.events.listen(createFunButton, goog.ui.Component.EventType.ACTION, function(e) {
    Ray.UI.funDefDialog.asCreate();
    Ray.UI.funDefDialog.setVisible(true);
  });
  Ray.UI.createFunButton = createFunButton;
  return createFunButton;
};

Ray.UI.setupRunButton = function(div) {
  var runButton = new Ray.UI.RunButton(div);
  Ray.UI.runButton = runButton;

  goog.events.listen(Ray.UI.runButton, goog.ui.Component.EventType.ACTION, function(e) {
    if(Ray.UI.Util.isMainWorkspaceOpen()) {
      var result = Ray.Evaluation.checkAllAndEval(Ray.UI.runButton);
      if(result.error_) {
        Ray.UI.resultsBox.showError(result);
      } else {
        Ray.UI.resultsBox.showValue(result);
      }
    } else {
      var currentTabBlockly = Ray.UI.tabBar.getSelectedTab().Blockly;
      Ray.Evaluation.checkFunTab(Ray.UI.runButton, currentTabBlockly);
    }
  });

  return runButton;
};

Ray.UI.setupLogoutButton = function(div)  {
  var logoutButton = new goog.ui.Button(undefined, goog.ui.FlatButtonRenderer.getInstance());
  logoutButton.decorate(div);
  logoutButton.logoutUrl = goog.dom.dataset.get(div, 'logoutUrl');
  goog.events.listen(logoutButton, goog.ui.Component.EventType.ACTION, function(e) {
    console.log('logging out!');
    Ray.UI.saveCurrentProgram();
    window.location = logoutButton.logoutUrl;
  });
};

Ray.UI.setupResultsBox = function(div) {
  var resultsBox = new Ray.UI.ResultsBox(div);
  Ray.UI.resultsBox = resultsBox;
  return resultsBox;
};

Ray.UI.switchDisplayedWorkspace = function(from, to) {
  goog.dom.classes.swap(goog.dom.getParentElement(from),
                        Ray.UI.VISIBLE_CONTAINER_CLASS,
                        Ray.UI.HIDDEN_CONTAINER_CLASS);
  goog.dom.classes.swap(goog.dom.getParentElement(to),
                        Ray.UI.HIDDEN_CONTAINER_CLASS,
                        Ray.UI.VISIBLE_CONTAINER_CLASS);
};

Ray.UI.selectTab = function(tab) {
  Ray.UI.currentTab = tab;
  var workspaceId = tab.workspaceId_;
  var containers = goog.dom.getChildren(Ray.UI.workspaceContainer);
  goog.array.forEach(containers, function(container) {
    var workspaceIframe = goog.dom.getFirstElementChild(container);
    if(workspaceIframe.id === workspaceId) {
      goog.dom.classes.swap(container, Ray.UI.HIDDEN_CONTAINER_CLASS, Ray.UI.VISIBLE_CONTAINER_CLASS);
    } else {
      goog.dom.classes.swap(container, Ray.UI.VISIBLE_CONTAINER_CLASS, Ray.UI.HIDDEN_CONTAINER_CLASS);
    }
  });
  if(tab.activate) {
    tab.activate();
  }
};

Ray.UI.deselectTab = function(tab) {
  if(tab.deactivate) {
    tab.deactivate();
  }
};

Ray.UI.loadMainBlockly = function(iframe, opt_loadString) {
  if(opt_loadString) {
    window._loadString = opt_loadString;
  }
  goog.dom.setProperties(iframe, {src: Ray.UI.Util.DIRECTORY_PREFIX + 'main_blockly.html'});
};

/**
 *
 * @param {HTMLIFrameElement} iframe
 * @param {Object} funDefInfo
 */
Ray.UI.loadFunDefBlockly = function(iframe, funDefInfo, opt_initialWorkspaceXml) {
  if(opt_initialWorkspaceXml) {
    window._initialWorkspaceXml = opt_initialWorkspaceXml;
  }
  window._funDefInfo = funDefInfo;
  goog.dom.setProperties(iframe, {src: Ray.UI.Util.DIRECTORY_PREFIX + 'fun_def_blockly.html'});
};

Ray.UI.initializeFunDefBlocklyDom = function() {
  var div = goog.dom.createDom('div', Ray.UI.HIDDEN_CONTAINER_CLASS,
                               goog.dom.createDom('iframe', {
                                 id: Ray.UI.Util.FUN_DEF_BLOCKLY_ID,
                                 src: "Javascript:''"}));
  goog.dom.appendChild(document.body, div);
};



Ray.UI.addFunDefWorkspaceDom = function(id) {
  var funDefDiv = goog.dom.createDom('div', 'hidden_container');
  var funDefIFrame = goog.dom.createDom('iframe', {
    id: Ray.UI.Util.funDefDomId(id),
    src: "Javascript:''"});
  goog.dom.appendChild(funDefDiv, funDefIFrame);
  goog.dom.appendChild(Ray.UI.workspaceContainer, funDefDiv);
  return funDefIFrame;
};

Ray.UI.funDefCount_ = 0;
Ray.UI.getFunId = function() {
  return Ray.UI.funDefCount_++;
};


Ray.UI.addFunDefWorkspaceTab = function(id) {
  var Blockly = Ray.Shared.lookupFunDefBlockly(id);

  var funDefTab = new Ray.UI.FunTab(Blockly);
  Ray.UI.tabBar.addChild(funDefTab, true);

  Blockly.funDefTab = funDefTab;

  funDefTab.onEdit(function(e) {
    Ray.UI.openFunDefEditor(Blockly);
  });

  Ray.UI.resizePage();
  return funDefTab;

};

Ray.UI.removeFunDef = function(id, funDefTab) {
  var tabBar = funDefTab.getParent();
  tabBar.removeChild(funDefTab, true);
  funDefTab.dispose();

  var funDefWorkspace = goog.dom.getElement(Ray.UI.Util.funDefDomId(id));
  if(Ray.UI.isDisplayedContainer(funDefWorkspace)) {
    Ray.UI.switchDisplayedWorkspace(funDefWorkspace, Ray.UI.mainDom());
  }

  goog.dom.removeNode(goog.dom.getParentElement(funDefWorkspace));

};

Ray.UI.openFunDefEditor = function(Blockly) {
  var dialog = Ray.UI.dialog;
  dialog.asEdit();
  dialog.onApplyChanges(function(e) {
    console.log('\'Apply changes\' clicked!');
    var funSpec = this.getFunSpec();
    Ray.Shared.applyFunDefChanges(Blockly.funId, funSpec);
  });
  dialog.onDelete(function(e) {
    console.log('\'Delete\' clicked!');
    if(Ray.UI.currentTab === Blockly.funDefTab) {
      Ray.UI.currentTab.stopPollingForStatus();
    }
    Ray.Shared.destroyFunGlobally(Blockly, Blockly.funId);
    Ray.UI.removeFunDef(Blockly.funId, Blockly.funDefTab);
  });
  dialog.setFunSpec(Blockly.funSpec);
  dialog.setVisible(true);
};

Ray.UI.createFunBlockly = function(funSpec, opt_initialWorkspaceXml) {
  funSpec.funId = Ray.UI.getFunId();
  var funBlocks = Ray.UserFun.makeFunAppAndArgBlocks(funSpec);
  var funArgBlocks = funBlocks.args;
  var funAppBlock = funBlocks.app;
  Ray.Shared.addToSavedBlocks(funAppBlock);

  var funDefWorkspace = Ray.UI.addFunDefWorkspaceDom(funSpec.funId);
  var funDefInfo = {
    funId: funSpec.funId,
    funArgBlockProtos: funArgBlocks,
    funAppBlockProto: funAppBlock,
    funName: funSpec.name,
    funSpec: funSpec
  };
  Ray.UI.loadFunDefBlockly(funDefWorkspace, funDefInfo, opt_initialWorkspaceXml);
  // We will create the tab and load it from the iframe
  Ray.UI.resizePage();

};