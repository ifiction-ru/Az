define(['modules/az-utils', 'modules/az-layers', 'modules/az-events'], function (utils, layers, events) {
    'use strict';

    /* Формат базы данных "db_values":
     layer   Номер слоя данных
     simple  Признак свойства: false — свойство объекта "Объект.Имя", true — произвольное свойство Получить(Имя, Объект)
     object  Уникальный идентификатор объекта
     name    Имя свойства
     value   Значение свойства
    */

    var dbValues = TAFFY(), // База данных для хранения

        /**
         *
         * @param name
         * @param value
         */
        create = function(name, value) {
            set(false, AZ.getID(this), name, value);

            Object.defineProperty(this, name, {
                set: function(value) {
                    //При записи свойства объекта
                    set(false, AZ.getID(this), name, value);
                },
                get: function() {
                    var value = get(false, AZ.getID(this), name),
                        result = events.checkReactions(events.PROPERTY, { // Вызываем событие "При получении свойства объекта"
                            what: this, property: name
                        }, {
                            parameter: value
                        });

                    if (result !== undefined) {
                        value = result;
                    }

                    return value;
                }
            });

        },

        /**
         *
         * @param simple
         * @param object
         * @param name
         * @param value
         */
        set = function (simple, object, name, value) {
            if (value === undefined) {
                value = null;
            }

            layers.set(dbValues, {
                simple: simple,
                object: object,
                name: name
            }, {
                value: value
            });
        },

        /**
         *
         * @param simple
         * @param object
         * @param name
         * @returns {*}
         */
        get = function (simple, object, name) {
            return layers.get(dbValues, {
                simple: simple,
                object: object,
                name: name
            }, 'value', undefined);
        },


        checkArgs = function (options, gos, defaultValue) {
            var result = {
                object: null,
                name: undefined,
                value: undefined
            };

            if (options.length === 3) {
                result.object = options[0];

                if (result.object != null && AZ.isObject(result.object) == true) {
                    result.object = AZ.getID(result.object);
                }

                result.name  = options[1];
                result.value = options[2];
            } else if (options.length === 2) {
                if (gos == 'set') {
                    result.name  = options[0];
                    result.value = options[1];
                } else {
                    result.object = options[0];

                    if (result.object != null && AZ.isObject(result.object) == true) {
                        result.object = AZ.getID(result.object);
                    }

                    result.name = options[1];
                }
            } else {
                result.name = options[0];
            }

            if (result.name === undefined) {
                console.error('Ошибка при передаче параметов записи свойства: ' + arguments);
                return null;
            }

            if (result.value === undefined && defaultValue !== undefined) {
                result.value = defaultValue;
            }

            return result;
        };

    layers.addHandler('move', {
        db: dbValues,
        sort: 'object asec, name asec, simple asec',
        filter: ['object', 'name', 'simple']
    });

    // TODO: перенести из глобальной области видимости
    // Присваивание значения "свободному" свойству. Свойство может быть привязано к объекту.
    window.setProperty = function (name, object, value) {
        var params = checkArgs(arguments, 'set', null);

        if (params == null) {
            return;
        }

        set(true, params.object, params.name, params.value);
    };

    window.incProperty = function (name, object, value) {
        var params = checkArgs(arguments, 'get', 1);

        if (params == null) {
            return;
        }

        set(true, params.object, params.name, get(true, params.object, params.name) + params.value);
    };

    window.decProperty = function (name, object, value) {
        var params = checkArgs(arguments, 'get', 1);

        if (params == null) {
            return;
        }

        set(true, params.object, params.name, PROPERTIES.get(true, params.object, params.name) - params.value);
    };

    window.getProperty = function (name, object, value) {
        var params = checkArgs(arguments, 'get', null);

        if (params == null) {
            return;
        }

        var savedValue = get(true, params.object, params.name);

        if (savedValue === undefined && params.value !== undefined) {
            savedValue = params.value;
        }

        return savedValue;
    };


    return {
        create: create,
        set: set,
        get: get,
        checkArgs: checkArgs
    };

});
