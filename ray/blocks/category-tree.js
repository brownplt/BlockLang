
goog.provide('Ray.Blocks.CategoryTree');

goog.require('Ray.Blocks.Config');

goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.object');


// Don't put anything above this line, or it will get clobbered when I reassign Ray.Blocks.CategoryTree!!

Ray.Blocks.CategoryTree = function() {
  return new Ray.Blocks.CategoryTree.Node();
};

Ray.Blocks.CategoryTree.prototype.setParent = function(parent) { this.parent_ = parent; };
Ray.Blocks.CategoryTree.prototype.getLookupKey = function() {
  if(!this.parent_) { return null; }
  var key = goog.object.findKey(this.parent_.subcategories_, function(value) {
    return this === value;
  }, this);
  return key;
};
Ray.Blocks.CategoryTree.prototype.getDisplayName = function() {
  return Ray.Blocks.Config.categoryKeyToDisplayName(this.getLookupKey());
}
Ray.Blocks.CategoryTree.prototype.getPath = function() {
  if(this.parent_ === null) {
    return [];
  } else {
    return this.parent_.getPath().concat(this.getLookupKey());
  }
};



// Nodes contain subcategories
Ray.Blocks.CategoryTree.Node = function() {
  this.subcategories_ = {};
  this.parent_ = null;
};
goog.inherits(Ray.Blocks.CategoryTree.Node, Ray.Blocks.CategoryTree);

Ray.Blocks.CategoryTree.Node.prototype.isNode = function() { return true; };
Ray.Blocks.CategoryTree.Node.prototype.isLeaf = function() { return false; };
Ray.Blocks.CategoryTree.Node.prototype.getChildren = function() { return goog.object.getValues(this.subcategories_); };
Ray.Blocks.CategoryTree.Node.prototype.addItemAt = function(path, item) {
  if(path.length === 0) {
    throw 'Empty path';
  }

  var key = path.shift();
  if(path.length === 0) {
    this.get_(key, true).add(item);
  } else {
    this.get_(key).addItemAt(path, item);
  }
};
Ray.Blocks.CategoryTree.Node.prototype.getItems = function(path) {
  if(path.length === 0) {
    throw 'Empty path';
  }
  var newPath = goog.array.clone(path);
  var key = newPath.shift();
  if(newPath.length === 0) {
    return this.get_(key, true).getItems();
  } else {
    return this.get_(key).getItems(newPath);
  }
};
Ray.Blocks.CategoryTree.Node.prototype.get_ = function(key, opt_isLeaf) {
  var childIsNode = !opt_isLeaf;
  var value = this.subcategories_[key];
  if(!value) {
    if(childIsNode) {
      this.subcategories_[key] = new Ray.Blocks.CategoryTree.Node();
      value = this.subcategories_[key];
    } else {
      this.subcategories_[key] = new Ray.Blocks.CategoryTree.Leaf();
      value = this.subcategories_[key];
    }

    value.setParent(this);
  } else if((childIsNode && value.isLeaf()) ||
            (!childIsNode && value.isNode())) {
    throw { msg: 'Unexpected value!', value: value, childIsNode: childIsNode };
  }
  return value;
};
Ray.Blocks.CategoryTree.Node.prototype.toToolboxXml = function() {
  var xml = goog.dom.createDom('xml', {'id': 'toolbox' });
  var categoryNames = goog.object.getKeys(this.subcategories_);
  goog.array.forEach(categoryNames, function(categoryName) {
    var category = this.subcategories_[categoryName];
    var categoryXml = category.toXml(categoryName);
    goog.dom.appendChild(xml, categoryXml);
  }, this);
  return goog.dom.xml.serialize(xml);
};
Ray.Blocks.CategoryTree.Node.prototype.toXml = function(categoryName) {
  var categoryXml = goog.dom.createDom('category');
  goog.dom.xml.setAttributes(categoryXml, {'name': categoryName});
  var subcategoryNames = goog.object.getKeys(this.subcategories_);
  goog.array.forEach(subcategoryNames, function(subcategoryName) {
    var subcategory = this.subcategories_[subcategoryName];
    var subcategoryXml = subcategory.toXml(subcategoryName);
    goog.dom.appendChild(categoryXml, subcategoryXml);
  }, this);
  return categoryXml;
};
Ray.Blocks.CategoryTree.Node.prototype.removeCategory = function(categoryName) {
  var category = this.subcategories_[categoryName];
  if(!category) {
    return false;
  } else {
    delete this.subcategories_[categoryName];
    return true;
  }
};

// Leaves contain items, not subcategories
Ray.Blocks.CategoryTree.Leaf = function() {
  this.contents_ = [];
  this.parent_ = null;
};
goog.inherits(Ray.Blocks.CategoryTree.Leaf, Ray.Blocks.CategoryTree);

Ray.Blocks.CategoryTree.Leaf.prototype.isLeaf = function() { return true; };
Ray.Blocks.CategoryTree.Leaf.prototype.isNode = function() { return false; };
Ray.Blocks.CategoryTree.Leaf.prototype.add = function(item) {
  if(!goog.isDef(item)) {
    return false;
  }
  this.contents_.push(item);
  return true;
};
Ray.Blocks.CategoryTree.Leaf.prototype.getItems = function() {
  return this.contents_;
};
Ray.Blocks.CategoryTree.Leaf.prototype.toXml = function(categoryName) {
  var categoryXml = goog.dom.createDom('category');
  var attributes = {
    'name': categoryName,
    'key': categoryName,
    'custom': categoryName
  };
  goog.dom.xml.setAttributes(categoryXml, attributes);
  return categoryXml;
};

Ray.Blocks.generateToolbox = function(blockDirectory, opt_includeArguments) {
  var includeArguments = goog.isDef(opt_includeArguments) ? opt_includeArguments : true;
  var toolboxCategories = goog.object.getKeys(blockDirectory);
  toolboxCategories.sort();
  var toolbox = goog.dom.createDom('xml', {id: 'toolbox'});
  goog.array.forEach(toolboxCategories, function(category) {
    // Disabling these categories at the moment
    if(category === Ray.Blocks.ARGUMENT_CATEGORY_NAME || category === Ray.Blocks.ALL_CATEGORY_NAME) {
      return;
    }
    // Don't display arguments if false is passed in as opt_includeArguments
    if(category === Ray.Blocks.ARGUMENT_CATEGORY_NAME && !includeArguments) {
      return;
    }
    // Otherwise, display category, even if it is empty!
    var cat = goog.dom.createDom('category');
    goog.dom.xml.setAttributes(cat, {name: category});

    if(!goog.isArray(blockDirectory[category])) {
      goog.array.forEach(goog.object.getKeys(blockDirectory[category]), function(subcategory) {
        var attributes = {};
        attributes.name = (subcategory === Ray.Blocks.INPUT_CATEGORY_NAME ? 'consumes' : 'produces');
        attributes.key = subcategory;
        attributes.custom = category + '_' + attributes.key;
        var subcat = goog.dom.createDom('category');
        goog.dom.xml.setAttributes(subcat, attributes);
        goog.dom.appendChild(cat, subcat);
      });
    } else {
      goog.dom.xml.setAttributes(cat, {custom: category});
    }

    goog.dom.appendChild(toolbox, cat);
  });
  return goog.dom.xml.serialize(toolbox);
};