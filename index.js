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
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU General
 * Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any
 * later version. The code is distributed WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE. See the GNU GPL for more details.
 *
 * https://raw.github.com/projexsys/Jolt/master/LICENSE
 * http://www.gnu.org/licenses/gpl-3.0.txt
 *
 * However, if you have executed an End User Software License and
 * Services Agreement or an OEM Software License and Support Services
 * Agreement, or another commercial license agreement with Projexsys,
 * Inc. (each, a "Commercial Agreement"), the terms of the license in
 * such Commercial Agreement will supersede the GNU GENERAL PUBLIC
 * LICENSE Version 3 and you may use the Software solely pursuant to the
 * terms of the relevant Commercial Agreement.
 *
//////////////////////////////// CREDIT ////////////////////////////////
 *
 * This program is derived from and incorporates existing works:
 *
 *  https://github.com/brownplt/flapjax
 *  https://github.com/hij1nx/EventEmitter2
 *  https://github.com/jquery/sizzle
 *  https://github.com/documentcloud/underscore
 *  https://github.com/epeli/underscore.string
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
  
  /*!
   * Sizzle CSS Selector Engine
   *  Copyright 2011, The Dojo Foundation
   *  Released under the MIT, BSD, and GPL Licenses.
   *  More information: http://sizzlejs.com/
   */
  
  // MYMOD - 14 Nov 2011
  if (typeof document !== "undefined" && document !== null) {
  
    var Sizzle
  
    // MYMOD - 14 Nov 2011
    ;(function(){
  
    var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
      expando = "sizcache" + (Math.random() + '').replace('.', ''),
      done = 0,
      toString = Object.prototype.toString,
      hasDuplicate = false,
      baseHasDuplicate = true,
      rBackslash = /\\/g,
      rReturn = /\r\n/g,
      rNonWord = /\W/;
  
    // Here we check if the JavaScript engine is using some sort of
    // optimization where it does not always call our comparision
    // function. If that is the case, discard the hasDuplicate value.
    //   Thus far that includes Google Chrome.
    [0, 0].sort(function() {
      baseHasDuplicate = false;
      return 0;
    });
  
    // MYMOD - 14 Nov 2011
    Sizzle = function( selector, context, results, seed ) {
      results = results || [];
      context = context || document;
  
      var origContext = context;
  
      if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
        return [];
      }
      
      if ( !selector || typeof selector !== "string" ) {
        return results;
      }
  
      var m, set, checkSet, extra, ret, cur, pop, i,
        prune = true,
        contextXML = Sizzle.isXML( context ),
        parts = [],
        soFar = selector;
      
      // Reset the position of the chunker regexp (start from head)
      do {
        chunker.exec( "" );
        m = chunker.exec( soFar );
  
        if ( m ) {
          soFar = m[3];
        
          parts.push( m[1] );
        
          if ( m[2] ) {
            extra = m[3];
            break;
          }
        }
      } while ( m );
  
      if ( parts.length > 1 && origPOS.exec( selector ) ) {
  
        if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
          set = posProcess( parts[0] + parts[1], context, seed );
  
        } else {
          set = Expr.relative[ parts[0] ] ?
            [ context ] :
            Sizzle( parts.shift(), context );
  
          while ( parts.length ) {
            selector = parts.shift();
  
            if ( Expr.relative[ selector ] ) {
              selector += parts.shift();
            }
            
            set = posProcess( selector, set, seed );
          }
        }
  
      } else {
        // Take a shortcut and set the context if the root selector is an ID
        // (but not if it'll be faster if the inner selector is an ID)
        if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
            Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
  
          ret = Sizzle.find( parts.shift(), context, contextXML );
          context = ret.expr ?
            Sizzle.filter( ret.expr, ret.set )[0] :
            ret.set[0];
        }
  
        if ( context ) {
          ret = seed ?
            { expr: parts.pop(), set: makeArray(seed) } :
            Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
  
          set = ret.expr ?
            Sizzle.filter( ret.expr, ret.set ) :
            ret.set;
  
          if ( parts.length > 0 ) {
            checkSet = makeArray( set );
  
          } else {
            prune = false;
          }
  
          while ( parts.length ) {
            cur = parts.pop();
            pop = cur;
  
            if ( !Expr.relative[ cur ] ) {
              cur = "";
            } else {
              pop = parts.pop();
            }
  
            if ( pop == null ) {
              pop = context;
            }
  
            Expr.relative[ cur ]( checkSet, pop, contextXML );
          }
  
        } else {
          checkSet = parts = [];
        }
      }
  
      if ( !checkSet ) {
        checkSet = set;
      }
  
      if ( !checkSet ) {
        Sizzle.error( cur || selector );
      }
  
      if ( toString.call(checkSet) === "[object Array]" ) {
        if ( !prune ) {
          results.push.apply( results, checkSet );
  
        } else if ( context && context.nodeType === 1 ) {
          for ( i = 0; checkSet[i] != null; i++ ) {
            if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i])) ) {
              results.push( set[i] );
            }
          }
  
        } else {
          for ( i = 0; checkSet[i] != null; i++ ) {
            if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
              results.push( set[i] );
            }
          }
        }
  
      } else {
        makeArray( checkSet, results );
      }
  
      if ( extra ) {
        Sizzle( extra, origContext, results, seed );
        Sizzle.uniqueSort( results );
      }
  
      return results;
    };
  
    Sizzle.uniqueSort = function( results ) {
      if ( sortOrder ) {
        hasDuplicate = baseHasDuplicate;
        results.sort( sortOrder );
  
        if ( hasDuplicate ) {
          for ( var i = 1; i < results.length; i++ ) {
            if ( results[i] === results[ i - 1 ] ) {
              results.splice( i--, 1 );
            }
          }
        }
      }
  
      return results;
    };
  
    Sizzle.matches = function( expr, set ) {
      return Sizzle( expr, null, null, set );
    };
  
    Sizzle.matchesSelector = function( node, expr ) {
      return Sizzle( expr, null, null, [node] ).length > 0;
    };
  
    Sizzle.find = function( expr, context, isXML ) {
      var set, i, len, match, type, left;
  
      if ( !expr ) {
        return [];
      }
  
      for ( i = 0, len = Expr.order.length; i < len; i++ ) {
        type = Expr.order[i];
        
        if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
          left = match[1];
          match.splice( 1, 1 );
  
          if ( left.substr( left.length - 1 ) !== "\\" ) {
            match[1] = (match[1] || "").replace( rBackslash, "" );
            set = Expr.find[ type ]( match, context, isXML );
  
            if ( set != null ) {
              expr = expr.replace( Expr.match[ type ], "" );
              break;
            }
          }
        }
      }
  
      if ( !set ) {
        set = typeof context.getElementsByTagName !== "undefined" ?
          context.getElementsByTagName( "*" ) :
          [];
      }
  
      return { set: set, expr: expr };
    };
  
    Sizzle.filter = function( expr, set, inplace, not ) {
      var match, anyFound,
        type, found, item, filter, left,
        i, pass,
        old = expr,
        result = [],
        curLoop = set,
        isXMLFilter = set && set[0] && Sizzle.isXML( set[0] );
  
      while ( expr && set.length ) {
        for ( type in Expr.filter ) {
          if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
            filter = Expr.filter[ type ];
            left = match[1];
  
            anyFound = false;
  
            match.splice(1,1);
  
            if ( left.substr( left.length - 1 ) === "\\" ) {
              continue;
            }
  
            if ( curLoop === result ) {
              result = [];
            }
  
            if ( Expr.preFilter[ type ] ) {
              match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );
  
              if ( !match ) {
                anyFound = found = true;
  
              } else if ( match === true ) {
                continue;
              }
            }
  
            if ( match ) {
              for ( i = 0; (item = curLoop[i]) != null; i++ ) {
                if ( item ) {
                  found = filter( item, match, i, curLoop );
                  pass = not ^ found;
  
                  if ( inplace && found != null ) {
                    if ( pass ) {
                      anyFound = true;
  
                    } else {
                      curLoop[i] = false;
                    }
  
                  } else if ( pass ) {
                    result.push( item );
                    anyFound = true;
                  }
                }
              }
            }
  
            if ( found !== undefined ) {
              if ( !inplace ) {
                curLoop = result;
              }
  
              expr = expr.replace( Expr.match[ type ], "" );
  
              if ( !anyFound ) {
                return [];
              }
  
              break;
            }
          }
        }
  
        // Improper expression
        if ( expr === old ) {
          if ( anyFound == null ) {
            Sizzle.error( expr );
  
          } else {
            break;
          }
        }
  
        old = expr;
      }
  
      return curLoop;
    };
  
    Sizzle.error = function( msg ) {
      throw new Error( "Syntax error, unrecognized expression: " + msg );
    };
  
    /**
     * Utility function for retreiving the text value of an array of DOM nodes
     * @param {Array|Element} elem
     */
    var getText = Sizzle.getText = function( elem ) {
        var i, node,
        nodeType = elem.nodeType,
        ret = "";
  
      if ( nodeType ) {
        if ( nodeType === 1 || nodeType === 9 ) {
          // Use textContent || innerText for elements
          if ( typeof elem.textContent === 'string' ) {
            return elem.textContent;
          } else if ( typeof elem.innerText === 'string' ) {
            // Replace IE's carriage returns
            return elem.innerText.replace( rReturn, '' );
          } else {
            // Traverse it's children
            for ( elem = elem.firstChild; elem; elem = elem.nextSibling) {
              ret += getText( elem );
            }
          }
        } else if ( nodeType === 3 || nodeType === 4 ) {
          return elem.nodeValue;
        }
      } else {
  
        // If no nodeType, this is expected to be an array
        for ( i = 0; (node = elem[i]); i++ ) {
          // Do not traverse comment nodes
          if ( node.nodeType !== 8 ) {
            ret += getText( node );
          }
        }
      }
      return ret;
    };
  
    var Expr = Sizzle.selectors = {
      order: [ "ID", "NAME", "TAG" ],
  
      match: {
        ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
        CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
        NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
        ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
        TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
        CHILD: /:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
        POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
        PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
      },
  
      leftMatch: {},
  
      attrMap: {
        "class": "className",
        "for": "htmlFor"
      },
  
      attrHandle: {
        href: function( elem ) {
          return elem.getAttribute( "href" );
        },
        type: function( elem ) {
          return elem.getAttribute( "type" );
        }
      },
  
      relative: {
        "+": function(checkSet, part){
          var isPartStr = typeof part === "string",
            isTag = isPartStr && !rNonWord.test( part ),
            isPartStrNotTag = isPartStr && !isTag;
  
          if ( isTag ) {
            part = part.toLowerCase();
          }
  
          for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
            if ( (elem = checkSet[i]) ) {
              while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}
  
              checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
                elem || false :
                elem === part;
            }
          }
  
          if ( isPartStrNotTag ) {
            Sizzle.filter( part, checkSet, true );
          }
        },
  
        ">": function( checkSet, part ) {
          var elem,
            isPartStr = typeof part === "string",
            i = 0,
            l = checkSet.length;
  
          if ( isPartStr && !rNonWord.test( part ) ) {
            part = part.toLowerCase();
  
            for ( ; i < l; i++ ) {
              elem = checkSet[i];
  
              if ( elem ) {
                var parent = elem.parentNode;
                checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
              }
            }
  
          } else {
            for ( ; i < l; i++ ) {
              elem = checkSet[i];
  
              if ( elem ) {
                checkSet[i] = isPartStr ?
                  elem.parentNode :
                  elem.parentNode === part;
              }
            }
  
            if ( isPartStr ) {
              Sizzle.filter( part, checkSet, true );
            }
          }
        },
  
        "": function(checkSet, part, isXML){
          var nodeCheck,
            doneName = done++,
            checkFn = dirCheck;
  
          if ( typeof part === "string" && !rNonWord.test( part ) ) {
            part = part.toLowerCase();
            nodeCheck = part;
            checkFn = dirNodeCheck;
          }
  
          checkFn( "parentNode", part, doneName, checkSet, nodeCheck, isXML );
        },
  
        "~": function( checkSet, part, isXML ) {
          var nodeCheck,
            doneName = done++,
            checkFn = dirCheck;
  
          if ( typeof part === "string" && !rNonWord.test( part ) ) {
            part = part.toLowerCase();
            nodeCheck = part;
            checkFn = dirNodeCheck;
          }
  
          checkFn( "previousSibling", part, doneName, checkSet, nodeCheck, isXML );
        }
      },
  
      find: {
        ID: function( match, context, isXML ) {
          if ( typeof context.getElementById !== "undefined" && !isXML ) {
            var m = context.getElementById(match[1]);
            // Check parentNode to catch when Blackberry 4.6 returns
            // nodes that are no longer in the document #6963
            return m && m.parentNode ? [m] : [];
          }
        },
  
        NAME: function( match, context ) {
          if ( typeof context.getElementsByName !== "undefined" ) {
            var ret = [],
              results = context.getElementsByName( match[1] );
  
            for ( var i = 0, l = results.length; i < l; i++ ) {
              if ( results[i].getAttribute("name") === match[1] ) {
                ret.push( results[i] );
              }
            }
  
            return ret.length === 0 ? null : ret;
          }
        },
  
        TAG: function( match, context ) {
          if ( typeof context.getElementsByTagName !== "undefined" ) {
            return context.getElementsByTagName( match[1] );
          }
        }
      },
      preFilter: {
        CLASS: function( match, curLoop, inplace, result, not, isXML ) {
          match = " " + match[1].replace( rBackslash, "" ) + " ";
  
          if ( isXML ) {
            return match;
          }
  
          for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
            if ( elem ) {
              if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n\r]/g, " ").indexOf(match) >= 0) ) {
                if ( !inplace ) {
                  result.push( elem );
                }
  
              } else if ( inplace ) {
                curLoop[i] = false;
              }
            }
          }
  
          return false;
        },
  
        ID: function( match ) {
          return match[1].replace( rBackslash, "" );
        },
  
        TAG: function( match, curLoop ) {
          return match[1].replace( rBackslash, "" ).toLowerCase();
        },
  
        CHILD: function( match ) {
          if ( match[1] === "nth" ) {
            if ( !match[2] ) {
              Sizzle.error( match[0] );
            }
  
            match[2] = match[2].replace(/^\+|\s*/g, '');
  
            // parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
            var test = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(
              match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
              !/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);
  
            // calculate the numbers (first)n+(last) including if they are negative
            match[2] = (test[1] + (test[2] || 1)) - 0;
            match[3] = test[3] - 0;
          }
          else if ( match[2] ) {
            Sizzle.error( match[0] );
          }
  
          // TODO: Move to normal caching system
          match[0] = done++;
  
          return match;
        },
  
        ATTR: function( match, curLoop, inplace, result, not, isXML ) {
          var name = match[1] = match[1].replace( rBackslash, "" );
          
          if ( !isXML && Expr.attrMap[name] ) {
            match[1] = Expr.attrMap[name];
          }
  
          // Handle if an un-quoted value was used
          match[4] = ( match[4] || match[5] || "" ).replace( rBackslash, "" );
  
          if ( match[2] === "~=" ) {
            match[4] = " " + match[4] + " ";
          }
  
          return match;
        },
  
        PSEUDO: function( match, curLoop, inplace, result, not ) {
          if ( match[1] === "not" ) {
            // If we're dealing with a complex expression, or a simple one
            if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
              match[3] = Sizzle(match[3], null, null, curLoop);
  
            } else {
              var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
  
              if ( !inplace ) {
                result.push.apply( result, ret );
              }
  
              return false;
            }
  
          } else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
            return true;
          }
          
          return match;
        },
  
        POS: function( match ) {
          match.unshift( true );
  
          return match;
        }
      },
      
      filters: {
        enabled: function( elem ) {
          return elem.disabled === false && elem.type !== "hidden";
        },
  
        disabled: function( elem ) {
          return elem.disabled === true;
        },
  
        checked: function( elem ) {
          return elem.checked === true;
        },
        
        selected: function( elem ) {
          // Accessing this property makes selected-by-default
          // options in Safari work properly
          if ( elem.parentNode ) {
            elem.parentNode.selectedIndex;
          }
          
          return elem.selected === true;
        },
  
        parent: function( elem ) {
          return !!elem.firstChild;
        },
  
        empty: function( elem ) {
          return !elem.firstChild;
        },
  
        has: function( elem, i, match ) {
          return !!Sizzle( match[3], elem ).length;
        },
  
        header: function( elem ) {
          return (/h\d/i).test( elem.nodeName );
        },
  
        text: function( elem ) {
          var attr = elem.getAttribute( "type" ), type = elem.type;
          // IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc) 
          // use getAttribute instead to test this case
          return elem.nodeName.toLowerCase() === "input" && "text" === type && ( attr === type || attr === null );
        },
  
        radio: function( elem ) {
          return elem.nodeName.toLowerCase() === "input" && "radio" === elem.type;
        },
  
        checkbox: function( elem ) {
          return elem.nodeName.toLowerCase() === "input" && "checkbox" === elem.type;
        },
  
        file: function( elem ) {
          return elem.nodeName.toLowerCase() === "input" && "file" === elem.type;
        },
  
        password: function( elem ) {
          return elem.nodeName.toLowerCase() === "input" && "password" === elem.type;
        },
  
        submit: function( elem ) {
          var name = elem.nodeName.toLowerCase();
          return (name === "input" || name === "button") && "submit" === elem.type;
        },
  
        image: function( elem ) {
          return elem.nodeName.toLowerCase() === "input" && "image" === elem.type;
        },
  
        reset: function( elem ) {
          var name = elem.nodeName.toLowerCase();
          return (name === "input" || name === "button") && "reset" === elem.type;
        },
  
        button: function( elem ) {
          var name = elem.nodeName.toLowerCase();
          return name === "input" && "button" === elem.type || name === "button";
        },
  
        input: function( elem ) {
          return (/input|select|textarea|button/i).test( elem.nodeName );
        },
  
        focus: function( elem ) {
          return elem === elem.ownerDocument.activeElement;
        }
      },
      setFilters: {
        first: function( elem, i ) {
          return i === 0;
        },
  
        last: function( elem, i, match, array ) {
          return i === array.length - 1;
        },
  
        even: function( elem, i ) {
          return i % 2 === 0;
        },
  
        odd: function( elem, i ) {
          return i % 2 === 1;
        },
  
        lt: function( elem, i, match ) {
          return i < match[3] - 0;
        },
  
        gt: function( elem, i, match ) {
          return i > match[3] - 0;
        },
  
        nth: function( elem, i, match ) {
          return match[3] - 0 === i;
        },
  
        eq: function( elem, i, match ) {
          return match[3] - 0 === i;
        }
      },
      filter: {
        PSEUDO: function( elem, match, i, array ) {
          var name = match[1],
            filter = Expr.filters[ name ];
  
          if ( filter ) {
            return filter( elem, i, match, array );
  
          } else if ( name === "contains" ) {
            return (elem.textContent || elem.innerText || getText([ elem ]) || "").indexOf(match[3]) >= 0;
  
          } else if ( name === "not" ) {
            var not = match[3];
  
            for ( var j = 0, l = not.length; j < l; j++ ) {
              if ( not[j] === elem ) {
                return false;
              }
            }
  
            return true;
  
          } else {
            Sizzle.error( name );
          }
        },
  
        CHILD: function( elem, match ) {
          var first, last,
            doneName, parent, cache,
            count, diff,
            type = match[1],
            node = elem;
  
          switch ( type ) {
            case "only":
            case "first":
              while ( (node = node.previousSibling) )	 {
                if ( node.nodeType === 1 ) { 
                  return false; 
                }
              }
  
              if ( type === "first" ) { 
                return true; 
              }
  
              node = elem;
  
            case "last":
              while ( (node = node.nextSibling) )	 {
                if ( node.nodeType === 1 ) { 
                  return false; 
                }
              }
  
              return true;
  
            case "nth":
              first = match[2];
              last = match[3];
  
              if ( first === 1 && last === 0 ) {
                return true;
              }
              
              doneName = match[0];
              parent = elem.parentNode;
      
              if ( parent && (parent[ expando ] !== doneName || !elem.nodeIndex) ) {
                count = 0;
                
                for ( node = parent.firstChild; node; node = node.nextSibling ) {
                  if ( node.nodeType === 1 ) {
                    node.nodeIndex = ++count;
                  }
                } 
  
                parent[ expando ] = doneName;
              }
              
              diff = elem.nodeIndex - last;
  
              if ( first === 0 ) {
                return diff === 0;
  
              } else {
                return ( diff % first === 0 && diff / first >= 0 );
              }
          }
        },
  
        ID: function( elem, match ) {
          return elem.nodeType === 1 && elem.getAttribute("id") === match;
        },
  
        TAG: function( elem, match ) {
          return (match === "*" && elem.nodeType === 1) || !!elem.nodeName && elem.nodeName.toLowerCase() === match;
        },
        
        CLASS: function( elem, match ) {
          return (" " + (elem.className || elem.getAttribute("class")) + " ")
            .indexOf( match ) > -1;
        },
  
        ATTR: function( elem, match ) {
          var name = match[1],
            result = Sizzle.attr ?
              Sizzle.attr( elem, name ) :
              Expr.attrHandle[ name ] ?
              Expr.attrHandle[ name ]( elem ) :
              elem[ name ] != null ?
                elem[ name ] :
                elem.getAttribute( name ),
            value = result + "",
            type = match[2],
            check = match[4];
  
          return result == null ?
            type === "!=" :
            !type && Sizzle.attr ?
            result != null :
            type === "=" ?
            value === check :
            type === "*=" ?
            value.indexOf(check) >= 0 :
            type === "~=" ?
            (" " + value + " ").indexOf(check) >= 0 :
            !check ?
            value && result !== false :
            type === "!=" ?
            value !== check :
            type === "^=" ?
            value.indexOf(check) === 0 :
            type === "$=" ?
            value.substr(value.length - check.length) === check :
            type === "|=" ?
            value === check || value.substr(0, check.length + 1) === check + "-" :
            false;
        },
  
        POS: function( elem, match, i, array ) {
          var name = match[2],
            filter = Expr.setFilters[ name ];
  
          if ( filter ) {
            return filter( elem, i, match, array );
          }
        }
      }
    };
  
    var origPOS = Expr.match.POS,
      fescape = function(all, num){
        return "\\" + (num - 0 + 1);
      };
  
    for ( var type in Expr.match ) {
      Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
      Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape) );
    }
  
    var makeArray = function( array, results ) {
      array = Array.prototype.slice.call( array, 0 );
  
      if ( results ) {
        results.push.apply( results, array );
        return results;
      }
      
      return array;
    };
  
    // Perform a simple check to determine if the browser is capable of
    // converting a NodeList to an array using builtin methods.
    // Also verifies that the returned array holds DOM nodes
    // (which is not the case in the Blackberry browser)
    try {
      Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;
  
    // Provide a fallback method if it does not work
    } catch( e ) {
      makeArray = function( array, results ) {
        var i = 0,
          ret = results || [];
  
        if ( toString.call(array) === "[object Array]" ) {
          Array.prototype.push.apply( ret, array );
  
        } else {
          if ( typeof array.length === "number" ) {
            for ( var l = array.length; i < l; i++ ) {
              ret.push( array[i] );
            }
  
          } else {
            for ( ; array[i]; i++ ) {
              ret.push( array[i] );
            }
          }
        }
  
        return ret;
      };
    }
  
    var sortOrder, siblingCheck;
  
    if ( document.documentElement.compareDocumentPosition ) {
      sortOrder = function( a, b ) {
        if ( a === b ) {
          hasDuplicate = true;
          return 0;
        }
  
        if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
          return a.compareDocumentPosition ? -1 : 1;
        }
  
        return a.compareDocumentPosition(b) & 4 ? -1 : 1;
      };
  
    } else {
      sortOrder = function( a, b ) {
        // The nodes are identical, we can exit early
        if ( a === b ) {
          hasDuplicate = true;
          return 0;
  
        // Fallback to using sourceIndex (in IE) if it's available on both nodes
        } else if ( a.sourceIndex && b.sourceIndex ) {
          return a.sourceIndex - b.sourceIndex;
        }
  
        var al, bl,
          ap = [],
          bp = [],
          aup = a.parentNode,
          bup = b.parentNode,
          cur = aup;
  
        // If the nodes are siblings (or identical) we can do a quick check
        if ( aup === bup ) {
          return siblingCheck( a, b );
  
        // If no parents were found then the nodes are disconnected
        } else if ( !aup ) {
          return -1;
  
        } else if ( !bup ) {
          return 1;
        }
  
        // Otherwise they're somewhere else in the tree so we need
        // to build up a full list of the parentNodes for comparison
        while ( cur ) {
          ap.unshift( cur );
          cur = cur.parentNode;
        }
  
        cur = bup;
  
        while ( cur ) {
          bp.unshift( cur );
          cur = cur.parentNode;
        }
  
        al = ap.length;
        bl = bp.length;
  
        // Start walking down the tree looking for a discrepancy
        for ( var i = 0; i < al && i < bl; i++ ) {
          if ( ap[i] !== bp[i] ) {
            return siblingCheck( ap[i], bp[i] );
          }
        }
  
        // We ended someplace up the tree so do a sibling check
        return i === al ?
          siblingCheck( a, bp[i], -1 ) :
          siblingCheck( ap[i], b, 1 );
      };
  
      siblingCheck = function( a, b, ret ) {
        if ( a === b ) {
          return ret;
        }
  
        var cur = a.nextSibling;
  
        while ( cur ) {
          if ( cur === b ) {
            return -1;
          }
  
          cur = cur.nextSibling;
        }
  
        return 1;
      };
    }
  
    // Check to see if the browser returns elements by name when
    // querying by getElementById (and provide a workaround)
    (function(){
      // We're going to inject a fake input element with a specified name
      var form = document.createElement("div"),
        id = "script" + (new Date()).getTime(),
        root = document.documentElement;
  
      form.innerHTML = "<a name='" + id + "'/>";
  
      // Inject it into the root element, check its status, and remove it quickly
      root.insertBefore( form, root.firstChild );
  
      // The workaround has to do additional checks after a getElementById
      // Which slows things down for other browsers (hence the branching)
      if ( document.getElementById( id ) ) {
        Expr.find.ID = function( match, context, isXML ) {
          if ( typeof context.getElementById !== "undefined" && !isXML ) {
            var m = context.getElementById(match[1]);
  
            return m ?
              m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ?
                [m] :
                undefined :
              [];
          }
        };
  
        Expr.filter.ID = function( elem, match ) {
          var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
  
          return elem.nodeType === 1 && node && node.nodeValue === match;
        };
      }
  
      root.removeChild( form );
  
      // release memory in IE
      root = form = null;
    })();
  
    (function(){
      // Check to see if the browser returns only elements
      // when doing getElementsByTagName("*")
  
      // Create a fake element
      var div = document.createElement("div");
      div.appendChild( document.createComment("") );
  
      // Make sure no comments are found
      if ( div.getElementsByTagName("*").length > 0 ) {
        Expr.find.TAG = function( match, context ) {
          var results = context.getElementsByTagName( match[1] );
  
          // Filter out possible comments
          if ( match[1] === "*" ) {
            var tmp = [];
  
            for ( var i = 0; results[i]; i++ ) {
              if ( results[i].nodeType === 1 ) {
                tmp.push( results[i] );
              }
            }
  
            results = tmp;
          }
  
          return results;
        };
      }
  
      // Check to see if an attribute returns normalized href attributes
      div.innerHTML = "<a href='#'></a>";
  
      if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
          div.firstChild.getAttribute("href") !== "#" ) {
  
        Expr.attrHandle.href = function( elem ) {
          return elem.getAttribute( "href", 2 );
        };
      }
  
      // release memory in IE
      div = null;
    })();
  
    if ( document.querySelectorAll ) {
      (function(){
        var oldSizzle = Sizzle,
          div = document.createElement("div"),
          id = "__sizzle__";
  
        div.innerHTML = "<p class='TEST'></p>";
  
        // Safari can't handle uppercase or unicode characters when
        // in quirks mode.
        if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
          return;
        }
      
        Sizzle = function( query, context, extra, seed ) {
          context = context || document;
  
          // Only use querySelectorAll on non-XML documents
          // (ID selectors don't work in non-HTML documents)
          if ( !seed && !Sizzle.isXML(context) ) {
            // See if we find a selector to speed up
            var match = /^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec( query );
            
            if ( match && (context.nodeType === 1 || context.nodeType === 9) ) {
              // Speed-up: Sizzle("TAG")
              if ( match[1] ) {
                return makeArray( context.getElementsByTagName( query ), extra );
              
              // Speed-up: Sizzle(".CLASS")
              } else if ( match[2] && Expr.find.CLASS && context.getElementsByClassName ) {
                return makeArray( context.getElementsByClassName( match[2] ), extra );
              }
            }
            
            if ( context.nodeType === 9 ) {
              // Speed-up: Sizzle("body")
              // The body element only exists once, optimize finding it
              if ( query === "body" && context.body ) {
                return makeArray( [ context.body ], extra );
                
              // Speed-up: Sizzle("#ID")
              } else if ( match && match[3] ) {
                var elem = context.getElementById( match[3] );
  
                // Check parentNode to catch when Blackberry 4.6 returns
                // nodes that are no longer in the document #6963
                if ( elem && elem.parentNode ) {
                  // Handle the case where IE and Opera return items
                  // by name instead of ID
                  if ( elem.id === match[3] ) {
                    return makeArray( [ elem ], extra );
                  }
                  
                } else {
                  return makeArray( [], extra );
                }
              }
              
              try {
                return makeArray( context.querySelectorAll(query), extra );
              } catch(qsaError) {}
  
            // qSA works strangely on Element-rooted queries
            // We can work around this by specifying an extra ID on the root
            // and working up from there (Thanks to Andrew Dupont for the technique)
            // IE 8 doesn't work on object elements
            } else if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
              var oldContext = context,
                old = context.getAttribute( "id" ),
                nid = old || id,
                hasParent = context.parentNode,
                relativeHierarchySelector = /^\s*[+~]/.test( query );
  
              if ( !old ) {
                context.setAttribute( "id", nid );
              } else {
                nid = nid.replace( /'/g, "\\$&" );
              }
              if ( relativeHierarchySelector && hasParent ) {
                context = context.parentNode;
              }
  
              try {
                if ( !relativeHierarchySelector || hasParent ) {
                  return makeArray( context.querySelectorAll( "[id='" + nid + "'] " + query ), extra );
                }
  
              } catch(pseudoError) {
              } finally {
                if ( !old ) {
                  oldContext.removeAttribute( "id" );
                }
              }
            }
          }
        
          return oldSizzle(query, context, extra, seed);
        };
  
        for ( var prop in oldSizzle ) {
          Sizzle[ prop ] = oldSizzle[ prop ];
        }
  
        // release memory in IE
        div = null;
      })();
    }
  
    (function(){
      var html = document.documentElement,
        matches = html.matchesSelector || html.mozMatchesSelector || html.webkitMatchesSelector || html.msMatchesSelector;
  
      if ( matches ) {
        // Check to see if it's possible to do matchesSelector
        // on a disconnected node (IE 9 fails this)
        var disconnectedMatch = !matches.call( document.createElement( "div" ), "div" ),
          pseudoWorks = false;
  
        try {
          // This should fail with an exception
          // Gecko does not error, returns false instead
          matches.call( document.documentElement, "[test!='']:sizzle" );
      
        } catch( pseudoError ) {
          pseudoWorks = true;
        }
  
        Sizzle.matchesSelector = function( node, expr ) {
          // Make sure that attribute selectors are quoted
          expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");
  
          if ( !Sizzle.isXML( node ) ) {
            try { 
              if ( pseudoWorks || !Expr.match.PSEUDO.test( expr ) && !/!=/.test( expr ) ) {
                var ret = matches.call( node, expr );
  
                // IE 9's matchesSelector returns false on disconnected nodes
                if ( ret || !disconnectedMatch ||
                    // As well, disconnected nodes are said to be in a document
                    // fragment in IE 9, so check for that
                    node.document && node.document.nodeType !== 11 ) {
                  return ret;
                }
              }
            } catch(e) {}
          }
  
          return Sizzle(expr, null, null, [node]).length > 0;
        };
      }
    })();
  
    (function(){
      var div = document.createElement("div");
  
      div.innerHTML = "<div class='test e'></div><div class='test'></div>";
  
      // Opera can't find a second classname (in 9.6)
      // Also, make sure that getElementsByClassName actually exists
      if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
        return;
      }
  
      // Safari caches class attributes, doesn't catch changes (in 3.2)
      div.lastChild.className = "e";
  
      if ( div.getElementsByClassName("e").length === 1 ) {
        return;
      }
      
      Expr.order.splice(1, 0, "CLASS");
      Expr.find.CLASS = function( match, context, isXML ) {
        if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
          return context.getElementsByClassName(match[1]);
        }
      };
  
      // release memory in IE
      div = null;
    })();
  
    function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
      for ( var i = 0, l = checkSet.length; i < l; i++ ) {
        var elem = checkSet[i];
  
        if ( elem ) {
          var match = false;
  
          elem = elem[dir];
  
          while ( elem ) {
            if ( elem[ expando ] === doneName ) {
              match = checkSet[elem.sizset];
              break;
            }
  
            if ( elem.nodeType === 1 && !isXML ){
              elem[ expando ] = doneName;
              elem.sizset = i;
            }
  
            if ( elem.nodeName.toLowerCase() === cur ) {
              match = elem;
              break;
            }
  
            elem = elem[dir];
          }
  
          checkSet[i] = match;
        }
      }
    }
  
    function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
      for ( var i = 0, l = checkSet.length; i < l; i++ ) {
        var elem = checkSet[i];
  
        if ( elem ) {
          var match = false;
          
          elem = elem[dir];
  
          while ( elem ) {
            if ( elem[ expando ] === doneName ) {
              match = checkSet[elem.sizset];
              break;
            }
  
            if ( elem.nodeType === 1 ) {
              if ( !isXML ) {
                elem[ expando ] = doneName;
                elem.sizset = i;
              }
  
              if ( typeof cur !== "string" ) {
                if ( elem === cur ) {
                  match = true;
                  break;
                }
  
              } else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
                match = elem;
                break;
              }
            }
  
            elem = elem[dir];
          }
  
          checkSet[i] = match;
        }
      }
    }
  
    if ( document.documentElement.contains ) {
      Sizzle.contains = function( a, b ) {
        return a !== b && (a.contains ? a.contains(b) : true);
      };
  
    } else if ( document.documentElement.compareDocumentPosition ) {
      Sizzle.contains = function( a, b ) {
        return !!(a.compareDocumentPosition(b) & 16);
      };
  
    } else {
      Sizzle.contains = function() {
        return false;
      };
    }
  
    Sizzle.isXML = function( elem ) {
      // documentElement is verified for cases where it doesn't yet exist
      // (such as loading iframes in IE - #4833) 
      var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;
  
      return documentElement ? documentElement.nodeName !== "HTML" : false;
    };
  
    var posProcess = function( selector, context, seed ) {
      var match,
        tmpSet = [],
        later = "",
        root = context.nodeType ? [context] : context;
  
      // Position selectors must be done after the filter
      // And so must :not(positional) so we move all PSEUDOs to the end
      while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
        later += match[0];
        selector = selector.replace( Expr.match.PSEUDO, "" );
      }
  
      selector = Expr.relative[selector] ? selector + "*" : selector;
  
      for ( var i = 0, l = root.length; i < l; i++ ) {
        Sizzle( selector, root[i], tmpSet, seed );
      }
  
      return Sizzle.filter( later, tmpSet );
    };
  
    // EXPOSE
  
    // MYMOD - 14 Nov 2011
    //window.Sizzle = Sizzle;
  
    })();
  
  // MYMOD - 14 Nov 2011
  }
  
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
  
  // Underscore.string
  // (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
  // Underscore.strings is freely distributable under the terms of the MIT license.
  // Documentation: https://github.com/epeli/underscore.string
  // Some code is borrowed from MooTools and Alexandru Marasteanu.
  
  // Version 1.2.0
  
  // MYMOD - 14 Nov 2011
  var _s
  
  // MYMOD - 14 Nov 2011
  ;(function(){
    'use strict';
  
    // Defining helper functions.
  
    var nativeTrim = String.prototype.trim;
  
    var parseNumber = function(source) { return source * 1 || 0; };
  
    var strRepeat = function(i, m) {
      for (var o = []; m > 0; o[--m] = i) {}
      return o.join('');
    };
  
    var slice = function(a){
      return Array.prototype.slice.call(a);
    };
  
    var defaultToWhiteSpace = function(characters){
      if (characters) {
        return _s.escapeRegExp(characters);
      }
      return '\\s';
    };
  
    var sArgs = function(method){
      return function(){
        var args = slice(arguments);
        for(var i=0; i<args.length; i++)
          args[i] = args[i] == null ? '' : '' + args[i];
        return method.apply(null, args);
      };
    };
  
    // sprintf() for JavaScript 0.7-beta1
    // http://www.diveintojavascript.com/projects/javascript-sprintf
    //
    // Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
    // All rights reserved.
  
    var sprintf = (function() {
      function get_type(variable) {
        return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
      }
  
      var str_repeat = strRepeat;
  
      var str_format = function() {
        if (!str_format.cache.hasOwnProperty(arguments[0])) {
          str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
        }
        return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
      };
  
      str_format.format = function(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
        for (i = 0; i < tree_length; i++) {
          node_type = get_type(parse_tree[i]);
          if (node_type === 'string') {
            output.push(parse_tree[i]);
          }
          else if (node_type === 'array') {
            match = parse_tree[i]; // convenience purposes only
            if (match[2]) { // keyword argument
              arg = argv[cursor];
              for (k = 0; k < match[2].length; k++) {
                if (!arg.hasOwnProperty(match[2][k])) {
                  throw(sprintf('[_.sprintf] property "%s" does not exist', match[2][k]));
                }
                arg = arg[match[2][k]];
              }
            } else if (match[1]) { // positional argument (explicit)
              arg = argv[match[1]];
            }
            else { // positional argument (implicit)
              arg = argv[cursor++];
            }
  
            if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
              throw(sprintf('[_.sprintf] expecting number but found %s', get_type(arg)));
            }
            switch (match[8]) {
              case 'b': arg = arg.toString(2); break;
              case 'c': arg = String.fromCharCode(arg); break;
              case 'd': arg = parseInt(arg, 10); break;
              case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
              case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
              case 'o': arg = arg.toString(8); break;
              case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
              case 'u': arg = Math.abs(arg); break;
              case 'x': arg = arg.toString(16); break;
              case 'X': arg = arg.toString(16).toUpperCase(); break;
            }
            arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
            pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
            pad_length = match[6] - String(arg).length;
            pad = match[6] ? str_repeat(pad_character, pad_length) : '';
            output.push(match[5] ? arg + pad : pad + arg);
          }
        }
        return output.join('');
      };
  
      str_format.cache = {};
  
      str_format.parse = function(fmt) {
        var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
        while (_fmt) {
          if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
            parse_tree.push(match[0]);
          }
          else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
            parse_tree.push('%');
          }
          else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
            if (match[2]) {
              arg_names |= 1;
              var field_list = [], replacement_field = match[2], field_match = [];
              if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                field_list.push(field_match[1]);
                while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                  if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                    field_list.push(field_match[1]);
                  }
                  else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                    field_list.push(field_match[1]);
                  }
                  else {
                    throw('[_.sprintf] huh?');
                  }
                }
              }
              else {
                throw('[_.sprintf] huh?');
              }
              match[2] = field_list;
            }
            else {
              arg_names |= 2;
            }
            if (arg_names === 3) {
              throw('[_.sprintf] mixing positional and named placeholders is not (yet) supported');
            }
            parse_tree.push(match);
          }
          else {
            throw('[_.sprintf] huh?');
          }
          _fmt = _fmt.substring(match[0].length);
        }
        return parse_tree;
      };
  
      return str_format;
    })();
  
  
  
    // Defining underscore.string
  
    // MYMOD - 14 Nov 2011
    _s = {
  
      VERSION: '1.2.0',
  
      isBlank: sArgs(function(str){
        return (/^\s*$/).test(str);
      }),
  
      stripTags: sArgs(function(str){
        return str.replace(/<\/?[^>]+>/ig, '');
      }),
  
      capitalize : sArgs(function(str) {
        return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
      }),
  
      chop: sArgs(function(str, step){
        step = parseNumber(step) || str.length;
        var arr = [];
        for (var i = 0; i < str.length;) {
          arr.push(str.slice(i,i + step));
          i = i + step;
        }
        return arr;
      }),
  
      clean: sArgs(function(str){
        return _s.strip(str.replace(/\s+/g, ' '));
      }),
  
      count: sArgs(function(str, substr){
        var count = 0, index;
        for (var i=0; i < str.length;) {
          index = str.indexOf(substr, i);
          index >= 0 && count++;
          i = i + (index >= 0 ? index : 0) + substr.length;
        }
        return count;
      }),
  
      chars: sArgs(function(str) {
        return str.split('');
      }),
  
      escapeHTML: sArgs(function(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                              .replace(/"/g, '&quot;').replace(/'/g, "&apos;");
      }),
  
      unescapeHTML: sArgs(function(str) {
        return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                              .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
      }),
  
      escapeRegExp: sArgs(function(str){
        // From MooTools core 1.2.4
        return str.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
      }),
  
      insert: sArgs(function(str, i, substr){
        var arr = str.split('');
        arr.splice(parseNumber(i), 0, substr);
        return arr.join('');
      }),
  
      include: sArgs(function(str, needle){
        return str.indexOf(needle) !== -1;
      }),
  
      join: sArgs(function(sep) {
        var args = slice(arguments);
        return args.join(args.shift());
      }),
  
      lines: sArgs(function(str) {
        return str.split("\n");
      }),
  
      reverse: sArgs(function(str){
          return Array.prototype.reverse.apply(String(str).split('')).join('');
      }),
  
      splice: sArgs(function(str, i, howmany, substr){
        var arr = str.split('');
        arr.splice(parseNumber(i), parseNumber(howmany), substr);
        return arr.join('');
      }),
  
      startsWith: sArgs(function(str, starts){
        return str.length >= starts.length && str.substring(0, starts.length) === starts;
      }),
  
      endsWith: sArgs(function(str, ends){
        return str.length >= ends.length && str.substring(str.length - ends.length) === ends;
      }),
  
      succ: sArgs(function(str){
        var arr = str.split('');
        arr.splice(str.length-1, 1, String.fromCharCode(str.charCodeAt(str.length-1) + 1));
        return arr.join('');
      }),
  
      titleize: sArgs(function(str){
        var arr = str.split(' '),
            word;
        for (var i=0; i < arr.length; i++) {
          word = arr[i].split('');
          if(typeof word[0] !== 'undefined') word[0] = word[0].toUpperCase();
          i+1 === arr.length ? arr[i] = word.join('') : arr[i] = word.join('') + ' ';
        }
        return arr.join('');
      }),
  
      camelize: sArgs(function(str){
        return _s.trim(str).replace(/(\-|_|\s)+(.)?/g, function(match, separator, chr) {
          return chr ? chr.toUpperCase() : '';
        });
      }),
  
      underscored: function(str){
        return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/\-|\s+/g, '_').toLowerCase();
      },
  
      dasherize: function(str){
        return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1-$2').replace(/^([A-Z]+)/, '-$1').replace(/\_|\s+/g, '-').toLowerCase();
      },
  
      humanize: function(str){
        return _s.capitalize(this.underscored(str).replace(/_id$/,'').replace(/_/g, ' '));
      },
  
      trim: sArgs(function(str, characters){
        if (!characters && nativeTrim) {
          return nativeTrim.call(str);
        }
        characters = defaultToWhiteSpace(characters);
        return str.replace(new RegExp('\^[' + characters + ']+|[' + characters + ']+$', 'g'), '');
      }),
  
      ltrim: sArgs(function(str, characters){
        characters = defaultToWhiteSpace(characters);
        return str.replace(new RegExp('\^[' + characters + ']+', 'g'), '');
      }),
  
      rtrim: sArgs(function(str, characters){
        characters = defaultToWhiteSpace(characters);
        return str.replace(new RegExp('[' + characters + ']+$', 'g'), '');
      }),
  
      truncate: sArgs(function(str, length, truncateStr){
        truncateStr = truncateStr || '...';
        length = parseNumber(length);
        return str.length > length ? str.slice(0,length) + truncateStr : str;
      }),
  
      /**
       * _s.prune: a more elegant version of truncate
       * prune extra chars, never leaving a half-chopped word.
       * @author github.com/sergiokas
       */
      prune: sArgs(function(str, length, pruneStr){
        // Function to check word/digit chars including non-ASCII encodings. 
        var isWordChar = function(c) { return ((c.toUpperCase() != c.toLowerCase()) || /[-_\d]/.test(c)); }
        
        var template = '';
        var pruned = '';
        var i = 0;
        
        // Set default values
        pruneStr = pruneStr || '...';
        length = parseNumber(length);
        
        // Convert to an ASCII string to avoid problems with unicode chars.
        for (i in str) {
          template += (isWordChar(str[i]))?'A':' ';
        } 
  
        // Check if we're in the middle of a word
        if( template.substring(length-1, length+1).search(/^\w\w$/) === 0 )
          pruned = _s.rtrim(template.slice(0,length).replace(/([\W][\w]*)$/,''));
        else
          pruned = _s.rtrim(template.slice(0,length));
  
        pruned = pruned.replace(/\W+$/,'');
  
        return (pruned.length+pruneStr.length>str.length) ? str : str.substring(0, pruned.length)+pruneStr;
      }),
  
      words: function(str, delimiter) {
        return String(str).split(delimiter || " ");
      },
  
      pad: sArgs(function(str, length, padStr, type) {
        var padding = '',
            padlen  = 0;
  
        length = parseNumber(length);
  
        if (!padStr) { padStr = ' '; }
        else if (padStr.length > 1) { padStr = padStr.charAt(0); }
        switch(type) {
          case 'right':
            padlen = (length - str.length);
            padding = strRepeat(padStr, padlen);
            str = str+padding;
            break;
          case 'both':
            padlen = (length - str.length);
            padding = {
              'left' : strRepeat(padStr, Math.ceil(padlen/2)),
              'right': strRepeat(padStr, Math.floor(padlen/2))
            };
            str = padding.left+str+padding.right;
            break;
          default: // 'left'
            padlen = (length - str.length);
            padding = strRepeat(padStr, padlen);;
            str = padding+str;
          }
        return str;
      }),
  
      lpad: function(str, length, padStr) {
        return _s.pad(str, length, padStr);
      },
  
      rpad: function(str, length, padStr) {
        return _s.pad(str, length, padStr, 'right');
      },
  
      lrpad: function(str, length, padStr) {
        return _s.pad(str, length, padStr, 'both');
      },
  
      sprintf: sprintf,
  
      vsprintf: function(fmt, argv){
        argv.unshift(fmt);
        return sprintf.apply(null, argv);
      },
  
      toNumber: function(str, decimals) {
        var num = parseNumber(parseNumber(str).toFixed(parseNumber(decimals)));
        return (!(num === 0 && (str !== "0" && str !== 0))) ? num : Number.NaN;
      },
  
      strRight: sArgs(function(sourceStr, sep){
        var pos =  (!sep) ? -1 : sourceStr.indexOf(sep);
        return (pos != -1) ? sourceStr.slice(pos+sep.length, sourceStr.length) : sourceStr;
      }),
  
      strRightBack: sArgs(function(sourceStr, sep){
        var pos =  (!sep) ? -1 : sourceStr.lastIndexOf(sep);
        return (pos != -1) ? sourceStr.slice(pos+sep.length, sourceStr.length) : sourceStr;
      }),
  
      strLeft: sArgs(function(sourceStr, sep){
        var pos = (!sep) ? -1 : sourceStr.indexOf(sep);
        return (pos != -1) ? sourceStr.slice(0, pos) : sourceStr;
      }),
  
      strLeftBack: sArgs(function(sourceStr, sep){
        var pos = sourceStr.lastIndexOf(sep);
        return (pos != -1) ? sourceStr.slice(0, pos) : sourceStr;
      }),
  
      exports: function() {
        var result = {};
  
        for (var prop in this) {
          if (!this.hasOwnProperty(prop) || prop == 'include' || prop == 'contains' || prop == 'reverse') continue;
          result[prop] = this[prop];
        }
  
        return result;
      }
  
    };
  
    // Aliases
  
    _s.strip    = _s.trim;
    _s.lstrip   = _s.ltrim;
    _s.rstrip   = _s.rtrim;
    _s.center   = _s.lrpad;
    _s.ljust    = _s.lpad;
    _s.rjust    = _s.rpad;
    _s.contains = _s.include;
  
    // MYMOD - 14 Nov 2011
    // CommonJS module is defined
    //if (typeof exports !== 'undefined') {
    //  if (typeof module !== 'undefined' && module.exports) {
    //    // Export module
    //    module.exports = _s;
    //  }
    //  exports._s = _s;
    //
    // Integrate with Underscore.js
    //} else if (typeof root._ !== 'undefined') {
    //  // root._.mixin(_s);
    //  root._.string = _s;
    //  root._.str = root._.string;
    //
    // Or define it
    //} else {
    //  root._ = {
    //    string: _s,
    //    str: _s
    //  };
    //}
  
  // MYMOD - 14 Nov 2011
  })();
  
  _.string = _s
  _.str = _s
  
  var $$, $B, Behavior, BinaryHeap, CATCH_E, ChangesE, ConcatE, EventStream, EventStream_api, FINALLY_E, HEAP_E, HeapStore, InternalE, Jolt, MappedE, PriorityQueue, Pulse, Pulse_cat, Pulse_catch_and_trace, Reactor, beforeNextPulse, beforeQ, changesE, cleanupQ, cleanupWeakReference, concatE, defaultCatchE, defaultFinallyE, defaultHeapE, defer, defer_high, delay, doNotPropagate, exporter, extractB, genericAttachListener, genericRemoveListener, genericRemoveWeakReference, internalE, isB, isE, isNodeJS, isP, isPropagating, lastRank, lastStamp, mapE, nextRank, nextStamp, propagateHigh, say, scheduleBefore, scheduleCleanup, sendCall, sendEvent, setPropagating, valueNow;
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
  
  Jolt.$$ = $$ = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (!($$.okay != null)) {
      if (typeof Sizzle !== "undefined" && Sizzle !== null) {
        $$.okay = 1;
      } else {
        $$.okay = -1;
      }
    }
    if ($$.okay === -1) {
      throw 'Jolt.$$: Sizzle is undefined, because the document object was undefined when Jolt was loaded';
    }
    return Sizzle.apply(null, args);
  };
  
  Jolt.say = say = function(message, isError, color) {
    var c, colors, fn, _i, _len;
    if (color == null) color = 'white';
    if (!(say.okay != null)) {
      if (!((typeof console !== "undefined" && console !== null) || ((typeof window !== "undefined" && window !== null ? window.console : void 0) != null))) {
        say.okay = -1;
        throw 'console.log method is not available';
      }
      if (typeof console === "undefined" || console === null) {
        console = typeof window !== "undefined" && window !== null ? window.console : void 0;
      }
      say.console = console;
      say.error = console.error != null;
      if (!(console.log != null)) {
        say.okay = -1;
        throw 'console.log method is not available';
      } else {
        say.okay = 1;
        if (isNodeJS) {
          say.clc = require('cli-color');
        } else {
          say.clc = {};
          colors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'];
          fn = function(text) {
            return text;
          };
          for (_i = 0, _len = colors.length; _i < _len; _i++) {
            c = colors[_i];
            say.clc[c] = fn;
            say.clc[c].bold = fn;
          }
        }
      }
    }
    if (say.okay === -1) throw 'console.log method is not available';
    if (isError && (say.error != null)) {
      say.console.error(say.clc['red'].bold(message));
      return;
    }
    return say.console.log(say.clc[color](message));
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
  
  nextStamp = function() {
    return ++lastStamp;
  };
  
  Jolt.isPropagating = isPropagating = false;
  
  Jolt.setPropagating = setPropagating = function(bool) {
    return isPropagating = Boolean(bool);
  };
  
  Jolt.doNotPropagate = doNotPropagate = {};
  
  Jolt.propagateHigh = propagateHigh = {};
  
  sendCall = {
    name: (function() {
      return 'Jolt.sendEvent';
    }),
    removeWeakReference: function() {}
  };
  
  if (isNodeJS) {
    Jolt.defer_high = defer_high = function() {
      var args, func;
      func = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return process.nextTick(function() {
        return func.apply(null, args);
      });
    };
    Jolt.delay = delay = function() {
      var args, func, ms;
      func = arguments[0], ms = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      return setTimeout((function() {
        return func.apply(null, args);
      }), ms);
    };
  } else {
    Jolt.defer_high = defer_high = function() {
      var args, func;
      func = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return defer.apply(null, [func].concat(__slice.call(args)));
    };
    Jolt.delay = delay = function() {
      var args, func, ms;
      func = arguments[0], ms = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      return window.setTimeout((function() {
        return func.apply(null, args);
      }), ms);
    };
  }
  
  Jolt.defer = defer = function() {
    var args, func;
    func = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return delay.apply(null, [func, 0].concat(__slice.call(args)));
  };
  
  Jolt.cleanupQ = cleanupQ = cleanupWeakReference = [];
  
  cleanupQ.draining = false;
  
  cleanupQ.freq = 100;
  
  cleanupQ.drain = function() {
    if (cleanupQ.length) {
      (cleanupQ.shift())();
      return delay(cleanupQ.drain, cleanupQ.freq);
    } else {
      return cleanupQ.draining = false;
    }
  };
  
  Jolt.scheduleCleanup = scheduleCleanup = function(cleanupQ, sender, weakReference) {
    if (!cleanupQ) cleanupQ = cleanupWeakReference;
    if (!weakReference.cleanupScheduled) {
      weakReference.cleanupScheduled = true;
      cleanupQ.push(function() {
        return sender.removeWeakReference(weakReference);
      });
      if (!cleanupQ.draining) {
        cleanupQ.draining = true;
        return delay(cleanupQ.drain, cleanupQ.freq);
      }
    }
  };
  
  Jolt.beforeQ = beforeQ = beforeNextPulse = [];
  
  beforeQ.draining = false;
  
  beforeQ.freq = 10;
  
  beforeQ.drain = function() {
    if (beforeQ.length) {
      (beforeQ.shift())();
      return delay(beforeQ.drain, beforeQ.freq);
    } else {
      return beforeQ.draining = false;
    }
  };
  
  Jolt.scheduleBefore = scheduleBefore = function() {
    var args, beforeQ, func;
    beforeQ = arguments[0], func = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (!beforeQ) beforeQ = beforeNextPulse;
    beforeQ.push(function() {
      return func.apply(null, args);
    });
    if (!beforeQ.draining) {
      beforeQ.draining = true;
      return delay(beforeQ.drain, beforeQ.freq);
    }
  };
  
  HeapStore = (function() {
  
    function HeapStore(stamp) {
      this.stamp = stamp;
      this.nodes = [];
    }
  
    return HeapStore;
  
  })();
  
  Jolt.isP = isP = function(pulse) {
    return pulse instanceof Pulse;
  };
  
  Jolt.Pulse = Pulse = (function() {
  
    function Pulse(arity, junction, sender, stamp, value, heap) {
      this.arity = arity;
      this.junction = junction;
      this.sender = sender;
      this.stamp = stamp;
      this.value = value;
      this.heap = heap != null ? heap : new HeapStore(this.stamp);
    }
  
    Pulse.prototype.propagate = function() {
      var P, high, more, nextPulse, pulse, queue, qv, receiver, sender, weaklyHeld, _ref;
      pulse = arguments[0], sender = arguments[1], receiver = arguments[2], high = arguments[3], more = 5 <= arguments.length ? __slice.call(arguments, 4) : [];
      if (!receiver.weaklyHeld) {
        if (beforeQ.length && !high) {
          while (beforeQ.length) {
            (beforeQ.shift())();
          }
        }
        setPropagating(true);
        queue = new PriorityQueue;
        queue.push({
          estream: receiver,
          pulse: pulse,
          rank: receiver.rank
        });
        while (queue.size()) {
          qv = queue.pop();
          P = new (qv.estream.PulseClass())(qv.pulse.arity, qv.pulse.junction, qv.pulse.sender, qv.pulse.stamp, qv.pulse.value.slice(0), qv.pulse.heap);
          P.heap.nodes.push(qv.estream);
          nextPulse = (_ref = qv.estream.PulseClass().prototype).PROPAGATE.apply(_ref, [P, P.sender, qv.estream, high].concat(__slice.call(more)));
          weaklyHeld = true;
          if (nextPulse !== doNotPropagate) {
            nextPulse.sender = qv.estream;
            _(qv.estream.sendTo).map(function(receiver) {
              weaklyHeld = weaklyHeld && receiver.weaklyHeld;
              if (receiver.weaklyHeld) {
                return scheduleCleanup(cleanupQ, qv.estream, receiver);
              } else {
                return queue.push({
                  estream: receiver,
                  pulse: nextPulse,
                  rank: receiver.rank
                });
              }
            });
            if (qv.estream.sendTo.length && weaklyHeld) {
              qv.estream.weaklyHeld = true;
              scheduleCleanup(cleanupQ, qv.pulse.sender, qv.estream);
            }
          }
        }
        setPropagating(false);
        return P.heap;
      } else {
        scheduleCleanup(cleanupQ, sender, receiver);
        return pulse.heap;
      }
    };
  
    Pulse.prototype.PROPAGATE = function() {
      var PULSE, high, more, pulse, receiver, sender;
      pulse = arguments[0], sender = arguments[1], receiver = arguments[2], high = arguments[3], more = 5 <= arguments.length ? __slice.call(arguments, 4) : [];
      PULSE = receiver.UPDATER(pulse);
      if (PULSE !== doNotPropagate && !(isP(PULSE))) {
        setPropagating(false);
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
  
  genericAttachListener = function(sender, receiver) {
    var cur, doNextRank, estream, i, q, sentinel, _i, _len, _results;
    if (!isPropagating) {
      if (sender.rank === receiver.rank) {
        throw '<' + sender.ClassName + '>.attachListener: cycle detected in propagation graph';
      }
      i = _.indexOf(sender.sendTo, receiver);
      if (!(i + 1)) {
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
              throw '<' + sender.ClassName + '>.attachListener: cycle detected in propagation graph';
            }
            doNextRank.push(cur);
            cur.__cycleSentinel__ = sentinel;
            q.push.apply(q, cur.sendTo);
          }
          _results = [];
          for (_i = 0, _len = doNextRank.length; _i < _len; _i++) {
            estream = doNextRank[_i];
            _results.push(estream.rank = nextRank());
          }
          return _results;
        }
      }
    } else {
      return scheduleBefore(beforeQ, genericAttachListener, sender, receiver);
    }
  };
  
  genericRemoveListener = function(sender, receiver) {
    var i;
    if (!isPropagating) {
      i = _.indexOf(sender.sendTo, receiver);
      if (i + 1) return sender.sendTo.splice(i, 1);
    } else {
      return scheduleBefore(beforeQ, genericRemoveListener, sender, receiver);
    }
  };
  
  genericRemoveWeakReference = function(sender, weakReference) {
    var i;
    weakReference.cleanupScheduled = false;
    if (!weakReference.cleanupCanceled) {
      if (!isPropagating) {
        i = _.indexOf(sender.sendTo, weakReference);
        if (i + 1) sender.sendTo.splice(i, 1);
        if (!sender.sendTo.length) return sender.weaklyHeld = true;
      } else {
        return scheduleCleanup(cleanupQ, sender, weakReference);
      }
    } else {
      return weakReference.cleanupCanceled = null;
    }
  };
  
  Jolt.EventStream = EventStream = (function() {
  
    function EventStream() {
      var recvFrom;
      var _this = this;
      recvFrom = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this.rank = nextRank();
      this.absRank = this.rank;
      this.sendTo = [];
      if (recvFrom.length) {
        _(_.flatten(__slice.call(recvFrom))).map(function(estream) {
          return estream.attachListener(_this);
        });
      }
    }
  
    EventStream.prototype.attachListener = function(receiver) {
      if (!isE(receiver)) {
        throw '<' + this.ClassName + '>.attachListener: expected an EventStream';
      }
      genericAttachListener(this, receiver);
      return this;
    };
  
    EventStream.prototype.removeListener = function(receiver) {
      if (!isE(receiver)) {
        throw '<' + this.ClassName + '>.removeListener: expected an EventStream';
      }
      genericRemoveListener(this, receiver);
      return this;
    };
  
    EventStream.prototype.removeWeakReference = function(weakReference) {
      if (!isE(weakReference)) {
        throw '<' + this.ClassName + '>.removeWeakReference: expected an EventStream';
      }
      genericRemoveWeakReference(this, weakReference);
      return this;
    };
  
    EventStream.prototype.ClassName = 'EventStream';
  
    EventStream.prototype.cleanupCanceled = null;
  
    EventStream.prototype.cleanupScheduled = false;
  
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
  
    EventStream.prototype.seq_junc_helper = function(pulse) {
      var ret, thisClass;
      thisClass = this;
      ret = [];
      _(pulse.value).each(function(jp) {
        if (jp.junction) {
          return ret = ret.concat(thisClass.seq_junc_helper(jp));
        } else {
          return ret = ret.concat(jp.value);
        }
      });
      return ret;
    };
  
    EventStream.prototype.vec_junc_helper = function(pulse) {
      var ret, thisClass;
      thisClass = this;
      ret = [];
      _(pulse.value).each(function(jp) {
        if (jp.junction) {
          return ret = ret.concat(thisClass.vec_junc_helper(jp));
        } else {
          return ret.push(jp.value);
        }
      });
      return ret;
    };
  
    EventStream.prototype.zip_junc_helper = function(pulse) {
      return _.zip.apply(_, this.vec_junc_helper(pulse));
    };
  
    EventStream.prototype.tranRCV = function(pulse) {
      switch (this.mode()) {
        case 'sequenced':
          if (pulse.junction) {
            pulse.value = this.seq_junc_helper(pulse);
          } else {
            return pulse;
          }
          break;
        case 'vectored':
          if (pulse.junction) {
            pulse.value = this.vec_junc_helper(pulse);
          } else {
            pulse.value = [pulse.value];
            pulse.arity = 1;
            return pulse;
          }
          break;
        case 'zipped':
          if (pulse.junction) {
            pulse.value = this.zip_junc_helper(pulse);
          } else {
            pulse.value = _(pulse.value).zip();
            return pulse;
          }
          break;
        case null:
          if (pulse.junction && this.no_null_junc) {
            throw '<' + this.ClassName + '>.transRCV: does not support null mode for pulse junctions';
          } else {
            return pulse;
          }
          break;
        default:
          throw '<' + this.ClassName + '>.transRCV: bad mode value ' + (JSON.stringify(this.mode()));
      }
      pulse.arity = pulse.value.length;
      pulse.junction = false;
      return pulse;
    };
  
    EventStream.prototype.tranOUT = function(pulse) {
      var ret;
      if ((pulse !== doNotPropagate) && this.isNary()) {
        ret = [];
        _(pulse.value).each(function(val) {
          return ret = ret.concat(val);
        });
        pulse.value = ret;
      }
      return pulse;
    };
  
    EventStream.prototype.tranVAL = function(pulse) {
      var ret, thisClass;
      switch (this.mode()) {
        case null:
        case 'sequenced':
          ret = this.updater.apply(this, pulse.value);
          if (ret === doNotPropagate) {
            pulse = ret;
          } else {
            pulse.value = ret;
          }
          break;
        case 'vectored':
        case 'zipped':
          thisClass = this;
          ret = [];
          _(pulse.value).each(function(value) {
            var iret;
            iret = thisClass.updater.apply(thisClass, value);
            if (iret !== doNotPropagate) return ret.push(iret);
          });
          if (ret.length === 0) {
            pulse = doNotPropagate;
          } else {
            pulse.value = ret;
          }
          break;
        default:
          throw '<' + this.ClassName + '>.UPDATER: bad mode value ' + (JSON.stringify(this.mode()));
      }
      return pulse;
    };
  
    EventStream.prototype.updater = function() {
      var value;
      value = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return value;
    };
  
    EventStream.prototype.UPDATER = function(pulse) {
      return this.tranOUT(this.tranVAL(this.tranRCV(pulse)));
    };
  
    EventStream.prototype.weaklyHeld = false;
  
    return EventStream;
  
  })();
  
  Jolt.sendEvent = sendEvent = function() {
    var P, estream, high, high_maybe, length, pClass, vals;
    estream = arguments[0], vals = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    high = false;
    high_maybe = vals[vals.length - 1];
    if (high_maybe === propagateHigh) {
      high = true;
      vals.pop();
    }
    pClass = estream.PulseClass();
    length = vals.length;
    P = new pClass(length, false, sendCall, nextStamp(), vals);
    pClass.prototype.propagate(P, P.sender, estream, high);
    return;
  };
  
  Jolt.EventStream_api = EventStream_api = (function() {
  
    __extends(EventStream_api, EventStream);
  
    function EventStream_api() {
      EventStream_api.__super__.constructor.apply(this, arguments);
    }
  
    return EventStream_api;
  
  })();
  
  Jolt.InternalE = InternalE = (function() {
  
    __extends(InternalE, EventStream_api);
  
    function InternalE() {
      InternalE.__super__.constructor.apply(this, arguments);
    }
  
    InternalE.prototype.ClassName = 'InternalE';
  
    InternalE.factory = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(this, args, function() {});
    };
  
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
  
  Jolt.ConcatE = ConcatE = (function() {
  
    __extends(ConcatE, EventStream_api);
  
    function ConcatE() {
      ConcatE.__super__.constructor.apply(this, arguments);
    }
  
    ConcatE.prototype.ClassName = 'ConcatE';
  
    ConcatE.factory = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(this, args, function() {});
    };
  
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
  
    Pulse_catch_and_trace.prototype.propagate = function(pulse, sender, receiver, high, isHeap, isCatch, isFinally) {
      var HEAP, caught, heapP, stamp, timeEnd, timeStart, traceTime;
      HEAP = pulse.heap;
      traceTime = 123;
      if ((!isHeap) && (!isCatch) && (!isFinally)) {
        timeStart = new Date;
        stamp = pulse.stamp;
        heapP = new Pulse_cat(2, false, sender, stamp, ['start', timeStart], new HeapStore(stamp));
        this.constructor.prototype.propagate(heapP, heapP.sender, HEAP_E, true, true, false, false);
        setPropagating(true);
      } else {
        'do';
      }
      caught = null;
      try {
        HEAP = Pulse_catch_and_trace.__super__.propagate.call(this, pulse, sender, receiver, high, isHeap, isCatch, isFinally);
      } catch (error) {
        caught = error;
      } finally {
        if ((!isHeap) && (!isCatch) && (!isFinally)) {
          timeEnd = new Date;
          heapP = new Pulse_cat(5, false, sender, stamp, ['end', timeEnd, timeEnd - timeStart, traceTime, HEAP], new HeapStore(stamp));
          this.constructor.prototype.propagate(heapP, heapP.sender, HEAP_E, true, true, false, false);
        } else {
          'do';
        }
        if (caught) throw caught;
      }
      return HEAP;
    };
  
    Pulse_catch_and_trace.prototype.PROPAGATE = function(pulse, sender, receiver, high, isHeap, isCatch, isFinally) {
      var PULSE, caught, doSub, errP, finP, fn, fnames, prePulse, stamp, subs, timeNow, times, _i, _j, _k, _len, _len2, _len3;
      caught = false;
      PULSE = null;
      timeNow = new Date;
      fnames = ['tranRCV', 'tranVAL', 'tranOUT'];
      times = {};
      try {
        prePulse = {
          arity: pulse.arity,
          junction: pulse.junction,
          stamp: pulse.stamp,
          value: pulse.value.slice(0)
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
        PULSE = receiver.UPDATER(pulse);
        if (PULSE !== doNotPropagate && !(isP(PULSE))) {
          PULSE = null;
          throw 'receiver\'s UPDATER did not return a pulse object';
        }
      } catch (error) {
        if ((!isHeap) && (!isCatch) && (!isFinally)) {
          caught = true;
          stamp = pulse.stamp;
          errP = new Pulse_cat(5, false, receiver, stamp, [error, prePulse, sender, receiver, timeNow], new HeapStore(stamp));
          this.constructor.prototype.propagate(errP, errP.sender, CATCH_E, true, false, true, false);
          setPropagating(true);
        } else {
          setPropagating(false);
          throw error;
        }
      } finally {
        for (_k = 0, _len3 = fnames.length; _k < _len3; _k++) {
          fn = fnames[_k];
          receiver[fn] = subs[fn];
        }
        if ((!isHeap) && (!isCatch) && (!isFinally) && (!caught)) {
          stamp = pulse.stamp;
          finP = new Pulse_cat(4, false, receiver, stamp, [prePulse, PULSE, sender, receiver, timeNow, times], new HeapStore(stamp));
          this.constructor.prototype.propagate(finP, finP.sender, FINALLY_E, true, false, false, true);
          setPropagating(true);
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
        break;
      case 'end':
        message = "----HEAP-END-----\n" + timeNow + "\nepoch:   " + (timeNow.valueOf()) + "\n  (time in ms)\nelapsed:  " + timeElapsed + "\ntrace:    " + 0 + "\nest. net: " + 0 + "\nheap: " + (JSON.stringify(HEAP));
    }
    return say(message);
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
    return say(message, true);
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
    message = "------TRACE------\nsender:    " + sName + "  " + sClass + "\n  rank:    " + (sender.rank || 'n/a') + "\n  absRank: " + (sender.absRank || 'n/a') + "\nreceiver:  " + rName + "  " + rClass + "\n  mode:    " + (receiver.mode()) + "\n  nary:    " + (receiver.isNary()) + "\n  rank:    " + receiver.rank + "\n  absRank: " + receiver.absRank + "\n----RCV-PULSE----\narity:     " + prePulse.arity + "\njunction:  " + prePulse.junction + "\nstamp:     " + prePulse.stamp + "\nvalue:     " + (JSON.stringify(prePulse.value)) + "\n----OUT-PULSE----\narity:     " + PULSE.arity + "\njunction:  " + PULSE.junction + "\nstamp:     " + PULSE.stamp + "\nvalue:     " + (JSON.stringify(PULSE.value)) + "\n-----PROFILE-----\n  (time in ms)\ntranRCV: " + times.tranRCV + "\ntranVAL: " + times.tranVAL + "\ntranOUT: " + times.tranOUT;
    return say(message);
  }).name('Jolt.defaultFinallyE').PulseClass(Pulse_cat);
  
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
      var value;
      Behavior.__super__.UPDATER.apply(this, arguments);
      value = pulse.value;
      this.last = {
        arity: value.length,
        value: value
      };
      return pulse;
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
  
  Jolt._ = _;
  
  Jolt._s = _s;
  
  Jolt.EventEmitter2 = EventEmitter;
  
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
