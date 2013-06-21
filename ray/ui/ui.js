goog.provide('Ray.UI');

goog.require('goog.dom');
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
  arg_type.addItem(new goog.ui.Option('Boolean'));
  arg_type.addItem(new goog.ui.Option('Char'));
  arg_type.addItem(new goog.ui.Option('Number'));
  arg_type.addItem(new goog.ui.Option('String'));
  arg_type.setSelectedIndex(0);
  arg_type.setDefaultCaption('Pick a type for this argument');
  arg_type.render(div);

  var arg_remove_button = new goog.ui.Button('-', goog.ui.FlatButtonRenderer.getInstance());
  arg_remove_button.render(div);

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

  goog.events.listen(arg_add_button.getContentElement(), goog.events.EventType.CLICK, function(e) {
    var arg = new Arg();
    this.arg_list_.addArg(arg);
    var arg_ui = new ArgUI(arg, this.getChildCount());
    this.addChild(arg_ui);
    arg_ui.initializeDom(args_div);
    goog.events.listen(arg_ui, ArgList.EventType.REMOVE_ARG_EVENT, this.onRemoveArg_, false, this);
  }, false, this);

  if(elem) {
    goog.dom.append(elem, container_div);
  }
  return container_div;

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

  var func_def = goog.dom.createDom('div', 'function_definition');


  goog.dom.append(func_def, "What will you name the function?");
  goog.dom.append(func_def, goog.dom.createElement('br'));
  var f_name = new goog.ui.LabelInput('name');
  f_name.render(func_def);

  goog.dom.append(func_def, goog.dom.createElement('br'));

  goog.dom.append(func_def, "Describe the input to the function:");
  goog.dom.append(func_def, goog.dom.createElement('br'));
  var f_desc = new goog.ui.LabelInput('description');
  f_desc.render(func_def);

  var arg_list = new ArgList([new Arg('x'), new Arg('y')]);
  var arg_list_container = new ArgListContainer(arg_list);
  arg_list_container.initializeDom(func_def);

  goog.dom.append(dialog.getContentElement(), func_def);
  //dialog.setVisible(true);
  return dialog;
};

Ray.UI.add_func_def_blockly = function() {
  var func_def_blockly = Ray.UI.make_blockly();
  goog.dom.classes.add(func_def_blockly, 'func_def_blockly');
  goog.dom.appendChild(document.body, func_def_blockly);
}

Ray.UI.show_func_def_blockly = function() {
  goog.style.showElement(goog.dom.getElementsByClass('container')[0], false);
  goog.style.showElement(goog.dom.getElementByClass('func_def_blockly'), true);
};

Ray.UI.hide_func_def_blockly = function() {
  goog.style.showElement(goog.dom.getElementsByClass('container')[0], true);
  goog.style.showElement(goog.dom.getElementByClass('func_def_blockly'), false);
};

Ray.UI.make_blockly = function() {
  return goog.dom.createDom('div', 'container',
                            goog.dom.createDom('iframe', {src: 'frame.html'}));
};

Ray.UI.add_blockly = function() {
  var blockly_div = Ray.UI.make_blockly();
  goog.dom.appendChild(document.body, blockly_div);
};
/**
Ray.FuncDefDialog.blockly_two = function() {
  var BlocklyTwo =
  var dom = goog.dom.getDomHelper(document.body);
  var dialog = new goog.ui.Dialog(null, false, dom);
  dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOkCancel());
  var b2 = goog.dom.createDom('div', 'container',
                                goog.dom.createDom('iframe',  {src: 'frame.html'}));
  dialog.setContent(b2.outerHTML);
  //dialog.setVisible(true);
  return dialog;
};
 */