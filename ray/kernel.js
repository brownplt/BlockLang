/**
 * @author Spencer Gordon
 * @desc A Racket evaluator and namespace
 */

goog.provide('ray.kernel');

goog.require('ray.underscore');
goog.require('ray.util');

ray.kernel = function() {

  var _ = ray.underscore;

  var global = window;
  // inject utility functions into the global namespace
    _.each(ray.util(), function(v,k) {
    global[k] = v;
  });

  var make_expr = function(r,type,obj) {
    var proto = {};
    _.extend(proto, obj);
    proto.toString = function() { return type + 'E'; };
    proto.type = type.toLocaleLowerCase() + 'E';
    proto.R = r;
    proto.expr = true;
    return proto;
  };

  var make_value = function(r,type,obj) {
    var proto = {};
    _.extend(proto, obj);
    proto.toString = function() {
      return type;
    };
    proto.type = type.toLocaleLowerCase();
    proto.R = r;
    proto.eval = function() { 
      throw new Error(type + " has no eval method!!!");
    };
    proto.value = true;
    return proto;
  };

  var attach_value_node = function(r,Node,type,obj) {
    function Builder(args) {
      return Node.apply(this, args);
    }
    Builder.prototype = make_value(r,type,obj);
    var NodeConstructor = function() {
      var node = new Builder(arguments);
      //console.log('Making ' + Builder.prototype.type);
      if(!node.__proto__.type) { throw new Error("No type set for this expr!!"); }
      return node;
    };
    r.Value[type] = NodeConstructor;
    Builder.prototype.__node_constructor__ = NodeConstructor;
  };

  var attach_expr_node = function(r,Node,type,obj) {
    function Builder(args) {
      return Node.apply(this, args);
    }
    Builder.prototype = make_expr(r,type,obj);
    var NodeConstructor = function() {
      var node = new Builder(arguments);
      //console.log('Making ' + Builder.prototype.type);
      if(!node.__proto__.type) { throw new Error("No type set for this expr!!"); }
      return node;
    };
    r.Expr[type] = NodeConstructor;
    Builder.prototype.__node_constructor__ = NodeConstructor;
  };

  /**
   * @desc Values
   */
  var Pair = product('car','cdr');
  Pair.proto = {
    clone: clone_constructor,
    display: function() { 
      return '(' + this.R.display(this.car) + ' . ' + this.R.display(this.cdr) + ')';
    }
  };

  var Null = product();
  Null.proto = {
    clone: clone_constructor,
    display: function() { 
      return '()';
    }
  };

  var Boolean = product('b');
  Boolean.proto = {
    clone: clone_constructor,
    display: function() {
      return this.b ? "#t" : "#f";
    }
  };

  var Num = product('n');
  Num.proto = {
    clone: clone_constructor,
    display: function() { 
      return n.toString();
    }
  };

  var Primitive = product('arg_spec', 'f');
  Primitive.proto = {
    clone: clone_constructor,
    bind_arguments: function(args) {      
	    this.args = this.R.eval(args);
    },
    evaluate_body: function() {
	    var args = [];
	    var p_args = this.args.p_args;
	    var num_p_args = this.arg_spec.p_args.length;
	    for(var i = 0; i < num_p_args; i++) {
	      args.push(p_args[i]);
	    }
	    args.push(p_args.slice(num_p_args)); // rest_arg
	    return this.f.apply(this, args);
    },
    unbind_arguments: function() {
	    this.args = null;
    },
    display: function() { 
      return '(primitive ' + this.R.display(this.arg_spec) + ' ...)';
    }
  };

  var Closure = product('arg_spec', 'body', 'envs');
  Closure.proto = {
    clone: function() {
      return new this.R.Value.Closure(this.R.clone(this.arg_spec), 
                                      this.R.clone(this.body),
                                      this.R.clone_envs(this.envs));
    },
    bind_arguments: function(args) {
      this.saved_envs = this.R.swap_envs(this.envs);
	    this.arg_spec.bind_arguments(args);
    },
    evaluate_body: function() {
	    return this.R.eval(this.body);
    },
    unbind_arguments: function() {
      this.arg_spec.unbind_arguments();
      this.R.swap_envs(this.saved_envs);
    },
    display: function() { 
      return '(closure ' + this.R.display(this.arg_spec) + ' ' + this.R.quote(this.R.display(this.body)) + ')'; 
    }
  };

  var ArgumentSpec = product('p_args', 'kw_args', 'rest_arg');
  ArgumentSpec.proto = { 
    clone: function() { 
      return new this.R.Value.ArgumentSpec(_.map(this.p_args, _.identity),
                                           _.clone(this.kw_args),
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
	    var keywords_needed = _.keys(this.kw_args);
	    var keywords_provided = _.keys(args.kw_args);
	    return (_.difference(keywords_needed, keywords_provided).length === 0) &&
        (_.difference(keywords_provided, keywords_needed).length === 0);
    },
    /**
     * @requires args must be accepted, (call ArgumentSpec.accepts(args) before this)
     */
    bind_arguments: function(args) {
      this.R.push_env();
	    var self = this;
	    self.bound_args = self.bound_args || [];
	    for(var i = 0; i < self.p_args.length; i++) {
	      self.R.bind(self.p_args[i], args.p_args[i]);
	    }

	    if(self.rest_arg) {
	      self.R.bind(self.rest_arg, args.p_args.slice(self.p_args.length));
	    }
	    _.each(self.kw_args, function(kw_name, kw) {
	      self.R.bind(kw_name, args.kw_args[kw]);
	    });
    },
    unbind_arguments: function() {
      return this.R.pop_env();
    },
    display: function() { 
      return '(' + this.p_args.join(' ') + 
        (_.map(this.kw_args, function(v,k) { return '#:' + k + ' ' + v; })).join(' ') + 
        (this.rest_arg ? ' . ' + this.rest_arg : '') + ')';
    }
  };

  var Arguments = product('p_args','kw_args');
  Arguments.proto = {
    clone: function() {
      return new this.R.Value.Arguments(_.map(this.p_args, _.identity), _.clone(this.kw_args));
    }
  };



  /////////////////////////////////////////////////////// Expressions

  var PairExpr = product('car','cdr');
  PairExpr.proto = {
    clone: clone_constructor,
    eval: function() { 
      return new this.R.Value.Pair(this.R.eval(this.car), 
                                   this.R.eval(this.cdr));
    },
    display: function() { 
      return '(' + this.R.display(this.car) + ' . ' + this.R.display(this.cdr) + ')';
    }
  };

  var NullExpr = product();
  NullExpr.proto = {
    clone: clone_constructor,
    eval: function() { 
      return new this.R.Value.Null();      
    },
    display: function() { 
      return '()';
    }
  };

  var BooleanExpr = product('b');
  BooleanExpr.proto = {
    clone: clone_constructor,
    eval: function() { 
      return new this.R.Value.Boolean(this.b);     
    },
    display: function() { 
      return this.b ? "#t" : "#f";
    }
  };

  var NumExpr = product('n');
  NumExpr.proto = {
    clone: clone_constructor,
    eval: function() { 
      return new this.R.Value.Num(this.n);
    },
    display: function() { 
      return this.n.toString();
    }
  };

  var PrimitiveExpr = product('arg_spec', 'f');
  PrimitiveExpr.proto = {
    clone: clone_constructor,
    eval: function() {
      return new this.R.Value.Primitive(this.R.eval(this.arg_spec), this.f);
    },
    display: function() { 
      return '(primitive ' + this.R.display(this.arg_spec) + ' ...)';
    }
  };

  var If = product('pred', 't_expr', 'f_expr');
  If.proto = {
    clone: clone_constructor,
    eval: function() {
      var pred_value = this.R.eval(this.pred);
      return this.R.eval(pred_value.get() ? this.t_expr : this.f_expr);
    },
    display: function() { 
      return '(if' + this.R.display(this.pred) + ' ' + this.R.display(this.t_expr) + ' ' + this.R.display(this.f_expr) + ')';
    }
  };

  var And = product('args');
  And.proto = {
    clone: function() {
      var self = this;
      return new this.R.Expr.And(_.map(this.args, function(arg) { 
        return self.R.clone(arg);
      }));
    },
    eval: function() {
      var arg_val = new this.R.Value.Boolean(true);
      for(var i = 0; i < this.args.length; i++) {
        arg_val = this.R.eval(this.args[i]);
        if((this.R.type(arg_val) === 'boolean') && (arg_val.b === false)) {
            return new this.R.Value.Boolean(false);
        }
      }
      return arg_val;
    },
    display: function() { 
      var self = this;
      return '(and ' + (_.map(this.args, self.R.display)).join(' ') + ')';
    }
  };

  var Or = product('args');
  Or.proto = {
    clone: function() {
      var self = this;
      return new this.R.Expr.Or(_.map(this.args, function(arg) { 
        return self.R.clone(arg); 
      }));
    },
    eval: function() {
      var arg_val;
      for(var i = 0; i < this.args.length; i++) {
        arg_val = this.R.eval(this.args[i]);
        if((this.R.type(arg_val) !== 'boolean') || (arg_val.b === true)) {
            return arg_val;
        }
      }
      return new this.R.Value.Boolean(false);
    },
    display: function() { 
      var self = this;
      return '(or ' + (_.map(this.args, self.R.display)).join(' ') + ')';
    }
  };

  /**
   * @desc Names/Identifiers
   */
  var Name = product('name');
  Name.proto = {
    clone: clone_constructor,
    eval: function() {
	    return this.R.lookup(this.name);
    }, 
    display: function() { 
      return this.name;
    }
  };

  /**
   * @desc Arguments objects
   */
  var ArgumentsExpr = product('p_args','kw_args');
  ArgumentsExpr.proto = {
    clone: function() {
      return new this.R.Expr.Arguments(_.map(this.p_args, _.identity), _.clone(this.kw_args));
    },
    eval: function() {
	    var self = this;
	    var p_arg_values = _.map(this.p_args, self.R.eval);
	    var kw_arg_values = {};
	    _.each(this.kw_args, function(kw_arg_expr, kw) {
	      kw_arg_values[kw] = self.R.eval(kw_arg_expr);
	    });
      return new this.R.Value.Arguments(p_arg_values, kw_arg_values);
    },
    display: function() { 
      return this.p_args.join(' ') + 
        (_.map(this.kw_args, function(v,k) { return '#:' + k + ' ' + v; })).join(' ') +
        (this.rest_arg ? ' . ' + this.rest_arg : '');
    }
  };

  /**
   * @desc Function Applications
   */
  var App = product('f', 'args');
  App.proto = {
    clone: clone_constructor,
    eval: function() {
	    var f_value = this.R.eval(this.f);
	    if(!(this.R.type(f_value) === 'closure' ||
	         this.R.type(f_value) === 'primitive')) {
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
      return '(' + this.R.display(this.f) + ' ' + this.R.display(this.args) + ')';
    }
  };

  /**
   * @desc Argument specification for a function
   */
  var ArgumentSpecExpr = product('p_args', 'kw_args', 'rest_arg');
  ArgumentSpecExpr.proto = {
    clone: function() { 
      return new this.R.Expr.ArgumentSpec(_.map(this.p_args, _.identity),
                                          _.clone(this.kw_args),
                                          this.rest_arg);
    },
    eval: function() {
      return new this.R.Value.ArgumentSpec(_.map(this.p_args, _.identity),
                                          _.clone(this.kw_args),
                                          this.rest_arg);
    }
  };

  /**
   * @desc Lambdas
   */
  var Lambda = product('arg_spec', 'body');
  Lambda.proto = {
    clone: clone_constructor,
    eval: function() {
	    return new this.R.Value.Closure(this.R.eval(this.arg_spec), this.R.clone(this.body), this.R.clone_envs());
    }
  };

  var Error = function(message) {
    this.message =  message;
  };

  self.Error = Error;
  global.R = R;

  var R = function(dict) {
    this.envs = [dict || {}];
    var self = this;

    this.Value = {};
    attach_value_node(self,Pair,'Pair',Pair.proto);
    attach_value_node(self,Null,'Null',Null.proto);
    attach_value_node(self,Num,'Num',Num.proto);
    attach_value_node(self,Boolean,'Boolean',Boolean.proto);
    attach_value_node(self,Primitive,'Primitive',Primitive.proto);
    attach_value_node(self,Closure,'Closure',Closure.proto);
    attach_value_node(self,ArgumentSpec,'ArgumentSpec',ArgumentSpec.proto);
    attach_value_node(self,Arguments,'Arguments',Arguments.proto);

    this.Expr = {};
    attach_expr_node(self,PairExpr,'Pair',PairExpr.proto);
    attach_expr_node(self,NullExpr,'Null',NullExpr.proto);
    attach_expr_node(self,NumExpr,'Num',NumExpr.proto);
    attach_expr_node(self,BooleanExpr,'Boolean',BooleanExpr.proto);
    attach_expr_node(self,PrimitiveExpr,'Primitive',PrimitiveExpr.proto);
    attach_expr_node(self,Lambda,'Lambda',Lambda.proto);

    attach_expr_node(self,Name,'Name',Name.proto);
    attach_expr_node(self,If,'If',If.proto);
    attach_expr_node(self,And,'And',And.proto);
    attach_expr_node(self,Or,'Or',Or.proto);
    attach_expr_node(self,App,'App',App.proto);
    attach_expr_node(self,ArgumentsExpr,'Arguments',ArgumentsExpr.proto);
    attach_expr_node(self,ArgumentSpecExpr,'ArgumentSpec',ArgumentSpecExpr.proto);                      
  };

  R.prototype = {
    list_all: function () {
      return _.map(this.envs, function(env) {
        return _.keys(env);
      });
    },
    bind: function(name, val) {
      var value = this.eval(val);
      // Have to special-case closures to handle recursion
      if(this.type(value) === 'closure') {
        // Add the closure to its own environment to make recursion possible
        if(value.envs[0][name]) {
          throw new Error("Name already bound in closure environment!");
        } else {
          value.envs[0][name] = [];
        }
        value.envs[0][name].unshift(value);
      }
      if(!this.envs[0][name]) {
	      this.envs[0][name] = [];
      }
      this.envs[0][name].unshift(value);
    },
    unbind: function(name) {
      if(!this.envs[0][name]) {
	      throw new Error("Can't unbind " + name + ": no bound values in local scope!");
      }
      return this.envs[0][name].shift();
    },
    lookup: function(name) {
      for(var i = 0; i < this.envs.length; i++) {
        if(this.envs[i][name]) {
          return this.envs[i][name][0];
        }
      }
      return null;
    },
    type: function(obj) {
      return obj.type;
    },
    clone: function(expr) {
      return expr.clone();
    },
    eval: function(expr) {
      return expr.eval();
    },
    swap_envs: function(envs) {
      var tmp_envs = this.envs;
      this.envs = envs;
      return tmp_envs;
    },
    push_env: function() {
      this.envs.unshift({});
    },
    pop_env: function() {
      return this.envs.shift();
    },
    clone_envs: function(envs) {
      var self = this;
      var old_envs = envs || this.envs;
      var new_envs = _.map(old_envs, function(env) {
        var new_env = {};
        _.each(env, function(v_array,k) {
          new_env[k] = _.map(v_array, function(v) { return self.clone(v); });
        });
        return new_env;
      });
      return new_envs;
    },
    display: function(expr) { 
      return expr.display();
    },
    quote: function(str) { 
      return "'" + str;
    }
  };

  /**
   * @desc Helper object to make constructing all this stuff easier
   */
  R.prototype.make_helper = function() {
    var r = this;
    return {
      app: function(f, args) {
	      return new r.Expr.App(f, args);
      },
      prim: function(arg_spec, f) {
	      return new r.Expr.Primitive(arg_spec, f);
      },
      args: function(p_args, kw_args) {
	      return new r.Expr.Arguments(p_args, kw_args);
      },
      p_args: function(/* args */) { 
        return new r.Expr.Arguments(Array.prototype.slice.call(arguments,0), {});
      },
      name: function(name_arg) {
	      return new r.Expr.Name(name_arg);
      },
      spec: function(p_args, kw_args, rest_arg) {
	      return new r.Expr.ArgumentSpec(p_args, kw_args, rest_arg);
      },
      p_spec: function(/* args */) {
        return new r.Expr.ArgumentSpec(Array.prototype.slice.call(arguments,0), {}, null);
      },
      kw_spec: function(args) {
        return new r.Expr.ArgumentSpec([], args, null);
      },
      rest_spec: function(name) {
        return new r.Expr.ArgumentSpec([], {}, name);
      },
      fn: function(arg_spec, body) {
	      return new r.Expr.Lambda(arg_spec, body);
      },
      num: function(n) {
        if(typeof n === 'number') {
          return new r.Expr.Num(n);
        } else {
          return n;
        }
      },
      pair: function(car, cdr) {
        return new r.Expr.Pair(car, cdr);
      },
      _null: function() {
        return new r.Expr.Null();
      },
      bool: function(b) {
        return new r.Expr.Boolean(b);
      },
      _if: function(p, t, f) {
        return new r.Expr.If(p, t, f);
      },
      and: function(/* args */) {
        return new r.Expr.And(Array.prototype.slice.call(arguments, 0));
      },
      or: function(/* args */) {
        return new r.Expr.Or(Array.prototype.slice.call(arguments, 0));
      }
    };
  };

  return R;

};
