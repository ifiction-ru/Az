define(['modules/az-objects', 'modules/az-engine'], function (objects, engine) {
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
        engine.setProtagonist(this);
    };

    Character.prototype.markContainerAsExamined = function(container) {
        var id = engine.getId(container);

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

