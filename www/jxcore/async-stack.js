require('async-listener');

function Scope(stack, parentScope) {
    this.stack = stack;
    this.parentScope = parentScope;
}

Scope.prototype.getAsyncStack = function () {
    var asyncSeparator = '\n- async -\n';
    var stacks = [];
    var scope = this;
    while (scope) {
        stacks.push(scope.stack);
        scope = scope.parentScope;
    }

    if (process.config.variables.node_engine_v8) {
        var ignoreLinesRe = new RegExp(
            [
                '\\/async-listener\\/(glue|index)\\.js:\\d+:\\d+\\)?',
                '^\\s*at AsyncListener\\.process\\.addAsyncListener\\.create',
            ].join('|')
        );
        return stacks.map(function (stack, index) {
            var lines = stack.split('\n');
            lines.shift();
            lines = lines.filter(function (line) {
                return !ignoreLinesRe.test(line);
            });
            return lines.join('\n');
        }).join(asyncSeparator);
    }
    if (process.config.variables.node_engine_mozilla) {
        var ignorePathRe = new RegExp(
            [
                '\\/async-listener\\/(glue|index)\\.js:\\d+:\\d+$',
            ].join('|')
        );
        var ignoreFnRe = new RegExp(
            '^listener<\\.create$'
        );
        return stacks.map(function (stack, index) {
            var lines = stack.split('\n');
            lines = lines.map(function (line) {
                line = line.trim();
                if (!line) {
                    return null;
                }

                var pair = line.split('@');
                var fn = pair[0] ? pair[0].trim() : '<anonymous>';
                var path = pair[1] ? pair[1].trim() : '';
                var ignorePath = ignorePathRe.test(path);
                var ignoreFn = ignoreFnRe.test(fn);
                if (ignorePath || ignoreFn) {
                    return null;
                }
                return '    at ' + fn + ' (' + path + ')';
            }).filter(function (line) {
                return line !== null;
            });

            return lines.join('\n');
        }).join(asyncSeparator);
    }
    return stacks.join(asyncSeparator);
};

function printError(err) {
    console.log(err.message);
    console.log(err.stack);
    Object.keys(err).forEach(function (k) {
        console.log('err.%s = %j', k, err[k]);
    });
}

var log = console.log.bind(console);

var listener;
var currentScope = null;

// use it to safely log from inside of the async listener callbacks
log = function () {
    process.removeAsyncListener(listener);
    console.log.apply(console, arguments);
    process.addAsyncListener(listener);
};
listener = process.addAsyncListener({
    create: function (storage) {
        var scope = new Scope(new Error('ASYNCSTACK').stack, currentScope);
        return scope;
    },
    before: function (context, storage) {
        currentScope = storage;
    },
    after: function (context, storage) {
        currentScope = currentScope ? currentScope.parentScope : null;
    },
    error: function (storage, err) {
        currentScope = null;
        var scope = new Scope(err.stack, storage);
        err.asyncStack = scope.getAsyncStack();
    }
});

// process.on('async:create', function (passStorage, callback, metadata) {
//     var scope = new Scope(new Error('ASYNCSTACK').stack, currentScope);
//     scope.metadata = metadata;
//     if (metadata) {
//         console.log('CREATE:', metadata);
//     }
//     passStorage(scope);
// });
// process.on('async:before', function (storage) {
//     currentScope = storage;
//     if (storage.metadata) {
//         console.log('BEFORE:', storage.metadata);
//     }
// });
// process.on('async:after', function (storage) {
//     currentScope = currentScope ? currentScope.parentScope : null;
//     if (storage.metadata) {
//         console.log('AFTER:', storage.metadata);
//     }
// });

// process.on('async:error', function (storage, err) {
//     console.log('async:error');
//     if (storage.metadata) {
//         console.log('ERROR:', storage.metadata);
//         printError(err);
//     }
//     currentScope = null;
//     var scope = new Scope(err.stack, storage);
//     err.asyncStack = scope.getAsyncStack();
//     err.scope = scope;
// });
function getCurrentScope () {
    return currentScope;
}

global.getCurrentScope = getCurrentScope;

module.exports = {
    listener: listener,
    log: log,
    getCurrentScope: getCurrentScope,
};

