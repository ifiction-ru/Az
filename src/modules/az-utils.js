/*  */

define(function () {
   'use strict';

    var extend = function (target, source) {
            target = target || {};

            for (var i in source) {
                if (source.hasOwnProperty(i)) {
                    if (typeof source[i] === 'object') {
                        target[i] = Array.isArray(source[i]) ? [] : {};
                        extend(target[i], source[i]);
                    } else {
                        target[i] = source[i];
                    }
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
        };

    return {
        extend: extend,
        typeOf: typeOf
    }
});
