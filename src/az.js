/**/

(function (global) {

    'use strict';

    var modules = {},
        modulesPath = (function () {
            var scripts = document.getElementsByTagName('script'),
                i;

            for (i = scripts.length; i--;) {
                if (scripts[i].src.match(/^(\S*)*az.js$/i)) {
                    return (RegExp.$1 || '') + 'modules/';
                }
            }
        }()),
        require = function () {
            global.exports = global.exports || {};

            var exports = global.exports,
                required = [],
                createScript = function (name, callback) {
                    var script = document.createElement('script');

                    script.src = modulesPath + name + '.js';
                    script.onload = callback;
                    document.body.appendChild(script);
                },
                runInit = function (module) {
                    if (module.init && typeof module.init === 'function') {
                        module.init();
                    }
                };

            if (arguments.length) {
                if (Array.isArray(arguments[0])) {
                    required = Array.prototype.slice.call(arguments);
                } else {
                    Array.prototype.forEach.call(arguments, function (arg) {
                        if (typeof arg === 'string') {
                            required.push(arg);
                        }
                    });
                }
            }

            required.forEach(function (req) {
                if (exports[req]) {
                    if (!modules[req]) {
                        modules[req] = exports[req];
                        runInit(modules[req]);
                    }
                } else {
                    createScript(req, function () {
                        if (exports[req]) {
                            modules[req] = exports[req];
                            runInit(modules[req]);
                        } else {
                            throw new Error('Az: Module "' + req + '" not found');
                        }
                    });
                }
            });
        },

        // Including Az-modules
        ui = require('az-ui');

    global.az = {
        ui:  ui
    };

})(this);
