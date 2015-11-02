/*  */

define(function () {
    'use strict';

    /**
     *
     * @param target
     * @param source
     * @returns {*|{}}
     */
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

        /**
         *
         * @param arg
         * @returns {*}
         */
        typeOf = function (arg) {
            if (arg === null) {
                return 'null';
            } else if (Array.isArray(arg)) {
                return 'array';
            }

            return typeof arg;
        },

        /**
         *
         * @param element
         * @returns {Array.<T>}
         */
        toArray = function (element) {
            return Array.prototype.slice.call(element);
        },

        /**
         *
         * @param param
         * @param value
         * @returns {*}
         */
        iNN = function (param, value) {
            if (param === null || param === undefined || param === false) {
                return null;
            } else {
                if (typeof param !== 'object') {
                    return value;
                } else {
                    return param[value];
                }
            }
        },

        /**
         *
         * @param arr
         * @param values
         */
        addArrToArr = function (arr, values) {
            for (var i = 0; i < values.length; i++) {
                if (arr.indexOf(values[i]) == -1) {
                    arr.push(values[i]);
                }
            }
        },

        /**
         *
         * @param from
         * @returns {{}}
         */
        arrToArr = function (from) {
            var result = {};

            for (var key in from) {
                if (from.hasOwnProperty(key)) {
                    result[key] = from[key];
                }
            }

            return result;
        },

        /**
         * yoToE("ёлка") — Возвращает слово, где Ё заменено на Е.
         * @param word
         * @returns {string|XML}
         */
        yoToE = function (word) {
            return word.replace('ё', 'е').replace('Ё', 'Е');
        },

        /**
         *
         * @param list
         * @returns {*}
         */
        lengthToSymbol = function (list) {
            var value = typeof(list) == 'number' ? list : list.length;

            if (value == 0) {
                return 'N';
            } else if (value == 1) {
                return 'S';
            } else if (value > 1) {
                return 'P';
            } else {
                return null;
            }
        },

        /**
         *
         * @param data
         * @param result
         * @param fields
         * @param level
         * @param max
         * @param elem
         */
        objectToTable = function (data, result, fields, level, max, elem) {
            // Начальная инициализация данных
            if (level == undefined) {
                level = 0;
            }

            if (fields == undefined) {
                fields = [];

                for (var k in data) {
                    fields.push(k);
                }
            }

            if (max == undefined) {
                max = fields.length - 1;
            }

            if (elem == undefined) {
                elem = {};
            }

            if (result == undefined) {
                result = [];
            }

            var field = fields[level],
                value = data[field],
                elem2 = {},
                elem3,
                value2;

            if (value === null || typeof value !== 'object' || value.length === undefined) {
                value = [value];
            }
            for (k in elem) {
                elem2[k] = elem[k];
            }

            for (var i = 0; i < value.length; i++) {
                value2 = value[i];
                elem2[field] = value2;

                if (level == max) {
                    elem3 = {};

                    for (k in elem2) {
                        elem3[k] = elem2[k];
                    }

                    result.push(elem3);
                } else {
                    objectToTable(data, result, fields, level + 1, max, elem2);
                }
            }
        };

    return {
        extend: extend,
        typeOf: typeOf,
        toArray: toArray,
        iNN: iNN,
        addArrToArr: addArrToArr,
        arrToArr: arrToArr,
        yoToE: yoToE,
        lengthToSymbol: lengthToSymbol,
        objectToTable: objectToTable
    }
});
