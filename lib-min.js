var COMPONENT_OBJ = {};
function registerComponents(tag, obj) {
    COMPONENT_OBJ[tag.toUpperCase()] = obj;
}

var Component = function(comp) {

    var state = _.cloneDeep(comp.state);
    var _el;
    var parentState;


    this.getState = function() {
        return state;
    };

    this.methods = {};
    var methods = comp.methods(this.getState);
    for (var fn in methods) {
        // todo ceck type is fn
        this.methods[fn] = methods[fn];
    }

    var self = this;

    init = function(_parentState) {
        if (comp.init) {
            comp.init(self.getState);
        }

        parentState = _parentState || {};

    }

    // must live inside the compnent so it can inherit the state
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
                compInstances[key].setParentState(state);
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
            // console.log('update', fromEl)

            if (COMPONENT_OBJ[fromEl.tagName] != null) {
                var key = fromEl.componentId;
                compInstances[key].setParentState(state);
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

    function render() {
        console.log('state render', state)
        var renderState = _.merge(parentState, state);
        if (typeof comp.viewLayer == 'function') {
            renderState = comp.viewLayer(renderState);
        }
        morphdom(_el, "<div>" + comp.render(renderState) + "</div>", morphdomCallbacks);
    }



    function setParentState(newState) {
        console.log('get state', newState);
        parentState = newState;
        render();
    }

    this._eval = function(functionName) {
         //  console.log('called _eval with', this);
        // console.log('event', event);

        var nameOnly = functionName.substring(0, functionName.indexOf('('));
        console.log('nameOnly', nameOnly);
console.log(this.methods);
        if (typeof this.methods[nameOnly] == 'function') {
            var str = 'this.methods.' + functionName;
            // console.log('eva ',str)

            state = eval(str);
            render();
        }
    }

    function bindEvents() {
        var eventsToListen = ['click', 'change', 'keyup', 'submit', 'dblclick', 'blur'];

        eventsToListen.forEach(function(eventName) {
            $(_el).on(eventName, '[data-on-' + eventName + ']', function(event) {
                 console.log('event', event);
                 console.log('target', event.currentTarget.getAttribute('data-on-' + eventName));
                 console.log('this', $(this));
                var fn = event.currentTarget.getAttribute('data-on-' + eventName)
                //$(this).data('on-' + eventName);
                 console.log('FN', fn);
                try {
                    self._eval.call(self, fn);
                   //_eval(fn)
                } catch(e) {
                     console.log('error', e)
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
            setParentState: setParentState
        }
    }
};


var componentCounter = 0;
var compInstances = {};

// var COMPONENT_OBJ = {COMP2: comp3Obj, COMP3: comp3Obj, COMP4: comp4Obj};
