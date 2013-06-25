goog.provide('Ray.UI');

goog.require('Ray.Types');

goog.require('goog.dom');
goog.require('goog.dom.query');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.ui.Button');
goog.require('goog.ui.Container');
goog.require('goog.ui.ContainerRenderer');
goog.require('goog.ui.Control');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.Dialog.ButtonSet');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.FlatButtonRenderer');
goog.require('goog.ui.FlatMenuButtonRenderer');
goog.require('goog.ui.Option');
goog.require('goog.ui.Select');
goog.require('goog.ui.Tab');

Ray.UI.VISIBLE_CONTAINER_CLASS = "container";
Ray.UI.HIDDEN_CONTAINER_CLASS = "hidden_container";

/** @typedef {{type:Ray.Types.*, name: string}} */
var Arg = function(name, type) {
  this.name_ = name || 'x';
  this.type = type || null;
};
Arg.prototype.getName = function() {
  return this.name_;
};
Arg.prototype.setName = function(name) {
  this.name_ = name;
};
Arg.prototype.setType = function(type) {
  this.type_ = type;
};

RemoveArgEvent = function(argIndex) {
  goog.events.Event.call(this, ArgList.EventType.REMOVE_ARG_EVENT, argIndex);
  this.arg_index_ = argIndex;
};
goog.inherits(RemoveArgEvent, goog.events.Event);
RemoveArgEvent.prototype.getArgIndex = function() {
  return this.arg_index_;
};

/**
 * @extends {goog.ui.ControlRenderer}
 * @constructor
 */
var ArgList = function(args) {
  /**
   * @type {Array.<Ray.FuncDefDialog.Arg>}
   * @private
   */
  this.args_ = args ? goog.array.clone(args) : [];
};
ArgList.EventType = {
  REMOVE_ARG_EVENT: 'remove_arg_from_arg_list'
};
ArgList.prototype.getArgs = function() {
  return goog.array.clone(this.args_);
};
ArgList.prototype.removeArgAt = function(index) {
  if(this.args_.length > index && index >= 0) {
    var removed = this.args_.splice(index, 1);
    return removed[0]
  } else {
    throw "Index out of bounds!";
  }
};
ArgList.prototype.addArg = function(arg) {
  this.args_.push(arg);
};

var ArgUI = function(arg, ix) {
  goog.base(this);
  this.arg_ = arg;
  this.ix_ = ix;
};
goog.inherits(ArgUI, goog.events.EventTarget);
ArgUI.prototype.setArgIndex = function(ix) {
  this.ix_ = ix;
  if(this.arg_name_) {
    this.arg_name_.setLabel('arg' + String(this.ix_ + 1));
  }
};
ArgUI.prototype.getDivId = function() {
  return 'arg-control-' + this.ix_.toString();
};
ArgUI.prototype.getDom = function() {
  return this.dom_;
};
ArgUI.prototype.initializeDom = function(elem) {
  var div = goog.dom.createDom('div', {
    class: 'arg-control', id: this.getDivId()
  });
  var arg_name = new goog.ui.LabelInput('arg' + String(this.ix_ + 1));
  this.arg_name_ = arg_name;

  arg_name.render(div);
  if(this.arg_.getName().length) {
    arg_name.setValue(this.arg_.getName());
  }


  goog.dom.append(div, ' of type ');
  goog.dom.append(div, goog.dom.createDom('br'));

  var arg_type = new goog.ui.Select(null, null, goog.ui.FlatMenuButtonRenderer.getInstance(), goog.dom.getDomHelper(div));
  //arg_type.setRenderer(goog.ui.FlatMenuButtonRenderer.getInstance());
  goog.array.forEach(goog.object.getKeys(Ray.Types.atomic_types), function(type) {
    arg_type.addItem(new goog.ui.Option(type.toLocaleUpperCase(), type));
  });
  arg_type.setSelectedIndex(0);
  arg_type.setDefaultCaption('Pick a type for this argument');
  arg_type.render(div);
  this.arg_type_ = arg_type;

  var arg_remove_button = new goog.ui.Button('-', goog.ui.FlatButtonRenderer.getInstance());
  arg_remove_button.render(div);
  goog.style.setInlineBlock(arg_remove_button.getContentElement());

  goog.events.listen(arg_remove_button.getContentElement(), goog.events.EventType.CLICK, function(e) {
    console.log('arg_remove_button clicked, ix: ' + this.ix_);
    this.dispatchEvent(new RemoveArgEvent(this.ix_));
  }, false, this);

  if(elem) {
    goog.dom.append(elem, div);
  }
  this.dom_ = div;
  return div;
};
ArgUI.prototype.getName = function() {
  return this.arg_name_.getValue();
};
ArgUI.prototype.getType = function() {
  return this.arg_type_.getSelectedItem().getValue();
};

ArgListContainer = function(argList) {
  this.arg_list_ = argList;
  this.id_num = ArgListContainer.makeUniqueIdNum();
  this.children_ = [];
};
ArgListContainer.prototype.getDivId = function() {
  return 'arg-list-' + this.id_num.toString();
};
ArgListContainer.makeUniqueIdNum = (function() {
  var nextID = 0;
  return function() {
    return nextID++;
  }
})();
ArgListContainer.prototype.addChild = function(child) {
  this.children_.push(child);
  child.setParentEventTarget(this);
};
ArgListContainer.prototype.getChildAt = function(ix) {
  return this.children_[ix]
};
ArgListContainer.prototype.removeChildAt = function(ix) {
  this.children_.splice(ix, 1);
};
ArgListContainer.prototype.getChildCount = function() {
  return this.arg_list_.getArgs().length;
};
ArgListContainer.prototype.initializeDom = function(elem) {
  var container_div = goog.dom.createDom('div', {
    class: 'arg-list-container', id: this.getDivId()
  });
  var args_div = goog.dom.createDom('div', {
    class: 'arg-list'
  });
  goog.dom.append(container_div, args_div);

  this.dom_ = container_div;

  var args = this.arg_list_.getArgs();
  for(var ix = 0; ix < args.length; ix++) {
    var arg_ui = new ArgUI(args[ix], ix);
    this.addChild(arg_ui);
    arg_ui.initializeDom(args_div);
    goog.events.listen(arg_ui, ArgList.EventType.REMOVE_ARG_EVENT, this.onRemoveArg_, false, this);
  }

  var arg_add_button = new goog.ui.Button('+', goog.ui.FlatButtonRenderer.getInstance());
  arg_add_button.render(container_div);
  goog.style.setInlineBlock(arg_add_button.getContentElement());

  goog.events.listen(arg_add_button.getContentElement(), goog.events.EventType.CLICK, function(e) {
    this.addArg();
  }, false, this);

  if(elem) {
    goog.dom.append(elem, container_div);
  }
  return container_div;

};
ArgListContainer.prototype.addArg = function(arg) {
  if(!arg) {
    arg = new Arg();
  }
  this.arg_list_.addArg(arg);
  var arg_ui = new ArgUI(arg, this.getChildCount() - 1);
  this.addChild(arg_ui);
  if(this.dom_) {
    arg_ui.initializeDom(goog.dom.getElementByClass('arg-list', this.dom_));
  }
  goog.events.listen(arg_ui, ArgList.EventType.REMOVE_ARG_EVENT, this.onRemoveArg_, false, this);
};
ArgListContainer.prototype.onRemoveArg_ = function(e) {
  e.stopPropagation();
  console.log("Arg at " + e.arg_index_ + " removed");
  var ix = e.getArgIndex();
  goog.dom.removeNode(e.currentTarget.getDom());
  this.arg_list_.removeArgAt(ix);
  this.removeChildAt(ix);
  for(var i = ix; i < this.getChildCount(); i++) {
    this.getChildAt(i).setArgIndex(i);
  }
};
ArgListContainer.prototype.getArgNamesAndTypes = function() {
  var children = this.children_;
  return goog.array.map(children, function(child) {
    return {name: child.getName(), type: child.getType()};
  });
};

Ray.UI.make_function_definition_dialog = function() {
  var dom = goog.dom.getDomHelper(document.body);

  var dialog = new goog.ui.Dialog(null, true, dom);
  var dialog_buttons = new goog.ui.Dialog.ButtonSet();
  dialog_buttons.set('create', 'Create Function');
  dialog_buttons.set('cancel', 'Cancel');
  dialog_buttons.setCancel('cancel');
  dialog_buttons.setDefault('create');
  dialog.setButtonSet(dialog_buttons);
  dialog.setTitle("Define a new function");
  //var ok_button = dialog.getButtonSet().getButton('ok');
  /**goog.events.listen(ok_button, goog.events.EventType.CLICK, function(e) {
    console.log('OK!');
  }, false, this);*/

  var elem = dialog.getContentElement();

  goog.dom.append(elem, "What will you name the function?");
  goog.dom.append(elem, goog.dom.createElement('br'));

  var f_name = new goog.ui.LabelInput('name');
  dialog.addChild(f_name, true);

  goog.dom.append(elem, goog.dom.createElement('br'));

  goog.dom.append(elem, "Describe the input to the function:");
  goog.dom.append(elem, goog.dom.createElement('br'));
  var f_desc = new goog.ui.LabelInput('description');
  dialog.addChild(f_desc, true);

  goog.dom.append(elem, goog.dom.createElement('br'));
  goog.dom.append(elem, "This function consumes:");
  goog.dom.append(elem, goog.dom.createElement('br'));

  var arg_list = new ArgList();
  var arg_list_container = new ArgListContainer(arg_list);
  arg_list_container.initializeDom(elem);
  dialog.arg_list_container_ = arg_list_container;

  goog.dom.append(elem, "This function produces:");
  goog.dom.append(elem, goog.dom.createElement('br'));
  var return_type = new goog.ui.Select(null, null,
                                       goog.ui.FlatMenuButtonRenderer.getInstance());
  goog.array.forEach(goog.object.getKeys(Ray.Types.atomic_types), function(type) {
    return_type.addItem(new goog.ui.Option(type.toLocaleUpperCase(), type));
  });
  return_type.setSelectedIndex(0);
  return_type.setDefaultCaption('Pick a return type for this function');
  dialog.addChild(return_type, true);

  return dialog;
};

Ray.UI.populate_dialog_w_test_data = function(dialog) {
  dialog.getChildAt(0).setValue('double');
  dialog.getChildAt(1).setValue('doubles a number');
  dialog.arg_list_container_.addArg();
  dialog.arg_list_container_.getChildAt(0).arg_type_.setSelectedIndex(1);
  dialog.getChildAt(2).setSelectedIndex(1);
};

Ray.UI.get_function_definition_dialog_values = function(dialog) {
  var name = dialog.getChildAt(0).getValue();
  var desc = dialog.getChildAt(1).getValue();
  var args = dialog.arg_list_container_.getArgNamesAndTypes();
  var return_type = dialog.getChildAt(2).getSelectedItem().getValue();
  return {name: name, desc: desc, args: args, return_type: return_type};
};

Ray.UI.switch_displayed_blockly = function(from, to) {
  goog.dom.classes.swap(goog.dom.getParentElement(from),
                        Ray.UI.VISIBLE_CONTAINER_CLASS,
                        Ray.UI.HIDDEN_CONTAINER_CLASS);
  goog.dom.classes.swap(goog.dom.getParentElement(to),
                        Ray.UI.HIDDEN_CONTAINER_CLASS,
                        Ray.UI.VISIBLE_CONTAINER_CLASS);
};

Ray.UI.show_workspace_from_tab = function(tab, workspace_content) {
  var active_workspace_id = tab.workspace_id_;
  var containers = goog.dom.getChildren(workspace_content);
  goog.array.forEach(containers, function(container) {
    var workspace = goog.dom.getFirstElementChild(container);
    if(workspace.id === active_workspace_id) {
      goog.dom.classes.swap(container, Ray.UI.HIDDEN_CONTAINER_CLASS, Ray.UI.VISIBLE_CONTAINER_CLASS);
    } else {
      goog.dom.classes.swap(container, Ray.UI.VISIBLE_CONTAINER_CLASS, Ray.UI.HIDDEN_CONTAINER_CLASS);
    }
  });
};

Ray.UI.add_function_definition_workspace_dom = function(function_name, container) {
  var func_def_div = goog.dom.createDom('div', 'hidden_container');
  var func_def_iframe = goog.dom.createDom('iframe', {
    id: 'blockly_function_definition_' + function_name,
    src: "Javascript:''"});
  goog.dom.appendChild(func_def_div, func_def_iframe);
  goog.dom.appendChild(container, func_def_div);
  return func_def_iframe;
};

Ray.UI.add_function_definition_workspace_tab = function(function_name, tabbar) {
  var func_def_tab = new goog.ui.Tab('Edit ' + function_name); //goog.ui.RoundedTabRenderer.getInstance());
  func_def_tab.workspace_id_ = 'blockly_function_definition_' + function_name;
  tabbar.addChild(func_def_tab, true);
  return func_def_tab;
};
