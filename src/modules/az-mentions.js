define(['modules/az-utils', 'modules/az-constants', 'modules/az-engine'], function (utils, cons, engine) {
    'use strict';

    /**
     * Упоминания объекта в разных местах и для разных целей, их может быть несколько.
     * @param ownerObj
     * @constructor
     */
    var Mentions = function (ownerObj) {
        Object.defineProperty(this, 'owner', { configurable: false, writable: false, value: ownerObj });
        this.mentionsList = [];
    };

    /**
     * Добавляет упоминание об объекте
     * @param purpose
     * @param where
     * @param text
     * @returns {boolean}
     */
    Mentions.prototype.add = function (purpose, where, text) {
        // Если параметр "для чего" не заполнен, то приводим его к константе ANYTHING
        if (!purpose) {
            purpose = cons.ANYTHING;
        }

        // Если объект передан строкой-идентификатором, то определяем сам объект
        where = AZ.getID(where);

        // Если параметр "где" пустой, то приводим его к константе ANYTHING
        if (where == null) {
            where = cons.ANYTHING;
        }

        var mention = {
            purpose: purpose,
            where:   where,
            text:    text
        };

        this.mentionsList.push(mention);

        return true;
    };

    /**
     * Получить упоминания
     * @param purpose
     * @param where
     * @returns {*}
     */
    Mentions.prototype.get = function(purpose, where) {
        // Если параметр "для чего" не заполнен, то приводим его к константе ANYTHING
        if (purpose === undefined) {
            purpose = cons.ANYTHING;
        }

        where = AZ.getID(where);

        // Если параметр "где" пустой, то приводим его к константе ANYTHING
        if (where == null) {
            where = cons.ANYTHING
        }

        var mentionForAll         = null,
            mentionForAllObjects  = null,
            mentionForAllPurposes = null,
            mentionForThis        = null,
            mention;

        // Начинаем перебор всех возможных упоминаний объекта
        for (var i = 0; i < this.mentionsList.length; i++) {
            var rec = this.mentionsList[i];

            // Данное упоминание подходит для любых ситуаций
            if (rec.purpose === cons.ANYTHING && rec.where === cons.ANYTHING) {
                mentionForAll = rec;
            // Данное упоминание подходит для любых "для чего" по переданному объекту
            } else if (rec.purpose === cons.ANYTHING && rec.where === where) {
                mentionForAllPurposes = rec;
            // Данное упоминание подходит для любого объекта по переданному "для чего"
            } else if (rec.purpose === purpose && rec.where === cons.ANYTHING) {
                mentionForAllObjects = rec;
            } else if (rec.purpose === purpose && rec.where === where) {
                mentionForThis = rec;
            }
        }

        if (mentionForThis === null) {
            if (mentionForAllPurposes !== null) {
                mentionForThis = mentionForAllPurposes;
            } else if (mentionForAllObjects !== null) {
                mentionForThis = mentionForAllObjects;
            } else if (mentionForAll !== null) {
                mentionForThis = mentionForAll;
            }
        }

        if (mentionForThis === null) {
            return null;
        } else {
            mention = mentionForThis.text;

            if (typeof mention === 'string') {
                return mention;
            } else if (typeof mention === 'function') {
                return mention(purpose, engine.getObject(where));
            }
        }
    };

    return Mentions;
});
