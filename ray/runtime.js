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

var make_expr = function(type,obj) {
  var proto = {};
  goog.object.extend(proto, obj);
  proto.toString = function() { return type + 'E'; };
  proto.__node_type__ = type.toLowerCase() + 'E';
  proto.__expr_type__ = Ray.Globals.Expressions[type];
  proto.expr = true;
  return proto;
};

var make_value = function(type,obj) {
  var proto = {};
  goog.object.extend(proto, obj);
  proto.toString = function() { return type; };
  proto.__node_type__ = type.toLowerCase();
  proto.__value_type__ = Ray.Globals.Values[type];
  proto.interp = function() {
    throw new Error(type + " has no interp method!!!");
  };
  proto.value = true;
  return proto;
};

var attach_value_node = function(Node,type,obj) {
  function Builder(args) {
    return Node.apply(this, args);
  }
  Builder.prototype = make_value(type,obj);
  var NodeConstructor = function() {
    var node = new Builder(arguments);
    //console.log('Making ' + Builder.prototype.type);
    if(!node.__proto__.__node_type__) { throw new Error("No type set for this expr!!"); }
    return node;
  };
  R.Value[type] = NodeConstructor;
  Builder.prototype.__node_constructor__ = NodeConstructor;
};

var attach_expr_node = function(Node,type,obj) {
  function Builder(args) {
    return Node.apply(this, args);
  }
  Builder.prototype = make_expr(type,obj);
  var NodeConstructor = function() {
    var node = new Builder(arguments);
    //console.log('Making ' + Builder.prototype.type);
    if(!node.__proto__.__node_type__) { throw new Error("No type set for this expr!!"); }
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

var Primitive = product(['arg_spec', 'f'], ['body_type']);
Primitive.proto = {
  clone: clone_constructor,
  bind_arguments: function(args) {
    this.args = R.interp(args);
  },
  evaluate_body: function() {
    var args = [];
    var p_args = this.args.p_args;
    var num_p_args = this.arg_spec.p_args.length;
    for(var i = 0; i < num_p_args; i++) {
      args.push(p_args[i]);
    }
    var kw_args = this.args.kw_args;
    if(kw_args.length > 0) {
      // I don't handle kw_args at the moment in primitives!!!
      throw new Error("Keyword arguments not supported for primitives");
    }

    args.push(p_args.slice(num_p_args)); // rest_arg
    return this.f.apply(this, args);
  },
  unbind_arguments: function() {
    this.args = null;
  },
  display: function() {
    return '(primitive ' + R.display(this.arg_spec) + ' ...)';
  }
};

var Closure = product(['arg_spec', 'body', 'envs'], ['body_type']);
Closure.proto = {
  clone: function() {
    return new R.Value.Closure(R.clone(this.arg_spec),
                               R.clone(this.body),
                               R.clone_envs(this.envs),
                               this.body_type);
  },
  bind_arguments: function(args) {
    if(!this.saved_envs) { this.saved_envs = []; }
    var arg_env = this.arg_spec.bind_arguments(args);
    this.saved_envs.unshift(R.swap_envs(this.envs));
    R.push_env(arg_env);

  },
  evaluate_body: function() {
    R.record_function_call(this, this.__name__);
    return R.interp(this.body);
  },
  unbind_arguments: function() {
    this.arg_spec.unbind_arguments();
    R.swap_envs(this.saved_envs.shift());
  },
  display: function() {
    return '(lambda ' + R.display(this.arg_spec) + ' ' + R.display(this.body) + ')';
  }
};

var ArgumentSpec = product(['p_args', 'kw_args', 'rest_arg'], ['arguments_type']);
ArgumentSpec.proto = {
  clone: function() {
    return new R.Value.ArgumentSpec(goog.array.map(this.p_args, goog.functions.identity),
                                    goog.object.clone(this.kw_args),
                                    this.rest_arg);
  },
  /**
   * @desc Does the provided arguments object match the argument specification,
   * so that it is a valid function call?
   */
  accepts: function(args) {
    var p_args_match = (args.p_args.length === this.p_args.length) ||
      (this.rest_arg && (args.p_args.length > this.p_args.length));
    if(!p_args_match) {
      return false;
    }
    var keywords_needed = goog.object.getKeys(this.kw_args);
    var needed_set = new goog.structs.Set();
    needed_set.addAll(keywords_needed);
    var keywords_provided = goog.object.getKeys(args.kw_args);
    var provided_set = new goog.structs.Set();
    provided_set.addAll(keywords_provided);
    return (needed_set.difference(provided_set).getCount() === 0) &&
           (provided_set.difference(needed_set).getCount() === 0);
  },
  /**
   * @requires args must be accepted, (call ArgumentSpec.accepts(args) before this)
   */
  bind_arguments: function(args) {
    var env = R.get_env();
    var self = this;
    self.bound_args = self.bound_args || [];
    for(var i = 0; i < self.p_args.length; i++) {
      env = env.extend(self.p_args[i], R.interp(args.p_args[i]));
    }

    if(self.rest_arg) {
      env = env.extend(self.rest_arg, goog.array.map(args.p_args.slice(self.p_args.length), R.interp));
    }
    goog.object.forEach(self.kw_args, function(kw_name, kw) {
      env = env.extend(kw_name, R.interp(args.kw_args[kw]));
    });

    return env;
  },
  unbind_arguments: function() {
    return R.pop_env();
  },
  display: function() {
    var kw_args = [];
    goog.object.forEach(this.kw_args, function(v,k) { kw_args.push('#:' + k + ' ' + v); });
    return '(' + this.p_args.concat(kw_args).concat(this.rest_arg ? ['. ' + this.rest_arg] : []).join(' ') + ')';
  }
};

var Arguments = product(['p_args','kw_args']);
Arguments.proto = {
  clone: function() {
    return new R.Value.Arguments(
      goog.array.map(this.p_args, goog.functions.identity),
      goog.object.clone(this.kw_args));
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
    return new R.Char(this.c);
  },
  display: function() {
    return "'" + this.c + "'";
  }
};

var PrimitiveExpr = product(['arg_spec', 'f'], ['body_type']);
PrimitiveExpr.proto = {
  clone: clone_constructor,
  interp: function() {
    return new R.Value.Primitive(R.interp(this.arg_spec), this.f, this.body_type);
  },
  display: function() {
    return '(primitive ' + R.display(this.arg_spec) + ' ...)';
  }
};

var If = product(['pred', 't_expr', 'f_expr']);
If.proto = {
  clone: clone_constructor,
  interp: function() {
    var pred_value = R.interp(this.pred);
    return R.interp(pred_value.b ? this.t_expr : this.f_expr);
  },
  display: function() {
    return ['(if',
            R.display(this.pred),
            R.display(this.t_expr),
            R.display(this.f_expr) + ')'].join(' ');
  }
};

/**
 * Note that at least one clause must be present, but it can be an else clause!!
 */
var Cond = product(['test_clauses', 'else_clause']);
Cond.proto = {
  clone: function() {
    var self = this;
    var test_clause_clones = goog.array.map(this.test_clauses, function(test_clause) {
      return [R.clone(test_clause[0]), R.clone(test_clause[1])];
    });

    var else_clause_clone = R.clone(this.else_clause);
    return new R.Expr.Cond(test_clause_clones, else_clause_clone);
  },
  interp: function() {
    if(this.test_clauses.length === 0 && !this.else_clause) {
      throw new Error("At least 1 clause required in cond form!");
    }
    for(var i = 0; i < this.test_clauses.length; i++) {
      var test_value = R.interp(this.test_clauses[i][0]);
      if(R.node_type(test_value) !== 'boolean' || test_value.b) {
        return R.interp(this.test_clauses[i][1]);
      }
    }
    if(this.else_clause) {
      return R.interp(this.else_clause);
    } else {
      throw new Error("All test results were false, and no else clause provided!");
    }
  },
  display: function() {
    var self = this;
    var displayed_clauses = goog.array.map(this.test_clauses, function(clause) {
      return '[' + R.display(clause[0]) + ' ' + R.display(clause[1]) + ']';
    });
    if(this.else_clause) {
      displayed_clauses.push('[else ' + R.display(this.else_clause) + ']');
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
      if((R.node_type(arg_val) === 'boolean') && (arg_val.b === false)) {
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
      if((R.node_type(arg_val) !== 'boolean') || (arg_val.b === true)) {
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
var ArgumentsExpr = product(['p_args','kw_args']);
ArgumentsExpr.proto = {
  clone: function() {
    return new R.Expr.Arguments(
      goog.array.map(this.p_args, goog.functions.identity),
      goog.object.clone(this.kw_args));
  },
  interp: function() {
    var self = this;
    var p_arg_values = goog.array.map(this.p_args, R.interp, R);
    var kw_arg_values = {};
    goog.object.forEach(this.kw_args, function(kw_arg_expr, kw) {
      kw_arg_values[kw] = R.interp(kw_arg_expr);
    });
    return new R.Value.Arguments(p_arg_values, kw_arg_values);
  },
  display: function() {
    var self = this;
    var kw_args = [];
    goog.object.forEach(this.kw_args, function(v,k) { kw_args.push('#:' + k + ' ' + R.display(v)); });
    return goog.array.map(this.p_args, R.display).join(' ') +
           kw_args.join(' ') +
           (this.rest_arg ? ' . ' + R.display(this.rest_arg) : '');
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
    if(!(R.node_type(f_value) === 'closure' ||
      R.node_type(f_value) === 'primitive')) {
      throw new Error("Tried to apply a non-function");
    }
    if(!f_value.arg_spec.accepts(this.args)) {
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
var ArgumentSpecExpr = product(['p_args', 'kw_args', 'rest_arg'], ['arguments_type']);
ArgumentSpecExpr.proto = {
  clone: function() {
    return new R.Expr.ArgumentSpec(
      goog.array.map(this.p_args, goog.functions.identity),
      goog.object.clone(this.kw_args),
      this.rest_arg,
      this.arguments_type);
  },
  interp: function() {
    return new R.Value.ArgumentSpec(
      goog.array.map(this.p_args, goog.functions.identity),
      goog.object.clone(this.kw_args),
      this.rest_arg,
      this.arguments_type);
  },
  display: function() {
    var args = goog.array.map(this.p_args, goog.functions.identity);
    goog.object.forEach(this.kw_args, function(v,k) {
      args = args.concat('#:' + k, v);
    });
    if(this.rest_arg) {
      args = args.concat('.', this.rest_arg);
    }
    return '(' + args.join(' ') + ')';
  }
};

/**
 * @desc Lambdas
 */
var Lambda = product(['arg_spec', 'body'], ['body_type']);
Lambda.proto = {
  clone: clone_constructor,
  interp: function() {
    return new R.Value.Closure(R.interp(this.arg_spec), R.clone(this.body), R.clone_envs(), this.body_type);
  },
  display: function() {
    return ['(lambda',
            R.display(this.arg_spec),
            R.display(this.body) + ')'].join(' ');
  }
};

var Error = function(message) {
  this.message =  message;
};

/////////////////////////////////////////////////////// Runtime

Ray.Runtime.envs = [];
Ray.Runtime.top_level = env.empty_env();
Ray.Runtime.builtins = env.empty_env();
Ray.Runtime.function_call_limit = 100;
var self = Ray.Runtime;

Ray.Runtime.Value = {};
attach_value_node(Pair,'Pair',Pair.proto);
attach_value_node(Empty,'Empty',Empty.proto);
attach_value_node(Num,'Num',Num.proto);
attach_value_node(Boolean,'Boolean',Boolean.proto);
attach_value_node(Primitive,'Primitive',Primitive.proto);
attach_value_node(Closure,'Closure',Closure.proto);
attach_value_node(ArgumentSpec,'ArgumentSpec',ArgumentSpec.proto);
attach_value_node(Arguments,'Arguments',Arguments.proto);
attach_value_node(Str,'Str',Str.proto);

Ray.Runtime.Expr = {};
attach_expr_node(PairExpr,'Pair',PairExpr.proto);
attach_expr_node(EmptyExpr,'Empty',EmptyExpr.proto);
attach_expr_node(NumExpr,'Num',NumExpr.proto);
attach_expr_node(BooleanExpr,'Boolean',BooleanExpr.proto);
attach_expr_node(PrimitiveExpr,'Primitive',PrimitiveExpr.proto);
attach_expr_node(StrExpr,'Str',StrExpr.proto);
attach_expr_node(Lambda,'Lambda',Lambda.proto);

attach_expr_node(Name,'Name',Name.proto);
attach_expr_node(Cond,'Cond',Cond.proto);
attach_expr_node(If,'If',If.proto);
attach_expr_node(And,'And',And.proto);
attach_expr_node(Or,'Or',Or.proto);
attach_expr_node(App,'App',App.proto);
attach_expr_node(ArgumentsExpr,'Arguments',ArgumentsExpr.proto);
attach_expr_node(ArgumentSpecExpr,'ArgumentSpec',ArgumentSpecExpr.proto);

Ray.Runtime.set_function_call_limit = function(limit) {
  this.function_call_limit = limit;
};

// Functions dealing with environments, making bindings
Ray.Runtime.builtins_bind = function(name, val) {
  var value = this.interp(val);
  if(this.builtins.lookup(name)) {
    throw new Error("Trying to change a builtin binding: " + name);
  } else {
    this.builtins = this.builtins.extend(name, value);
    value.__name__ = name;
  }
};

Ray.Runtime.top_level_bind = function(name, val) {
  var value = this.interp(val);
  this.top_level = this.top_level.extend(name, value);
  value.__name__ = name;
};

Ray.Runtime.local_bind = function(name, val) {
  var value = this.interp(val);
  var tmp = this.envs[0].lookup(name);
  this.envs[0] = this.envs[0].extend(name, value);
  return tmp || null;
};

Ray.Runtime.bind = function(name, val) {
  this.top_level_bind(name, val);
};

Ray.Runtime.lookup = function(name) {
  var value;
  for(var i = 0; i < this.envs.length; i++) {
    value = this.envs[i].lookup(name);
    if(value) {
      return value;
    }
  }
  value = this.top_level.lookup(name);
  if(value) {
    return value;
  }
  value = this.builtins.lookup(name);
  if(value) {
    return value;
  }

  return null;
};

/**
 * Allows for dispatch on AST nodes (works with values and expressions)
 * @param node
 * @returns {*}
 */
Ray.Runtime.node_type = function(node) {
  return node.__node_type__;
};

/**
 * Allows for dispatch on expressions by constructor
 * @param expr
 * @returns {*}
 */
Ray.Runtime.expr_type = function(expr) {
  return expr.__expr_type__;
};

/** Allows for dispatch on values by constructor
 * @param value
 * @returns {*}
 */
Ray.Runtime.value_type = function(value) {
  return value.__value_type__;
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
Ray.Runtime.set_stop = function(should_stop) {
  this.should_stop = should_stop || false;
  return this.should_stop;
};

/**
 * Halt evaluation
 */
Ray.Runtime.stop = function() {
  this.envs = [];
  var name = this.current_function_name;
  this.current_function = null;
  this.function_call_count = 0;
  throw new Error("Stopping in:" + (name ? name : "**unknown**"));
};

Ray.Runtime.record_function_call = function(f, name) {
  if(name) {
    this.current_function_name = name;
  }

  if(this.current_function === f) {
    // Increment calls to this function
    this.function_call_count++;
    if(this.function_call_count > this.function_call_limit) {
      this.should_stop = true;
    }
  } else {
    // Reset current function name and start function call count at 1
    this.current_function = f;
    this.function_call_count = 1;
  }
};


/**
 * Recursive interpreter entry point
 * @param expr
 * @returns {*}
 */
Ray.Runtime.interp = function(expr) {
  if(this.should_stop) {
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
  if(!expr.expr) {
    throw new Error("Can't evaluate a non-expression!!");
  }
  // Surround with try/catch to catch interpreter exceptions
  return this.interp(expr);
};

Ray.Runtime.swap_envs = function(envs) {
  var tmp_envs = this.envs;
  this.envs = envs;
  return tmp_envs;
};

Ray.Runtime.get_env = function() {
  return env.empty_env();
};

Ray.Runtime.push_env = function(env) {
  this.envs.unshift(env);
};

Ray.Runtime.pop_env = function() {
  return this.envs.shift();
};

Ray.Runtime.clone_envs = function(envs) {
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
Ray.Runtime.prim = function(arg_spec, f, body_type) {
  return new R.Expr.Primitive(arg_spec, f, body_type);
};
Ray.Runtime.args = function(p_args, kw_args) {
  return new R.Expr.Arguments(p_args, kw_args);
};
Ray.Runtime.p_args = function(/* args */) {
  return new R.Expr.Arguments(Array.prototype.slice.call(arguments,0), {});
};
Ray.Runtime.name = function(name_arg) {
  return new R.Expr.Name(name_arg);
};
Ray.Runtime.spec = function(p_args, kw_args, rest_arg) {
  var p_arg_names = goog.array.map(p_args, function(p_arg) { return p_arg[0]; });
  var p_arg_types = goog.array.map(p_args, function(p_arg) { return p_arg[1]; });
  var rest_arg_name = rest_arg[0];
  var rest_arg_type = rest_arg[1];
  return new R.Expr.ArgumentSpec(p_arg_names,
                                 kw_args,
                                 rest_arg_name,
                                 Ray.Types.args(Ray.Types.ty_list(p_arg_types),
                                                Ray.Types.ty_n_arity(rest_arg_type)));
};

Ray.Runtime.p_spec = function(/* args */) {
  var args = goog.array.toArray(arguments);
  var arg_names = goog.array.map(args, function(arg) { return arg[0]; });
  var arg_types = goog.array.map(args, function(arg) { return arg[1]; });
  return new R.Expr.ArgumentSpec(arg_names,
                                 {}, // kw_args
                                 null, // rest_arg
                                 Ray.Types.args(Ray.Types.ty_list(arg_types), null)); // Type annotations
};

Ray.Runtime.kw_spec = function(args, arg_types) {
  // Ignoring kw_args for now
  throw new Error("kw_args not implemented yet!");
  // return new R.Expr.ArgumentSpec([], args, null, arg_types);
};
Ray.Runtime.rest_spec = function(name, type) {
  return new R.Expr.ArgumentSpec([], {}, name, Ray.Types.rest_arg(type));
};
Ray.Runtime.fn = function(arg_spec, body, body_type) {
  return new R.Expr.Lambda(arg_spec, body, body_type);
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
Ray.Runtime.cond = function(test_clauses, else_clause) {
  if(test_clauses.length === 0 && !else_clause) {
    throw new Error("At least one clause needed in cond form!");
  } else {
    return new R.Expr.Cond(test_clauses, else_clause || null);
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
