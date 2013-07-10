/*
 * User: spencergordon
 * Date: 7/8/13
 * Time: 1:59 PM
 *
 * So I want it to be possible to specify constraints in a simple and elegant fashion
 */
goog.provide('Ray.Inference');

goog.require('Ray.Types');

goog.require('goog.array');

/*
 * What do I need to specify as user to get the inference working?
 *
 * I need to provide a function to get the connections.
 *
 * I need the connections to be aware of their role in the constraint and to modify their behavior accordingly
 *
 */

Ray.Inference.inferType = function(conns, ty) {
  goog.array.forEach(conns, function(conn) {
    if(conn.inferTypeFromConstraint) {
      conn.inferTypeFromConstraint(ty);
    } else {
      conn.inferType(ty);
    }
  });
};

Ray.Inference.inferListTypeFromElementConstraint = function(ty) {
  this.inferType(new Ray.Types.List(ty));
};

Ray.Inference.getElementTypeForListConstraint = function(ty) {
  return ty.element_type;
};

Ray.Inference.clearInferredType = function(conns) {
  goog.array.map(conns, function(c) { c.clearInferredType(); });
};

Ray.Inference.getInitialType = function(conns) {
  return goog.array.map(conns, function(c) {
    var ty = c.getInitialType();
    return c.getTypeForConstraint ? c.getTypeForConstraint(ty) : ty;
  });
};

Ray.Inference.updateInferredTypes = function(conn, ty) {
  var type = conn.getTypeForConstraint ? conn.getTypeForConstraint(ty) : ty;
  this.updateTypes(type);
};

Ray.Inference.updateTypes = function(ty) {
  var connections = this.getConstraintConnections();

  if(ty) {
    Ray.Inference.inferType(connections, ty);
  } else {
    Ray.Inference.clearInferredType(connections)
    var types = Ray.Inference.getInitialType(connections);
    var principal_type = Ray.Types.principal_type(types);
    Ray.Inference.inferType(connections, principal_type);
  }
};