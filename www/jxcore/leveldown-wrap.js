var LeveldownMobile = require('leveldown-mobile');
var ChainedBatch = require('leveldown-mobile/chained-batch');
var Iterator = require('leveldown-mobile/iterator');

var wrapCallback = require('async-listener/glue.js')
var shimmer = require('shimmer')
var massWrap = shimmer.massWrap

massWrap(
  LeveldownMobile,
  [
    'destroy',
    'repair'
  ],
  activator
);

massWrap(
  LeveldownMobile.prototype,
  [
    '_open',
    '_close',
    '_put',
    '_get',
    '_del',
    '_batch',
    '_approximateSize'
  ],
  activator
);

massWrap(
  ChainedBatch.prototype,
  [
    '_write'
  ],
  activator
);

massWrap(
  Iterator.prototype,
  [
    '_next',
    '_end'
  ],
  activator
);

function activator(fn) {
  var fallback = function () {
    var args;
    var cbIdx = arguments.length - 1;
    if (typeof arguments[cbIdx] === "function") {
      args = Array(arguments.length)
      for (var i = 0; i < arguments.length - 1; i++) {
        args[i] = arguments[i];
      }
      args[cbIdx] = wrapCallback(arguments[cbIdx]);
    }
    return fn.apply(this, args || arguments);
  };
  // Preserve function length for small arg count functions.
  switch (fn.length) {
    case 1:
      return function (cb) {
        if (arguments.length !== 1) return fallback.apply(this, arguments);
        if (typeof cb === "function") cb = wrapCallback(cb);
        return fn.call(this, cb);
      };
    case 2:
      return function (a, cb) {
        if (arguments.length !== 2) return fallback.apply(this, arguments);
        if (typeof cb === "function") cb = wrapCallback(cb);
        return fn.call(this, a, cb);
      };
    case 3:
      return function (a, b, cb) {
        if (arguments.length !== 3) return fallback.apply(this, arguments);
        if (typeof cb === "function") cb = wrapCallback(cb);
        return fn.call(this, a, b, cb);
      };
    case 4:
      return function (a, b, c, cb) {
        if (arguments.length !== 4) return fallback.apply(this, arguments);
        if (typeof cb === "function") cb = wrapCallback(cb);
        return fn.call(this, a, b, c, cb);
      };
    case 5:
      return function (a, b, c, d, cb) {
        if (arguments.length !== 5) return fallback.apply(this, arguments);
        if (typeof cb === "function") cb = wrapCallback(cb);
        return fn.call(this, a, b, c, d, cb);
      };
    case 6:
      return function (a, b, c, d, e, cb) {
        if (arguments.length !== 6) return fallback.apply(this, arguments);
        if (typeof cb === "function") cb = wrapCallback(cb);
        return fn.call(this, a, b, c, d, e, cb);
      };
    default:
      return fallback;
  }
}
