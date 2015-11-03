define(['modules/az-utils', 'modules/az-layers', 'modules/az-engine', 'modules/az-events', 'libs/taffy'], function (utils, layers, engine, events, Taffy) {
    'use strict';

    /* Формат базы данных "dbArrangement":
     layer       Номер слоя данных
     what        Уникальный идентификатор объекта (что)
     where       Уникальный идентификатор объекта-содержимого (где)
     quantity    Количество (сколько)
     */
    var dbArrangement = Taffy(),

        // Записываем в БД данные СКОЛЬКО ЧЕГО ГДЕ
        /**
         * Записывает в БД данные СКОЛЬКО ЧЕГО ГДЕ
         * @param what
         * @param where
         * @param quantity
         * @returns {boolean}
         */
        set = function (what, where, quantity) {
            layers.set(dbArrangement, {
                what: what,
                where: where
            }, {
                quantity: quantity
            });

            return true;
        },

        /**
         * Получает из БД данные СКОЛЬКО ЧЕГО ГДЕ
         * @param what
         * @param where
         * @returns {*}
         */
        get = function (what, where) {
            return layers.get(dbArrangement, {
                what: what,
                where: where
            }, 'quantity', 0);
        },

        /**
         *
         * @param what
         * @param where
         * @param quantity
         * @param removeAll
         * @returns {boolean}
         */
        remove = function (what, where, quantity, removeAll) {
            //if (what == null || where == null) {return false;} // end if

            // Обрабатываем параметр "Удалить всё"
            removeAll = removeAll || false;

            var howMany;

            if (quantity === undefined) {
                removeAll = true;
            }

            if (removeAll == true) {
                set(what, where, 0);
            } else {
                howMany = get(what, where);
                set(what, where, Math.max(0, howMany - quantity));
            }

            return true;
        },

        /**
         * Функция вызывается из методов REMOVE и MOVE объекта и предназачена для проверки параметра ОТКУДА. Он может быть незаполнен,
         * тогда нужно удалять объект отовсюду, а следовательно нужен перечень контейнеров.
         * @param what
         * @param where
         * @returns {*}
         */
        checkParamWhere = function (what, where) {
            var result = null;

            if (where == null) {
                result = getWhere(what);
            } else {
                result = [ {
                    what: what,
                    where: where
                } ];
            }

            return result;
        },

        /**
         *
         * @param where
         * @returns {Array}
         */
        getContent = function (where) {
            if (where == null) {
                return [];
            }

            var result = [], // Перечень результатов
                list = []; // Перечень уже добавленных объектов (чтобы пропускать нижние слои)

            dbArrangement({
                where: where,
                quantity: { '>': 0 }
            })
                .order('what asec, layer desc')
                .each(function (rec) {
                    if (list.indexOf(rec.what) < 0) {
                        result.push({
                            what: rec.what,
                            where: where,
                            quantity: rec.quantity
                        });
                        list.push(rec.what);
                    }
                });

            return result;
        },

        /**
         *
         * @param what
         * @returns {Array}
         */
        getWhere = function (what) {
            if (what == null) {
                return [];
            }

            var result = [], // Перечень результатов
                list = []; // Перечень уже добавленных объектов (чтобы пропускать нижние слои)

            dbArrangement({
                what: what,
                quantity: { '>': 0 }
            })
                .order('where asec, layer desc')
                .each(function (rec) {
                    if (list.indexOf(rec.where) < 0) {
                        result.push({
                            what: what,
                            where: rec.where,
                            quantity: rec.quantity
                        });
                        list.push(rec.where);
                    }
                });

            return result;
        },

        /**
         *
         * @param object Объект-владелец модуля контейнеров
         * @constructor
         */
        Container = function (object) {
            var owner = engine.getId(object); // Объект-владелец модуля контейнеров. Сразу запоминаем ID, потому как сам объект особо и не нужен.

            Object.defineProperty(this, 'OWNER', { configurable: false, writable: false, value: owner });
        };

    layers.addHandler('move', {
        db: dbArrangement,
        sort: 'what asec, where asec',
        filter: [ 'what', 'where' ]
    });

    Container.prototype.put = function (where, quantity) {
        // Приводим переданный объект к однозначному значению, содержащему идентификатор
        where = engine.getId(where);

        if (where == null) {
            console.error('Не указан объект для помещения в контейнер!');
            return false;
        }

        quantity = quantity || 1;

        // Запись для события "Перед удалением объекта"
        var event = {
            when: events.BEFORE,
            what: this.OWNER,
            to: where
        };

        // Вызываем событие "Перед добавлением объекта"
        var result = event.checkReactions(events.PUT, event);

        // Если событие вернуло "Отбой", то пропускаем добавление
        if (result == false) {
            return false;
        }

        // Получаем количество, сколько было
        var howMany = get(this.OWNER, where);

        // Устанавливаем новое количество
        set(this.OWNER, where, (howMany + quantity));

        // Если помещаем куда-либо ГЕРОЯ игры, то меняем его локацию.
        if (this.OWNER == engine.getProtagonist(true)) {
            engine.moveProtagonist(where);
        }

        // Дополняем запись для события "ПОСЛЕ добавления объекта"
        event['when'] = events.AFTER;
        // Вызываем событие "ПОСЛЕ добавления объекта"
        events.checkReactions(events.PUT, event);

        return true;
    };

    /**
     *
     * @param where
     * @param quantity
     * @returns {boolean}
     */
    Container.prototype.remove = function (where, quantity) {
        if (typeof where === 'number') {
            quantity = where;
            where = null;
        } else if (where === undefined) {
            where = null;
        }

        var removeAll = quantity === undefined,
            fromList = checkParamWhere(this.OWNER, engine.getId(where)), // Список объектов, откуда нужно удалить объект
            counter = fromList.length, // Счётчик необходимых удалений
            event = { what: this.OWNER},
            result; // Запись для события "Перед удалением объекта"

        for (var i = 0; i < fromList.length; i++) {
            // Дополняем запись для события "ПЕРЕД удалением объекта"
            event.when = events.BEFORE;
            event.from = fromList[i].where;

            // Вызываем событие "Перед удалением объекта"
            result = events.checkReactions(events.REMOVE, event);

            // Если событие вернуло "Отбой", то пропускаем удаление
            if (result == false) {
                continue;
            }

            remove(this.OWNER, fromList[i].where, quantity, removeAll);

            // Если убираем откуда-либо ГЕРОЯ игры, то очищаем его локацию.
            if (this.OWNER == engine.getProtagonist(true)) {
                engine.setLocation(null);
            }

            // Дополняем запись для события "ПОСЛЕ удаления объекта"
            event.when = events.AFTER;

            // Вызываем событие "ПОСЛЕ удаления объекта"
            events.checkReactions(events.REMOVE, event);
            counter--;
        }

        if (fromList.length == 0) {
            return false;
        } else {
            // Если хоть одно удаление не прошло, то возвращаем FALSE, иначе TRUE
            return counter == 0;
        }
    };

    /**
     *
     * @param from
     * @param to
     * @param quantity
     * @returns {boolean}
     */
    Container.prototype.move = function (from, to, quantity) {
        var objectFrom,
            objectTo;

        if (arguments.length === 1 || typeof to === 'number') {
            objectFrom = null;
            objectTo = engine.getId(from);
            quantity = to;
        } else {
            objectFrom = engine.getId(from);
            objectTo = engine.getId(to);

            if (objectFrom == null) {
                console.error('Некорректно указано содержимое ("' + from + '"), откуда нужно перемещать объект "' + this.OWNER + '"!');

                return false;
            }
        }

        if (objectTo == null) {
            console.error('Не указано содержимое, куда нужно перемещать объект "' + this.OWNER + '"!');

            return false;
        }

        var removeAll = quantity === undefined,
            fromList = checkParamWhere(this.OWNER, objectFrom), // Список объектов, откуда нужно переместить объект
            success = null,
            event = {
                what: this.OWNER,
                to: objectTo
            }, // Запись для события "ПЕРЕД перемещением объекта"
            listForPut = [],
            where; // Список контейнеров, откуда удалялся объект, для события "ПОСЛЕ перемещения объекта"

        for (var i = 0; i < fromList.length; i++) {
            where = fromList[i].where;

            // Дополняем запись для события "ПЕРЕД перемешением объекта"
            event.when = events.BEFORE;
            event.from = where;

            // Вызываем событие "Перед перемещением объекта"
            var result = events.checkReactions(events.MOVE, event);

            // Если событие вернуло "Отбой", то пропускаем перемещение
            if (result == false) {
                // Отмечаем неудачу, только если нет удачных вариантов.
                if (success == null) {
                    success = false;
                }

                continue;
            }

            remove(this.OWNER, where, quantity, removeAll);
            listForPut.push(where);
            success = true;
        }

        if (success == false) {
            return false;
        }

        // ??? Нужно ли вызывать какое-либо событие после удаления перемещаемого объекта, но до его добавления?
        quantity = quantity || 1;

        // Получаем количество, сколько было
        var howMany = get(this.OWNER, objectTo);

        // Устанавливаем новое количество
        set(this.OWNER, objectTo, (howMany + quantity));

        // Если помещаем куда-либо ГЕРОЯ игры, то меняем его локацию.
        if (this.OWNER == engine.getProtagonist(true)) {
            engine.moveProtagonist(objectTo);
        }

        // Дополняем запись для события "ПОСЛЕ добавления объекта"
        event.when = events.AFTER;
        event.from = listForPut;

        events.checkReactions(events.MOVE, event); // Вызываем событие "ПОСЛЕ добавления объекта"

        return true;
    };

    /**
     *
     * @param asArray
     * @returns {*}
     */
    Container.prototype.where = function (asArray) {
        asArray = asArray || false;

        var whereList = getWhere(this.OWNER);

        // +++ Событие "При получении информации о местонахождении объекта"
        if (whereList.length == 0) {
            return (asArray === true) ? [] : null;
        } else {
            for (var i = 0; i < whereList.length; i++) {
                whereList[i].what = engine.getObject(whereList[i].what);
                whereList[i].where = engine.getObject(whereList[i].where);
            }

            return (asArray === true) ? whereList : whereList[0].where;
        }
    };

    /**
     *
     * @param where
     * @returns {boolean}
     */
    Container.prototype.isThere = function (where) {
        var objectWhere = engine.getId(where);

        if (objectWhere == null) {
            return false;
        }

        var result = get(this.OWNER, objectWhere) > 0;

        // +++ Событие "При проверке наличия объекта в переданном местонахождении"

        return result;
    };

    /**
     *
     * @param what
     * @returns {boolean}
     */
    Container.prototype.includes = function (what) {
        var objectWhat = engine.getId(what);

        if (objectWhat == null) {
            return false;
        }

        var result = get(objectWhat, this.OWNER) > 0;

        // +++ Событие "При проверке нахождения переданного объекта"

        return result;
    };

    Container.prototype.getContent = function (idsOnly) {
        idsOnly = idsOnly || false;

        var result = [],
            content = getContent(this.OWNER),
            heroId = engine.getProtagonist(true);

        for (var i = 0; i < content.length; i++) {
            if (heroId == null) {
                continue;
            }

            // Персонажа игрока в перечень не включаем никогда
            if (heroId == content[i].what) {
                continue;
            }

            if (idsOnly == false) {
                content[i].what = engine.getObject(content[i].what);
                content[i].where = engine.getObject(content[i].where);
            }

            result.push(content[i]);
        }

        return result;

    };

    return {
        set: set,
        get: get,
        remove: remove,
        checkParamWhere: checkParamWhere,
        getContent: getContent,
        getWhere: getWhere,

        Container: Container
    };
});