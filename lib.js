var COMPONENT_OBJ = {};
function registerComponents(tag, obj) {
    COMPONENT_OBJ[tag.toUpperCase()] = obj;
}

var Component = function(comp) {
    
    var state = _.cloneDeep(comp.state);
    var _el;

    this.dispatch = function(action) {
        state = comp.reducer(state, action);
        console.log('got from reducer', state);

        render();
    }  

    this.getState = function() {
        return state;
    };

    this.methods = {};

    for (var fn in comp.methods) {
        // todo ceck type is fn
        this.methods[fn] = comp.methods[fn](this.dispatch, this.getState);
    }
  
    var self = this;

    init = function() {
        if (comp.init) {
            comp.init(self.dispatch, self.getState);
        }
    }

    function render() {
        state = comp.viewLayer && comp.viewLayer(state);
        morphdom(_el, "<div>" + comp.render(state) + "</div>", morphdomCallbacks);
    }

    

    function update(newState) {
        state = newState;
        state.parentCounter++;
        //console.log('component got the new context', newState);
        render(); 
    }

    this._eval = function(functionName) {
         //  console.log('called _eval with', this);
        // console.log('event', event);

        var nameOnly = functionName.substring(0, functionName.indexOf('('));
        console.log('nameOnly', nameOnly);

        if (typeof this.methods[nameOnly] == 'function') {
            var str = 'this.methods.' + functionName;
            // console.log('eva ',str)

            eval( str );     
        }
       

    }

    function bindEvents() {
        var eventsToListen = ['click', 'change', 'keyup', 'submit', 'dblclick', 'blur'];

        eventsToListen.forEach(function(eventName) {
            $(_el).on(eventName, '[data-on-' + eventName + ']', function(event) {
                 console.log('event', event);
                var fn = $(this).data('on-' + eventName);
                // console.log('attribute', fn);
                try {
                    self._eval.call(self, fn);
                   //_eval(fn)
                } catch(e) {
                    // console.log('error', e)
                }
            });
        });
    }

    return function(el) {
        _el = el;
        // console.log('this', this)
        // console.log('initialise instance on ', _el);

        init();

        render();
        bindEvents();

        return {
            update: update
        }
    }
};


var componentCounter = 0;
var compInstances = {};

// var COMPONENT_OBJ = {COMP2: comp3Obj, COMP3: comp3Obj, COMP4: comp4Obj};

var morphdomCallbacks = {
    childrenOnly: true,
    onNodeAdded: function(node) {
        // console.log('add node', node);
        // console.log(node.tagName)
        if (COMPONENT_OBJ[node.tagName] != null) {
            var key = node.tagName + componentCounter;
            node.componentId = key;
            var comp = new Component(COMPONENT_OBJ[node.tagName]);
            compInstances[key] = new comp(node);
            //new COMPONENT_CONSTR[node.tagName](node); 
            // console.log('will add a component ' + key);
            componentCounter++;
        } 
    },

    onBeforeNodeAdded: function(node) {
        // console.log('want to add note', node);
        //console.trace();
        return node;
    },
    getNodeKey: function(node) {
        var id = node.id;
        //if (id) console.log('id', id);
        return id;
    },
    onBeforeElChildrenUpdated: function(fromEl, toEl) {
        // console.log('update  children from' + fromEl.tagName + ' to ' + toEl.tagName);
        return true;
    },

    onElUpdated: function(el) {
        // console.log('onElUpdated', el);
    },

    onBeforeElUpdated: function(fromEl, toEl) {
        if (fromEl.tagName == 'COMP') {
            // console.warn('you should update', fromEl);
            var key = fromEl.componentId;
            // console.log('key', key)
            compInstances[key].update(context);
            return false;// todo actually update this node
        }

        if (fromEl.tagName === 'INPUT' &&
                $(fromEl).is(':focus')) {
            return false;
        }
        // console.log('update EL from' + fromEl.tagName + ' to ' + toEl.tagName);
        return true;
    },

    onBeforeNodeDiscarded: function(node) {
        return true;
    }
};