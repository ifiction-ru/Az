define(['modules/az-objects'], function (objects) {
    'use strict';

    /**
     * Объявление объекта с типом "Персонаж"
     * @param id
     * @constructor
     */
    var Character = function (id) {
        objects.Simple.apply(this, arguments);

        this.type       = 'character'; // Тип данных
        this.whatHeSaw  = { // Перечень увиденных персонажем объектов
            now:  [],
            past: []
        };
        this.whatHeExamined = { // Перечень осмотренных персонажем контейнеров
            now:  [],
            past: []
        };
    };

    Character.prototype = Object.create(objects.Simple.prototype);
    Character.prototype.constructor = Character;

    Character.prototype.assignAsCurrent = function () {
        AZ.setProtagonist(this);
    };

    Character.prototype.markContainerAsExamined = function(container) {
        var id = AZ.getID(container);

        if (id == null) {
            return false;
        }

        if (this.whatHeExamined.now.indexOf(id) < 0) {
            this.whatHeExamined.now.push(id);
        }

        if (this.whatHeExamined.past.indexOf(id) < 0) {
            this.whatHeExamined.past.push(id);
        }

        return true;
    };

    return Character;
});

