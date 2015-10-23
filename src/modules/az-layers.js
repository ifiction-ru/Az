define(function () {
    'use strict';

    /*
        Параметры Слой сохранения данных. Используется для реализации возможности сохранения.
        0 - Заполнение при инициализации.
        1 - Переназначение в процессе игры.
        2..N - Переназначение в процессе последнего хода.
    */

    var current = 0, // Номер текущего слоя сохранения данных
        settings = {
            limit: 10 // Максимальное число команды "Отмена" + 1
        },
        // Список модулей-обработчиков
        modules = {
            move: [],
            cut:  []
        },

        move = function (db, sort, fields) {
            // Если текущий слой 0 или 1, то сворачивать смысла нет.
            if (current < 2) {
                return;
            }

            var list = db({
                    'layer': { '>' : 1 }
                })
                    .order(sort + ', layer asec')
                    .get();

            for (var i = 0; i < list.length; i++) {
                var record = list[i],
                    filter = {};

                for (var key in fields) {
                    filter[key] = record[key];
                }

                filter['layer'] = record.layer - 1;
                db(filter).remove();
                db(record).update({
                    'layer': (record.layer - 1)
                });
            }
        },

        set = function(db, filter, value) {
            var search = filter.slice(),
                rec;

            search.layer = current;
            rec = db(search).first();

            if (!rec) {
                db(search).update(value);
            } else {
                for (var key in value) {
                    search[key] = value[key];
                }

                db.insert(search);
            }
        },

        /**
         *
         * @param db База данных (TAFFY)
         * @param filter Фильтр поиска, измерения в виде объект: {поле: значение}
         * @param field Наименование поля, откуда нужно брать возвращаемое значение. Если строка — то значение, если массив — то объект {поле: значение}.
         * @param defaultValue Возвращаемое значение, если запись не найдена.
         * @returns {*}
         */

        get = function(db, filter, field, defaultValue) {
            var rec = db(filter)
                .order('layer desc')
                .first();

            if (rec == false) {
                return defaultValue;
            } else {
                if (typeof field === 'string') {
                    return rec[field];
                } else {
                    var result = {};

                    for (var i = 0; i < field.length; i++) {
                        result[field[i]] = rec[field[i]];
                    }

                    return result;
                }
            }
        },

        /*
            РАБОТА СО СЛОЯМИ ДАННЫХ
        */

        addHandler = function(type, data) {
            modules[ type.trim().toLowerCase() ].push(data);
        },

        add = function () {
            current++; // Увеличиваем счётчик слоёв

            // Если счётчик слоёв превышает максимальное значение
            if (current > limit) {
                // запускаем модули сдвижки слоёв
                for (var i = 0; i < modules.move.length; i++) {
                    var rec = modules.move[i];

                    move(rec.db, rec.sort, rec.filter);
                }

                current = limit; // Присваиваем счётчику слоёв максимально возможное значение
            }
        },

        cut =  function () {
            // TODO: Сделать сдвижку слоёв на нужное число, чтобы в итоге осталось равное limit
        };

    return {
        settings: settings,
        set: set,
        get: get,
        add: add,
        cut: cut,
        addHandler: addHandler
    }
});
