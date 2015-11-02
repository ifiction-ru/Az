/*
 Объект "AUTOCOMPLETE" предназначен для формирования перечня слов для автодополнения при вводе текстовых команд.
 Данный объект используется:
      1. При заполнении словаря (az-dictionary) — с помощью флагов "-" и "+" у существительных,
          глаголов и предлогов можно указывать нужно ли включать те или иные словоформы в автодополнение.
      2. При отладке (az-debug) для вывода перечня слов для целей отладки.

 Принцип работы:
      Данный объект предоставляет функцию "setCharsMin", с помощью которой автор может указывать
      минимальное число символов для формирования перечня
      В процессе препарсинга вводимой игроком команды объект AUTOCOMPLETE формирует два списка: полный и краткий.
          Полный список   -   содержит все слова независимо от числа введённых символов.
          Краткий список  -   содержит ограниченный перечень слов, с учётом минимального числа символов для формирования
                              перечня автодополнения.
      Также объект содержит функцию "getActionFlag", которая возвращает true, если введённая команда может быть выполнена.
*/

define(['modules/az-utils', 'libs/taffy'], function (utils, Taffy) {
    'use strict';

    var acData,
        acMorphs,
        acExclude,
        acAction,
        acChars = 0,

        /*
         Формат базы данных "db_autocomplete":
         bid     Уникальный числовой идентификатор слова
         fid     Числовой идентификатор формы-автодополнения
         inc     Включать или нет слово в автодополнение
         */

        dbAutocomplete = Taffy(),

        /**
         * Инициализация данных модуля. Вызывается в модуле parser в функции препарсинга.
         * @param bidsList
         */
        init = function (bidsList) {
            acData = [];
            acData.push({
                list: {
                    full:  [],
                    'Г':   [],
                    'С':   [],
                    other: []
                }
            });
            acData.push({
                list: {
                    full:  [],
                    'Г':   [],
                    'С':   [],
                    other: []
                }
            });

            _start(0);
            _start(1);

            if (bidsList === undefined) {
                acExclude = [];
            } else {
                acExclude = dbAutocomplete({
                    bid: bidsList,
                    inc: false
                }).select('fid');
            }

            acMorphs = {};
            acAction = false;
        },

        /**
         * Добавление слова в перечень автодополнения.
         * @param list
         * @param word
         * @param morph
         */
        _add = function (list, word, morph) {
            var lst = (morph == 'Г' || morph == 'С') ? list[morph] : list['other'];

            if (lst.indexOf(word) < 0) {
                lst.push(word);
                acMorphs[word] = morph;
            }
        },

        /**
         * Итоговая сортировка внутренних массивов слов (по части речи) и формирование общего перечня.
         * @param list
         */
        _sort = function (list) {
            list['Г'].sort();
            list['С'].sort();
            list['other'].sort();
            list['full'] = list['Г']
                .concat(list['С']
                .concat(list['other']));
        },

        /**
         * Начало выборки перечня слов. Параметр: 0 - полный список, 1 - краткий.
         * @param type
         */
        _start = function (type) {
            acData[type].position = -1;
            acData[type].word     = '';
            acData[type].morph    = '';
        },

        /**
         * Исключение (в основном) слова в автодополнение. Вызывается из модуля dictionary.
         * @param bid
         * @param fid
         * @param inc
         */
        addWordWithFlag = function (bid, fid, inc) {
            var search = {
                bid: bid,
                fid: fid
            };

            // Ищем, нет ли уже такой связки
            var rec = dbAutocomplete(search).first();

            if (rec == false) {
                search.inc = inc;
                dbAutocomplete.insert(search);
            }
        },

        /**
         * Получение перечня словоформ с учётом исключаемых из автодополнения. Вызывается из модуля parser.
         * @param bid
         * @returns {*}
         */
        getByBid = function (bid) {
            return dbAutocomplete({
                bid: bid,
                inc: true
            }).get();
        },

        /**
         * Установка минимального числа символов для формирования краткого перечня автодополнения. Используется АВТОРОМ.
         * @param quantity
         * @returns {number}
         */
        setCharsMin = function (quantity) {
            if (arguments.length == 0) {
                return acChars;
            } else {
                acChars = (quantity || 0);
            }
        },

        /**
         * Добавление словоформы в перечень автодополнения. Вызывается из модуля parser.
         * @param str
         * @param fid
         * @param word
         * @param morph
         */
        add = function (str, fid, word, morph) {
            if (acExclude.indexOf(fid) >= 0) {
                return;
            }

            _add(acData[0].list, word, morph);

            if (str.length >= acChars) {
                _add(acData[1].list, word, morph);
            }
        },

        /**
         * Сортировка полного и краткого перечней слов для автодополнения. Вызывается из модуля parser.
         */
        sort = function() {
            _sort(acData[0].list);
            _sort(acData[1].list);
        },

        /**
         * Начало выборки слов автодополнения. Параметр: 0 — из полного перечня, 1 — из краткого перечня (с учётом минимального числа символов).
         * @param type
         */
        start = function(type) {
            if (type === undefined) {
                _start(0);
                _start(1);
            } else {
                _start(type);
            }
        },

        /**
         * Сдвижка позиции выборки перечня слов автодополнения. Параметр: 0 — из полного перечня, 1 — из краткого перечня (с учётом минимального числа символов).
         * @param type
         * @returns {boolean}
         */
        next = function(type) {
            type = type || 0;
            acData[type].position++;

            var pos  = acData[type].position,
                list = acData[type].list['full'];

            if (pos >= list.length) {
                return false;
            }

            acData[type].word  = list[pos];
            acData[type].morph = acMorphs[acData[type].word];

            return true;
        },

        /**
         * Получение слова из текущей позиции выборки. Параметр: 0 — из полного перечня, 1 — из краткого перечня (с учётом минимального числа символов).
         * @param type
         * @returns {*}
         */
        word = function(type) {
            type = type || 0;

            return acData[type].word;
        },

        /**
         * Получение части речи слова из текущей позиции выборки. Параметр: 0 — из полного перечня, 1 — из краткого перечня (с учётом минимального числа символов).
         * @param type
         * @returns {*}
         */
        morph = function(type) {
            type = type || 0;

            return acData[type].morph;
        },

        /**
         * Установка признака возможного выполнения команды игрока. Вызывается из модуля parser.
         */
        setActionFlag = function() {
            acAction = true;
        },

        /**
         * Получение признака возможного выполнения команды игрока.
         * @returns {boolean}
         */
        getActionFlag = function() {
            return acAction == true;
        };

    init();

    return {
        init:            init,
        addWordWithFlag: addWordWithFlag,
        getByBid:        getByBid,
        setCharsMin:     setCharsMin,
        add:             add,
        sort:            sort,
        start:           start,
        next:            next,
        word:            word,
        morph:           morph,
        setActionFlag:   setActionFlag,
        getActionFlag:   getActionFlag
    };
});
