// Модуль-прослойка для оформления игры. Связывает движок с конкретным оформлением.

define(['modules/az-utils', 'modules/az-constants'], function (utils, cons) {
    'use strict';

    /**
     * Движок запрашивает оформление упоминания объекта
     * @param text      текст упоминания
     * @param type      тип упоминания:     0 - в составе описания
     *                                      1 - в составе содержимого
     * @param object    объект, в описании которого используется упоминание
     * @returns {*}
     */
    var getMention = function (text, type, object) {
            // Обработчик из конкретной темы (когда она появится)
            // А пока прописываем всё тут
            if (text.trim() == '') {
                return '';
            } else {
                return (type == 0 ? text : '<p>' + text + '</p>');
            }
        },

        /**
         *
         * @param type
         * @param list
         * @param prefix
         * @returns {string}
         */
        getContent = function (type, list, prefix) {
            var result = '';

            if (list.length == 0) {
                result = prefix[type + 'N'];
            } else {
                result = enumeration.getList( list, prefix[type + length2symbol(list.length)] );
            }

            return result;
        },

        description = {
            getTitle: function  (title, object) {
                return '<h3>' + title + '</h3>';
            },

            getText: function (descr, object) {
                // Типограф
                // Добавляем основной текст описания
                var result  = '<p>' + descr.text + '</p>';

                // Добавляем к тексту упоминания персонажей
                for (var i = 0; i < descr.mentions.characters.length; i++) {
                    result += getMention(descr.mentions.characters[i], 1, null);
                }

                // Добавляем к тексту упоминания прочих объектов
                for (i = 0; i < descr.mentions.items.length; i++) {
                    result += getMention(descr.mentions.items[i], 1, null);
                }

                result += getContent(cons.FOR_ALL, descr.content.full, descr.prefix);

                return result;
            }
        },

        enumeration = {
            getElement: function (text) {
                return text;
            },

            getDelimeter: function (isLast) {
                return (isLast == 0 ? ', ' : ' и ');
            },

            getEnd: function () {
                return '.';
            },

            getPrefix: function (text) {
                return text;
            },

            getBlock: function (text) {
                return '<p>' + text + '</p>';
            },

            getList: function (list, prefix) {
                if (list.length == 0) {
                    return '';
                }

                var result = '',
                    delimMid  = enumeration.getDelimeter(0),
                    delimLast = enumeration.getDelimeter(1);

                for (var i = 0; i < list.length; i++) {
                    var object = list[i].what,
                        title = enumeration.getElement(object.getTitle(null, false));

                    if (result == '') {
                        result = title;
                    } else {
                        result = result + (i == list.length - 1 ? delimLast : delimMid) + title;
                    }
                }

                result = ( prefix == '' ? '' : enumeration.getPrefix(prefix) ) + result;
                result += enumeration.getEnd();
                result = enumeration.getBlock(result);

                return result;
            }
        },

        inventory = {
            get: function () {
                var hero = AZ.getProtagonist();

                return getContent(cons.FOR_ALL, hero.getContent(), hero.getPrefixForContent());
            }
        },

        command = {
            print: function (text) {
                return '<p class="az-story__command">&gt; ' + text + '</p>';
            }
        };

    return {
        getMention:  getMention,
        getContent:  getContent,
        description: description,
        enumeration: enumeration,
        inventory:   inventory,
        command:     command
    };
});
