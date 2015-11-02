define(['modules/az-utils'], function (utils) {
    'use strict';

    /*
     Параметры Слой сохранения данных. Используется для реализации возможности сохранения.
     0 - Заполнение при инициализации.
     1 - Переназначение в процессе игры.
     2 - Переназначение в процессе последнего хода.
    */

    var protagonist = { // Текущий персонаж
            object: null,
            id:     null
        },
        position    = { // Текущее местоположение (персонажа)
            object: null,
            id:     null
        },
        // Известные игроку контейнеры в инвентаре и локации
        availableObjects = [],
        availableObjectsIds = [],

        objectsList = {}, // Объект для хранения ссылок на объекты игры по их строковому ID.
        updateAvailableObjects = function () {
            var // Добавляем в перечень доступных объектов содержимое локации
                // ??? Может, стоит это делатьтолько после того, как игрок посмотрел инвентарь?
                posObjects = position.object.container.getContent(),
                // Добавляем в перечень доступных объектов содержимое инвентаря
                proObjects = protagonist.object.container.getContent(),
                objects = posObjects.concat(proObjects),
                object,
                container,
                containerId,
                content,
                id;

            // Добавляем в перечень доступных объектов персонажа игрока
            objects.unshift({
                what: protagonist.object,
                where: position.object,
                quantity: 1
            });
            // Добавляем в перечень доступных объектов текущую локацию
            objects.unshift({
                what: position.object,
                where: position.object,
                quantity: 1
            });

            // Известные игроку контейнеры в инвентаре и локации
            for (var i = 0; i < objects.length; i++) {
                object = getObject(objects[i].what);
                availableObjects.push(object);
                availableObjectsIds.push(getId(object));
            }

            var examinedObjects = protagonist.object.what_he_exam.now;

            for (i = 0; i < examinedObjects.length; i++) {
                container    = getObject(examinedObjects[i]);
                containerId  = getObject(examinedObjects[i]);

                if (getId(containerId) == position.ID) {
                    continue;
                }

                content = container.getContent();

                for (var k = 0; k < content.length; k++) {
                    object = content[k].what;
                    id = getId(object);

                    if (availableObjectsIds.indexOf(id) < 0) {
                        availableObjects.push(object);
                        availableObjectsIds.push(id);
                    }
                }
            }

        },

        /**
         *
         * @param arr
         * @param limit
         * @param level
         * @param fields
         * @param x
         * @returns {string}
         */
        arrToStr = function (arr, limit, level, fields, x) {
            if (level === undefined) {
                level = 0;
            }
            if (x === undefined) {
                x = '';
            }

            level++;

            if (limit !== undefined && level > limit) {
                return '';
            }

            var result = '';

            for (var key in arr) {
                if (arr.hasOwnProperty(key)) {
                    if (fields !== undefined && fields.indexOf(key) == -1) {
                        continue;
                    }

                    var value = arr[key];

                    result += '' + x + key + ': ';

                    if (typeof value === 'object') {
                        if (isGameObject(value)) {
                            result += '#' + getID(value) + '\n';
                        } else {
                            result += arrToStr(value, limit, level, fields, x + '    ');
                        }
                    } else if (typeof(value) == 'function') {
                        result += 'function(...)\n';
                    } else {
                        result += value + '\n';
                    }
                }
            }

            return result;
        },

        /**
         *
         * @param param
         * @param addNull
         * @returns {*}
         */
        anyToArr = function (param, addNull) {
            if (param === undefined) {
                param = (addNull == false ? [] : [null]);
            } else if (param === null) {
                param = (addNull == false ? [] : [null]);
            } else if (typeof param === 'string') {
                param = (param.trim() === '' && addNull == false) ? [] : [param];
            } else if (typeof param === 'number') {
                param = [param];
            } else if (typeof param === 'object') {
                if (param.length === undefined) {
                    param = [param];
                } else if (isGameObject(param) === true) {
                    param = [param];
                }
            }

            return param;
        },

        // РАБОТА С БАЗОВЫМИ ОБЪЕКТАМИ
        /**
         * Добавляем объект в "objectsList", чтобы можно было всегда получить по строковому ID сам объект.
         * @param id
         * @param object
         * @returns {*}
         */
        addObject = function(id, object) {
            id = id.trim().toUpperCase();

            if (objectsList[id] !== undefined) {
                console.error('Объект с ID "' + id + '" уже есть в базе!');
                return null;
            }

            objectsList[id] = object;

            return id;
        },

        /**
         *
         * @param id
         * @param error
         * @returns {*}
         */
        getObject = function(id, error) {
            var object;

            id = id || null;

            if (error === undefined) {
                error = false;
            }

            if (id !== null) {
                if (typeof id === 'string') {
                    object = objectsList[ id.trim().toUpperCase() ];
                } else if (isGameObject(id) == true) {
                    object = id;
                }
            }

            if (object === null && error == true) {
                console.error('Объект с ID "' + id + '" не найден!');
            }

            return object;
        },

        /**
         *
         * @param object
         * @param error
         * @returns {*}
         */
        getId = function(object, error) {
            if (error === undefined) {
                error = false;
            }

            object = object || null;

            if (object != null) {
                if (typeof object === 'string') {
                    object = objectsList[ object.trim().toUpperCase() ];
                } else if (isGameObject(object) == false) {
                    object = null;
                }
            }

            if (object != null) {
                return object.ID;
            } else {
                if (error ==  true) {
                    console.error('Объект с "' + object + '" не найден!');
                }
                return null;
            }
        },

        /**
         *
         * @param object
         * @returns {boolean}
         */
        isGameObject = function(object) {
            if (typeof object === 'string') {
                object = getObject(object);
            } else if (object.isObject !== true) {
                object = null;
            }

            return object != null;
        },

        /**
         *
         * @param obj1
         * @param obj2
         * @returns {boolean}
         */
        isEqual = function(obj1, obj2) {
            var id = getId(obj1);

            return !!(id != null && id == getId(obj2));
        },

        /**
         * 
         * @param object
         * @returns {boolean}
         */
        isAvailable = function(object) {
            var id = getId(object);

            if (id == null) {
                return false;
            }

            return availableObjectsIds.indexOf(id) != -1;
        },

        // РАБОТА С ОБЪЕКТАМИ ИГРЫ

        /**
         * 
         * @param character
         */
        setProtagonist = function(character) {
            if (!character) {
                console.error('Передан пустой персонаж!');
            } else {
                protagonist.object = getObject(character);
                protagonist.ID     = getId(protagonist.object);
                
                var loc = protagonist.object.container.where();
                
                if (loc != null) {
                    setLocation(loc);
                }
            }
        },

        /**
         * 
         * @param id
         * @returns {null}
         */
        getProtagonist = function(id) {
            id = id || false;

            return protagonist.object == null ? null : id == false ? protagonist.object : protagonist.id;
        },

        /**
         * 
         * @param location
         */
        moveProtagonist = function(location) {
            setLocation(location);
            setProperty('turns.loc', 0);
        },

        /**
         * 
         * @param _location
         */
        setLocation = function(_location) {
            var loc = getObject(_location);

            if (loc == null) {
                position.object = null;
                position.id     = null;
            } else {
                position.object = loc;
                position.id     = getId(loc);
            }
        },

        /**
         * 
         * @param id
         * @returns {null}
         */
        getLocation = function(id) {
            id = id || false;

            return position.object == null ? null : id == false ? position.object : position.id;
        },

        startNewTurn = function() {
            AUTOCOMPLETE.init();

            updateAvailableObjects();

            if (DEBUG.isEnable() == true) {
                DEBUG.updatePanelForObjects();
            }

            // Данная команда должна идти в самом конце, чтобы все изменения (по событиям, например), происходили на предыдущем слое.
            layers.add();
        },

        getAvailableObjects = function (idsOnly) {
            return !idsOnly ? getAvailableObjects.slice() : availableObjectsIds.slice();
        };

    // Инициализация параметров, которые должны сохраняться в игровой сессии
    setProperty('turns.all', 0);
    setProperty('turns.loc', 0);

    return {
        addObject: addObject,
        getObject: getObject,
        getId: getId,
        isGameObject: isGameObject,
        isEqual: isEqual,
        isAvailable: isAvailable,
        setProtagonist: setProtagonist,
        getProtagonist: getProtagonist,
        moveProtagonist: moveProtagonist,
        setLocation: setLocation,
        getLocation: getLocation,
        startNewTurn: startNewTurn,
        getAvailableObjects: getAvailableObjects,
        arrToStr: arrToStr,
        anyToArr: anyToArr
    };
});
