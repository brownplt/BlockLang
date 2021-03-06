
goog.provide('Ray.UserFun');

goog.require('Ray.Blocks');
goog.require('Ray.Blocks.UserFun');
goog.require('Ray.Evaluation');
goog.require('Ray.Runtime');


Ray.UserFun.makeFunArgBlocks = function(args, funId) {
  return Ray.Blocks.UserFun.generateArgBlocks(args, funId);
};

Ray.UserFun.makeFunAppBlock = function(name, returnType, argSpec, funId) {
  // Leave body and envs empty here
  var value = new Ray.Runtime.Value.Closure(argSpec,
                                            null, null,
                                            returnType);
  return Ray.Blocks.UserFun.generateAppBlock(name, value, funId);
};

Ray.UserFun.makeFunAppAndArgBlocks = function(funSpec) {
  var argSpec = Ray.Evaluation.createFunArgSpec(funSpec, true);
  var argBlocks = Ray.UserFun.makeFunArgBlocks(funSpec.args, funSpec.funId);
  var appBlock = Ray.UserFun.makeFunAppBlock(funSpec.name, funSpec.returnType, argSpec, funSpec.funId);
  return { 'args': argBlocks, 'app': appBlock };
};

Ray.UserFun.funSpecToXml = function(Blockly) {

  var xml = goog.dom.createDom('user_function_specification');
  goog.dom.xml.setAttributes(xml, {'fun_id': Blockly.funId });

  var funNameElement = goog.dom.createDom('name');
  goog.dom.appendChild(funNameElement, goog.dom.createTextNode(Blockly.funSpec.name));
  goog.dom.appendChild(xml, funNameElement);

  var funDescElement = goog.dom.createDom('description');
  goog.dom.appendChild(funDescElement, goog.dom.createTextNode(Blockly.funSpec.desc));
  goog.dom.appendChild(xml, funDescElement);

  var funArgs = Blockly.funSpec.args;
  goog.array.forEach(funArgs, function(arg) {
    var funArgElement = goog.dom.createDom('arg');
    var funArgAttributes = {
      'name' : arg.getName(),
      'type' : arg.getType().display()
    };
    goog.dom.xml.setAttributes(funArgElement, funArgAttributes);
    goog.dom.appendChild(xml, funArgElement);
  }, this);

  var funReturnTypeElement = goog.dom.createDom('return_type');
  goog.dom.xml.setAttributes(funReturnTypeElement, {
    'type' : Blockly.funSpec.returnType.display()
  });
  goog.dom.appendChild(xml, funReturnTypeElement);
  return xml;
};

Ray.UserFun.xmlToFunSpec = function(xml) {
  if(xml.tagName !== 'user_function_specification') {
    throw 'Unknown tag!';
  }

  var children = goog.array.toArray(goog.dom.getChildren(xml));
  var name = null, desc = null, returnType = null;
  var args = [];
  var child;
  while(child = children.shift()) {
    switch(child.tagName) {
      case 'name':
        name = goog.dom.getTextContent(child);
        break;
      case 'description':
        desc = goog.dom.getTextContent(child);
        break;
      case 'arg':
        var argName = child.getAttribute('name');
        var argTypeName = child.getAttribute('type');
        var argType = Ray.Types.textToType(argTypeName);
        var arg = new Ray.UI.Arg(argName, argType);
        args.push(arg);
        break;
      case 'return_type':
        var returnTypeName = child.getAttribute('type');
        returnType = Ray.Types.textToType(returnTypeName);
        break;
      default:
        throw 'Unknown tag';
        break;
    }
  }

  if(!name || !desc || !returnType) {
    throw 'Missing name, desc, or return type';
  }

  return {
    'name': name,
    'desc': desc,
    'args': args,
    'returnType': returnType
  };
};
