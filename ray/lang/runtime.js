/**
 * @author Spencer Gordon
 * @desc A Racket evaluator and namespace
 */

goog.provide('Ray.Runtime');
goog.provide('Ray.R');

goog.require('Ray.Globals');
goog.require('Ray.Util');
goog.require('Ray.Env');
goog.require('Ray.Types');
goog.require('Ray.JSNumbers');

goog.require('goog.array');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('goog.structs.Set');

var env = Ray.Env;
/**
 * R is shorthand for Runtime, will not be used for anything else!!!!!
 * @type {*}
 */
var R = Ray.Runtime;
Ray.R = R;


var clone_constructor = Ray.Util.clone_constructor;
clone_constructor.R = R;
var product = Ray.Util.product;
var construct = Ray.Util.construct;

var makeExpr = function(type,obj) {
  var proto = {};
  goog.object.extend(proto, obj);
  proto.toString = function() { return type + 'E'; };
  proto.nodeType_ = type.toLowerCase() + 'E';
  proto.exprType_ = Ray.Globals.Expressions[type];
  proto.expr = true;
  return proto;
};

var makeValue = function(type,obj) {
  var proto = {};
  goog.object.extend(proto, obj);
  proto.toString = function() { return type; };
  proto.nodeType_ = type.toLowerCase();
  proto.valueType_ = Ray.Globals.Values[type];
  proto.interp = function() {
    throw new Error(type + " has no interp method!!!");
  };
  proto.value = true;
  return proto;
};

var attachValueNode = function(Node,type,obj) {
  function Builder(args) {
    return Node.apply(this, args);
  }
  Builder.prototype = makeValue(type,obj);
  var NodeConstructor = function() {
    var node = new Builder(arguments);
    //console.log('Making ' + Builder.prototype.type);
    if(!node.__proto__.nodeType_) { throw new Error("No type set for this expr!!"); }
    return node;
  };
  R.Value[type] = NodeConstructor;
  Builder.prototype.__node_constructor__ = NodeConstructor;
};

var attachExprNode = function(Node,type,obj) {
  function Builder(args) {
    return Node.apply(this, args);
  }
  Builder.prototype = makeExpr(type,obj);
  var NodeConstructor = function() {
    var node = new Builder(arguments);
    //console.log('Making ' + Builder.prototype.type);
    if(!node.__proto__.nodeType_) { throw new Error("No type set for this expr!!"); }
    return node;
  };
  R.Expr[type] = NodeConstructor;
  Builder.prototype.__node_constructor__ = NodeConstructor;
};

//////////////////////////////////////////////////////// Values
var Pair = product(['car','cdr']);
Pair.proto = {
  clone: clone_constructor,
  display: function() {
    return '(' + R.display(this.car) + ' . ' + R.display(this.cdr) + ')';
  }
};

var Empty = product([]);
Empty.proto = {
  clone: clone_constructor,
  display: function() {
    return '()';
  }
};

var Boolean = product(['b']);
Boolean.proto = {
  clone: clone_constructor,
  display: function() {
    return this.b ? "true" : "false";
  }
};

var Num = product(['n']);
Num.proto = {
  clone: clone_constructor,
  display: function() {
    return String(this.n);
  }
};

var Str = product(['s']);
Str.proto = {
  clone: clone_constructor,
  display: function() {
    return "\"" + this.s + "\"";
  }
};

var Char = product(['c']);
Char.proto = {
  clone: clone_constructor,
  display: function() {
    return "'" + this.c + "'";
  }
}

var Primitive = product(['argSpec', 'f'], ['bodyType']);
Primitive.proto = {
  clone: clone_constructor,
  bind_arguments: function(args) {
    this.args = R.interp(args);
  },
  evaluate_body: function() {
    var args = [];
    var positionalArgs = this.args.positionalArgs;
    var num_p_args = this.argSpec.positionalArgs.length;
    for(var i = 0; i < num_p_args; i++) {
      args.push(positionalArgs[i]);
    }
    var keywordArgs = this.args.keywordArgs;
    if(keywordArgs.length > 0) {
      // I don't handle keywordArgs at the moment in primitives!!!
      throw new Error("Keyword arguments not supported for primitives");
    }

    args.push(positionalArgs.slice(num_p_args)); // restArg
    return this.f.apply(this, args);
  },
  unbind_arguments: function() {
    this.args = null;
  },
  display: function() {
    return '(primitive ' + R.display(this.argSpec) + ' ...)';
  }
};

var Closure = product(['argSpec', 'body', 'envs'], ['bodyType']);
Closure.proto = {
  clone: function() {
    return new R.Value.Closure(R.clone(this.argSpec),
                               R.clone(this.body),
                               R.cloneEnvs(this.envs),
                               this.bodyType);
  },
  bind_arguments: function(args) {
    if(!this.saved_envs) { this.saved_envs = []; }
    var arg_env = this.argSpec.bind_arguments(args);
    this.saved_envs.unshift(R.swapEnvs(this.envs));
    R.pushEnv(arg_env);

  },
  evaluate_body: function() {
    R.record_function_call(this, this.name_);
    return R.interp(this.body);
  },
  unbind_arguments: function() {
    this.argSpec.unbind_arguments();
    R.swapEnvs(this.saved_envs.shift());
  },
  display: function() {
    return '(lambda ' + R.display(this.argSpec) + ' ' + R.display(this.body) + ')';
  }
};

var ArgumentSpec = product(['positionalArgs', 'keywordArgs', 'restArg'], ['argsType']);
ArgumentSpec.proto = {
  clone: function() {
    return new R.Value.ArgumentSpec(goog.array.map(this.positionalArgs, goog.functions.identity),
                                    goog.object.clone(this.keywordArgs),
                                    this.restArg);
  },
  /**
   * @desc Does the provided arguments object match the argument specification,
   * so that it is a valid function call?
   */
  accepts: function(args) {
    var p_args_match = (args.positionalArgs.length === this.positionalArgs.length) ||
      (this.restArg && (args.positionalArgs.length > this.positionalArgs.length));
    if(!p_args_match) {
      return false;
    }
    var keywords_needed = goog.object.getKeys(this.keywordArgs);
    var needed_set = new goog.structs.Set();
    needed_set.addAll(keywords_needed);
    var keywords_provided = goog.object.getKeys(args.keywordArgs);
    var provided_set = new goog.structs.Set();
    provided_set.addAll(keywords_provided);
    return (needed_set.difference(provided_set).getCount() === 0) &&
           (provided_set.difference(needed_set).getCount() === 0);
  },
  /**
   * @requires args must be accepted, (call ArgumentSpec.accepts(args) before this)
   */
  bind_arguments: function(args) {
    var env = R.getEnv();
    var self = this;
    self.bound_args = self.bound_args || [];
    for(var i = 0; i < self.positionalArgs.length; i++) {
      env = env.extend(self.positionalArgs[i], R.interp(args.positionalArgs[i]));
    }

    if(self.restArg) {
      env = env.extend(self.restArg, goog.array.map(args.positionalArgs.slice(self.positionalArgs.length), R.interp));
    }
    goog.object.forEach(self.keywordArgs, function(kw_name, kw) {
      env = env.extend(kw_name, R.interp(args.keywordArgs[kw]));
    });

    return env;
  },
  unbind_arguments: function() {
    return R.popEnv();
  },
  display: function() {
    var keywordArgs = [];
    goog.object.forEach(this.keywordArgs, function(v,k) { keywordArgs.push('#:' + k + ' ' + v); });
    return '(' + this.positionalArgs.concat(keywordArgs).concat(this.restArg ? ['. ' + this.restArg] : []).join(' ') + ')';
  }
};

var Arguments = product(['positionalArgs','keywordArgs']);
Arguments.proto = {
  clone: function() {
    return new R.Value.Arguments(
      goog.array.map(this.positionalArgs, goog.functions.identity),
      goog.object.clone(this.keywordArgs));
  }
};

//////////////////////////////////////////////////////// Expressions

var PairExpr = product(['car','cdr']);
PairExpr.proto = {
  clone: clone_constructor,
  interp: function() {
    return new R.Value.Pair(R.interp(this.car),
                            R.interp(this.cdr));
  },
  display: function() {
    return '(' + R.display(this.car) + ' . ' + R.display(this.cdr) + ')';
  }
};

var EmptyExpr = product([]);
EmptyExpr.proto = {
  clone: clone_constructor,
  interp: function() {
    return new R.Value.Empty();
  },
  display: function() {
    return '()';
  }
};

var BooleanExpr = product(['b']);
BooleanExpr.proto = {
  clone: clone_constructor,
  interp: function() {
    return new R.Value.Boolean(this.b);
  },
  display: function() {
    return this.b ? "true" : "false";
  }
};

var NumExpr = product(['n']);
NumExpr.proto = {
  clone: clone_constructor,
  interp: function() {
    return new R.Value.Num(this.n);
  },
  display: function() {
    return String(this.n);
  }
};

var StrExpr = product(['s']);
StrExpr.proto = {
  clone: clone_constructor,
  interp: function() {
    return new R.Value.Str(this.s);
  },
  display: function() {
    return "\"" + this.s + "\"";
  }
};

var CharExpr = product(['c']);
CharExpr.proto = {
  clone: clone_constructor,
  interp: function() {
    return new R.Value.Char(this.c);
  },
  display: function() {
    return "'" + this.c + "'";
  }
};

var PrimitiveExpr = product(['argSpec', 'f'], ['bodyType']);
PrimitiveExpr.proto = {
  clone: clone_constructor,
  interp: function() {
    return new R.Value.Primitive(R.interp(this.argSpec), this.f, this.bodyType);
  },
  display: function() {
    return '(primitive ' + R.display(this.argSpec) + ' ...)';
  }
};

var If = product(['pred', 'thenExpr', 'elseExpr']);
If.proto = {
  clone: clone_constructor,
  interp: function() {
    var pred_value = R.interp(this.pred);
    return R.interp(pred_value.b ? this.thenExpr : this.elseExpr);
  },
  display: function() {
    return ['(if',
            R.display(this.pred),
            R.display(this.thenExpr),
            R.display(this.elseExpr) + ')'].join(' ');
  }
};

/**
 * Note that at least one clause must be present, but it can be an else clause!!
 */
var Cond = product(['testClauses', 'elseClause']);
Cond.proto = {
  clone: function() {
    var self = this;
    var test_clause_clones = goog.array.map(this.testClauses, function(test_clause) {
      return [R.clone(test_clause[0]), R.clone(test_clause[1])];
    });

    var else_clause_clone = R.clone(this.elseClause);
    return new R.Expr.Cond(test_clause_clones, else_clause_clone);
  },
  interp: function() {
    if(this.testClauses.length === 0 && !this.elseClause) {
      throw new Error("At least 1 clause required in cond form!");
    }
    for(var i = 0; i < this.testClauses.length; i++) {
      var test_value = R.interp(this.testClauses[i][0]);
      if(R.nodeType(test_value) !== 'boolean' || test_value.b) {
        return R.interp(this.testClauses[i][1]);
      }
    }
    if(this.elseClause) {
      return R.interp(this.elseClause);
    } else {
      throw new Error("All test results were false, and no else clause provided!");
    }
  },
  display: function() {
    var self = this;
    var displayed_clauses = goog.array.map(this.testClauses, function(clause) {
      return '[' + R.display(clause[0]) + ' ' + R.display(clause[1]) + ']';
    });
    if(this.elseClause) {
      displayed_clauses.push('[else ' + R.display(this.elseClause) + ']');
    }
    return ['(cond'].concat(displayed_clauses).join(' ') + ')';
  }
};

var And = product(['args']);
And.proto = {
  clone: function() {
    var self = this;
    return new R.Expr.And(goog.array.map(this.args, function(arg) {
      return R.clone(arg);
    }));
  },
  interp: function() {
    var arg_val = new R.Value.Boolean(true);
    for(var i = 0; i < this.args.length; i++) {
      arg_val = R.interp(this.args[i]);
      if((R.nodeType(arg_val) === 'boolean') && (arg_val.b === false)) {
        return new R.Value.Boolean(false);
      }
    }
    return arg_val;
  },
  display: function() {
    var self = this;
    var displayed_args = goog.array.map(this.args, R.display).join(' ');
    return '(and'  + (displayed_args ? ' ' : '') + displayed_args + ')';
  }
};

var Or = product(['args']);
Or.proto = {
  clone: function() {
    var self = this;
    return new R.Expr.Or(goog.array.map(this.args, function(arg) {
      return R.clone(arg);
    }));
  },
  interp: function() {
    var arg_val;
    for(var i = 0; i < this.args.length; i++) {
      arg_val = R.interp(this.args[i]);
      if((R.nodeType(arg_val) !== 'boolean') || (arg_val.b === true)) {
        return arg_val;
      }
    }
    return new R.Value.Boolean(false);
  },
  display: function() {
    var self = this;
    var displayed_args = goog.array.map(this.args, R.display).join(' ');
    return '(or'  + (displayed_args ? ' ' : '') + displayed_args + ')';
  }
};

/**
 * @desc Names/Identifiers
 */
var Name = product(['name']);
Name.proto = {
  clone: clone_constructor,
  interp: function() {
    var result = R.lookup(this.name);
    if(result) {
      return result;
    } else {
      throw new Error('Unbound identifier: \'' + this.name + '\'');
    }
  },
  display: function() {
    return this.name;
  }
};

/**
 * @desc Arguments objects
 */
var ArgumentsExpr = product(['positionalArgs','keywordArgs']);
ArgumentsExpr.proto = {
  clone: function() {
    return new R.Expr.Arguments(
      goog.array.map(this.positionalArgs, goog.functions.identity),
      goog.object.clone(this.keywordArgs));
  },
  interp: function() {
    var self = this;
    var p_arg_values = goog.array.map(this.positionalArgs, R.interp, R);
    var kw_arg_values = {};
    goog.object.forEach(this.keywordArgs, function(kw_arg_expr, kw) {
      kw_arg_values[kw] = R.interp(kw_arg_expr);
    });
    return new R.Value.Arguments(p_arg_values, kw_arg_values);
  },
  display: function() {
    var self = this;
    var keywordArgs = [];
    goog.object.forEach(this.keywordArgs, function(v,k) { keywordArgs.push('#:' + k + ' ' + R.display(v)); });
    return goog.array.map(this.positionalArgs, R.display).join(' ') +
           keywordArgs.join(' ') +
           (this.restArg ? ' . ' + R.display(this.restArg) : '');
  }
};

/**
 * @desc Function Applications
 */
var App = product(['f', 'args']);
App.proto = {
  clone: clone_constructor,
  interp: function() {
    var f_value = R.interp(this.f);
    if(!(R.nodeType(f_value) === 'closure' ||
      R.nodeType(f_value) === 'primitive')) {
      throw new Error("Tried to apply a non-function");
    }
    if(!f_value.argSpec.accepts(this.args)) {
      throw new Error("Arity mismatch in function application");
    }

    f_value.bind_arguments(this.args);
    var body_val = f_value.evaluate_body();
    f_value.unbind_arguments();

    return body_val;
  },
  display: function() {
    var displayed_args = R.display(this.args);
    return '(' + R.display(this.f) + (displayed_args ? ' ' : '') + displayed_args + ')';
  }
};

/**
 * @desc Argument specification for a function
 */
var ArgumentSpecExpr = product(['positionalArgs', 'keywordArgs', 'restArg'], ['argsType']);
ArgumentSpecExpr.proto = {
  clone: function() {
    return new R.Expr.ArgumentSpec(
      goog.array.map(this.positionalArgs, goog.functions.identity),
      goog.object.clone(this.keywordArgs),
      this.restArg,
      this.argsType);
  },
  interp: function() {
    return new R.Value.ArgumentSpec(
      goog.array.map(this.positionalArgs, goog.functions.identity),
      goog.object.clone(this.keywordArgs),
      this.restArg,
      this.argsType);
  },
  display: function() {
    var args = goog.array.map(this.positionalArgs, goog.functions.identity);
    goog.object.forEach(this.keywordArgs, function(v,k) {
      args = args.concat('#:' + k, v);
    });
    if(this.restArg) {
      args = args.concat('.', this.restArg);
    }
    return '(' + args.join(' ') + ')';
  }
};

/**
 * @desc Lambdas
 */
var Lambda = product(['argSpec', 'body'], ['bodyType']);
Lambda.proto = {
  clone: clone_constructor,
  interp: function() {
    return new R.Value.Closure(R.interp(this.argSpec), R.clone(this.body), R.cloneEnvs(), this.bodyType);
  },
  display: function() {
    return ['(lambda',
            R.display(this.argSpec),
            R.display(this.body) + ')'].join(' ');
  }
};

var Error = function(message) {
  this.message =  message;
};

/////////////////////////////////////////////////////// Runtime

Ray.Runtime.envs = [];
Ray.Runtime.topLevel_ = env.emptyEnv();
Ray.Runtime.builtins = env.emptyEnv();
Ray.Runtime.functionCallLimit_ = 100;
var self = Ray.Runtime;

Ray.Runtime.Expr = {};
attachExprNode(PairExpr,'Pair',PairExpr.proto);
attachExprNode(EmptyExpr,'Empty',EmptyExpr.proto);
attachExprNode(NumExpr,'Num',NumExpr.proto);
attachExprNode(BooleanExpr,'Boolean',BooleanExpr.proto);
attachExprNode(PrimitiveExpr,'Primitive',PrimitiveExpr.proto);
attachExprNode(StrExpr,'Str',StrExpr.proto);
attachExprNode(CharExpr,'Char',CharExpr.proto);
attachExprNode(Lambda,'Lambda',Lambda.proto);

attachExprNode(Name,'Name',Name.proto);
attachExprNode(Cond,'Cond',Cond.proto);
attachExprNode(If,'If',If.proto);
attachExprNode(And,'And',And.proto);
attachExprNode(Or,'Or',Or.proto);
attachExprNode(App,'App',App.proto);
attachExprNode(ArgumentsExpr,'Arguments',ArgumentsExpr.proto);
attachExprNode(ArgumentSpecExpr,'ArgumentSpec',ArgumentSpecExpr.proto);


Ray.Runtime.Value = {};
attachValueNode(Pair,'Pair',Pair.proto);
attachValueNode(Empty,'Empty',Empty.proto);
attachValueNode(Num,'Num',Num.proto);
attachValueNode(Boolean,'Boolean',Boolean.proto);
attachValueNode(Primitive,'Primitive',Primitive.proto);
attachValueNode(Closure,'Closure',Closure.proto);
attachValueNode(ArgumentSpec,'ArgumentSpec',ArgumentSpec.proto);
attachValueNode(Arguments,'Arguments',Arguments.proto);
attachValueNode(Str,'Str',Str.proto);
attachValueNode(Char,'Char',Char.proto);

Ray.Runtime.equals = function(valueA, valueB) {
  if(Ray.Runtime.valueType(valueA) !== Ray.Runtime.valueType(valueB)) {
    return false;
  } else {
    switch(Ray.Runtime.valueType(valueA)) {
      case Ray.Globals.Values.Pair:
        return Ray.Runtime.equals(valueA.car, valueB.car) &&
               Ray.Runtime.equals(valueA.cdr, valueB.cdr);
        break;
      case Ray.Globals.Values.Empty:
        return true;
        break;
      case Ray.Globals.Values.Boolean:
        return valueA.b === valueB.b;
        break;
      case Ray.Globals.Values.Num:
        return Ray.Numbers.equals(valueA.n, valueB.n);
        break;
      case Ray.Globals.Values.Str:
        return valueA.s === valueB.s;
      case Ray.Globals.Values.Char:
        return valueA.c === valueB.c;

      case Ray.Globals.Values.Primitive:
      case Ray.Globals.Values.Closure:
        // TODO (Figure out what I actually should do)
        return false;
        break;
      default:
        throw 'Invalid valueType for valueA';
        break;
    }
  }
};

Ray.Runtime.setFunctionCallLimit = function(limit) {
  this.functionCallLimit_ = limit;
};

// Functions dealing with environments, making bindings
Ray.Runtime.bindBuiltin = function(name, val) {
  var value = this.interp(val);
  if(this.builtins.lookup(name)) {
    throw new Error("Trying to change a builtin binding: " + name);
  } else {
    this.builtins = this.builtins.extend(name, value);
    value.__name__ = name;
  }
};

Ray.Runtime.bindTopLevel = function(name, val) {
  var value = this.interp(val);
  this.topLevel_ = this.topLevel_.extend(name, value);
  value.__name__ = name;
};

Ray.Runtime.bindLocal = function(name, val) {
  var value = this.interp(val);
  var tmp = this.envs[0].lookup(name);
  this.envs[0] = this.envs[0].extend(name, value);
  return tmp || null;
};

Ray.Runtime.bind = function(name, val) {
  this.bindTopLevel(name, val);
};

Ray.Runtime.lookup = function(name) {
  var value;
  for(var i = 0; i < this.envs.length; i++) {
    value = this.envs[i].lookup(name);
    if(value) {
      return value;
    }
  }
  value = this.topLevel_.lookup(name);
  if(value) {
    return value;
  }
  value = this.builtins.lookup(name);
  if(value) {
    return value;
  }

  return null;
};

Ray.Runtime.getAllBoundIdentifiers = function() {
  return this.topLevel_.allBoundNames().concat(this.builtins.allBoundNames());
};

/**
 * Allows for dispatch on AST nodes (works with values and expressions)
 * @param node
 * @returns {*}
 */
Ray.Runtime.nodeType = function(node) {
  return node.nodeType_;
};

/**
 * Allows for dispatch on expressions by constructor
 * @param expr
 * @returns {*}
 */
Ray.Runtime.exprType = function(expr) {
  return expr.exprType_;
};

/** Allows for dispatch on values by constructor
 * @param value
 * @returns {*}
 */
Ray.Runtime.valueType = function(value) {
  return value.valueType_;
};

/**
 * Clones a node
 * Currently this doesn't do anything but call the node's clone method,
 * but I could use this to log object creation in the runtime
 * @param expr
 * @returns {*}
 */
Ray.Runtime.clone = function(expr) {
  return expr.clone();
};

/**
 * Interrupts expression evaluation at next function call if should_stop
 * @param should_stop
 * @returns {boolean}
 */
Ray.Runtime.setStop = function(should_stop) {
  this.shouldStop_ = should_stop || false;
  return this.shouldStop_;
};

/**
 * Halt evaluation
 */
Ray.Runtime.stop = function() {
  this.envs = [];
  var name = this.currentFunctionName_;
  this.currentFunction_ = null;
  this.functionCallCount_ = 0;
  throw new Error("Stopping in:" + (name ? name : "**unknown**"));
};

Ray.Runtime.record_function_call = function(f, name) {
  if(name) {
    this.currentFunctionName_ = name;
  }

  if(this.currentFunction_ === f) {
    // Increment calls to this function
    this.functionCallCount_++;
    if(this.functionCallCount_ > this.functionCallLimit_) {
      this.shouldStop_ = true;
    }
  } else {
    // Reset current function name and start function call count at 1
    this.currentFunction_ = f;
    this.functionCallCount_ = 1;
  }
};


/**
 * Recursive interpreter entry point
 * @param expr
 * @returns {*}
 */
Ray.Runtime.interp = function(expr) {
  if(this.shouldStop_) {
    return this.stop();
  } else {
    return expr.interp();
  }
};

/**
 * Top level interpreter entry point
 * @param expr
 * @returns {*}
 */
Ray.Runtime.eval = function(expr) {
  // Make sure expr is actually an expression
  this.functionCallCount_ = 0;
  if(!expr.expr) {
    throw new Error("Can't evaluate a non-expression!!");
  }
  // Surround with try/catch to catch interpreter exceptions
  return this.interp(expr);
};

Ray.Runtime.swapEnvs = function(envs) {
  var tmp_envs = this.envs;
  this.envs = envs;
  return tmp_envs;
};

Ray.Runtime.getEnv = function() {
  return env.emptyEnv();
};

Ray.Runtime.pushEnv = function(env) {
  this.envs.unshift(env);
};

Ray.Runtime.popEnv = function() {
  return this.envs.shift();
};

Ray.Runtime.cloneEnvs = function(envs) {
  var old_envs = envs || this.envs;
  return goog.array.map(old_envs, function(env) {
    return env.clone();
  });
};

Ray.Runtime.display = function(expr) {
  return expr.display();
};

Ray.Runtime.quote = function(str) {
  return "'" + str;
};

/**
 * A bunch of convenience methods that make dealing with the runtime a lot less verbose
 */

Ray.Runtime.app = function(f, args) {
  return new R.Expr.App(f, args);
};
Ray.Runtime.prim = function(argSpec, f, bodyType) {
  return new R.Expr.Primitive(argSpec, f, bodyType);
};
Ray.Runtime.args = function(positionalArgs, keywordArgs) {
  return new R.Expr.Arguments(positionalArgs, keywordArgs);
};
Ray.Runtime.positionalArgs = function(/* args */) {
  return new R.Expr.Arguments(Array.prototype.slice.call(arguments,0), {});
};
Ray.Runtime.name = function(name_arg) {
  return new R.Expr.Name(name_arg);
};
Ray.Runtime.spec = function(positionalArgs, keywordArgs, restArg) {
  var p_arg_names = goog.array.map(positionalArgs, function(p_arg) { return p_arg[0]; });
  var positionalArgTypes = goog.array.map(positionalArgs, function(p_arg) { return p_arg[1]; });
  var rest_arg_name = restArg[0];
  var restArgType = restArg[1];
  return new R.Expr.ArgumentSpec(p_arg_names,
                                 keywordArgs,
                                 rest_arg_name,
                                 Ray.Types.args(Ray.Types.ty_list(positionalArgTypes),
                                                Ray.Types.ty_n_arity(restArgType)));
};

Ray.Runtime.p_spec = function(/* args */) {
  var args = goog.array.toArray(arguments);
  var arg_names = goog.array.map(args, function(arg) { return arg[0]; });
  var arg_types = goog.array.map(args, function(arg) { return arg[1]; });
  return new R.Expr.ArgumentSpec(arg_names,
                                 {}, // keywordArgs
                                 null, // restArg
                                 Ray.Types.args(Ray.Types.ty_list(arg_types), null)); // Type annotations
};

Ray.Runtime.kw_spec = function(args, arg_types) {
  // Ignoring keywordArgs for now
  throw new Error("keywordArgs not implemented yet!");
  // return new R.Expr.ArgumentSpec([], args, null, arg_types);
};
Ray.Runtime.rest_spec = function(name, type) {
  return new R.Expr.ArgumentSpec([], {}, name, Ray.Types.restArg(type));
};
Ray.Runtime.fn = function(argSpec, body, bodyType) {
  return new R.Expr.Lambda(argSpec, body, bodyType);
};
Ray.Runtime.num = function(n) {
  return new R.Expr.Num(n);
};
Ray.Runtime.str = function(s) {
  return new R.Expr.Str(s);
};
Ray.Runtime.char = function(c) {
  return new R.Expr.Char(c);
};
Ray.Runtime.pair = function(car, cdr) {
  return new R.Expr.Pair(car, cdr);
};
Ray.Runtime.empty = function() {
  return new R.Expr.Empty();
};
Ray.Runtime.bool = function(b) {
  return new R.Expr.Boolean(b);
};
Ray.Runtime.cond = function(testClauses, elseClause) {
  if(testClauses.length === 0 && !elseClause) {
    throw new Error("At least one clause needed in cond form!");
  } else {
    return new R.Expr.Cond(testClauses, elseClause || null);
  }
};
Ray.Runtime._if = function(p, t, f) {
  return new R.Expr.If(p, t, f);
};
Ray.Runtime.and = function(/* args */) {
  return new R.Expr.And(goog.array.toArray(arguments));
};
Ray.Runtime.or = function(/* args */) {
  return new R.Expr.Or(goog.array.toArray(arguments));
};
