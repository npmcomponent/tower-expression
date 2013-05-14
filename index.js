
/**
 * Module dependencies.
 */

var operator = require('tower-operator')
  , escapeRegExp = 'undefined' === typeof window
    ? require('escape-regexp-component')
    : require('escape-regexp');

/**
 * Expose `expression`.
 */

module.exports = expression;

/**
 * RegExps.
 */

var filterRegExp = / +| +/;
var fnRegExp = /(\w+)\(([^\)]*)\)/;
var numberRegExp = /^\d+(?:\.\d+)*$/
var propertyRegExp = /[\w\d\.]+/
var operatorRegExp = [];
for (var i = 0, n = operator.collection.length; i < n; i++) {
  operatorRegExp.push(escapeRegExp(operator.collection[i]));
}
operatorRegExp = new RegExp('(' + propertyRegExp.source + ') *(' + operatorRegExp.join('|') + ') *(' + propertyRegExp.source + ')');

/**
 * Parse a directive expression.
 *
 * XXX: Maybe there are "named" expressions later.
 *
 * @param {String} val
 * @return {Function} fn Expression to evaluate
 *    against the current `scope`.
 */

function expression(val) {
  // property used in this expression.
  var deps = {};
  var fn = Function('scope', '  return ' + parseExpression(val, deps));
  var keys = [];
  for (var key in deps) keys.push(key);
  fn.deps = keys;
  return fn;
}

function filterExpression(val) {
  val = val.split(filterRexExp);
  for (var i = 0, n = val.length; i < n; i++) {
    // XXX
    // val[i] = x
  }
  return val
}

function parseExpression(val, deps) {
  return keyValueExpression(val, deps)
    || fnExpression(val, deps)
    || operatorExpression(val, deps)
    || propertyExpression(val, deps);
}

// <input on-keypress="enter:createTodo">
// <input on-keypress="enter : createTodo">
// <input on-keypress="enter:create(todo)">
function keyValueExpression(val) {
  // XXX: todo
  // val.match(fnRegExp);
}

// <input on-keypress="create(todo)">
function fnExpression(val, deps) {
  if (!val.match(fnRegExp)) return;

  var name = RegExp.$1;
  var args = RegExp.$2;
  
  if (args) {
    return "scope.call('" + name + "', " + argumentsExpression(args, deps) + ")";
  } else {
    return "scope.call('" + name + "')";
  }
}

function argumentsExpression(val, deps) {
  val = val.split(/ *, */);
  var result = [];
  for (var i = 0, n = val.length; i < n; i ++) {
    // XXX: special cases: `i`, `event`, `this`.
    result.push(parseExpression(val[i], deps));
  }
  return result.join(', ');
}

function operatorExpression(val, deps) {
  if (!val.match(operatorRegExp)) return;

  var left = RegExp.$1;
  var operator = RegExp.$2;
  var right = RegExp.$3;

  var code = parseExpression(left, deps)
    + ' ' + operator + ' '
    + parseExpression(right, deps);

  return code;
}

function propertyExpression(val, deps) {
  return numberExpression(val, deps)
    || pathExpression(val, deps);
}

function numberExpression(val, deps) {
  if (val.match(numberRegExp)) return val;
}

function pathExpression(val, deps) {
  deps[val] = true;
  return "scope.get('" + val + "')";
}