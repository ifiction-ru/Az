define(['modules/az-utils', 'modules/az-engine', 'modules/az-descriptions', 'modules/az-mentions',
        'modules/az-containers', 'modules/az-dictionary', 'modules/az-parser', 'modules/az-properties'],
    function (utils, engine, Description, Mentions, containers, dict, parser, properties) {
        'use strict';

        /**
         * Простейший объект игры.
         * @constructor
         * @param id
         */
        var Simple = function (id) {
            var type = 'object',
                objectId = engine.addObject(id, this), //Строковый ID объекта
                description = new Description(this),
                mentions = new Mentions(this),
                container = new containers.Container(this); // Контейнер объекта

            this.actionsList = []; // Перечень обработчиков действий. Индекс массива используется как ID обработчика.

            Object.defineProperty(this, 'isObject', {configurable: false, writable: false, value: true});
            Object.defineProperty(this, 'id', {configurable: false, writable: false, value: objectId});

            //this.properties       = new tProperties(this); // Свойства объекта

            Object.defineProperty(this, 'description', {configurable: false, writable: false, value: description});
            Object.defineProperty(this, 'mentions', {configurable: false, writable: false, value: mentions});
            Object.defineProperty(this, 'container', {configurable: false, writable: false, value: container});
        };

        // ОБЩИЕ МЕТОДЫ

        // Функция сравнивает переданный параметр с идентификатором объекта.
        // Возвращает true или false.
        Simple.prototype.is = function (id) {
            return engine.getId(id) == this.id;
        };

        Simple.prototype.addMention = function (purpose, object, text) {
            this.mentions.add(purpose, object, text);
        };

        Simple.prototype.getMention = function (purpose, where) {
            return this.mentions.get(purpose, where);
        };

        Simple.prototype.setDescription = function (title, description, listInside) {
            this.description.set(title, description, listInside);
        };

        Simple.prototype.setPrefixForContent = function () {
            this.description.setPrefix.apply(this.description, arguments);
        };

        Simple.prototype.getPrefixForContent = function () {
            return this.description.getPrefix.apply(this.description, arguments);
        };

        Simple.prototype.getTitle = function () {
            return this.description.getTitle.apply(this.description, arguments);
        };

        Simple.prototype.getDescription = function () {
            return this.description.getText.apply(this.description, arguments);

        };

        Simple.prototype.isAvailable = function () {
            return engine.isAvailable(this.id);
        };

        /* --------------------------------------------------------------------------- */
        // РАБОТА С МЕСТОНАХОЖДЕНИЕМ ОБЪЕКТОВ
        //--------------------------------------------------

        // Помещает объект в контейнер. Параметры: КУДА, <КОЛИЧЕСТВО = 1>
        Simple.prototype.put = function () {
            return this.container.put.apply(this.container, arguments);
        };

        // Убирает объект из контейнера. Параметры: ОТКУДА, <КОЛИЧЕСТВО = ВСЁ>
        Simple.prototype.remove = function () {
            return this.container.remove.apply(this.container, arguments);
        };

        // Перемещает объект из одного контейнера в другой. Параметры: ОТКУДА, КУДА, <КОЛИЧЕСТВО = ВСЁ> / КУДА, <КОЛИЧЕСТВО = ВСЁ>
        Simple.prototype.move = function () {
            return this.container.move.apply(this.container, arguments);
        };

        Simple.prototype.Where = function (_as_array) {
            return this.container.where.apply(this.container, arguments);
        };

        Simple.prototype.isThere = function () {
            return this.container.isThere.apply(this.container, arguments);
        };

        Simple.prototype.includes = function () {
            return this.container.includes.apply(this.container, arguments);
        };

        Simple.prototype.getContent = function () {
            return this.container.getContent.apply(this.container, arguments);
        };

        /* --------------------------------------------------------------------------- */
        // РАБОТА СО СВОЙСТВАМИ ОБЪЕКТОВ
        //--------------------------------------------------

        Simple.prototype.property = function () {
            properties.create.apply(this, arguments);
        };

        /* --------------------------------------------------------------------------- */
        // РАБОТА С ПАРСЕРОМ
        //--------------------------------------------------

        Simple.prototype.notation = function (words, locations, numbers) {
            // Проверка на заполненность и корректность параметров
            words = engine.anyToArr(words, true);
            locations = engine.anyToArr(locations, true);
            numbers = engine.anyToArr(numbers || 'Е');

            for (var i = 0; i < numbers.length; i++) {
                numbers[i] = numbers[i].toUpperCase();
            }

            for (i = 0; i < words.length; i++) {
                var word = dict.getWord(words[i]);

                if (word === null) {
                    console.error('Не найдено слово "' + words[i] + '" для привязки к объекту: ' + this.ID);
                    //dict.dict_absend.push({'word': _words[x], 'morph': 'С', 'object': this});
                    continue;
                }

                var objectId = engine.getId(this);

                for (var j = 0; j < locations.length; j++) {
                    parser.addLinkToObject({
                        obj: objectId,
                        priority: 0,
                        loc: (!locations[i] ? null : engine.getId(locations[i])),
                        wid: word.bid,
                        nums: numbers
                    });
                }
            }

            return true;
        };

        Simple.prototype.action = function (options, execute) {
            // Проверка на заполненность и корректность параметров
            //if (!options.ACT) { return; } // end if
            if ((execute || null) === null) {
                console.error('У объекта "' + this.ID + '" при добавлении действия нет модуля!');
                // Ошибка. Нет модуля действия!
                return;
            }

            this.actionsList.push(execute);

            var actionId = this.actionsList.length,
                objectId = engine.getId(this.ID),
                optrec,
                verbs,
                locations,
                word,
                priority,
                data;

            options = any2arr(options, true);

            for (var iOpt = 0; iOpt < options.length; iOpt++) {
                optrec = options[iOpt];
                verbs = engine.anyToArr(optrec['глагол'], true);
                locations = engine.anyToArr(optrec['где'], true);

                data = [
                    null,
                    optrec['А'] === undefined ? null : any2arr(optrec['А'], true),
                    optrec['Б'] === undefined ? null : any2arr(optrec['Б'], true),
                    optrec['В'] === undefined ? null : any2arr(optrec['В'], true)
                ];

                for (var iVerb = 0; iVerb < verbs.length; iVerb++) {
                    var verbId = null;

                    if (!verbs[iVerb]) {
                        word = dict.getWord(verbs[iVerb]);
                        if (word === null) {
                            console.error('У объекта "' + this.ID + '" в качестве глагола указано неизвестное слово: "' + verbs[iVerb] + '"!');
                            //DICTIONARY.dict_absend.push({'word': verb, 'morph': 'Г', 'object': this});
                            continue;
                        }

                        verbId = word.bid;
                    }

                    for (var iLoc = 0; iLoc < locations.length; iLoc++) {
                        var locId = engine.getId(locations[iLoc], false),
                            haveNotNull = false;

                        // Добавить проверку, чтобы объект не мог повторяться в полях А, Б и В. Должен быть в каком-то одном!
                        for (priority = 1; priority <= 3; priority++) {
                            if (data[priority] !== null) {
                                haveNotNull = true;
                                break;
                            }
                        }

                        if (haveNotNull == false) {
                            parser.addLinkToObject({
                                obj: objectId,
                                priority: 1,
                                loc: locId,
                                vid: verbId,
                                action: actionId
                            });

                            continue;
                        }

                        var recList = [],
                            priorityAll = null,
                            priorityObj = null,
                            recData = [];

                        for (priority = 1; priority <= 3; priority++) {
                            var objData = data[priority];

                            if (objData === null) {
                                continue;
                            }

                            var recElems = [];

                            for (var iObj = 0; iObj < objData.length; iObj++) {
                                var rec = objData[iObj];

                                if (!rec) {
                                    //parser.addLinkToObject({'obj':object_id, 'priority':priority, 'loc':loc_id, 'vid':verb_id, 'action':action_id});
                                    recElems.push(null);
                                    priorityAll = priority;
                                } else if (typeof(rec) == 'string') {
                                    word = dict.getWord(rec);

                                    if (word === null) {
                                        console.error('У объекта "' + this.ID + '" в качестве связки указано неизвестное слово: "' + rec + '"!');
                                        continue;
                                    }

                                    //PARSER.addLinkToObject({'obj':object_id, 'priority':priority, 'loc':loc_id, 'vid':verb_id, 'wid':word.bid, 'action':action_id});
                                    recElems.push({
                                        wid: word.bid,
                                        fid: word.fid
                                    });
                                    priorityAll = priority;
                                } else if (typeof(rec) == 'object') {// end if
                                    if (engine.isGameObject(rec) === true) {
                                        var recId = engine.getId(rec);

                                        //var data_tmp = {'obj':object_id, 'priority':priority, 'loc':loc_id, 'vid':verb_id, 'action':action_id};
                                        //data_tmp['to'+priority] = rec_id;
                                        //parser.addLinkToObject(data_tmp);

                                        var dataTemp = {};

                                        dataTemp['to' + priority] = recId;
                                        recElems.push(dataTemp);

                                        if (recId == objectId) {
                                            priorityObj = priority;
                                        }

                                    } else if (rec.length === undefined) {
                                        var prepsList = engine.anyToArr(rec['предлоги'], true),
                                            wordsList = engine.anyToArr(rec['слова'], true);

                                        for (var iPrep = 0; iPrep < prepsList.length; iPrep++) {
                                            var prep = dict.getWord(prepsList[iPrep]);

                                            if (prep === null) {
                                                console.error('У объекта "' + this.ID + '" в качестве предлога указано неизвестное слово: "' + prepsList[iPrep] + '"!');

                                                continue;
                                            }

                                            for (var iWord = 0; iWord < wordsList.length; iWord++) {
                                                word = wordsList[iWord];

                                                if (typeof(word) == 'string') {
                                                    word = dict.getWord(word);

                                                    if (word === null) {
                                                        console.error('У объекта "' + this.ID + '" в качестве слова-отсылки указано неизвестное слово: "' + word + '"!');
                                                        return;
                                                    }

                                                    recElems.push({'pid': prep.bid, 'wid': word.bid, 'fid': word.fid});
                                                } else if (typeof(word) == 'object' && word !== null) {
                                                    if (engine.isGameObject(word) == true) {
                                                        var e = {
                                                            pid: prep.bid
                                                        };

                                                        e['to' + priority] = engine.getId(word);
                                                        recElems.push(e);
                                                    }
                                                }
                                            }
                                        }

                                        priorityAll = priority;
                                    }
                                }
                            }

                            recData[priority] = recElems;
                        }

                        var fillElem = function (rec, data, key) {
                            if ((data[key] !== undefined) && (rec[key] === undefined)) {
                                rec[key] = data[key];
                            }
                        };

                        var fillData = function (priority, data, rec) {
                            var elemsList = data[priority];

                            if (elemsList === undefined) {
                                if (priority < 3) {
                                    fillData(priority + 1, data, rec);
                                } else {
                                    parser.addLinkToObject(rec);
                                }
                            } else {
                                for (var iElem = 0; iElem < elemsList.length; iElem++) {
                                    var elem = elemsList[iElem];

                                    //if (priority == 1) {rec = {};} // end if
                                    var rec2 = arr2arr(rec);

                                    fillElem(rec2, elem, 'pid');
                                    fillElem(rec2, elem, 'wid');
                                    fillElem(rec2, elem, 'fid');
                                    fillElem(rec2, elem, 'to1');
                                    fillElem(rec2, elem, 'to2');
                                    fillElem(rec2, elem, 'to3');

                                    if (priority < 3) {
                                        fillData(priority + 1, data, rec2);
                                    } else {
                                        parser.addLinkToObject(rec2);
                                    }
                                }
                            }
                        };

                        fillData(1, recData, {
                            obj: objectId,
                            priority: priorityObj !== null ? priorityObj : priorityAll,
                            loc: locId,
                            vid: verbId,
                            action: actionId
                        });

                    }
                }
            }

            return true;
        };

        /**
         * Объявление объекта с типом "Location"
         * @param id
         * @constructor
         */
        var Location = function (id) {
            Simple.apply(this, arguments);
        };

        Location.prototype = Object.create(Simple.prototype);
        Location.prototype.constructor = Location;

        /**
         * Объявление объекта с типом "Объект" (предмет)
         * @param id
         * @constructor
         */
        var Item = function (id) {
            Simple.apply(this, arguments);
        };

        Item.prototype = Object.create(Simple.prototype);
        Item.prototype.constructor = Item;

        return {
            Simple: Simple,
            Location: Location,
            Item: Item
        };
    });
