/*  Jay JavaScript Framework for Games
 *  (c) 2008-3008 Enrique Garcia Cota
 *
 *  Jay is freely distributable under the terms of an MIT-style license.
 *
 *--------------------------------------------------------------------------*/

 var Jay = {
  Version: '0.2',
  emptyFunction: function() {},
  random: function (upper, lower) {
    lower = lower || 0;
    var rIncrement = Math.round( Math.random() * (upper - lower) );
    return parseInt(lower + rIncrement,10);
  },
  // adapted from http://www.prototypejs.org/api/element/absolutize
  absolutize: function(node) {
  
    var getOffsetParent = function(node) {
      if (node === document.body) { return node; }

      while ((node = node.parentNode) && node !== document.body) {
        if (node.style.position !== 'static') { return node; }
      }
      return document.body;
    };
  
    var positionedOffset = function(node) {
      var currTop = 0, currLeft = 0;
      do {
        currTop += node.offsetTop  || 0;
        currLeft += node.offsetLeft || 0;
        node = getOffsetParent(node);
        if (node) {
          if (node.tagName === 'BODY' || node.style.position === 'relative' || node.style.position === 'absolute') { break; }
        }
      } while (node);
      return { left:currLeft, top:currTop };
    };
  
    var offsets = positionedOffset(node);
    var width = node.clientWidth;
    var height = node.clientHeight;
    node.style.position = 'absolute';
    node.style.top    = offsets.top + 'px';
    node.style.left   = offsets.left + 'px';
    node.style.width  = width + 'px';
    node.style.height = height + 'px';
    return node;
  },
  // based in from http://ejohn.org/projects/flexible-javascript-events/
  addEvent: function(obj, type, fn) {
    if(obj.attachEvent) {
      obj['e'+type+fn] = fn;
      obj[type+fn] = function(){obj['e'+type+fn]( window.event );};
      obj.attachEvent( 'on'+type, obj[type+fn] );
    } else {
      obj.addEventListener(type, fn, false);
    }
  },
  // based in http://ejohn.org/projects/flexible-javascript-events/
  removeEvent: function(obj, type, fn) {
    if(obj.detachEvent) {
      obj.detachEvent('on'+type, obj[type+fn]);
      obj[type+fn] = null;
    } else {
      obj.removeEventListener( type, fn, false );
    }
  },
  // copies each property of "origin" in destination
  // example: destination = {x:a}, origin {y:b, z:c}
  // apply (destination, origin) makes destination {x:a, y:b, z:c}
  apply: function(destination, origin, ownPropertiesOnly) {
    if(ownPropertiesOnly === undefined) { ownPropertiesOnly =true; }
    for (var prop in origin) {
      if(!ownPropertiesOnly || origin.hasOwnProperty(prop)) {
        destination[prop] = origin[prop];
      }
    }
  },
  // copies each property of "origin" in destination, in an inverse way
  // example: destination = {x:a}, origin {y:b, z:c}
  // apply (destination, origin) makes destination {x:a, b:y, c:z}
  // note that in this example b:y and c:z are inversed in destination
  applyInverse: function (destination, origin, ownPropertiesOnly) {
    if(ownPropertiesOnly === undefined) { ownPropertiesOnly =true; }
    for (var prop in origin) {
      if(!ownPropertiesOnly || origin.hasOwnProperty(prop)) {
        destination[origin[prop]] = prop;
      }
    }
  }
};
 
// taken from http://ejohn.org/blog/simple-javascript-inheritance/
// with slight modifications (like changing prototype by _prototype)
(function() { 
  var initializing = false;
  var fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The _super Class implementation (does nothing)
  this.Class = function(){};
 
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a _super class (but only create the instance,
    // don't run the init init)
    initializing = true;
    var _prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      _prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class init
    function Class() {
      // All construction is actually done in the init method
      if (!initializing && this.init) {
        this.init.apply(this, arguments);
      }
    }
   
    // Populate our constructed prototype object
    Class.prototype = _prototype;
   
    // Enforce the init to be what we expect
    Class.init = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };
})();



Jay.StatefulClass = Class.extend ({
  init: function (object, states) {
    this. _super(object);
    this._states = states;
    this.goToState(states.init);
    var father = this.prototype;
    var name;
    if(father._states){
      for (name in father._states) {
        if(!this._states[name]) {
          this._states[name] = father._states[name];
        }
      }
    }
    for (name in this._states) {
      if(this._states.hasOwnProperty(name)) {
        this._states[name] = father._states[name];
        this._states[name]._stateName= name;
      }
    }
  },
  goToState: function (stateName) {
    if (this._getCurrentState().onExit) { this._getCurrentState().onExit(); }
    this._statePile=[this._states[stateName]];
    this._overrideFunctionsWithState();
    if (this._getCurrentState().onEnter) { this._getCurrentState().onEnter(); }
  },
  pushState: function (stateName) {
    if (this._getCurrentState().onExit) { this._getCurrentState().onExit(); }
    this._statePile.push(this._states[stateName]);
    this._overrideFunctionsWithState();
    if (this._getCurrentState().onEnter) { this._getCurrentState().onEnter(); }
  },
  popState: function () {
    if (this._getCurrentState().onExit) { this._getCurrentState().onExit(); }
    this._statePile.pop();
    this._overrideFunctionsWithState();
    if (this._getCurrentState().onEnter) { this._getCurrentState().onEnter(); }
  },
  getCurrentStateName: function () {
    return this._getCurrentState()._stateName;
  },
  isInState: function (stateName) {
    return this._getCurrentState()._stateName === stateName;
  },
  _getCurrentState: function () {
    if (this._statePile)
      { return this._statePile[this._statePile.length - 1]; }
    return null;
  },
  // this function allows to do object.animate instead of object._getCurrentState().animate
  _overrideFunctionsWithState: function() {
    // undo previous overrides (replaces with the saved _functionOverrides
    Jay.apply(this, this._functionOverrides);
    
    // perform the actual overrides; each function on the state replaces (temporarily) the 
    // object's default function
    // fixme -- this doesn't include "_super" support
    this._functionOverrides = {};

    // make a "copy" of the overrides in this._functionOverrides, so we can "undo" them when we exit from the state
    for (var name in this._getCurrentState) {
      if(this._getCurrentState.hasOwnProperty(name)) {
        this._functionOverrides[name] = this[name];
      }
    }
    
    // copy all methods from the state to the object, so they can be used like this:
    //   this.method(...)
    // instead of like this:
    //   this._getCurrentState.method(...)
    Jay.apply(this, this._getCurrentState);
  }
});

Jay.Screen = Class.extend({
  init: function(game, options) {

    options = options || {};
    
    this.game = game;
    this.node = game.node;
    
    // top, left, height, width:
    // 1. See if parameters have been passed (options)
    // 2. See if the node passed on the options has top, left, height, width
    this.setTop   (options.top    || parseInt(this.node.style.top, 10)   || 10);
    this.setLeft  (options.left   || parseInt(this.node.style.left, 10)  || 10);
    this.setHeight(options.height || parseInt(this.node.style.height, 10)|| 400);
    this.setWidth (options.width  || parseInt(this.node.style.width, 10) || 640);
    this.setBorderStyle( options.borderStyle || this.node.style.border || "1px solid #999999");
    this.setBackgroundStyle (options.backgroundStyle || this.node.style.background || "#FFFFFF");
  },
  setTop: function (top) {
    this.top = top;
    this.node.style.top= this.top+"px";
  },
  setLeft: function(left) {
    this.left = left;
    this.node.style.left=this.left+"px";
  },
  setWidth: function(width) {
    this.width = width;
    this.node.style.width=this.width+"px";
  },
  setHeight: function(height) {
    this.height = height;
    this.node.style.height=this.height+"px";
  },
  setBorderStyle: function(style) {
    this.node.style.border = style;
  },
  setBackgroundStyle: function(style) {
    this.node.style.background = style;
  }
  
});

Jay.Sprite = Class.extend({

    init: function(game, node, options) {
      this.game = game;
      this.node = node;

      this.defaultFrameWidth = options.defaultFrameWidth || 0;
      this.defaultFrameHeight = options.defaultFrameHeight || 0;
      this.width = options.width || 0;
      this.height = options.height || 0;
      this.animations = options.animations || {};
      
      this.x = 0;
      this.y = 0; 
      
      this.frameCoords = {};
      this.setFrame(0, 0);
    },
    setX: function(x) {
        this.x = x;
        this._updateImageCoords();
    },
    setY: function(y) {
        this.y = y;
        this._updateImageCoords();
    },
    setXY: function(x, y) {
        this.x = x;
        this.y = y;
        this._updateImageCoords();
    },
    setFrameWithOptions: function(options) {
      options = options || {};
      this.setFrame ( options.x || 0, // x
                      options.y || 0, // y
                      options.width || this.defaultFrameWidth, // width
                      options.height || this.defaultFrameHeight ); // height    
    },
    setFrame: function(x, y, width, height) {
      this.frameCoords.left = x || 0;
      this.frameCoords.top = y || 0;
      this.frameCoords.right = x+(width || this.defaultFrameWidth);
      this.frameCoords.bottom = y+(height || this.defaultFrameHeight);
      this._frameClip();
    },
    setAnimation: function (animation) {
      if(!animation) { throw "Sprite.SetAnimation: parameter is undefined or null"; }
    
      this.currAnimation = animation;

      if(!this.currAnimationKeyIndex || this.currAnimationKeyIndex >= this.currAnimation.length) {
        this.currAnimationKeyIndex = 0;
      }
      var animKey = this.currAnimation[this.currAnimationKeyIndex];
      this.setFrameWithOptions(animKey);
      this._calculateAnimFrameCount();
      this.animationFrameTick = 0;
    },
    animate: function() {
      this.animFrameCounter = (this.animFrameCounter || 0) + 1; 
      
      if(this.animFrameCounter >= this.animFrameCount) {
    
        this.animFrameCounter = 0;
    
        this.currAnimationKeyIndex += 1;
        if(this.currAnimationKeyIndex >= this.currAnimation.length) {
          this.currAnimationKeyIndex = 0;
        }
      
        this._calculateAnimFrameCount();
      }
      var animKey = this.currAnimation[this.currAnimationKeyIndex];
      this.setFrameWithOptions(animKey);
    },
    // does funny stuff with the clip style so sprites can contain several frames.
    // FIXME clipping with the screen
    _frameClip: function() {

        this.node.style.clip = 'rect(' + this.frameCoords.top + 'px ' + 
                                      this.frameCoords.right + 'px ' +
                      this.frameCoords.bottom + 'px ' +
                      this.frameCoords.left + 'px)';
        this._updateImageCoords();
    },
    // updates the sprite display taking into account the screen definition, frame and 
    // FIXME clipping with the screen
    _updateImageCoords: function() {

        this.node.style.left = (this.game.screen.left + this.x - this.frameCoords.left) + "px";
        this.node.style.top = (this.game.screen.top + this.y - this.frameCoords.top) + "px";
    },
    _calculateAnimFrameCount: function() {
      this.animFrameCount = this.currAnimation[this.currAnimationKeyIndex].count || 1;
    }
});

Jay.Loader = Class.extend({
  init: function(game, url, options) {
    this.game = game;
  
    options = options || {};

    this.url = options.url || "[no-url]";
    this.loadCallback    = options.loadCallback    || Jay.emptyFunction ;
    this.errorCallback   = options.errorCallback   || function (self) { throw "Resource::init error: There was an error while trying to load [" + self.url + "]"; }
    this.abortCallback   = options.abortCallback   || function (self) { throw "Resource::Load aborted for [" + self.url + "]"; }
    this.timeout         = options.timeout         || 20000; // 20 seconds
    this.timeoutCallback = options.timeoutCallback || function (self) { throw "Resource::Load timeout: The timing (" + self.timeout + ") was exceeded while loading [" + self.url + "]"; }

    // status variables
    this.loaded = false;
    this.error = false;
    this.abort = false;
    this.timedOut = false;
  },
  onLoad: function () {    
    if(!this.loaded) {
      this.loaded = true;
      this.loadCallback(this);
    }
  },
  onError: function() {
    this.error = true;
    this.errorCallback(this)
  },
  onAbort: function() {
    this.abort = true;
    this.abortCallback(this);
  },
  onTimeOut: function() {
    if(!this.loaded && !this.error && !this.abort) {
      this.timedOut = true;
      this.timeoutCallback(this);
    }
  }
 });

Jay.SpriteLoaderAndFactory = Jay.Loader.extend({
  init: function(game, url, options)  {

    this._super(game, url, options);
    
    options = options || {};
    
    this.width           = options.width      || 0;
    this.height          = options.height     || 0;
    this.defaultFrameWidth      = options.defaultFrameWidth      || 0;
    this.defaultFrameHeight     = options.defaultFrameHeight     || 0;
    
    // prepare animations
    this.animations      = options.animations || {};
    this.animationsArray = [];
    var a;
    for (a in this.animations) {
      if(this.animations.hasOwnProperty(a)) {
        this.animationsArray.push(this.animations[a]);
      }
    }
    
    // prepare image node
    this.node = new Image();
     
    var self = this; // auxiliary variable used so we can reference "this" on the callbacks
    this.node.onload = function () { self.onLoad(); } ;
    this.node.onerror = function() { self.onError(); } ;
    this.node.onabort = function() { self.onAbort(); } ;
    this.node.src = url;
    this.url = this.node.src; // we do this instead of this.url = url; so we get a "complete" URL
    
  },
  onLoad: function () {
    this._super();
    this.width = this.width || this.node.width;
    this.height = this.height || this.node.height;
  },
  create: function() {
    if(this.loaded===false) {
      throw "SpriteLoaderAndFactory: the sprite is still not loaded";
    }
    
    var node = this.node.cloneNode(false);
    document.body.appendChild(node);
    Jay.absolutize(node);
    
    return new Jay.Sprite(this.game, node, this);
  }
});

Jay.NullSprite = {}; //FIXME use a real class here

Jay.Actor = Jay.StatefulClass.extend({
  init: function(options) {
  
    this.game = this.getGame();
    this.game.addActor(this);
    
    options = options || {};
    this.setSprite ( options.sprite || Jay.NullSprite );
    this.frozen = options.frozen || false;        // the game will not call "run" on frozen actors
    this.setAnimation(options.animation || [{x:0,y:0}]); // default animation to the 0,0 frame
    this.setXY(options.x || 0, options.y || 0);
  },
  getGame: function() {
    // has to be overriden by children
  },
  setSprite: function(factory){
    this.sprite = factory.create();
    this.sprite.actor = this;
  },
  run: function() {
    // this function has to be overriden, will be called on each game loop iteration
  },
  setX: function (x) {
    this.x = x;
    this.sprite.setX(x);
  },
  setY: function(y) {
    this.y = y;
    this.sprite.setY(y);
  },
  setXY: function(x, y) {
    this.x = x;
    this.y = y;
    this.sprite.setXY(x, y);
  },
  increaseX: function(incX) {
    this.x += incX;
    this.sprite.setX(this.x);
  },
  increaseY: function(incY) {
    this.y += incY;
    this.sprite.setY(this.y);
  },
  increaseXY: function(incX, incY) {
    this.x += incX;
    this.y += incY;
    this.sprite.setXY(this.x, this.y);
  },
  setAnimation: function (animation) {
    this.sprite.setAnimation(animation);
  },
  animate: function() {
    this.sprite.animate();
  },
  setFrame: function(x, y, width, height) {
    this.sprite.setFrame(x, y, width, height);
  },
  freeze: function() {
    this.frozen = true;
  },
  unfreeze: function() {
    this.frozen = false;
  }
});

Jay.Input = Class.extend({
  init: function (game, options) {
    this.game = game;
    this.node = /*game.node ||*/ document;
    
    this.actions = {}; // holds the status of every binded action up, down, pressed or released
    this.bindings = {}; // holds equivalence actionName -> KEY_F1, KEY_F2 ... etc
    this.invertedBindings = {};    // holds equivalence KEY_F1, KEY_F2 ... -> actionsName
    this._previousActions = {}; // helper array used for detecting key presses and releases
    
    this.bindingCounter = { keys:0, mouseButtons:0, mouseWheel:0, mouseMove:0 };
    
    options = options || {};
    this.doBindings (options);
  },
  // bindings is supposed to be an object with {actionName:COMMAND ... }.
  // action can be any string useful for the game (i.e. 'movePacmanRight')
  // COMMAND can be a KEY_SOMETHING or a MOUSE_SOMETHING
  doBindings: function(bindings) {
    for (var actionName in bindings) {
      if(bindings.hasOwnProperty(actionName)) {
        this.doBinding(actionName, bindings[actionName]);
      }
    }
  },
  // this is just the opposite of doBindings; dissociates actions from keys
  // this function accepts either an object or an array as paramters
  // if an object is passed, the property names are used for determinig the actions to be unbinded
  undoBindings: function(bindings) {
    for (var actionName in bindings) {
      if(bindings.hasOwnProperty(actionName)) {
        this.undoBinding(actionName);
      }
    }
  },
  doBinding: function (actionName, command) {
    this.bindings[actionName] = command;
    this.invertedBindings[command] = actionName;
    
    var self = this; // auxiliar variable used so "this" doesn't refer to document.div in _handle* functions
    
    switch(command) {
      case "MOUSE_MOVE":
        if(this.bindingCounter.mouseMove === 0) {
          Jay.addEvent(this.node, 'mousemove', function(ev){ self._handleMouseMove(ev); } );
        }
        this.bindingCounter.mouseMove += 1;

        this.actions[actionName]={position:0, offset:0};
        this._previousActions[actionName]={position:0, offset:0};
      break;
        
      case "MOUSE_WHEEL_UP": case "MOUSE_WHEEL_DOWN":
        if(this.bindingCounter.mouseWheel === 0) {
          Jay.addEvent(this.node, "mousewheel", function(ev){ self._handleMouseWheel(ev); } );
          Jay.addEvent(this.node, "DOMMouseScroll", function(ev){ self._handleMouseWheel(ev); } );
        }
        this.bindingCounter.mouseWheel += 1;
        
        this.actions[actionName]= { isDown:false, isUp:true, isPressed:false, isReleased:false, counter:0 };
        this._previousActions[actionName] = { isDown:false, isUp:true, isPressed:false, isReleased:false, counter:0 };      
      break;
  
      case "MOUSE_RIGHT": case "MOUSE_LEFT": case "MOUSE_MIDDLE":
        if(this.bindingCounter.mouseButtons === 0) {
          Jay.addEvent(this.node, 'mousedown', function(ev){ self._handleMouseDown(ev); } );
          Jay.addEvent(this.node, 'mouseup', function(ev){ self._handleMouseUp(ev); } );
        }
        this.bindingCounter.mouseButtons += 1;
        
        this.actions[actionName]= { isDown:false, isUp:true, isPressed:false, isReleased:false };
        this._previousActions[actionName] = { isDown:false, isUp:true, isPressed:false, isReleased:false };
      break;
        
      default: // keyboard presses
        if(Jay.Input.KeyNames[command] === undefined) { throw "Jay.Input.AddEvent: The key name '" + command + "' isn't a recognized key name"; }
        if(this.bindingCounter.keys === 0) {
          Jay.addEvent(this.node, 'keydown', function(ev){ self._handleKeyDown(ev); } );
          Jay.addEvent(this.node, 'keyup', function(ev){ self._handleKeyUp(ev); } );
        }
        this.bindingCounter.keys += 1;
      
        this.actions[actionName]= { isDown:false, isUp:true, isPressed:false, isReleased:false };
        this._previousActions[actionName] = { isDown:false, isUp:true, isPressed:false, isReleased:false };
      break;
    }
  },
  undoBinding: function (actionName) {
    var command = this.bindings[actionName];
    if(!command) { return; }
    var self = this; // auxiliar variable used so "this" doesn't refer to document.div in _handle* functions
    
    switch(command) {
      case "MOUSE_MOVE":
        this.bindingCounter.mouseMove -= 1;
        if(this.bindingCounter.mouseMove === 0) {
          Jay.removeEvent(this.node, 'mousemove', function(ev){ self._handleMouseMove(ev); } );
        }
      break;
        
      case "MOUSE_WHEEL_UP": case "MOUSE_WHEEL_DOWN":
        this.bindingCounter.mouseWheel -= 1;
        if(this.bindingCounter.mouseWheel === 0) {
          Jay.removeEvent(this.node, "mousewheel", function(ev){ self._handleMouseWheel(ev); } );
          Jay.removeEvent(this.node, "DOMMouseScroll", function(ev){ self._handleMouseWheel(ev); } );
        }  
      break;
  
      case "MOUSE_RIGHT": case "MOUSE_LEFT": case "MOUSE_MIDDLE":
        this.bindingCounter.mouseButtons -= 1;
        if(this.bindingCounter.mouseButtons === 0) {
          Jay.removeEvent(this.node, 'mousedown', function(ev){ self._handleMouseDown(ev); } );
          Jay.removeEvent(this.node, 'mouseup', function(ev){ self._handleMouseUp(ev); } );
        }
      break;
        
      default: // keyboard presses
        if(Jay.Input.KeyNames[command] === undefined) { throw "Jay.Input.RemoveEvent: The key name '" + command + "' isn't a recognized key name"; }
        this.bindingCounter.keys -= 1;
        if(this.bindingCounter.keys === 0) {
          Jay.removeEvent(this.node, 'keydown', function(ev){ self._handleKeyDown(ev); } );
          Jay.removeEvent(this.node, 'keyup', function(ev){ self._handleKeyUp(ev); } );
        }
      break;
    }
    
    // delete from the actions array
    delete this.actions[actionName];
    delete this._previousActions[actionName];    
    // finally delete from the bindings
    delete this.bindings[actionName];
    delete this.invertedBindings[command];
  },
  // copies the "current snapshot" on "previous snapshot" of key statuses. This will allow
  // to control key presses and releases later on (by comparing previous with current)
  capture: function () {
    var currAction; var prevAction; var currCommand;
    for (var actionName in this.bindings) {
      if(this.bindings.hasOwnProperty(actionName)) {
        currAction = this.actions[actionName];
        currCommand = this.bindings[actionName];
        prevAction = this._previousActions[actionName];
        
        switch (currCommand) {
          case "MOUSE_MOVE":
            currAction.xOffset = currAction.xOffset - prevAction.x;
            prevAction.x = currAction.x;
            currAction.yOffset = currAction.yOffset - prevAction.y;
            prevAction.y = currAction.y;
          break;
          case "MOUSE_WHEEL_UP": case "MOUSE_WHEEL_DOWN":
            // special treatment for mouse wheel actions; they don't have a "key up" so we have to simulate one
            // we do this by incrementing a counter every time the wheel is pressed. if the current counter has not been increased
            // (prevAction.counter === currAction.counter) then we've got an "up event"
            if(prevAction.counter === currAction.counter) {
              currAction.isUp = true;
              currAction.isDown = false;
              currAction.counter = 0;
            }
            prevAction.counter = currAction.counter;
            
            //=== NOTICE THAT WE ARE NOT INCLUDING A BREAK STATEMENT HERE ===
            //we continue with the default treatment, below
          default:
            // recalculate the presses and releases
            currAction.isPressed = prevAction.isUp && currAction.isDown;
            currAction.isReleased = prevAction.isDown && currAction.isUp;
            
            // make "current" the "previous", so we can update the presses and releases
            prevAction.isDown = currAction.isDown;
            prevAction.isUp = currAction.isUp;

          break;
        }
      }
    }
  },
  _handleKeyDown: function(ev) {
    return this._handleKeyUpOrDown(ev, true);
  },
  _handleKeyUp: function(ev) {
    return this._handleKeyUpOrDown(ev, false);
  },
  _handleMouseDown: function(ev) {
    return this._handleMouseUpOrDown(ev, true);
  },
  _handleMouseUp: function(ev) {
    return this._handleMouseUpOrDown(ev, false);
  },
  // Adapted from http://adomas.org/javascript-mouse-wheel/
  _handleMouseWheel: function(ev) {
    if (ev.wheelDelta) { /* IE/Opera. */
      delta = ev.wheelDelta;
      if (window.opera) { delta = -delta; } // In Opera 9, delta differs in sign as compared to IE.
    } else if (ev.detail) { // Mozilla case.
      // In Mozilla, sign of delta is different than in IE.
      delta = -ev.detail;
    }
        
    var resultUp = this._handleInputEvent(ev, "MOUSE_WHEEL_UP", {isDown: delta>0});
    var resultDown = this._handleInputEvent(ev, "MOUSE_WHEEL_DOWN", {isDown: delta<0});
    
    return resultUp && resultDown;
  },
  _handleMouseMove: function(ev) { // FIXME
    
    var mouseX = ((ev.clientX ? ev.clientX + document.body.scrollLeft : ev.pageX) || 0) - this.game.screen.left ;
    var mouseY = ((ev.clientY ? ev.clientY + document.body.scrollTop  : ev.pageY) || 0) - this.game.screen.top ;
    
    return this._handleInputEvent(ev, "MOUSE_MOVE", {x:mouseX, y:mouseY});
  },
  _handleKeyUpOrDown: function(ev, isDown) {
    var keyboardCode = ev.keyCode || ev.charCode;
    var keyboardCommand = Jay.Input.KeyboardCodes[keyboardCode];
    
    return this._handleInputEvent (ev, keyboardCommand, {isDown: isDown});
  },
  _handleMouseUpOrDown: function(ev, isDown) {
    // This piece is adapted from http://unixpapa.com/js/mouse.html
    var button;
    if (ev.which == undefined) {
      button= (ev.button < 2) ? "MOUSE_LEFT" : ((ev.button == 4) ? "MOUSE_MIDDLE" : "MOUSE_RIGHT");
    } else {
      button= (ev.which < 2) ? "MOUSE_LEFT" : ((ev.which == 2) ? "MOUSE_MIDDLE" : "MOUSE_RIGHT");
    }
    return this._handleInputEvent (ev, button, { isDown: isDown } );
  },
  _handleInputEvent: function(ev, command, options) {
    var actionName = this.invertedBindings[command];

    if(actionName!==undefined) {
      var action = this.actions[actionName];
      options = options || {};
      
      switch (command) {
        case "MOUSE_MOVE":
          action.x = options.x || 0;
          action.y = options.y || 0;
        break;
        default:
          action.isDown = options.isDown || false;
          action.isUp = !action.isDown;
          if(action.counter!==undefined) { // this attribute is only used by the mouse wheel. it helps guessing whether the wheel has really gone up or down
            action.counter += action.isDown ? 1:0;
          }
        break;
      }
      if (ev.preventDefault!==undefined) { ev.preventDefault(); }
      if (ev.stopPropagation!==undefined) { ev.stopPropagation(); }
      ev.returnValue = false
      return false;
    }
    return true;
  }
});

// The whole keycodes code adapted without shame from http://www.tommysmind.com/gamejs/
Jay.Input.KeyNames = {
// Non-graphical keys
   KEY_BACKSPACE: 8, KEY_TAB: 9, KEY_NUM_CENTER: 12, KEY_ENTER: 13, KEY_RETURN: 13, KEY_SHIFT: 16, KEY_CTRL: 17, KEY_ALT: 18,
   KEY_PAUSE: 19, KEY_CAPS_LOCK: 20, KEY_ESCAPE: 27,
   KEY_SPACE: 32, KEY_PAGE_UP: 33, KEY_PAGE_DOWN: 34, KEY_END: 35, KEY_HOME: 36,
   // Arrow keys
   KEY_LEFT: 37, KEY_UP: 38, KEY_RIGHT: 39, KEY_DOWN: 40,
   KEY_PRINT_SCREEN: 44, KEY_INSERT: 45, KEY_DELETE: 46,
   // Numbers
   KEY_ZERO: 48, KEY_ONE: 49, KEY_TWO: 50, KEY_THREE: 51, KEY_FOUR: 52, KEY_FIVE: 53, KEY_SIX: 54, KEY_SEVEN: 55, KEY_EIGHT: 56, KEY_NINE: 57,
   // Letters
   KEY_A: 65, KEY_B: 66, KEY_C: 67, KEY_D: 68, KEY_E: 69, KEY_F: 70, KEY_G: 71, KEY_H: 72, KEY_I: 73, KEY_J: 74, KEY_K: 75, KEY_L: 76, KEY_M: 77, KEY_N: 78, KEY_O: 79, KEY_P: 80, KEY_Q: 81, KEY_R: 82, KEY_S: 83, KEY_T: 84, KEY_U: 85, KEY_V: 86, KEY_W: 87, KEY_X: 88, KEY_Y: 89, KEY_Z: 90,
   KEY_CONTEXT_MENU: 93,
   // Keypad Numbers
   KEY_NUM_ZERO: 96, KEY_NUM_ONE: 97, KEY_NUM_TWO: 98, KEY_NUM_THREE: 99, KEY_NUM_FOUR: 100, KEY_NUM_FIVE: 101, KEY_NUM_SIX: 102, KEY_NUM_SEVEN: 103, KEY_NUM_EIGHT: 104, KEY_NUM_NINE: 105,
   KEY_NUM_MULTIPLY: 106, KEY_NUM_PLUS: 107, KEY_NUM_MINUS: 109, KEY_NUM_PERIOD: 110, KEY_NUM_DIVISION: 111,
   // F keys
   KEY_F1: 112, KEY_F2: 113, KEY_F3: 114, KEY_F4: 115, KEY_F5: 116, KEY_F6: 117, KEY_F7: 118, KEY_F8: 119, KEY_F9: 120, KEY_F10: 121, KEY_F11: 122, KEY_F12: 123
};

// calculate inverse numbers too, so if we can make Jay.Input.KeyboardCodes[8] = "KEY_BACKSPACE"
Jay.Input.KeyboardCodes = {};
Jay.applyInverse(Jay.Input.KeyboardCodes, Jay.Input.KeyNames);

Jay.Input.MouseCommands = { MOUSE_LEFT:1, MOUSE_RIGHT:2, MOUSE_MIDDLE:3, 
  MOUSE_WHEEL_UP:0, MOUSE_WHEEL_DOWN:0, MOUSE_MOVE:-1 };

// Fixme add a way to remove an actor
// Fixme add "factories" for sprites and a callback 'all_loaded'
Jay.Game = Class.extend({
  init: function(options) {
  
    // default options
    options = options || {}; // if options is null we make it an empty object
  
    this.timerSpeed = options.timerSpeed || 50;
    
    // create/choose a DOM node for starting the game
    this.node=options.node || document.createElement("div");
    Jay.absolutize(this.node); // this "fixes" the node on the page. it makes it have some "top, left, height and width" properties
    if(this.node.parentNode === null) { document.body.appendChild(this.node); }
    
    // callback function to be called when all resources have been loaded (and the user has called waitForLoad at least once)
    // by default it just calls this.start(); but it can be overriden to other stuff
    this.screen = new Jay.Screen(this, options.screen);
   
    this.input = new Jay.Input(this, options.input);
    
    // other options
    this.actors = [];     // holds the actors
    this.resources = [];
    this.loadedResources = 0;
    this.pendingToLoad = 0;
    this.running = false; // status flag - running or not running
    
  },
  createActorClass: function( parentClass, instanceMethods, states ) {
    parentClass = parentClass || Jay.Actor;
    var self = this;
    instanceMethods = instanceMethods || {};
    instanceMethods.getGame = function() { return self; };
    return parentClass.extend(instanceMethods, states);
  },
  addActor: function(actor) {
    actor.game = this;
    this.actors.push(actor);
    return actor;
  },
  loadResource: function (url, options, loader) {

    // loading control variable
    // the user has to call to waitForLoad() when he/she finishes specifying resources 
    // this variable will be 0 when all the outstanding resources are loaded
    this.pendingToLoad += 1;
    // this adds code to the loadcallback so the game detects the loading
    // first get the callback from options, or an empty function
    var loadCallback    = options.loadCallback || Jay.emptyFunction ;
    // then change the options callback by another one that calls the initial client
    // callback but then checks if all the sprite definitions have been loaded
    var self = this;
    
    // newOptions will be a copy of options, just changing the loadCallback so the game object will keep track of loadings
    var newOptions = {};
    Jay.apply(newOptions, options);
    
    newOptions.loadCallback = function(resource) {
      loadCallback(resource);
      self.pendingToLoad -= 1;
      self.waitForLoad(); // launches "loaded()" if pendingToLoad===0
    };
    
    var resource = new loader(this, url, newOptions);
    this.resources.push(resource);
    
    return resource;
  },
  loadSprite : function (url, options) {
    return this.loadResource(url, options, Jay.SpriteLoaderAndFactory);
  },
  waitForLoad : function () {
    if(this.pendingToLoad === 0) {
      this.loaded();
    }
  },
  loaded : function() {
    this.start();
  },
  start: function() {
    if(this.running) { return; }
    // else ...
    
    this.running=true; // this stops some possible scenarios in which game.start could be called several times (in less than this.timerSpeed ms)
    // Trick the browser
    var self = this;                          // to be used on the settimeout call below
    this._gameIntervalId = setInterval(function(){  // a new function creates a new scope
      self.gameLoop();                        // "this" would point to "window". So we use a temp variable called "self"
    }, this.timerSpeed); 
  },
  stop: function () {
    if(this.running) {
      clearInterval (this._gameIntervalId);
    }
    this.running = false;
  },
  gameLoop: function () {
    if (this.input) { this.input.capture(); }
  
    var actor = null;
    // execute "run()" on all actors
    for (var i = 0; i < this.actors.length; i++) {
      actor = this.actors[i];
      if (!actor.frozen) {
        actor.run();
      }
    }
  },

});     
  