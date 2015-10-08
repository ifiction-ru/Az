/*  */

define(function () {
   'use strict';

    var extend = function (target, source) {
            var src, copy;

            target = target || {};

            for (var name in source) {
                src = target[name];
                copy = source[name];

                if (target === copy) {
                    continue;
                }

                if (typeof copy === 'object') {
                    target[name] = Array.isArray(src) ? [] : {};
                    target[name] = extend(copy, src);
                } else if (copy !== undefined) {
                    target[name] = src;
                }
            }

            return target;
        },

        typeOf = function (arg) {
            if (arg === null) {
                return 'null';
            } else if (Array.isArray(arg)) {
                return 'array';
            }

            return typeof arg;
        },

        toArray = function (element) {
            return Array.prototype.slice.call(element);
        };

    return {
        extend: extend,
        typeOf: typeOf,
        toArray: toArray
    }
});
