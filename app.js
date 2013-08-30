
goog.provide('Ray.App');

/** Ray Imports */
goog.require('Ray.Main');
goog.require('Ray.Shared');
goog.require('Ray.UI');
/** Closure Library Imports */
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');

function loadPage() {
  // This is the entry point for the application
  Ray.Main.initializeLibrary();
  var blocks = Ray.Main.createBlocks();
  Ray.Shared.setBlocks(blocks);
  Ray.Shared.attachToBlockly(Blockly);

  Ray.UI.setupFunDefDialog(goog.dom.getDomHelper(document.body));

  Ray.UI.setupTabBar('workspace_tabs', 'blockly_main');

  Ray.UI.saveWorkspaceHeaderTabsContainer(goog.dom.getElement('header'),
                                          goog.dom.getElement('workspace_tabs'),
                                          goog.dom.getElement('workspace_container'));


  Ray.UI.setupCreateFunButton(goog.dom.getElement('create_function_button'));

  Ray.UI.setupRunButton(goog.dom.getElement('run_button'));

  Ray.UI.setupResultsBox(goog.dom.getElement('results_box'));

  Ray.UI.resizePage();
  Ray.UI.setupResizeListener();

  Ray.UI.setupDialogCreateFunListener();

  Ray.UI.listenForTabChanges();

  // Ray.Main.initializeMainBlocklyDom();
  // Ray.UI.initializeFunDefBlocklyDom();
  Ray.UI.loadMainBlockly(Ray.UI.Util.mainBlockly());

  goog.events.listen(window, goog.events.EventType.BEFOREUNLOAD, function(e) {
    return 'If you leave the page, any unsaved programs will be lost!';
  });
}