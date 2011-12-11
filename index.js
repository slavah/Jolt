/*/////////////////////////////// JOLT /////////////////////////////////
 *
 * Reactive Objects for JavaScript
 * https://github.com/projexsys/Jolt
 *
 * This software is Copyright (c) 2011 by Projexsys, Inc.
 *
 * This is free software, licensed under:
 *
 * The GNU General Public License Version 3
 *
 * The JavaScript code developed and owned by Projexsys, Inc. in this
 * page is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License (GNU GPL) as published by
 * the Free Software Foundation, either version 3 of the License, or (at
 * your option) any later version. The code is distributed WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU GPL for more details:
 *
 * https://raw.github.com/projexsys/Jolt/master/LICENSE
 * http://www.gnu.org/licenses/gpl-3.0.txt
 *
 * As a special exception to the GNU GPL, any HTML file or other
 * software which merely makes function calls to this software, and for
 * that purpose includes it by reference or requires it as a dependency,
 * shall be deemed a separate work for copyright law purposes. This
 * special exception is not applicable to prototype extensions of or
 * with the objects exported by this software, which comprise its API.
 * In addition, the copyright holders of this software give you
 * permission to combine it with free software libraries that are
 * released under the GNU Lesser General Public License (GNU LGPL). You
 * may copy and distribute such a system following the terms of the GNU
 * GPL for this software and the GNU LGPL for the libraries. If you
 * modify this software, you may extend this exception to your version
 * of the software, but you are not obligated to do so. If you do not
 * wish to do so, delete this exception statement from your version.
 *
 * If you have executed an End User Software License and Services
 * Agreement or an OEM Software License and Support Services Agreement,
 * or another commercial license agreement with Projexsys, Inc. (each, a
 * "Commercial Agreement"), the terms of the license in such Commercial
 * Agreement will supersede the GNU GPL and you may use the Software
 * solely pursuant to the terms of the relevant Commercial Agreement.
 *
//////////////////////////////// CREDIT ////////////////////////////////
 *
 * This sofware is derived from and incorporates existing works:
 *
 *  https://github.com/brownplt/flapjax
 *  https://github.com/hij1nx/EventEmitter2
 *  https://github.com/documentcloud/underscore
 *  https://github.com/autotelicum/Smooth-CoffeeScript
 *
 * For further information and license texts please refer to:
 * https://raw.github.com/projexsys/Jolt/master/LICENSES
 *
/*//////////////////////////////////////////////////////////////////////



;(function (exports, undefined) {

  // MYMOD - 15 Nov 2011
  var EventEmitter
  
  // MYMOD - 15 Nov 2011
  ;(function(undefined) {
  
    var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
      return Object.prototype.toString.call(obj) === "[object Array]";
    };
    var defaultMaxListeners = 10;
  
    function init() {
      this._events = new Object;
    }
  
    function configure(conf) {
  
      if (conf) {
        this.wildcard = conf.wildcard;
        this.delimiter = conf.delimiter || '.';
  
        if (this.wildcard) {
          this.listenerTree = new Object;
        }
      }
    }
  
    // MYMOD - 15 Nov 2011
    EventEmitter = function EventEmitter(conf) {
      this._events = new Object;
      configure.call(this, conf);
    }
  
    function searchListenerTree(handlers, type, tree, i) {
      if (!tree) {
        return;
      }
      var listeners, leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
          typeLength = type.length, currentType = type[i], nextType = type[i+1];
      if (i === typeLength && tree._listeners) {
        //
        // If at the end of the event(s) list and the tree has listeners
        // invoke those listeners.
        //
        if (typeof tree._listeners === 'function') {
          handlers && handlers.push(tree._listeners);
          return tree;
        } else {
          for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
            handlers && handlers.push(tree._listeners[leaf]);
          }
          return tree;
        }
      }
  
      if ((currentType === '*' || currentType === '**') || tree[currentType]) {
        //
        // If the event emitted is '*' at this part
        // or there is a concrete match at this patch
        //
        if (currentType === '*') {
          for (branch in tree) {
            if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
              listeners = searchListenerTree(handlers, type, tree[branch], i+1);
            }
          }
          return listeners;
        } else if(currentType === '**') {
          endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
          if(endReached && tree._listeners) {
            // The next element has a _listeners, add it to the handlers.
            listeners = searchListenerTree(handlers, type, tree, typeLength);
          }
  
          for (branch in tree) {
            if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
              if(branch === '*' || branch === '**') {
                if(tree[branch]._listeners && !endReached) {
                  listeners = searchListenerTree(handlers, type, tree[branch], typeLength);
                }
                listeners = searchListenerTree(handlers, type, tree[branch], i);
              } else if(branch === nextType) {
                listeners = searchListenerTree(handlers, type, tree[branch], i+2);
              } else {
                // No match on this one, shift into the tree but not in the type array.
                listeners = searchListenerTree(handlers, type, tree[branch], i);
              }
            }
          }
          return listeners;
        }
  
        listeners = searchListenerTree(handlers, type, tree[currentType], i+1);
      }
  
      xTree = tree['*'];
      if (xTree) {
        //
        // If the listener tree will allow any match for this part,
        // then recursively explore all branches of the tree
        //
        searchListenerTree(handlers, type, xTree, i+1);
      }
      
      xxTree = tree['**'];
      if(xxTree) {
        if(i < typeLength) {
          if(xxTree._listeners) {
            // If we have a listener on a '**', it will catch all, so add its handler.
            searchListenerTree(handlers, type, xxTree, typeLength);
          }
          
          // Build arrays of matching next branches and others.
          for(branch in xxTree) {
            if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
              if(branch === nextType) {
                // We know the next element will match, so jump twice.
                searchListenerTree(handlers, type, xxTree[branch], i+2);
              } else if(branch === currentType) {
                // Current node matches, move into the tree.
                searchListenerTree(handlers, type, xxTree[branch], i+1);
              } else {
                isolatedBranch = {};
                isolatedBranch[branch] = xxTree[branch];
                searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
              }
            }
          }
        } else if(xxTree._listeners) {
          // We have reached the end and still on a '**'
          searchListenerTree(handlers, type, xxTree, typeLength);
        } else if(xxTree['*'] && xxTree['*']._listeners) {
          searchListenerTree(handlers, type, xxTree['*'], typeLength);
        }
      }
  
      return listeners;
    }
  
    function growListenerTree(type, listener) {
  
      type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      
      //
      // Looks for too consecutive '**', if so, don't add the event at all.
      //
      for(var i = 0, len = type.length; i+1 < len; i++) {
        if(type[i] === '**' && type[i+1] === '**') {
          return;
        }
      }
  
      var tree = this.listenerTree;
      var name = type.shift();
  
      while (name) {
  
        if (!tree[name]) {
          tree[name] = new Object;
        }
  
        tree = tree[name];
  
        if (type.length === 0) {
  
          if (!tree._listeners) {
            tree._listeners = listener;
          }
          else if(typeof tree._listeners === 'function') {
            tree._listeners = [tree._listeners, listener];
          }
          else if (isArray(tree._listeners)) {
  
            tree._listeners.push(listener);
  
            if (!tree._listeners.warned) {
  
              var m = defaultMaxListeners;
  
              if (m > 0 && tree._listeners.length > m) {
  
                tree._listeners.warned = true;
                console.error('(node) warning: possible EventEmitter memory ' +
                              'leak detected. %d listeners added. ' +
                              'Use emitter.setMaxListeners() to increase limit.',
                              tree._listeners.length);
                console.trace();
              }
            }
          }
          return true;
        }
        name = type.shift();
      }
      return true;
    };
  
    // By default EventEmitters will print a warning if more than
    // 10 listeners are added to it. This is a useful default which
    // helps finding memory leaks.
    //
    // Obviously not all Emitters should be limited to 10. This function allows
    // that to be increased. Set to zero for unlimited.
  
    EventEmitter.prototype.setMaxListeners = function(n) {
      this._events || init.call(this);
      this._events.maxListeners = n;
    };
  
    EventEmitter.prototype.event = '';
  
    EventEmitter.prototype.once = function(event, fn) {
      this.many(event, 1, fn);
      return this;
    };
  
    EventEmitter.prototype.many = function(event, ttl, fn) {
      var self = this;
  
      if (typeof fn !== 'function') {
        throw new Error('many only accepts instances of Function');
      }
  
      function listener() {
        if (--ttl === 0) {
          self.off(event, listener);
        }
        fn.apply(this, arguments);
      };
  
      listener._origin = fn;
  
      this.on(event, listener);
  
      return self;
    };
  
    EventEmitter.prototype.emit = function() {
      this._events || init.call(this);
  
      var type = arguments[0];
  
      if (type === 'newListener') {
        if (!this._events.newListener) { return false; }
      }
  
      // Loop through the *_all* functions and invoke them.
      if (this._all) {
        var l = arguments.length;
        var args = new Array(l - 1);
        for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
        for (i = 0, l = this._all.length; i < l; i++) {
          this.event = type;
          this._all[i].apply(this, args);
        }
      }
  
      // If there is no 'error' event listener then throw.
      if (type === 'error') {
        
        if (!this._all && 
          !this._events.error && 
          !(this.wildcard && this.listenerTree.error)) {
  
          if (arguments[1] instanceof Error) {
            throw arguments[1]; // Unhandled 'error' event
          } else {
            throw new Error("Uncaught, unspecified 'error' event.");
          }
          return false;
        }
      }
  
      var handler;
  
      if(this.wildcard) {
        handler = [];
        var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
        searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
      }
      else {
        handler = this._events[type];
      }
  
      if (typeof handler === 'function') {
        this.event = type;
        if (arguments.length === 1) {
          handler.call(this);
        }
        else if (arguments.length > 1)
          switch (arguments.length) {
            case 2:
              handler.call(this, arguments[1]);
              break;
            case 3:
              handler.call(this, arguments[1], arguments[2]);
              break;
            // slower
            default:
              var l = arguments.length;
              var args = new Array(l - 1);
              for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
              handler.apply(this, args);
          }
        return true;
      }
      else if (handler) {
        var l = arguments.length;
        var args = new Array(l - 1);
        for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
  
        var listeners = handler.slice();
        for (var i = 0, l = listeners.length; i < l; i++) {
          this.event = type;
          listeners[i].apply(this, args);
        }
        return true;
      }
  
    };
  
    EventEmitter.prototype.on = function(type, listener) {
      this._events || init.call(this);
  
      // To avoid recursion in the case that type == "newListeners"! Before
      // adding it to the listeners, first emit "newListeners".
      this.emit('newListener', type, listener);
  
      if(this.wildcard) {
        growListenerTree.call(this, type, listener);
        return this;
      }
  
      if (!this._events[type]) {
        // Optimize the case of one listener. Don't need the extra array object.
        this._events[type] = listener;
      }
      else if(typeof this._events[type] === 'function') {
        // Adding the second element, need to change to array.
        this._events[type] = [this._events[type], listener];
      }
      else if (isArray(this._events[type])) {
        // If we've already got an array, just append.
        this._events[type].push(listener);
  
        // Check for listener leak
        if (!this._events[type].warned) {
  
          var m;
          if (this._events.maxListeners !== undefined) {
            m = this._events.maxListeners;
          } else {
            m = defaultMaxListeners;
          }
  
          if (m && m > 0 && this._events[type].length > m) {
  
            this._events[type].warned = true;
            console.error('(node) warning: possible EventEmitter memory ' +
                          'leak detected. %d listeners added. ' +
                          'Use emitter.setMaxListeners() to increase limit.',
                          this._events[type].length);
            console.trace();
          }
        }
      }
      return this;
    };
  
    EventEmitter.prototype.onAny = function(fn) {
  
      if(!this._all) {
        this._all = [];
      }
  
      if (typeof fn !== 'function') {
        throw new Error('onAny only accepts instances of Function');
      }
  
      // Add the function to the event listener collection.
      this._all.push(fn);
      return this;
    };
  
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;
  
    EventEmitter.prototype.off = function(type, listener) {
      if (typeof listener !== 'function') {
        throw new Error('removeListener only takes instances of Function');
      }
  
      var handlers;
  
      if(this.wildcard) {
        var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
        var leaf = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
  
        if('undefined' === typeof leaf) { return this; }
        handlers = leaf._listeners;
      }
      else {
        // does not use listeners(), so no side effect of creating _events[type]
        if (!this._events[type]) return this;
        handlers = this._events[type];
      }
  
      if (isArray(handlers)) {
  
        var position = -1;
  
        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }
  
        if (position < 0) {
          return this;
        }
  
        if(this.wildcard) {
          leaf._listeners.splice(position, 1)
        }
        else {
          this._events[type].splice(position, 1);
        }
  
        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }
      }
  
      return this;
    };
  
    EventEmitter.prototype.offAny = function(fn) {
      var i = 0, l = 0, fns;
      if (fn && this._all && this._all.length > 0) {
        fns = this._all;
        for(i = 0, l = fns.length; i < l; i++) {
          if(fn === fns[i]) {
            fns.splice(i, 1);
            return this;
          }
        }
      } else {
        this._all = [];
      }
      return this;
    };
  
    EventEmitter.prototype.removeListener = EventEmitter.prototype.off;
  
    EventEmitter.prototype.removeAllListeners = function(type) {
      if (arguments.length === 0) {
        !this._events || init.call(this);
        return this;
      }
  
      if(this.wildcard) {
        var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
        var leaf = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
  
        if('undefined' === typeof leaf) { return this; }
        leaf._listeners = null;
      }
      else {
        if (!this._events[type]) return this;
        this._events[type] = null;
      }
      return this;
    };
  
    EventEmitter.prototype.listeners = function(type) {
      if(this.wildcard) {
        var handlers = [];
        var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
        searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
        return handlers;
      }
  
      this._events || init.call(this);
  
      if (!this._events[type]) this._events[type] = [];
      if (!isArray(this._events[type])) {
        this._events[type] = [this._events[type]];
      }
      return this._events[type];
    };
  
    EventEmitter.prototype.listenersAny = function() {
  
      if(this._all) {
        return this._all;
      }
      else {
        return [];
      }
  
    };
  
    // MYMOD - 15 Nov 2011
    //exports.EventEmitter2 = EventEmitter;
  
  // MYMOD - 15 Nov 2011
  })();
  
  //     Underscore.js 1.2.2
  //     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
  //     Underscore is freely distributable under the MIT license.
  //     Portions of Underscore are inspired or borrowed from Prototype,
  //     Oliver Steele's Functional, and John Resig's Micro-Templating.
  //     For all details and documentation:
  //     http://documentcloud.github.com/underscore
  
  // MYMOD - 14 Nov 2011
  var _
  
  ;(function() {
  
    // Baseline setup
    // --------------
  
    // MYMOD - 14 Nov 2011
    // Establish the root object, `window` in the browser, or `global` on the server.
    //var root = this;
    //
    // Save the previous value of the `_` variable.
    //var previousUnderscore = root._;
  
    // Establish the object that gets returned to break out of a loop iteration.
    var breaker = {};
  
    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
  
    // Create quick reference variables for speed access to core prototypes.
    var slice            = ArrayProto.slice,
        unshift          = ArrayProto.unshift,
        toString         = ObjProto.toString,
        hasOwnProperty   = ObjProto.hasOwnProperty;
  
    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    var
      nativeForEach      = ArrayProto.forEach,
      nativeMap          = ArrayProto.map,
      nativeReduce       = ArrayProto.reduce,
      nativeReduceRight  = ArrayProto.reduceRight,
      nativeFilter       = ArrayProto.filter,
      nativeEvery        = ArrayProto.every,
      nativeSome         = ArrayProto.some,
      nativeIndexOf      = ArrayProto.indexOf,
      nativeLastIndexOf  = ArrayProto.lastIndexOf,
      nativeIsArray      = Array.isArray,
      nativeKeys         = Object.keys,
      nativeBind         = FuncProto.bind;
  
    // MYMOD - 14 Nov 2011
    // Create a safe reference to the Underscore object for use below.
    _ = function(obj) { return new wrapper(obj); };
  
    // MYMOD - 14 Nov 2011
    // Export the Underscore object for **Node.js** and **"CommonJS"**, with
    // backwards-compatibility for the old `require()` API. If we're not in
    // CommonJS, add `_` to the global object.
    //if (typeof exports !== 'undefined') {
    //  if (typeof module !== 'undefined' && module.exports) {
    //    exports = module.exports = _;
    //  }
    //  exports._ = _;
    //} else if (typeof define === 'function' && define.amd) {
    //  // Register as a named module with AMD.
    //  define('underscore', function() {
    //    return _;
    //  });
    //} else {
    //  // Exported as a string, for Closure Compiler "advanced" mode.
    //  root['_'] = _;
    //}
  
    // Current version.
    _.VERSION = '1.2.2';
  
    // Collection Functions
    // --------------------
  
    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles objects with the built-in `forEach`, arrays, and raw objects.
    // Delegates to **ECMAScript 5**'s native `forEach` if available.
    var each = _.each = _.forEach = function(obj, iterator, context) {
      if (obj == null) return;
      if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
      } else if (obj.length === +obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
        }
      } else {
        for (var key in obj) {
          if (hasOwnProperty.call(obj, key)) {
            if (iterator.call(context, obj[key], key, obj) === breaker) return;
          }
        }
      }
    };
  
    // Return the results of applying the iterator to each element.
    // Delegates to **ECMAScript 5**'s native `map` if available.
    _.map = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
      each(obj, function(value, index, list) {
        results[results.length] = iterator.call(context, value, index, list);
      });
      return results;
    };
  
    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
    _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
      var initial = memo !== void 0;
      if (obj == null) obj = [];
      if (nativeReduce && obj.reduce === nativeReduce) {
        if (context) iterator = _.bind(iterator, context);
        return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
      }
      each(obj, function(value, index, list) {
        if (!initial) {
          memo = value;
          initial = true;
        } else {
          memo = iterator.call(context, memo, value, index, list);
        }
      });
      if (!initial) throw new TypeError("Reduce of empty array with no initial value");
      return memo;
    };
  
    // The right-associative version of reduce, also known as `foldr`.
    // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
    _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
      if (obj == null) obj = [];
      if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
        if (context) iterator = _.bind(iterator, context);
        return memo !== void 0 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
      }
      var reversed = (_.isArray(obj) ? obj.slice() : _.toArray(obj)).reverse();
      return _.reduce(reversed, iterator, memo, context);
    };
  
    // Return the first value which passes a truth test. Aliased as `detect`.
    _.find = _.detect = function(obj, iterator, context) {
      var result;
      any(obj, function(value, index, list) {
        if (iterator.call(context, value, index, list)) {
          result = value;
          return true;
        }
      });
      return result;
    };
  
    // Return all the elements that pass a truth test.
    // Delegates to **ECMAScript 5**'s native `filter` if available.
    // Aliased as `select`.
    _.filter = _.select = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
      each(obj, function(value, index, list) {
        if (iterator.call(context, value, index, list)) results[results.length] = value;
      });
      return results;
    };
  
    // Return all the elements for which a truth test fails.
    _.reject = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      each(obj, function(value, index, list) {
        if (!iterator.call(context, value, index, list)) results[results.length] = value;
      });
      return results;
    };
  
    // Determine whether all of the elements match a truth test.
    // Delegates to **ECMAScript 5**'s native `every` if available.
    // Aliased as `all`.
    _.every = _.all = function(obj, iterator, context) {
      var result = true;
      if (obj == null) return result;
      if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
      each(obj, function(value, index, list) {
        if (!(result = result && iterator.call(context, value, index, list))) return breaker;
      });
      return result;
    };
  
    // Determine if at least one element in the object matches a truth test.
    // Delegates to **ECMAScript 5**'s native `some` if available.
    // Aliased as `any`.
    var any = _.some = _.any = function(obj, iterator, context) {
      iterator = iterator || _.identity;
      var result = false;
      if (obj == null) return result;
      if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
      each(obj, function(value, index, list) {
        if (result || (result = iterator.call(context, value, index, list))) return breaker;
      });
      return !!result;
    };
  
    // Determine if a given value is included in the array or object using `===`.
    // Aliased as `contains`.
    _.include = _.contains = function(obj, target) {
      var found = false;
      if (obj == null) return found;
      if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
      found = any(obj, function(value) {
        return value === target;
      });
      return found;
    };
  
    // Invoke a method (with arguments) on every item in a collection.
    _.invoke = function(obj, method) {
      var args = slice.call(arguments, 2);
      return _.map(obj, function(value) {
        return (method.call ? method || value : value[method]).apply(value, args);
      });
    };
  
    // Convenience version of a common use case of `map`: fetching a property.
    _.pluck = function(obj, key) {
      return _.map(obj, function(value){ return value[key]; });
    };
  
    // Return the maximum element or (element-based computation).
    _.max = function(obj, iterator, context) {
      if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
      if (!iterator && _.isEmpty(obj)) return -Infinity;
      var result = {computed : -Infinity};
      each(obj, function(value, index, list) {
        var computed = iterator ? iterator.call(context, value, index, list) : value;
        computed >= result.computed && (result = {value : value, computed : computed});
      });
      return result.value;
    };
  
    // Return the minimum element (or element-based computation).
    _.min = function(obj, iterator, context) {
      if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
      if (!iterator && _.isEmpty(obj)) return Infinity;
      var result = {computed : Infinity};
      each(obj, function(value, index, list) {
        var computed = iterator ? iterator.call(context, value, index, list) : value;
        computed < result.computed && (result = {value : value, computed : computed});
      });
      return result.value;
    };
  
    // Shuffle an array.
    _.shuffle = function(obj) {
      var shuffled = [], rand;
      each(obj, function(value, index, list) {
        if (index == 0) {
          shuffled[0] = value;
        } else {
          rand = Math.floor(Math.random() * (index + 1));
          shuffled[index] = shuffled[rand];
          shuffled[rand] = value;
        }
      });
      return shuffled;
    };
  
    // Sort the object's values by a criterion produced by an iterator.
    _.sortBy = function(obj, iterator, context) {
      return _.pluck(_.map(obj, function(value, index, list) {
        return {
          value : value,
          criteria : iterator.call(context, value, index, list)
        };
      }).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }), 'value');
    };
  
    // Groups the object's values by a criterion. Pass either a string attribute
    // to group by, or a function that returns the criterion.
    _.groupBy = function(obj, val) {
      var result = {};
      var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
      each(obj, function(value, index) {
        var key = iterator(value, index);
        (result[key] || (result[key] = [])).push(value);
      });
      return result;
    };
  
    // Use a comparator function to figure out at what index an object should
    // be inserted so as to maintain order. Uses binary search.
    _.sortedIndex = function(array, obj, iterator) {
      iterator || (iterator = _.identity);
      var low = 0, high = array.length;
      while (low < high) {
        var mid = (low + high) >> 1;
        iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
      }
      return low;
    };
  
    // Safely convert anything iterable into a real, live array.
    _.toArray = function(iterable) {
      if (!iterable)                return [];
      if (iterable.toArray)         return iterable.toArray();
      if (_.isArray(iterable))      return slice.call(iterable);
      if (_.isArguments(iterable))  return slice.call(iterable);
      return _.values(iterable);
    };
  
    // Return the number of elements in an object.
    _.size = function(obj) {
      return _.toArray(obj).length;
    };
  
    // Array Functions
    // ---------------
  
    // Get the first element of an array. Passing **n** will return the first N
    // values in the array. Aliased as `head`. The **guard** check allows it to work
    // with `_.map`.
    _.first = _.head = function(array, n, guard) {
      return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
    };
  
    // Returns everything but the last entry of the array. Especcialy useful on
    // the arguments object. Passing **n** will return all the values in
    // the array, excluding the last N. The **guard** check allows it to work with
    // `_.map`.
    _.initial = function(array, n, guard) {
      return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
    };
  
    // Get the last element of an array. Passing **n** will return the last N
    // values in the array. The **guard** check allows it to work with `_.map`.
    _.last = function(array, n, guard) {
      if ((n != null) && !guard) {
        return slice.call(array, Math.max(array.length - n, 0));
      } else {
        return array[array.length - 1];
      }
    };
  
    // Returns everything but the first entry of the array. Aliased as `tail`.
    // Especially useful on the arguments object. Passing an **index** will return
    // the rest of the values in the array from that index onward. The **guard**
    // check allows it to work with `_.map`.
    _.rest = _.tail = function(array, index, guard) {
      return slice.call(array, (index == null) || guard ? 1 : index);
    };
  
    // Trim out all falsy values from an array.
    _.compact = function(array) {
      return _.filter(array, function(value){ return !!value; });
    };
  
    // Return a completely flattened version of an array.
    _.flatten = function(array, shallow) {
      return _.reduce(array, function(memo, value) {
        if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
        memo[memo.length] = value;
        return memo;
      }, []);
    };
  
    // Return a version of the array that does not contain the specified value(s).
    _.without = function(array) {
      return _.difference(array, slice.call(arguments, 1));
    };
  
    // Produce a duplicate-free version of the array. If the array has already
    // been sorted, you have the option of using a faster algorithm.
    // Aliased as `unique`.
    _.uniq = _.unique = function(array, isSorted, iterator) {
      var initial = iterator ? _.map(array, iterator) : array;
      var result = [];
      _.reduce(initial, function(memo, el, i) {
        if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) {
          memo[memo.length] = el;
          result[result.length] = array[i];
        }
        return memo;
      }, []);
      return result;
    };
  
    // Produce an array that contains the union: each distinct element from all of
    // the passed-in arrays.
    _.union = function() {
      return _.uniq(_.flatten(arguments, true));
    };
  
    // Produce an array that contains every item shared between all the
    // passed-in arrays. (Aliased as "intersect" for back-compat.)
    _.intersection = _.intersect = function(array) {
      var rest = slice.call(arguments, 1);
      return _.filter(_.uniq(array), function(item) {
        return _.every(rest, function(other) {
          return _.indexOf(other, item) >= 0;
        });
      });
    };
  
    // Take the difference between one array and another.
    // Only the elements present in just the first array will remain.
    _.difference = function(array, other) {
      return _.filter(array, function(value){ return !_.include(other, value); });
    };
  
    // Zip together multiple lists into a single array -- elements that share
    // an index go together.
    _.zip = function() {
      var args = slice.call(arguments);
      var length = _.max(_.pluck(args, 'length'));
      var results = new Array(length);
      for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
      return results;
    };
  
    // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
    // we need this function. Return the position of the first occurrence of an
    // item in an array, or -1 if the item is not included in the array.
    // Delegates to **ECMAScript 5**'s native `indexOf` if available.
    // If the array is large and already in sort order, pass `true`
    // for **isSorted** to use binary search.
    _.indexOf = function(array, item, isSorted) {
      if (array == null) return -1;
      var i, l;
      if (isSorted) {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
      if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
      for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
      return -1;
    };
  
    // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
    _.lastIndexOf = function(array, item) {
      if (array == null) return -1;
      if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
      var i = array.length;
      while (i--) if (array[i] === item) return i;
      return -1;
    };
  
    // Generate an integer Array containing an arithmetic progression. A port of
    // the native Python `range()` function. See
    // [the Python documentation](http://docs.python.org/library/functions.html#range).
    _.range = function(start, stop, step) {
      if (arguments.length <= 1) {
        stop = start || 0;
        start = 0;
      }
      step = arguments[2] || 1;
  
      var len = Math.max(Math.ceil((stop - start) / step), 0);
      var idx = 0;
      var range = new Array(len);
  
      while(idx < len) {
        range[idx++] = start;
        start += step;
      }
  
      return range;
    };
  
    // Function (ahem) Functions
    // ------------------
  
    // Reusable constructor function for prototype setting.
    var ctor = function(){};
  
    // Create a function bound to a given object (assigning `this`, and arguments,
    // optionally). Binding with arguments is also known as `curry`.
    // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
    // We check for `func.bind` first, to fail fast when `func` is undefined.
    _.bind = function bind(func, context) {
      var bound, args;
      if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
      if (!_.isFunction(func)) throw new TypeError;
      args = slice.call(arguments, 2);
      return bound = function() {
        if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
        ctor.prototype = func.prototype;
        var self = new ctor;
        var result = func.apply(self, args.concat(slice.call(arguments)));
        if (Object(result) === result) return result;
        return self;
      };
    };
  
    // Bind all of an object's methods to that object. Useful for ensuring that
    // all callbacks defined on an object belong to it.
    _.bindAll = function(obj) {
      var funcs = slice.call(arguments, 1);
      if (funcs.length == 0) funcs = _.functions(obj);
      each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
      return obj;
    };
  
    // Memoize an expensive function by storing its results.
    _.memoize = function(func, hasher) {
      var memo = {};
      hasher || (hasher = _.identity);
      return function() {
        var key = hasher.apply(this, arguments);
        return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
      };
    };
  
    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.
    _.delay = function(func, wait) {
      var args = slice.call(arguments, 2);
      return setTimeout(function(){ return func.apply(func, args); }, wait);
    };
  
    // Defers a function, scheduling it to run after the current call stack has
    // cleared.
    _.defer = function(func) {
      return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
    };
  
    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time.
    _.throttle = function(func, wait) {
      var context, args, timeout, throttling, more;
      var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
      return function() {
        context = this; args = arguments;
        var later = function() {
          timeout = null;
          if (more) func.apply(context, args);
          whenDone();
        };
        if (!timeout) timeout = setTimeout(later, wait);
        if (throttling) {
          more = true;
        } else {
          func.apply(context, args);
        }
        whenDone();
        throttling = true;
      };
    };
  
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds.
    _.debounce = function(func, wait) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };
  
    // Returns a function that will be executed at most one time, no matter how
    // often you call it. Useful for lazy initialization.
    _.once = function(func) {
      var ran = false, memo;
      return function() {
        if (ran) return memo;
        ran = true;
        return memo = func.apply(this, arguments);
      };
    };
  
    // Returns the first function passed as an argument to the second,
    // allowing you to adjust arguments, run code before and after, and
    // conditionally execute the original function.
    _.wrap = function(func, wrapper) {
      return function() {
        var args = [func].concat(slice.call(arguments));
        return wrapper.apply(this, args);
      };
    };
  
    // Returns a function that is the composition of a list of functions, each
    // consuming the return value of the function that follows.
    _.compose = function() {
      var funcs = slice.call(arguments);
      return function() {
        var args = slice.call(arguments);
        for (var i = funcs.length - 1; i >= 0; i--) {
          args = [funcs[i].apply(this, args)];
        }
        return args[0];
      };
    };
  
    // Returns a function that will only be executed after being called N times.
    _.after = function(times, func) {
      if (times <= 0) return func();
      return function() {
        if (--times < 1) { return func.apply(this, arguments); }
      };
    };
  
    // Object Functions
    // ----------------
  
    // Retrieve the names of an object's properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`
    _.keys = nativeKeys || function(obj) {
      if (obj !== Object(obj)) throw new TypeError('Invalid object');
      var keys = [];
      for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
      return keys;
    };
  
    // Retrieve the values of an object's properties.
    _.values = function(obj) {
      return _.map(obj, _.identity);
    };
  
    // Return a sorted list of the function names available on the object.
    // Aliased as `methods`
    _.functions = _.methods = function(obj) {
      var names = [];
      for (var key in obj) {
        if (_.isFunction(obj[key])) names.push(key);
      }
      return names.sort();
    };
  
    // Extend a given object with all the properties in passed-in object(s).
    _.extend = function(obj) {
      each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          if (source[prop] !== void 0) obj[prop] = source[prop];
        }
      });
      return obj;
    };
  
    // Fill in a given object with default properties.
    _.defaults = function(obj) {
      each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      });
      return obj;
    };
  
    // Create a (shallow-cloned) duplicate of an object.
    _.clone = function(obj) {
      if (!_.isObject(obj)) return obj;
      return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };
  
    // Invokes interceptor with the obj, and then returns obj.
    // The primary purpose of this method is to "tap into" a method chain, in
    // order to perform operations on intermediate results within the chain.
    _.tap = function(obj, interceptor) {
      interceptor(obj);
      return obj;
    };
  
    // Internal recursive comparison function.
    function eq(a, b, stack) {
      // Identical objects are equal. `0 === -0`, but they aren't identical.
      // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
      if (a === b) return a !== 0 || 1 / a == 1 / b;
      // A strict comparison is necessary because `null == undefined`.
      if (a == null || b == null) return a === b;
      // Unwrap any wrapped objects.
      if (a._chain) a = a._wrapped;
      if (b._chain) b = b._wrapped;
      // Invoke a custom `isEqual` method if one is provided.
      if (_.isFunction(a.isEqual)) return a.isEqual(b);
      if (_.isFunction(b.isEqual)) return b.isEqual(a);
      // Compare `[[Class]]` names.
      var className = toString.call(a);
      if (className != toString.call(b)) return false;
      switch (className) {
        // Strings, numbers, dates, and booleans are compared by value.
        case '[object String]':
          // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
          // equivalent to `new String("5")`.
          return String(a) == String(b);
        case '[object Number]':
          a = +a;
          b = +b;
          // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
          // other numeric values.
          return a != a ? b != b : (a == 0 ? 1 / a == 1 / b : a == b);
        case '[object Date]':
        case '[object Boolean]':
          // Coerce dates and booleans to numeric primitive values. Dates are compared by their
          // millisecond representations. Note that invalid dates with millisecond representations
          // of `NaN` are not equivalent.
          return +a == +b;
        // RegExps are compared by their source patterns and flags.
        case '[object RegExp]':
          return a.source == b.source &&
                 a.global == b.global &&
                 a.multiline == b.multiline &&
                 a.ignoreCase == b.ignoreCase;
      }
      if (typeof a != 'object' || typeof b != 'object') return false;
      // Assume equality for cyclic structures. The algorithm for detecting cyclic
      // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
      var length = stack.length;
      while (length--) {
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (stack[length] == a) return true;
      }
      // Add the first object to the stack of traversed objects.
      stack.push(a);
      var size = 0, result = true;
      // Recursively compare objects and arrays.
      if (className == '[object Array]') {
        // Compare array lengths to determine if a deep comparison is necessary.
        size = a.length;
        result = size == b.length;
        if (result) {
          // Deep compare the contents, ignoring non-numeric properties.
          while (size--) {
            // Ensure commutative equality for sparse arrays.
            if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
          }
        }
      } else {
        // Objects with different constructors are not equivalent.
        if ("constructor" in a != "constructor" in b || a.constructor != b.constructor) return false;
        // Deep compare objects.
        for (var key in a) {
          if (hasOwnProperty.call(a, key)) {
            // Count the expected number of properties.
            size++;
            // Deep compare each member.
            if (!(result = hasOwnProperty.call(b, key) && eq(a[key], b[key], stack))) break;
          }
        }
        // Ensure that both objects contain the same number of properties.
        if (result) {
          for (key in b) {
            if (hasOwnProperty.call(b, key) && !(size--)) break;
          }
          result = !size;
        }
      }
      // Remove the first object from the stack of traversed objects.
      stack.pop();
      return result;
    }
  
    // Perform a deep comparison to check if two objects are equal.
    _.isEqual = function(a, b) {
      return eq(a, b, []);
    };
  
    // Is a given array, string, or object empty?
    // An "empty" object has no enumerable own-properties.
    _.isEmpty = function(obj) {
      if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
      for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
      return true;
    };
  
    // Is a given value a DOM element?
    _.isElement = function(obj) {
      return !!(obj && obj.nodeType == 1);
    };
  
    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray
    _.isArray = nativeIsArray || function(obj) {
      return toString.call(obj) == '[object Array]';
    };
  
    // Is a given variable an object?
    _.isObject = function(obj) {
      return obj === Object(obj);
    };
  
    // Is a given variable an arguments object?
    if (toString.call(arguments) == '[object Arguments]') {
      _.isArguments = function(obj) {
        return toString.call(obj) == '[object Arguments]';
      };
    } else {
      _.isArguments = function(obj) {
        return !!(obj && hasOwnProperty.call(obj, 'callee'));
      };
    }
  
    // Is a given value a function?
    _.isFunction = function(obj) {
      return toString.call(obj) == '[object Function]';
    };
  
    // Is a given value a string?
    _.isString = function(obj) {
      return toString.call(obj) == '[object String]';
    };
  
    // Is a given value a number?
    _.isNumber = function(obj) {
      return toString.call(obj) == '[object Number]';
    };
  
    // Is the given value `NaN`?
    _.isNaN = function(obj) {
      // `NaN` is the only value for which `===` is not reflexive.
      return obj !== obj;
    };
  
    // Is a given value a boolean?
    _.isBoolean = function(obj) {
      return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
    };
  
    // Is a given value a date?
    _.isDate = function(obj) {
      return toString.call(obj) == '[object Date]';
    };
  
    // Is the given value a regular expression?
    _.isRegExp = function(obj) {
      return toString.call(obj) == '[object RegExp]';
    };
  
    // Is a given value equal to null?
    _.isNull = function(obj) {
      return obj === null;
    };
  
    // Is a given variable undefined?
    _.isUndefined = function(obj) {
      return obj === void 0;
    };
  
    // Utility Functions
    // -----------------
  
    // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
    // previous owner. Returns a reference to the Underscore object.
    _.noConflict = function() {
      root._ = previousUnderscore;
      return this;
    };
  
    // Keep the identity function around for default iterators.
    _.identity = function(value) {
      return value;
    };
  
    // Run a function **n** times.
    _.times = function (n, iterator, context) {
      for (var i = 0; i < n; i++) iterator.call(context, i);
    };
  
    // Escape a string for HTML interpolation.
    _.escape = function(string) {
      return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
    };
  
    // Add your own custom functions to the Underscore object, ensuring that
    // they're correctly added to the OOP wrapper as well.
    _.mixin = function(obj) {
      each(_.functions(obj), function(name){
        addToWrapper(name, _[name] = obj[name]);
      });
    };
  
    // Generate a unique integer id (unique within the entire client session).
    // Useful for temporary DOM ids.
    var idCounter = 0;
    _.uniqueId = function(prefix) {
      var id = idCounter++;
      return prefix ? prefix + id : id;
    };
  
    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    _.templateSettings = {
      evaluate    : /<%([\s\S]+?)%>/g,
      interpolate : /<%=([\s\S]+?)%>/g,
      escape      : /<%-([\s\S]+?)%>/g
    };
  
    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    _.template = function(str, data) {
      var c  = _.templateSettings;
      var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
        'with(obj||{}){__p.push(\'' +
        str.replace(/\\/g, '\\\\')
           .replace(/'/g, "\\'")
           .replace(c.escape, function(match, code) {
             return "',_.escape(" + code.replace(/\\'/g, "'") + "),'";
           })
           .replace(c.interpolate, function(match, code) {
             return "'," + code.replace(/\\'/g, "'") + ",'";
           })
           .replace(c.evaluate || null, function(match, code) {
             return "');" + code.replace(/\\'/g, "'")
                                .replace(/[\r\n\t]/g, ' ') + ";__p.push('";
           })
           .replace(/\r/g, '\\r')
           .replace(/\n/g, '\\n')
           .replace(/\t/g, '\\t')
           + "');}return __p.join('');";
      var func = new Function('obj', '_', tmpl);
      return data ? func(data, _) : function(data) { return func(data, _) };
    };
  
    // The OOP Wrapper
    // ---------------
  
    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.
    var wrapper = function(obj) { this._wrapped = obj; };
  
    // Expose `wrapper.prototype` as `_.prototype`
    _.prototype = wrapper.prototype;
  
    // Helper function to continue chaining intermediate results.
    var result = function(obj, chain) {
      return chain ? _(obj).chain() : obj;
    };
  
    // A method to easily add functions to the OOP wrapper.
    var addToWrapper = function(name, func) {
      wrapper.prototype[name] = function() {
        var args = slice.call(arguments);
        unshift.call(args, this._wrapped);
        return result(func.apply(_, args), this._chain);
      };
    };
  
    // Add all of the Underscore functions to the wrapper object.
    _.mixin(_);
  
    // Add all mutator Array functions to the wrapper.
    each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
      var method = ArrayProto[name];
      wrapper.prototype[name] = function() {
        method.apply(this._wrapped, arguments);
        return result(this._wrapped, this._chain);
      };
    });
  
    // Add all accessor Array functions to the wrapper.
    each(['concat', 'join', 'slice'], function(name) {
      var method = ArrayProto[name];
      wrapper.prototype[name] = function() {
        return result(method.apply(this._wrapped, arguments), this._chain);
      };
    });
  
    // Start chaining a wrapped Underscore object.
    wrapper.prototype.chain = function() {
      this._chain = true;
      return this;
    };
  
    // Extracts the result from a wrapped and chained object.
    wrapper.prototype.value = function() {
      return this._wrapped;
    };
  
  // MYMOD - 14 Nov 2011
  })();
  
  var $B, Behavior, BinaryHeap, CATCH_E, ChangesE, ConcatE, ContInfo, EventStream, EventStream_api, FINALLY_E, HEAP_E, HeapStore, InternalE, Jolt, MappedE, OneE, OneE_high, PriorityQueue, Pulse, Pulse_cat, Pulse_catch_and_trace, Reactor, ReceiverE, ZeroE, beforeNextPulse, beforeQ, changesE, cleanupQ, cleanupWeakReference, clog_err, concatE, defaultCatchE, defaultFinallyE, defaultHeapE, defer, delay, doNotPropagate, exporter, extractB, internalE, isB, isE, isNodeJS, isP, lastRank, lastStamp, linkHigh, linkTight, mapE, nextRank, nextStamp, oneE, oneE_high, receiverE, say, sayErr, sayError, scheduleBefore, scheduleCleanup, scheduleHigh, scheduleMid, scheduleNorm, sendCall, sendEvent, sendEvent_drainAll, sendEvent_drainHighThenNorm, sendEvent_drainHighThenNormThenMid, sendEvent_nodrain, valueNow, zeroE, _say, _say_helper;
  var __slice = Array.prototype.slice, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };
  
  BinaryHeap = (function() {
  
    function BinaryHeap(scoreFunction) {
      this.scoreFunction = scoreFunction != null ? scoreFunction : function(x) {
        return x;
      };
      this.content = [];
    }
  
    BinaryHeap.prototype.push = function(element) {
      this.content.push(element);
      return this._bubbleUp(this.content.length - 1);
    };
  
    BinaryHeap.prototype.pop = function() {
      var end, result;
      result = this.content[0];
      end = this.content.pop();
      if (this.content.length > 0) {
        this.content[0] = end;
        this._sinkDown(0);
      }
      return result;
    };
  
    BinaryHeap.prototype.size = function() {
      return this.content.length;
    };
  
    BinaryHeap.prototype.remove = function(node) {
      var end, i, len;
      len = this.content.length;
      for (i = 0; 0 <= len ? i < len : i > len; 0 <= len ? i++ : i--) {
        if (this.content[i] === node) {
          end = this.content.pop();
          if (i !== len - 1) {
            this.content[i] = end;
            if (this.scoreFunction(end) < this.scoreFunction(node)) {
              this._bubbleUp(i);
            } else {
              this._sinkDown(i);
            }
          }
          return;
        }
      }
      throw new Error('Node not found.');
    };
  
    BinaryHeap.prototype._bubbleUp = function(n) {
      var element, parent, parentN;
      element = this.content[n];
      while (n > 0) {
        parentN = Math.floor((n + 1) / 2) - 1;
        parent = this.content[parentN];
        if (this.scoreFunction(element) < this.scoreFunction(parent)) {
          this.content[parentN] = element;
          this.content[n] = parent;
          n = parentN;
        } else {
          break;
        }
      }
    };
  
    BinaryHeap.prototype._sinkDown = function(n) {
      var child1, child1N, child1Score, child2, child2N, child2Score, compScore, elemScore, element, length, swap;
      length = this.content.length;
      element = this.content[n];
      elemScore = this.scoreFunction(element);
      while (true) {
        child2N = (n + 1) * 2;
        child1N = child2N - 1;
        swap = null;
        if (child1N < length) {
          child1 = this.content[child1N];
          child1Score = this.scoreFunction(child1);
          if (child1Score < elemScore) swap = child1N;
        }
        if (child2N < length) {
          child2 = this.content[child2N];
          child2Score = this.scoreFunction(child2);
          compScore = swap === null ? elemScore : child1Score;
          if (child2Score < compScore) swap = child2N;
        }
        if (swap !== null) {
          this.content[n] = this.content[swap];
          this.content[swap] = element;
          n = swap;
        } else {
          break;
        }
      }
    };
  
    return BinaryHeap;
  
  })();
  
  isNodeJS = Boolean(typeof process !== "undefined" && process !== null ? process.pid : void 0);
  
  Jolt = {};
  
  _say = function() {
    var isError, message, styles;
    message = arguments[0], isError = arguments[1], styles = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (!(_say.okay != null)) {
      if (!((typeof console !== "undefined" && console !== null) || ((typeof window !== "undefined" && window !== null ? window.console : void 0) != null))) {
        _say.okay = -1;
        throw clog_err;
      }
      if (typeof console === "undefined" || console === null) {
        console = typeof window !== "undefined" && window !== null ? window.console : void 0;
      }
      _say.console = console;
      _say.error = console.error != null;
    }
    if (!(console.log != null)) {
      _say.okay = -1;
      throw clog_err;
    } else {
      _say.okay = 1;
    }
    if (_say.okay === -1) throw clog_err;
    if (!isNodeJS) {
      return _say_helper(message, isError);
    } else {
      switch (styles.length) {
        case 0:
          message = message;
          break;
        case 1:
          message = _say.clc[styles[0]](message);
          break;
        case 2:
          message = _say.clc[styles[0]][styles[1]](message);
          break;
        case 3:
          message = _say.clc[styles[0]][styles[1]][styles[2]](message);
          break;
        default:
          message = _say.clc[styles[0]][styles[1]][styles[2]][styles[3]](message);
      }
      return _say_helper(message, isError);
    }
  };
  
  if (isNodeJS) _say.clc = require('cli-color');
  
  clog_err = 'Jolt.say: console.log method is not available';
  
  _say_helper = function(message, isError) {
    if (isError) {
      if (_say.error != null) {
        _say.console.error(message);
        return;
      }
    }
    return _say.console.log(message);
  };
  
  Jolt.say = say = function() {
    var message, styles;
    message = arguments[0], styles = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return _say.apply(null, [message, false].concat(__slice.call(styles)));
  };
  
  Jolt.sayError = Jolt.sayErr = sayError = sayErr = function() {
    var message, styles;
    message = arguments[0], styles = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return _say.apply(null, [message, true].concat(__slice.call(styles)));
  };
  
  Jolt.PriorityQueue = PriorityQueue = (function() {
  
    __extends(PriorityQueue, BinaryHeap);
  
    function PriorityQueue() {
      this.content = [];
    }
  
    PriorityQueue.prototype.scoreFunction = function(x) {
      return x.rank;
    };
  
    return PriorityQueue;
  
  })();
  
  lastStamp = 0;
  
  Jolt.nextStamp = nextStamp = function() {
    return ++lastStamp;
  };
  
  Jolt.doNotPropagate = doNotPropagate = {};
  
  doNotPropagate.copy = function() {
    return this;
  };
  
  Jolt.scheduleHigh = scheduleHigh = {};
  
  Jolt.scheduleMid = scheduleMid = {};
  
  Jolt.scheduleNorm = scheduleNorm = {};
  
  Jolt.linkHigh = linkHigh = {};
  
  Jolt.linkTight = linkTight = {};
  
  Jolt.sendCall = sendCall = {
    name: (function() {
      return 'Jolt.sendEvent';
    }),
    removeWeakReference: function() {}
  };
  
  if (typeof setTimeout === "undefined" || setTimeout === null) {
    setTimeout = window.setTimeout;
  }
  
  Jolt.defer = defer = _.defer;
  
  Jolt.delay = delay = _.delay;
  
  Jolt.cleanupQ = cleanupQ = cleanupWeakReference = [];
  
  cleanupQ.draining = false;
  
  cleanupQ.freq = 100;
  
  cleanupQ.drain = function() {
    if (cleanupQ.length) {
      delay(cleanupQ.drain, cleanupQ.freq);
      (cleanupQ.shift())();
    } else {
      cleanupQ.draining = false;
    }
    return;
  };
  
  Jolt.scheduleCleanup = scheduleCleanup = function(cleanupQ, sender, weakReference) {
    if (!cleanupQ) cleanupQ = cleanupWeakReference;
    if (!weakReference.cleanupScheduled) {
      weakReference.cleanupScheduled = true;
      cleanupQ.push(function() {
        return sender.removeWeakReference(weakReference, true);
      });
      if (!cleanupQ.draining) {
        cleanupQ.draining = true;
        delay(cleanupQ.drain, cleanupQ.freq);
      }
    }
    return;
  };
  
  Jolt.beforeQ = beforeQ = beforeNextPulse = {
    high: [],
    mid: [],
    norm: []
  };
  
  beforeQ.drainingHigh = false;
  
  beforeQ.drainingMid = false;
  
  beforeQ.drainingNorm = false;
  
  beforeQ.norm.freq = 10;
  
  beforeQ.drainHigh = function() {
    if (beforeQ.high.length) {
      defer(beforeQ.drainHigh);
      (beforeQ.high.shift())();
    } else {
      beforeQ.drainingHigh = false;
    }
    return;
  };
  
  beforeQ.drainMid = function() {
    if (beforeQ.mid.length) {
      defer(beforeQ.drainMid);
      (beforeQ.mid.shift())();
    } else {
      beforeQ.drainingMid = false;
    }
    return;
  };
  
  beforeQ.drainNorm = function() {
    if (beforeQ.norm.length) {
      delay(beforeQ.drainNorm, beforeQ.norm.freq);
      if (!beforeQ.drainingHigh) (beforeQ.norm.shift())();
    } else {
      beforeQ.drainingNorm = false;
    }
    return;
  };
  
  Jolt.scheduleBefore = scheduleBefore = function() {
    var args, beforeQ, func, which, _which;
    beforeQ = arguments[0], func = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (!beforeQ) beforeQ = beforeNextPulse;
    which = scheduleNorm;
    _which = args[args.length - 1];
    if ((_which === scheduleHigh) || (_which === scheduleMid) || (_which === scheduleNorm)) {
      which = _which;
      args.pop();
    }
    switch (which) {
      case scheduleHigh:
        beforeQ.high.push(function() {
          return func.apply(null, args);
        });
        if (!beforeQ.drainingHigh) {
          beforeQ.drainingHigh = true;
          defer(beforeQ.drainHigh);
        }
        break;
      case scheduleMid:
        beforeQ.mid.push(function() {
          return func.apply(null, args);
        });
        if (!beforeQ.drainingMid) {
          beforeQ.drainingMid = true;
          defer(beforeQ.drainMid);
        }
        break;
      case scheduleNorm:
        beforeQ.norm.push(function() {
          return func.apply(null, args);
        });
        if (!beforeQ.drainingNorm) {
          beforeQ.drainingNorm = true;
          delay(beforeQ.drainNorm, beforeQ.norm.freq);
        }
    }
    return;
  };
  
  Jolt.HeapStore = HeapStore = (function() {
  
    function HeapStore(stamp, cont) {
      this.stamp = stamp;
      this.cont = cont;
      this.nodes = [];
    }
  
    return HeapStore;
  
  })();
  
  Jolt.ContInfo = ContInfo = (function() {
  
    function ContInfo(stamps, nodes) {
      this.stamps = stamps;
      this.nodes = nodes;
    }
  
    return ContInfo;
  
  })();
  
  Jolt.isP = isP = function(pulse) {
    return pulse instanceof Pulse;
  };
  
  Jolt.Pulse = Pulse = (function() {
  
    function Pulse(arity, junction, sender, stamp, value, heap, cont) {
      this.arity = arity;
      this.junction = junction;
      this.sender = sender;
      this.stamp = stamp;
      this.value = value != null ? value : [];
      this.heap = heap != null ? heap : new HeapStore(this.stamp, cont);
    }
  
    Pulse.prototype.copy = function(PulseClass) {
      if (PulseClass == null) PulseClass = this.constructor;
      return new PulseClass(this.arity, this.junction, this.sender, this.stamp, this.value.slice(0), this.heap);
    };
  
    Pulse.prototype.propagate = function() {
      var PULSE, more, nextPulse, queue, qv, receiver, sender, weaklyHeld, _i, _len, _ref;
      sender = arguments[0], receiver = arguments[1], more = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (!receiver.weaklyHeld) {
        queue = new PriorityQueue;
        queue.push({
          estream: receiver,
          pulse: this,
          rank: receiver.rank
        });
        while (queue.size()) {
          qv = queue.pop();
          qv.pulse.heap.nodes.push([qv.pulse.sender, qv.estream]);
          PULSE = qv.pulse.copy(qv.estream.PulseClass());
          nextPulse = PULSE.PROPAGATE.apply(PULSE, [PULSE.sender, qv.estream].concat(__slice.call(more)));
          weaklyHeld = true;
          if (nextPulse !== doNotPropagate) {
            nextPulse.sender = qv.estream;
            _ref = qv.estream.sendTo;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              receiver = _ref[_i];
              weaklyHeld = weaklyHeld && receiver.weaklyHeld;
              if (receiver.weaklyHeld) {
                qv.estream.removeWeakReference(receiver);
              } else {
                queue.push({
                  estream: receiver,
                  pulse: nextPulse,
                  rank: receiver.rank
                });
              }
            }
            if (qv.estream.sendTo.length && weaklyHeld) {
              qv.estream.weaklyHeld = true;
              qv.pulse.sender.removeWeakReference(qv.estream);
            }
          }
        }
        return PULSE.heap;
      } else {
        sender.removeWeakReference(receiver);
        return this.heap;
      }
    };
  
    Pulse.prototype.PROPAGATE = function() {
      var PULSE, more, receiver, sender;
      sender = arguments[0], receiver = arguments[1], more = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      PULSE = receiver.UPDATER(this);
      if (PULSE !== doNotPropagate && !(isP(PULSE))) {
        throw 'receiver\'s UPDATER did not return a pulse object';
      } else {
        return PULSE;
      }
    };
  
    return Pulse;
  
  })();
  
  lastRank = 0;
  
  nextRank = function() {
    return ++lastRank;
  };
  
  Jolt.isE = isE = function(estream) {
    return estream instanceof EventStream;
  };
  
  Jolt.EventStream = EventStream = (function() {
    var cycleError, expAnEstreamErr;
  
    function EventStream() {
      var estream, recvFrom, _i, _len, _ref;
      recvFrom = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this.rank = nextRank();
      this.absRank = this.rank;
      this.sendTo = [];
      this.linkTo = [];
      if (recvFrom.length) {
        _ref = _.flatten(__slice.call(recvFrom));
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          estream = _ref[_i];
          estream.attachListener(this);
        }
      }
    }
  
    expAnEstreamErr = 'expected an EventStream';
  
    EventStream.prototype.attachListener = function(receiver, now) {
      var rcvr, _i, _len, _results;
      if (now == null) now = false;
      if (_.isArray(receiver)) {
        receiver = _.flatten(receiver);
      } else {
        receiver = [receiver];
      }
      _results = [];
      for (_i = 0, _len = receiver.length; _i < _len; _i++) {
        rcvr = receiver[_i];
        if (!isE(rcvr)) {
          throw '<' + this.ClassName + '>.attachListener: ' + expAnEstreamErr;
        }
        if (now) {
          this.constructor.genericAttachListener(this, rcvr);
        } else {
          scheduleBefore(beforeQ, (function(sender, receiver) {
            return sender.attachListener(receiver, true);
          }), this, rcvr);
        }
        _results.push(this);
      }
      return _results;
    };
  
    EventStream.prototype.removeListener = function(receiver, now) {
      var rcvr, _i, _len, _results;
      if (now == null) now = false;
      if (_.isArray(receiver)) {
        receiver = _.flatten(receiver);
      } else {
        receiver = [receiver];
      }
      _results = [];
      for (_i = 0, _len = receiver.length; _i < _len; _i++) {
        rcvr = receiver[_i];
        if (!isE(rcvr)) {
          throw '<' + this.ClassName + '>.removeListener: ' + expAnEstreamErr;
        }
        if (now) {
          this.constructor.genericRemoveListener(this, rcvr);
        } else {
          scheduleBefore(beforeQ, (function(sender, receiver) {
            return sender.removeListener(receiver, true);
          }), this, rcvr);
        }
        _results.push(this);
      }
      return _results;
    };
  
    EventStream.prototype.removeWeakReference = function(weakReference, now) {
      if (now == null) now = false;
      if (!isE(weakReference)) {
        throw '<' + this.ClassName + '>.removeWeakReference: ' + expAnEstreamErr;
      }
      if (now) {
        this.constructor.genericRemoveWeakReference(this, weakReference);
      } else {
        scheduleCleanup(cleanupQ, this, weakReference);
      }
      return this;
    };
  
    EventStream.prototype.ClassName = 'EventStream';
  
    EventStream.prototype.cleanupScheduled = false;
  
    cycleError = '.genericAttachListener: cycle detected in propagation graph';
  
    EventStream.genericAttachListener = function(sender, receiver) {
      var cur, doNextRank, estream, i, q, sentinel, _i, _len;
      if (sender.rank === receiver.rank) throw sender.ClassName + cycleError;
      i = _.indexOf(sender.sendTo, receiver);
      if (!(i + 1)) {
        receiver.weaklyHeld = false;
        sender.sendTo.push(receiver);
        if (sender.rank > receiver.rank) {
          doNextRank = [];
          sentinel = {};
          sender.__cycleSentinel__ = sentinel;
          q = [receiver];
          while (q.length) {
            cur = q.shift();
            if (cur.__cycleSentinel__ === sentinel) {
              sender.sendTo.pop();
              throw sender.ClassName + cycleError;
            }
            doNextRank.push(cur);
            cur.__cycleSentinel__ = sentinel;
            q.push.apply(q, cur.sendTo);
          }
          for (_i = 0, _len = doNextRank.length; _i < _len; _i++) {
            estream = doNextRank[_i];
            estream.rank = nextRank();
          }
        }
      }
      return;
    };
  
    EventStream.genericRemoveListener = function(sender, receiver) {
      var i;
      i = _.indexOf(sender.sendTo, receiver);
      if (i + 1) sender.sendTo.splice(i, 1);
      return;
    };
  
    EventStream.genericRemoveWeakReference = function(sender, weakReference) {
      var i;
      weakReference.cleanupScheduled = false;
      if (weakReference.weaklyHeld) {
        i = _.indexOf(sender.sendTo, weakReference);
        if (i + 1) sender.sendTo.splice(i, 1);
        if (!sender.sendTo.length) sender.weaklyHeld = true;
      }
      return;
    };
  
    EventStream.prototype._mode = null;
  
    EventStream.prototype.mode = function(mode) {
      if (!arguments.length) return this._mode;
      if (!(mode != null)) {
        this._mode = null;
        return this;
      }
      switch (mode) {
        case 'sequenced':
        case 's':
          this._mode = 'sequenced';
          break;
        case 'vectored':
        case 'v':
          this._mode = 'vectored';
          break;
        case 'zipped':
        case 'z':
          this._mode = 'zipped';
          break;
        default:
          throw '<' + this.ClassName + '>.mode: ' + JSON.stringify(mode) + ' is not a valid mode';
      }
      return this;
    };
  
    EventStream.prototype["null"] = function() {
      return this.mode(null);
    };
  
    EventStream.prototype.s = function() {
      return this.mode('sequenced');
    };
  
    EventStream.prototype.sequenced = function() {
      return this.s();
    };
  
    EventStream.prototype.v = function() {
      return this.mode('vectored');
    };
  
    EventStream.prototype.vectored = function() {
      return this.v();
    };
  
    EventStream.prototype.z = function() {
      return this.mode('zipped');
    };
  
    EventStream.prototype.zipped = function() {
      return this.z();
    };
  
    EventStream.prototype._name = null;
  
    EventStream.prototype.name = function(str) {
      if (!arguments.length) return this._name;
      if (!_.isString(str)) {
        throw '<' + this.ClassName + '>.name: argument must be a string';
      }
      this._name = str;
      return this;
    };
  
    EventStream.prototype._nary = false;
  
    EventStream.prototype.nary = function() {
      this._nary = true;
      return this;
    };
  
    EventStream.prototype.isNary = function(bool) {
      if (!arguments.length) return this._nary;
      this._nary = Boolean(bool);
      return this;
    };
  
    EventStream.prototype._recur = false;
  
    EventStream.prototype.recur = function() {
      this._recur = true;
      return this;
    };
  
    EventStream.prototype.doesRecur = function(bool) {
      if (!arguments.length) return this._recur;
      this._recur = Boolean(bool);
      return this;
    };
  
    EventStream.prototype.no_null_junc = false;
  
    EventStream.prototype._PulseClass = Pulse;
  
    EventStream.prototype.PulseClass = function(klass) {
      if (!arguments.length) return this._PulseClass;
      if (!(_.isFunction(klass))) {
        throw '<' + this.ClassName + '>.PulseClass: argument must be a function';
      }
      if (!(isP(new klass))) {
        throw '<' + this.ClassName + '>.PulseClass: argument does not construct an instanceof Pulse';
      }
      this._PulseClass = klass;
      return this;
    };
  
    EventStream.prototype.seq_junc_helper = function(value) {
      var jp, retval, _i, _len;
      retval = [];
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        jp = value[_i];
        if (jp.junction) {
          retval = retval.concat(this.seq_junc_helper(jp.value));
        } else {
          retval = retval.concat(jp.value);
        }
      }
      return retval;
    };
  
    EventStream.prototype.vec_junc_helper = function(value) {
      var jp, retval, _i, _len;
      retval = [];
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        jp = value[_i];
        if (jp.junction) {
          retval = retval.concat(this.vec_junc_helper(jp.value));
        } else {
          retval.push(jp.value);
        }
      }
      return retval;
    };
  
    EventStream.prototype.zip_junc_helper = function(value) {
      return _.zip.apply(_, this.vec_junc_helper(value));
    };
  
    EventStream.prototype.tranIN = function(pulse) {
      var PULSE;
      PULSE = pulse.copy();
      switch (this.mode()) {
        case 'sequenced':
          if (PULSE.junction) {
            PULSE.value = this.seq_junc_helper(PULSE.value);
          } else {
            return PULSE;
          }
          break;
        case 'vectored':
          if (PULSE.junction) {
            PULSE.value = this.vec_junc_helper(PULSE.value);
          } else {
            PULSE.value = [PULSE.value];
            PULSE.arity = 1;
            return PULSE;
          }
          break;
        case 'zipped':
          if (PULSE.junction) {
            PULSE.value = this.zip_junc_helper(PULSE.value);
          } else {
            PULSE.value = _.zip(PULSE.value);
            return PULSE;
          }
          break;
        case null:
          if (PULSE.junction && this.no_null_junc) {
            throw '<' + this.ClassName + '>.tranIN: does not support null mode for pulse junctions';
          } else {
            return PULSE;
          }
          break;
        default:
          throw '<' + this.ClassName + '>.tranIN: bad mode value ' + (JSON.stringify(this.mode()));
      }
      PULSE.arity = PULSE.value.length;
      PULSE.junction = false;
      return PULSE;
    };
  
    EventStream.prototype.tranOUT = function(pulse) {
      var PULSE, _ref;
      PULSE = pulse.copy();
      if ((PULSE !== doNotPropagate) && this.isNary()) {
        PULSE.value = (_ref = []).concat.apply(_ref, PULSE.value);
      }
      return PULSE;
    };
  
    EventStream.prototype.tranVAL = function(pulse) {
      var PULSE, iret, redret, redval, ret, value, _i, _len, _ref, _ref2, _ref3;
      PULSE = pulse.copy();
      switch (this.mode()) {
        case null:
        case 'sequenced':
          ret = this.updater.apply(this, PULSE.value);
          if (ret === doNotPropagate) {
            PULSE = ret;
          } else {
            PULSE.value = ret;
          }
          break;
        case 'vectored':
        case 'zipped':
          ret = [];
          _ref = PULSE.value;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            value = _ref[_i];
            iret = this.updater.apply(this, value);
            if (iret !== doNotPropagate) ret.push(iret);
          }
          if (ret.length === 0) {
            PULSE = doNotPropagate;
          } else {
            if (this.doesRecur()) {
              redval = (_ref2 = []).concat.apply(_ref2, ret);
              if (this.isNary()) redval = (_ref3 = []).concat.apply(_ref3, redval);
              redret = this.updater.apply(this, redval);
              if (redret === doNotPropagate) {
                PULSE = redret;
              } else {
                PULSE.value = redret;
              }
            } else {
              PULSE.value = ret;
            }
          }
          break;
        default:
          throw '<' + this.ClassName + '>.UPDATER: bad mode value ' + (JSON.stringify(this.mode()));
      }
      return PULSE;
    };
  
    EventStream.prototype.updater = function() {
      var value;
      value = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return value;
    };
  
    EventStream.prototype.UPDATER = function(pulse) {
      return this.tranOUT(this.tranVAL(this.tranIN(pulse)));
    };
  
    EventStream.prototype.weaklyHeld = false;
  
    return EventStream;
  
  })();
  
  Jolt.sendEvent_nodrain = sendEvent_nodrain = function() {
    var PulseClass, cont, cont_maybe, estream, heap, pulse, value;
    estream = arguments[0], value = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    cont = void 0;
    cont_maybe = value[value.length - 1];
    if (cont_maybe instanceof ContInfo) {
      cont = cont_maybe;
      value.pop();
    }
    heap = void 0;
    PulseClass = estream.PulseClass();
    pulse = new PulseClass(value.length, false, sendCall, nextStamp(), value, heap, cont);
    pulse.propagate(sendCall, estream);
    return;
  };
  
  Jolt.sendEvent_drainHighThenNorm = sendEvent_drainHighThenNorm = function() {
    var estream, value;
    estream = arguments[0], value = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (beforeQ.high.length) {
      while (beforeQ.high.length) {
        (beforeQ.high.shift())();
      }
    }
    if (beforeQ.norm.length) {
      while (beforeQ.norm.length) {
        (beforeQ.norm.shift())();
      }
    }
    sendEvent_nodrain.apply(null, [estream].concat(__slice.call(value)));
    return;
  };
  
  Jolt.sendEvent = Jolt.sendEvent_drainAll = Jolt.sendEvent_drainHighThenNormThenMid = sendEvent = sendEvent_drainAll = sendEvent_drainHighThenNormThenMid = function() {
    var estream, value;
    estream = arguments[0], value = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (beforeQ.high.length) {
      while (beforeQ.high.length) {
        (beforeQ.high.shift())();
      }
    }
    if (beforeQ.norm.length) {
      while (beforeQ.norm.length) {
        (beforeQ.norm.shift())();
      }
    }
    if (beforeQ.mid.length) {
      while (beforeQ.mid.length) {
        (beforeQ.mid.shift())();
      }
    }
    sendEvent_nodrain.apply(null, [estream].concat(__slice.call(value)));
    return;
  };
  
  Jolt.EventStream_api = EventStream_api = (function() {
  
    __extends(EventStream_api, EventStream);
  
    function EventStream_api() {
      EventStream_api.__super__.constructor.apply(this, arguments);
    }
  
    EventStream_api.factory = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(this, args, function() {});
    };
  
    return EventStream_api;
  
  })();
  
  Jolt.InternalE = InternalE = (function() {
  
    __extends(InternalE, EventStream_api);
  
    function InternalE() {
      InternalE.__super__.constructor.apply(this, arguments);
    }
  
    InternalE.prototype.ClassName = 'InternalE';
  
    return InternalE;
  
  })();
  
  Jolt.internalE = internalE = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return InternalE.factory.apply(InternalE, args);
  };
  
  EventStream_api.prototype.internalE = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return internalE.apply(null, __slice.call(args).concat([this]));
  };
  
  Jolt.ReceiverE = ReceiverE = (function() {
  
    __extends(ReceiverE, EventStream_api);
  
    function ReceiverE() {
      ReceiverE.__super__.constructor.apply(this, arguments);
    }
  
    ReceiverE.prototype.ClassName = 'ReceiverE';
  
    ReceiverE.factory = function() {
      return new this;
    };
  
    ReceiverE.prototype.sendEvent = function() {
      var value;
      value = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return sendEvent.apply(null, [this].concat(__slice.call(value)));
    };
  
    return ReceiverE;
  
  })();
  
  Jolt.receiverE = receiverE = function() {
    return ReceiverE.factory();
  };
  
  Jolt.ZeroE = ZeroE = (function() {
  
    __extends(ZeroE, EventStream_api);
  
    function ZeroE() {
      ZeroE.__super__.constructor.apply(this, arguments);
    }
  
    ZeroE.prototype.ClassName = 'ZeroE';
  
    ZeroE.prototype.UPDATER = function(pulse) {
      throw '<' + this.ClassName + '>.UPDATER: received a pulse; an instance of ' + this.ClassName + ' should never receive a pulse';
    };
  
    return ZeroE;
  
  })();
  
  Jolt.zeroE = zeroE = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return ZeroE.factory.apply(ZeroE, args);
  };
  
  EventStream_api.prototype.zeroE = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return zeroE.apply(null, (args.push(this), args));
  };
  
  Jolt.OneE = OneE = (function() {
  
    __extends(OneE, EventStream_api);
  
    function OneE() {
      OneE.__super__.constructor.apply(this, arguments);
    }
  
    OneE.prototype.ClassName = 'OneE';
  
    OneE.factory = function() {
      var thisOneE, value;
      value = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      thisOneE = new this;
      scheduleBefore.apply(null, [beforeQ, sendEvent_drainHighThenNorm, thisOneE].concat(__slice.call(value), [scheduleMid]));
      return thisOneE;
    };
  
    OneE.prototype.sent = false;
  
    OneE.prototype.UPDATER = function(pulse) {
      if (this.sent) {
        throw '<' + this.ClassName + '>.UPDATER: received an extra pulse; an instance of ' + this.ClassName + ' should never receive more than 1 pulse';
      } else {
        this.sent = true;
        return OneE.__super__.UPDATER.apply(this, arguments);
      }
    };
  
    return OneE;
  
  })();
  
  Jolt.oneE = oneE = function() {
    var value;
    value = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return OneE.factory.apply(OneE, value);
  };
  
  Jolt.OneE_high = OneE_high = (function() {
  
    __extends(OneE_high, OneE);
  
    function OneE_high() {
      OneE_high.__super__.constructor.apply(this, arguments);
    }
  
    OneE_high.prototype.attachListener = function(receiver) {
      var rAL;
      rAL = receiver.attachListener;
      receiver.attachListener = function(rcvr) {
        return rAL.call(receiver, rcvr, true);
      };
      return OneE_high.__super__.attachListener.call(this, receiver, true);
    };
  
    OneE_high.prototype.removeListener = function(receiver) {
      var rRL;
      rRL = receiver.removeListener;
      receiver.removeListener = function(rcvr) {
        return rRL.call(receiver, rcvr, true);
      };
      return OneE_high.__super__.removeListener.call(this, receiver, true);
    };
  
    OneE_high.prototype.ClassName = 'OneE_high';
  
    OneE_high.factory = function() {
      var thisOneE_high, value;
      value = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      thisOneE_high = new this;
      scheduleBefore.apply(null, [beforeQ, sendEvent_nodrain, thisOneE_high].concat(__slice.call(value), [scheduleHigh]));
      return thisOneE_high;
    };
  
    return OneE_high;
  
  })();
  
  Jolt.oneE_high = oneE_high = function() {
    var value;
    value = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return OneE_high.factory.apply(OneE_high, value);
  };
  
  Jolt.isB = isB = function(behavior) {
    return behavior instanceof Behavior;
  };
  
  ChangesE = (function() {
  
    __extends(ChangesE, InternalE);
  
    function ChangesE(behavior) {
      var name;
      ChangesE.__super__.constructor.call(this, behavior);
      name = behavior.name();
      if (name) {
        this._name = name + ' changes';
      } else {
        this._name = 'absRank ' + behavior.absRank + ' changes';
      }
    }
  
    ChangesE.prototype.ClassName = 'ChangesE';
  
    ChangesE.factory = function(behavior) {
      return new this(behavior);
    };
  
    return ChangesE;
  
  })();
  
  changesE = function(behavior) {
    return ChangesE.factory(behavior);
  };
  
  Jolt.Behavior = Behavior = (function() {
  
    __extends(Behavior, EventStream);
  
    function Behavior() {
      var init, length, recvFrom;
      recvFrom = arguments[0], init = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      Behavior.__super__.constructor.call(this, recvFrom);
      length = init.length;
      this.last = {
        arity: !length ? (init.push(void 0), length += 1) : length,
        value: init
      };
      this._changes = null;
    }
  
    Behavior.prototype.changes = function() {
      if (!(this._changes != null)) this._changes = changesE(this);
      return this._changes;
    };
  
    Behavior.prototype.ClassName = 'Behavior';
  
    Behavior.prototype.no_null_junc = true;
  
    Behavior.prototype.UPDATER = function(pulse) {
      var PULSE, value;
      PULSE = Behavior.__super__.UPDATER.call(this, pulse);
      value = PULSE.value.slice(0);
      this.last = {
        arity: value.length,
        value: value
      };
      return PULSE;
    };
  
    Behavior.factory = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(this, args, function() {});
    };
  
    return Behavior;
  
  })();
  
  Jolt.valueNow = valueNow = function(behavior) {
    return behavior.last.value;
  };
  
  Behavior.prototype.valueNow = function(behavior) {
    return valueNow(this);
  };
  
  Jolt.$B = Jolt.extractB = $B = extractB = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return Behavior.factory.apply(Behavior, args);
  };
  
  EventStream_api.prototype.$B = EventStream_api.prototype.extractB = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return extractB.apply(null, [this].concat(__slice.call(args)));
  };
  
  Jolt.ConcatE = ConcatE = (function() {
  
    __extends(ConcatE, EventStream_api);
  
    function ConcatE() {
      ConcatE.__super__.constructor.apply(this, arguments);
    }
  
    ConcatE.prototype.ClassName = 'ConcatE';
  
    ConcatE.prototype.no_null_junc = true;
  
    ConcatE.prototype.updater = function() {
      var value, _ref;
      value = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = []).concat.apply(_ref, value);
    };
  
    return ConcatE;
  
  })();
  
  Jolt.concatE = concatE = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return ConcatE.factory.apply(ConcatE, args);
  };
  
  EventStream_api.prototype.concatE = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return concatE.apply(null, (args.push(this), args));
  };
  
  Jolt.MappedE = MappedE = (function() {
  
    __extends(MappedE, EventStream_api);
  
    function MappedE() {
      var args, fn;
      fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this.fn = fn;
      MappedE.__super__.constructor.apply(this, args);
    }
  
    MappedE.prototype.ClassName = 'MappedE';
  
    MappedE.factory = function() {
      var args, fn;
      fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (!(_.isFunction(fn))) {
        throw '<' + this.prototype.ClassName + '>.factory: 1st argument must be a function';
      }
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(this, [fn].concat(__slice.call(args)), function() {});
    };
  
    MappedE.prototype.updater = function() {
      var fn, value;
      value = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      fn = this.fn;
      return [fn.apply(null, value)];
    };
  
    return MappedE;
  
  })();
  
  Jolt.mapE = mapE = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return MappedE.factory.apply(MappedE, args);
  };
  
  EventStream_api.prototype.mapE = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return mapE.apply(null, (args.push(this), args));
  };
  
  Jolt.Pulse_cat = Jolt.Pulse_catch_and_trace = Pulse_cat = Pulse_catch_and_trace = (function() {
  
    __extends(Pulse_catch_and_trace, Pulse);
  
    function Pulse_catch_and_trace() {
      Pulse_catch_and_trace.__super__.constructor.apply(this, arguments);
    }
  
    Pulse_catch_and_trace.prototype.propagate = function(sender, receiver, isHeap, isCatch, isFinally) {
      var HEAP, caught, heapP, stamp, timeEnd, timeStart, traceTime;
      HEAP = this.heap;
      traceTime = 123;
      if ((!isHeap) && (!isCatch) && (!isFinally)) {
        timeStart = new Date;
        stamp = this.stamp;
        heapP = new this.constructor(2, false, sender, stamp, ['start', timeStart], new HeapStore(stamp));
        heapP.propagate(heapP.sender, HEAP_E, true, false, false);
      } else {
        'do';
      }
      caught = null;
      try {
        HEAP = Pulse_catch_and_trace.__super__.propagate.call(this, sender, receiver, isHeap, isCatch, isFinally);
      } catch (error) {
        caught = error;
      } finally {
        if ((!isHeap) && (!isCatch) && (!isFinally)) {
          timeEnd = new Date;
          heapP = new this.constructor(5, false, sender, stamp, ['end', timeEnd, timeEnd - timeStart, traceTime, HEAP], new HeapStore(stamp));
          heapP.propagate(heapP.sender, HEAP_E, true, false, false);
        } else {
          'do';
        }
        if (caught) throw caught;
      }
      return HEAP;
    };
  
    Pulse_catch_and_trace.prototype.PROPAGATE = function(sender, receiver, isHeap, isCatch, isFinally) {
      var PULSE, caught, doSub, errP, finP, fn, fnames, prePulse, stamp, subs, timeNow, times, _i, _j, _k, _len, _len2, _len3;
      caught = false;
      PULSE = null;
      timeNow = new Date;
      fnames = ['tranIN', 'tranVAL', 'tranOUT'];
      times = {};
      try {
        prePulse = {
          arity: this.arity,
          junction: this.junction,
          stamp: this.stamp,
          value: this.value.slice(0)
        };
        subs = {};
        for (_i = 0, _len = fnames.length; _i < _len; _i++) {
          fn = fnames[_i];
          subs[fn] = receiver[fn];
        }
        doSub = function(fn) {
          return receiver[fn] = function(pulse) {
            var P, t1;
            t1 = (new Date).valueOf();
            P = subs[fn].call(receiver, pulse);
            times[fn] = (new Date).valueOf() - t1;
            return P;
          };
        };
        for (_j = 0, _len2 = fnames.length; _j < _len2; _j++) {
          fn = fnames[_j];
          doSub(fn);
        }
        PULSE = receiver.UPDATER(this);
        if (PULSE !== doNotPropagate && !(isP(PULSE))) {
          PULSE = null;
          throw 'receiver\'s UPDATER did not return a pulse object';
        }
      } catch (error) {
        if ((!isHeap) && (!isCatch) && (!isFinally)) {
          caught = true;
          stamp = this.stamp;
          errP = new this.constructor(5, false, receiver, stamp, [error, prePulse, sender, receiver, timeNow], new HeapStore(stamp));
          errP.propagate(errP.sender, CATCH_E, false, true, false);
        } else {
          throw error;
        }
      } finally {
        for (_k = 0, _len3 = fnames.length; _k < _len3; _k++) {
          fn = fnames[_k];
          receiver[fn] = subs[fn];
        }
        if ((!isHeap) && (!isCatch) && (!isFinally) && (!caught)) {
          stamp = this.stamp;
          finP = new this.constructor(4, false, receiver, stamp, [prePulse, PULSE, sender, receiver, timeNow, times], new HeapStore(stamp));
          finP.propagate(finP.sender, FINALLY_E, false, false, true);
        }
      }
      return PULSE != null ? PULSE : PULSE = doNotPropagate;
    };
  
    return Pulse_catch_and_trace;
  
  })();
  
  Jolt.HEAP_E = HEAP_E = internalE().name('Jolt.HEAP_E').PulseClass(Pulse_cat);
  
  Jolt.CATCH_E = CATCH_E = internalE().name('Jolt.CATCH_E').PulseClass(Pulse_cat);
  
  Jolt.FINALLY_E = FINALLY_E = internalE().name('Jolt.FINALLY_E').PulseClass(Pulse_cat);
  
  Jolt.defaultHeapE = defaultHeapE = HEAP_E.mapE(function(where, timeNow, timeElapsed, traceTime, HEAP) {
    var message;
    switch (where) {
      case 'start':
        message = "----HEAP-START----\n" + timeNow + "\nepoch: " + (timeNow.valueOf());
        return say(message, 'green');
      case 'end':
        message = "----HEAP-END-----\n" + timeNow + "\nepoch:   " + (timeNow.valueOf()) + "\n  (time in ms)\nelapsed:  " + timeElapsed + "\ntrace:    " + 0 + "\nest. net: " + 0;
        return say(message, 'blue');
    }
  }).name('Jolt.defaultHeapE').PulseClass(Pulse_cat);
  
  Jolt.defaultCatchE = defaultCatchE = CATCH_E.mapE(function(error, prePulse, sender, receiver, timeNow) {
    var emsg, message, rClass, rName, sClass, sName;
    if ((typeof error) === 'string') {
      emsg = error;
    } else if (error.message != null) {
      emsg = error.message;
    } else {
      emsg = JSON.stringify(error);
    }
    if (emsg === '') emsg = 'undefined';
    if (emsg == null) emsg = 'undefined';
    sName = sender.name();
    if (sName == null) sName = 'unnamed';
    sClass = '(' + sender.ClassName + ')';
    if (sClass === '(undefined)') sClass = '';
    rName = receiver.name();
    if (rName == null) rName = 'unnamed';
    rClass = '(' + receiver.ClassName + ')';
    message = "------ERROR------\nsender:    " + sName + "  " + sClass + "\n  rank:    " + (sender.rank || 'n/a') + "\n  absRank: " + (sender.absRank || 'n/a') + "\nreceiver:  " + rName + "  " + rClass + "\n  mode:    " + (receiver.mode()) + "\n  nary:    " + (receiver.isNary()) + "\n  rank:    " + receiver.rank + "\n  absRank: " + receiver.absRank + "\nerror:     " + emsg + "\n----RECV-PULSE---\narity:     " + prePulse.arity + "\njunction:  " + prePulse.junction + "\nstamp:     " + prePulse.stamp + "\nvalue:     " + (JSON.stringify(prePulse.value));
    return sayError(message, 'bright', 'red');
  }).name('Jolt.defaultCatchE').PulseClass(Pulse_cat);
  
  Jolt.defaultFinallyE = defaultFinallyE = FINALLY_E.mapE(function(prePulse, PULSE, sender, receiver, timeNow, times) {
    var message, rClass, rName, sClass, sName;
    sName = sender.name();
    if (sName == null) sName = 'unnamed';
    sClass = '(' + sender.ClassName + ')';
    if (sClass === '(undefined)') sClass = '';
    rName = receiver.name();
    if (rName == null) rName = 'unnamed';
    rClass = '(' + receiver.ClassName + ')';
    message = "------TRACE------\nsender:    " + sName + "  " + sClass + "\n  rank:    " + (sender.rank || 'n/a') + "\n  absRank: " + (sender.absRank || 'n/a') + "\nreceiver:  " + rName + "  " + rClass + "\n  mode:    " + (receiver.mode()) + "\n  nary:    " + (receiver.isNary()) + "\n  rank:    " + receiver.rank + "\n  absRank: " + receiver.absRank + "\n----RCV-PULSE----\narity:     " + prePulse.arity + "\njunction:  " + prePulse.junction + "\nstamp:     " + prePulse.stamp + "\nvalue:     " + (JSON.stringify(prePulse.value)) + "\n----OUT-PULSE----\narity:     " + PULSE.arity + "\njunction:  " + PULSE.junction + "\nstamp:     " + PULSE.stamp + "\nvalue:     " + (JSON.stringify(PULSE.value)) + "\n-----PROFILE-----\n  (time in ms)\ntranIN:  " + times.tranIN + "\ntranVAL: " + times.tranVAL + "\ntranOUT: " + times.tranOUT;
    return say(message);
  }).name('Jolt.defaultFinallyE').PulseClass(Pulse_cat);
  
  Jolt.Reactor = Reactor = (function() {
  
    __extends(Reactor, EventEmitter);
  
    function Reactor() {
      Reactor.__super__.constructor.apply(this, arguments);
    }
  
    return Reactor;
  
  })();
  
  exporter = function(ns, target) {
    var key, value, _results;
    if (ns == null) ns = Jolt;
    if (target == null) target = exports;
    _results = [];
    for (key in ns) {
      if (!__hasProp.call(ns, key)) continue;
      value = ns[key];
      _results.push(target[key] = ns[key]);
    }
    return _results;
  };
  
  Jolt.EventEmitter2 = EventEmitter;
  
  Jolt._ = _;
  
  Jolt.globalize = function() {
    var namespaces, ns, which, _i, _len;
    namespaces = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    which = typeof window !== "undefined" && window !== null ? window : (typeof global !== "undefined" && global !== null ? global : {});
    if (!namespaces.length) exporter(Jolt, which);
    for (_i = 0, _len = namespaces.length; _i < _len; _i++) {
      ns = namespaces[_i];
      exporter(ns, which);
    }
  };
  
  exporter();
  

}).call(this, ((typeof exports !== 'undefined') ? exports : (this.previousJolt = this.Jolt, this.Jolt = {}, this.Jolt)))
