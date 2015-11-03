/*
 TODO: Добавить проверку наличия объекта в текущем контексте. А лучше фильтр.
 TODO: Добавить прилагательные: возьми золотой кубок // возьми деревянный кубок

 Формат параметров для "objects.Simple.prototype.Описывается":
 2. Перечень: [{words:[слова1], locs:[локации1]}, {words:[слова2], locs:[локации2]}]
 */

define(['modules/az-utils', 'modules/az-engine', 'modules/az-dictionary', 'modules/az-autocomplete', 'libs/taffy'],
function (utils, engine, dict, autocomplete, Taffy) {
    'use strict';

    //var autocomplete  = {};
    var lastParams = {},
        availableObjects = [],
        locId = null,

        /*
         Формат базы данных "dbWordsAndObjects":
         bid         Уникальный числовой идентификатор существительного
         object      Строковый идентификатор объекта
         location    Строковый идентификатор расположения объекта
         */

        dbWordsAndObjects = Taffy(),

        /**
         * Добавляет наречие в перечень наречий
         * @param adverbs
         * @param word
         * @private
         */
        _addAdverb = function (adverbs, word) {
            adverbs.list.push(word);
            adverbs.bids.push(word.bid);
        },

        /**
         * Удаляет наречие из перечня наречий
         * @param adverbs
         * @param word
         * @private
         */
        _removeAdverb = function (adverbs, word) {
            if (word == null) {
                return;
            }

            var pos = adverbs.bids.indexOf(word.bid);

            if (pos >= 0) {
                adverbs.list.splice(pos, 1);
                adverbs.bids.splice(pos, 1);
            }
        },

        /**
         *
         * @param cmd
         * @param priority
         * @param word
         * @param prep
         * @param objRec
         * @param nounsForPronouns
         * @param prOccupied
         * @private
         */
        _setCmdParam = function (cmd, priority, word, prep, objRec, nounsForPronouns, prOccupied) {
            if (cmd.params[priority] === null) {
                cmd.params[priority] = word;
                cmd.params[priority].prep = prep;

                // В перечень последних существительных добавляем только существительные
                if (word.morph == 'С') {
                    nounsForPronouns[word.gender + ':' + priority] = word;
                }

                if (objRec !== null) {
                    cmd.objects[priority] = objRec.object;
                    cmd.actions[priority] = objRec.action;
                }

                prOccupied.push(priority);
            }
        },

        /**
         *
         * @param cmd
         * @param word
         * @param prep
         * @param nounsForPronouns
         * @param prOccupied
         * @returns {*}
         * @private
         */
        _checkParamPriority = function (cmd, word, prep, nounsForPronouns, prOccupied) {
            var prepId = (prep === null ? null : prep.bid),
                priority = dict.getNounPriority(cmd.verb, word, prepId, prOccupied),
                objRec;

            if (priority === null) {
                return null;
            }

            priority = priority['priority'];

            if (priority >= 1 && priority <= 3) {
                objRec = getLinkToObject({
                    priority: priority,
                    loc: locId,
                    vid: cmd.verb.bid,
                    pid: prepId,
                    wid: word.bid
                });

                _setCmdParam(cmd, priority, word, prep, objRec, nounsForPronouns, prOccupied);

                return priority;
            } else {
                return null;
            }
        },

        /**
         * Проверяет, подходит ли предлог существительному по падежу
         * @param noun
         * @param prep
         * @returns {*}
         * @private
         */
        _checkPrepByNoun = function (noun, prep) {
            if (prep == null) {
                return null;
            }

            for (var i = 0; i < prep.cases.length; i++) {
                var prep_case = prep.cases[i];

                if (noun.cases.united.indexOf(prep_case) >= 0) {
                    // is_prep_correct = true;
                    return prep;
                }
            }

            return null;
        },

        /**
         * Примеряет накопившиеся наречия
         * @param cmd
         * @param adverbs
         * @param nounsForPronouns
         * @param prOccupied
         * @private
         */
        _checkAdverbs = function (cmd, adverbs, nounsForPronouns, prOccupied) {
            var objRec = null,
                adverb;

            // Если после разбора фразы остались наречия, которые не были использованы как предлоги
            if (adverbs.list.length > 0) {
                // Перебираем список неразобранных наречий
                for (var i = 0; i < adverbs.list.length; i++) {
                    adverb = adverbs.list[i];
                    objRec = null;

                    // Пытаемся пристроить наречие в порядке приоритета типа: 1-2-3
                    for (var priority = 1; priority <= 3; priority++) {
                        // Если параметр команды данного приоритета не занят...
                        if (prOccupied.indexOf(priority) == -1) {
                            // ...пытаемся опеределить, подходит ли данное слово к какому либо объекту
                            objRec = getLinkToObject({
                                priority: priority,
                                loc: locId,
                                vid: cmd.verb == null ? null : cmd.verb.bid,
                                wid: adverb.bid
                            });

                            if (objRec !== null) {
                                break;
                            }
                        }
                    }

                    if (objRec !== null) {
                        _setCmdParam(cmd, objRec.priority, adverb, null, objRec, nounsForPronouns, prOccupied);
                        _removeAdverb(adverbs, adverb);

                        continue;
                    }

                    if (cmd.verb !== null) {
                        priority = dict.getNounPriority(cmd.verb, adverb, null, prOccupied);
                        if (priority === null) {
                            continue;
                        }

                        priority = priority['priority'];

                        if (priority >= 1 && priority <= 3) {
                            objRec = getLinkToObject({
                                priority: priority,
                                loc: locId,
                                vid: cmd.verb.bid,
                                wid: adverb.bid
                            });

                            _setCmdParam(cmd, priority, adverb, null, objRec, nounsForPronouns, prOccupied);
                            _removeAdverb(adverbs, adverb);
                        }
                    }
                }
            }
        },

        /**
         * Ищет объект по сопоставленным с ним словам с нулевым приоритетом
         * @param cmd
         * @param verbId
         * @param wordId
         * @param priority
         * @returns {*}
         * @private
         */
        _searchObjectByPriority0 = function (cmd, verbId, wordId, priority) {
            //_priority = _priority || 1;
            var maxmin = (priority === undefined ? { min: 1, max: 3 } : { min: priority, max: priority }),
                result = null,

                // Получаем перечень объектов, сопоставленных с переданным словом в текущей локации (или во всех).
                objsList = dbWordsAndObjects({
                    obj: engine.getAvailableObjects(true),
                    priority: 0,
                    loc: [ locId, null ],
                    wid: wordId
                }).get(),

                objRec,
                search,
                actionsList,
                actRec;

            for (var i = 0; i < objsList.length; i++) {
                objRec = objsList[i];

                // Теперь ищем действия с каким-либо приоритетом, где указана ссылка на объект, найденный по слову: to1, to2 или to3
                search = {
                    obj: engine.getAvailableObjects(true),
                    loc: [ locId, null ],
                    vid: verbId
                };

                for (var _priority = maxmin.min; _priority <= maxmin.max; _priority++) {
                    if (cmd.objects[_priority] != null) {
                        continue;
                    }

                    search['to' + _priority] = objRec.obj;

                    // Получаем перечень записей объект + локация + приоритет + глагол
                    actionsList = dbWordsAndObjects(search).get();

                    for (var j = 0; j < actionsList.length; j++) {
                        actRec = actionsList[j];

                        if (actRec != null) {
                            if (actRec.priority == _priority) {
                                cmd.objects[_priority] = engine.getObject(actRec.obj);
                                cmd.actions[_priority] = actRec.action;
                                result = actRec;

                                break;
                            }
                        }
                        //----------
                        if (result != null) {
                            break;
                        }
                    }

                    delete search['to' + _priority];

                    if (result != null) {
                        break;
                    }
                }

                if (result != null) {
                    break;
                }
            }

            return result === null ? null : {
                object: engine.getObject(result.obj),
                priority: result.priority,
                action: result.action
            };
        },

        /**
         *
         * @param options
         * @returns {boolean}
         */
        addLinkToObject = function (options) {
            //_object_id, _priority, _location_id, _verb_id, _prep_id, _word_id, _tobj1, _tobj2, _tobj3, _action_id

            var search = {
                obj: options.obj,
                priority: options.priority,

                loc: options.loc || null,
                vid: options.vid || null,
                pid: options.pid || null,
                wid: options.wid || null,
                fid: options.fid || null,
                to1: options.to1 || null,
                to2: options.to2 || null,
                to3: options.to3 || null
            };

            if ((search.vid && search.pid && search.wid && search.to1 && search.to2 && search.to3) == false) {
                return false;
            }

            var rec = dbWordsAndObjects(search).first();

            if (rec !== false) {
                console.error('У объекта "' + search.obj + '" дублирующий набор параметров действия:');
                console.log(
                    '    1: L:' + rec.loc +
                    ', v:' + (rec.vid == null ? '-' : dict.getBase(rec.vid).base + ' (' + rec.vid + ')') +
                    ', p:' + (rec.pid == null ? '-' : dict.getBase(rec.pid).base + ' (' + rec.pid + ')') +
                    ', w:' + (rec.wid == null ? '-' : dict.getBase(rec.wid).base + ' (' + rec.wid + ')') +
                    ', t1:' + (rec.to1 || '-') +
                    ', t2:' + (rec.to2 || '-') +
                    ', t3:' + (rec.to3 || '-') +
                    ', a:' + rec.action);
                console.log(
                    '    2: L:' + search.loc +
                    ', v:' + (search.vid == null ? '-' : dict.getBase(search.vid).base + ' (' + search.vid + ')') +
                    ', p:' + (search.pid == null ? '-' : dict.getBase(search.pid).base + ' (' + search.pid + ')') +
                    ', w:' + (search.wid == null ? '-' : dict.getBase(search.wid).base + ' (' + search.wid + ')') +
                    ', t1:' + (search.to1 || '-') +
                    ', t2:' + (search.to2 || '-') +
                    ', t3:' + (search.to3 || '-') +
                    ', a:' + options.action);
            } else {
                search['action'] = options.action || null;
                search['nums'] = options.nums || null;

                //if (search.priority == 0) {
                /*console.log(
                 'id:'+search.obj+', t:'+search.priority+', n:'+search.nums+
                 ', L:'+search.loc+
                 ', v:'+(search.vid == null ? '-' : dict.getBase(search.vid).base+' ('+search.vid+')')+
                 ', p:'+(search.pid == null ? '-' : dict.getBase(search.pid).base+' ('+search.pid+')')+
                 ', w:'+(search.wid == null ? '-' : dict.getBase(search.wid).base+' ('+search.wid+')')+
                 ', f:'+(search.fid == null ? '-' : dict.getForm(search.fid).form+' ('+search.fid+')')+
                 ', t1:'+(search.to1 || '-')+
                 ', t2:'+(search.to2 || '-')+
                 ', t3:'+(search.to3 || '-')+
                 ', a:'+search.action);*/
                //}

                dbWordsAndObjects.insert(search);
            }

            return true;
        },

        /**
         *
         * @param options
         * @returns {*}
         * @private
         */
        getLinkToObject = function (options) {
            var priority = options['priority'] || 0,
                L = options['loc'] || null,
                V = options['vid'] || null,
                P = options['pid'] || null,
                W = options['wid'] || null,
            //  F = _options['fid'] || null,
                to1 = options['to1'] || null,
                to2 = options['to2'] || null,
                to3 = options['to3'] || null,

                search = {
                    obj: engine.getAvailableObjects(true),
                    priority: priority,
                    loc: L,
                    vid: V,
                    pid: P,
                    wid: W,
                    to1: to1,
                    to2: to2,
                    to3: to3
                },
                objectId = null,
                actionId = null,
                rec = dbWordsAndObjects(search).first();

            priority = null;

            if (rec == false) {
                search.loc = null;
                rec = dbWordsAndObjects(search).first();
            }

            if (rec != false) {
                objectId = rec.obj;
                priority = rec.priority;
                actionId = rec.action;
            }

            return objectId === null ? null : {
                object: engine.getObject(objectId),
                priority: priority,
                action: actionId
            };
        },

        /**
         *
         * @param search
         * @param morph
         * @returns {Array}
         * @private
         */
        getObjectsByWord = function (search, morph) {
            search.obj = engine.getAvailableObjects(true);

            var list = dbWordsAndObjects(search).get(),
                result = [];

            for (var i = 0; i < list.length; i++) {
                result.push(list[i].obj);
            }

            return result;
        },

        /**
         *
         * @param wid
         * @returns {*}
         * @private
         */
        getNounOfObjectByPronoun = function (wid) {
            var result = null,
                search = {
                    priority: 0,
                    obj: engine.getAvailableObjects(true),
                    loc: [ engine.getLocation(true), null],
                    wid: wid
                },
                list = dbWordsAndObjects(search).get();

            if (list.length == 0) {
                return null;
            }

            search.obj = list[0].obj;
            delete search.wid;
            list = dbWordsAndObjects(search).get();

            for (var i = 0; i < list.length; i++) {
                wid = list[i].wid;

                var rec = dict.getBase(wid);

                if (rec.morph == 'С') {
                    result = rec;
                    break;
                }
            }

            return result;
        },

        parse = function (phrase, preparsing, prepart2) {
            prepart2 = prepart2 || false;

            /*
             1. Фраза должна начинаться с действия / глагола.
             2. Если у действия есть качественная характеристика (быстро, аккуратно), оно должно идти перед действием.
             3. Если
             */
            preparsing = preparsing || false;

            var cmd = {
                    phrase: phrase, // Текст команды

                    anyErrors: false,
                    error: {type: null, word: ''}, // Описание ошибки

                    verb: null,
                    params: [ undefined, null, null, null ], // undefined - пустой элемент на 0-й позиции массива
                    objects: [ undefined, null, null, null ], // undefined - пустой элемент на 0-й позиции массива
                    actions: [ undefined, null, null, null ] // undefined - пустой элемент на 0-й позиции массива
                },
                nounsForPronouns = {},
                prOccupied = [],
                adverbs = { list: [], bids: []},
                availableObjs = engine.getAvailableObjects(true),

                priority = null, // Приоритет параметра команды
                objRec = null,
                buffer = [],
                preposition = null,
                bufferAfter = [], // Буфер существительных для (пост)постобработки ("кто я такой" -> "кто такой я")
                containsSpace = phrase.substr(-1) == ' ';

            locId = engine.getLocation(true);

            phrase = phrase.trim().toLowerCase().replace(/\s+/g, ' ');

            if (phrase == '') {
                //if (_preparsing == true) {
                //  var words_list = preParse(word_str);
                //}
                return null;
            }

            var wordsList = phrase.split(' '),
            //if (words_list.length == 0) {return null;}
                wordStr = '',
                word = null,
                wx = 0,
                maxwx = wordsList.length;

            while (wx <= maxwx - 1) {
                // Если есть глагол и буфер слов не пуст, то берём слово из него
                if (cmd.verb !== null && buffer.length > 0) {
                    word = buffer.shift();
                    // Иначе получаем очередное слово из фразы и преобразуем его в объект
                } else {
                    // Получаем из фразы очередную порцию
                    wordStr = wordsList[wx++];

                    if (preparsing == true && wx == maxwx && containsSpace == false) {
                        break;
                    }
                    // Получаем информацию о полученном слове
                    word = dict.getWord(wordStr, true, preposition, lastParams);

                    // +++ Если слово незнакомое
                    if (word === null) {
                        cmd.anyErrors = true;
                        cmd.error.type = 1; // 1 - незнакомое слово
                        cmd.error.word = wordStr;

                        break;
                    }

                    // Если глагол ещё не нашли, то помещаем слово в буфер
                    if (word.morph !== 'Г' && cmd.verb === null) {
                        buffer.push(word);

                        continue;
                    }
                }

                // Обрабатываем глагол
                if (word.morph === 'Г') {
                    cmd.verb = word;
                    cmd.verb.adverb = null;

                    // Проверяем, не является ли предыдущее слово из буфера наречием и не относится ли оно к глаголу
                    if (buffer.length > 0) {
                        word = buffer[buffer.length - 1];
                        if (word.morph === 'Н') {
                            if (word.canBePrep == false) { // К глаголу не может относится наречие, которое может быть предлогом
                                cmd.verb.adverb = word;
                                buffer.pop();
                                _removeAdverb(word);
                            }
                        }
                    }

                // Обрабатываем предлог
                } else if (word.morph === 'ПР') {
                    if (cmd.verb !== null) {
                        // Запоминаем предлог, только если уже получили глагол. Иначе — пропускаем.
                        preposition = word;
                    }

                // Обрабатываем наречие
                } else if (word.morph === 'Н') {
                    // Если наречие может быть предлогом, то запоминаем его ещё и как предлог
                    if (word.canBePrep == true) {
                        preposition = word;
                    }

                    // Добавляем наречие в список на последующий разбор наречий как самостоятельных единиц
                    _addAdverb(adverbs, word);

                    continue;
                // Обрабатываем существительное
                } else if (word.morph === 'С') {
                    // Если есть предлог, стоящий перед этим словом, то проверяем, подходит ли предлог по падежу
                    preposition = _checkPrepByNoun(word, preposition);
                    priority = _checkParamPriority(cmd, word, preposition, nounsForPronouns, prOccupied);

                    if (preposition !== null && priority !== null) {
                        // Если предлог ещё и наречие, то удаляем его из списка
                        _removeAdverb(preposition);
                    }

                    if (priority == null) {
                        bufferAfter.push(word);
                    }
                // Обрабатываем местоимение
                } else if (word.morph == 'М') {
                    for (var i = 0; i < word.nounsList.length; i++) {
                        var noun2 = word.nounsList[i],
                            prep2 = _checkPrepByNoun(noun2, prep2);

                        priority = _checkParamPriority(cmd, noun2, prep2, nounsForPronouns, prOccupied);

                        if (priority == null) {
                            bufferAfter.push(noun2);
                        } else {
                            if (preposition !== null) {
                                _removeAdverb(preposition);
                            }

                            break;
                        }
                    }
                }

                // Если обработанное слово не является предлогом, то сбрасываем предлог, который шёл перед этим словом
                if (word.morph !== 'ПР' && preposition !== null) {
                    preposition = null;
                }
            }

            if (cmd.anyErrors == true) {
                if (preparsing == false || (wx < maxwx || (wx == maxwx && containsSpace == true))) {
                    console.error('Слово: "' + wordStr + '" мне незнакомо.'); // Консоль
                    //SCREEN.Вывести('Мне неизвестно слово"'+_word+'".<br/>');
                    return null;
                }
            } else {
                if (containsSpace == true) {
                    wordStr = '';
                }
            }

            // Если после разбора фразы у нас осталось наречие, то пытаемся определить к чему оно относится
            priority = null;

            // Если после разбора фразы остались наречия, которые не были использованы как предлоги
            _checkAdverbs(cmd, adverbs, nounsForPronouns, prOccupied);

            buffer = buffer.concat(bufferAfter);

            // Попробуем обработать накопишуюся в буфере очередь
            if (buffer.length > 0) {
                preposition = null;
                for (i = 0; i < buffer.length; i++) {
                    word = buffer[i];

                    if (word.morph === 'ПР') {
                        preposition = word;

                    // Обрабатываем наречие
                    } else if (word.morph === 'Н') {
                        _addAdverb(adverbs, word);
                    // Обрабатываем существительное
                    } else if (word.morph === 'С') {
                        // Если есть предлог, стоящий перед этим словом, то проверяем, подходит ли предлог по падежу
                        preposition = _checkPrepByNoun(word, preposition);
                        objRec = null;

                        // Пытаемся пристроить существительное в порядке приоритета типа: 1-2-3
                        for (priority = 1; priority <= 3; priority++) {
                            // Если параметр команды данного приоритета не занят...
                            if (prOccupied.indexOf(priority) == -1) {
                                // ...пытаемся опеределить, подходит ли данное слово к какому либо объекту по приоритету
                                objRec = getLinkToObject({
                                    priority: priority,
                                    loc: locId,
                                    pid: preposition == null ? null : preposition.bid,
                                    wid: word.bid
                                });

                                if (objRec !== null) {
                                    break;
                                }
                            }
                        }
                        if (objRec == null) {
                            // ...пытаемся опеределить, подходит ли данное слово к какому либо объекту вообще
                            objRec = _searchObjectByPriority0(cmd, (cmd.verb == null ? null : cmd.verb.bid), word.bid);
                        }
                        if (objRec !== null) {
                            _setCmdParam(cmd, objRec.priority, word, preposition, objRec, nounsForPronouns, prOccupied);
                            _removeAdverb(preposition);
                        }
                    // Обрабатываем местоимение
                    } else if (word.morph === 'М') {
                        for (i = 0; i < word.nounsList.length; i++) {
                            noun2 = word.nounsList[i];
                            prep2 = _checkPrepByNoun(noun2, prep2);
                            objRec = null;

                            // Пытаемся пристроить существительное в порядке приоритета типа: 1-2-3
                            for (priority = 1; priority <= 3; priority++) {
                                // Если параметр команды данного приоритета не занят...
                                if (prOccupied.indexOf(priority) == -1) {
                                    // ...пытаемся опеределить, подходит ли данное слово к какому либо объекту
                                    objRec = getLinkToObject({
                                        priority: priority,
                                        loc: locId,
                                        pid: prep2 == null ? null : prep2.bid,
                                        wid: noun2.bid
                                    });

                                    if (objRec !== null) {
                                        break;
                                    }
                                }
                            }

                            if (objRec == null) {
                                // ...пытаемся опеределить, подходит ли данное слово к какому либо объекту вообще
                                objRec = _searchObjectByPriority0(cmd, (cmd.verb == null ? null : cmd.verb.bid), noun2.bid);
                            }
                            if (objRec !== null) {
                                _setCmdParam(cmd, objRec.priority, word, preposition, objRec, nounsForPronouns, prOccupied);
                                _removeAdverb(preposition);
                            }
                        }
                    }

                    // Если обработанное слово не является предлогом, то сбрасываем предлог, который шёл перед этим словом
                    if (word.morph !== 'ПР' && preposition !== null) {
                        preposition = null;
                    }
                }
            }

            // Если после разбора буфера остались наречия, которые не были использованы как предлоги
            _checkAdverbs(cmd, adverbs, nounsForPronouns, prOccupied);

            if (cmd.verb != null && cmd.params[1] == null && cmd.params[2] == null && cmd.params[3] == null) {
                objRec = null;
                priority = null;

                for (priority = 1; priority <= 3; priority++) {
                    if (prOccupied.indexOf(priority) == -1) {
                        objRec = getLinkToObject({
                            priority: priority,
                            loc: locId,
                            vid: cmd.verb.bid
                        });

                        if (objRec !== null) {
                            priority = objRec.priority;

                            break;
                        }
                    }
                }

                if (objRec !== null) {
                    cmd.params[objRec.priority] = null;
                    cmd.objects[objRec.priority] = objRec.object;
                    cmd.actions[objRec.priority] = objRec.action;
                    prOccupied.push(objRec.priority);
                }
            }

            if (cmd.verb != null) {
                for (priority = 1; priority <= 3; priority++) {
                    if (cmd.objects[priority] != null) {
                        continue;
                    }

                    var param = cmd.params[priority] || null;

                    if (param == null) {
                        continue;
                    }

                    objRec = _searchObjectByPriority0(cmd, cmd.verb.bid, param.bid, priority);

                    if (objRec != null) {
                        break;
                    }
                }
            }

            cmd.object = null;
            cmd.action = null;
            cmd.A = { object: null, word: null, prep: null };
            cmd.B = { object: null, word: null, prep: null };
            cmd.C = { object: null, word: null, prep: null };

            if (cmd.objects[1] != null) {
                cmd.A.object = cmd.objects[1];
            }

            if (cmd.objects[2] != null) {
                cmd.B.object = cmd.objects[2];
            }

            if (cmd.objects[3] != null) {
                cmd.B.object = cmd.objects[3];
            }

            if (cmd.params[1] != null) {
                cmd.A.word = cmd.params[1];
                cmd.A.prep = cmd.params[1].prep;
            }

            if (cmd.params[2] != null) {
                cmd.B.word = cmd.params[2];
                cmd.B.prep = cmd.params[2].prep;
            }

            if (cmd.params[3] != null) {
                cmd.C.word = cmd.params[3];
                cmd.C.prep = cmd.params[3].prep;
            }

            for (priority = 1; priority <= 3; priority++) {
                var obj = cmd.objects[priority],
                    act = cmd.actions[priority];

                if (obj != null && act != null) {
                    cmd.object = obj;
                    cmd.action = obj.actionsList[act - 1];

                    break;
                }
            }

            for (var key in nounsForPronouns) {
                lastParams[key] = nounsForPronouns[key];
            }

            if (window.localizeCMD && typeof localizeCMD === 'function') {
                localizeCMD(cmd);
            }

            if (preparsing == true) {
                preParse(wordStr, utils.iNN(cmd.verb, 'bid'), utils.iNN(preposition, 'bid'), cmd, prepart2);
            }

            return cmd;
        },

        /**
         *
         * @param wordStr
         * @param verbId
         * @param prepId
         * @param cmd
         * @param prepart2
         */
        preParse = function (wordStr, verbId, prepId, cmd, prepart2) {
            wordStr = wordStr || '';
            verbId = verbId || null;
            prepId = prepId || null;
            prepart2 = prepart2 || false;

            var bidsList = [],
                bidsData = [];

            locId = engine.getLocation(true);

            //var cashPrepsCases = {};
            // Добавляем слово в список на выдачу (+ доп. информация в values)
            function _addBid(list, data, bid, values) {
                if (list.indexOf(bid) == -1) {
                    list.push(bid);

                    var word = dict.getBase(bid),
                        rec = { wid: bid, base: word.base, morph: word.morph };

                    if (values != undefined) {
                        for (var key in values) {
                            rec[key] = values[key];
                        }
                    }

                    data.push(rec);
                }
            }

            // Добавляем возможные падежи к конкретному слову
            function _casesToWord(wCases, bid, cases) {
                if (cases != null && bid != null) {
                    var id = 'bid:' + bid;

                    if (wCases[id] === undefined) {
                        wCases[id] = cases.slice();
                    } else {
                        utils.addArrToArr(wCases[id], cases);
                    }
                }
            }

            function _addWordsFromLinks(list, data, obj, search, wCases, cases) {
                if (obj == null) {
                    return;
                }

                if (objToPass.indexOf(obj) >= 0) {
                    return;
                }

                search.obj = obj;
                cases = cases || null;

                //obj_to_pass.push(_obj);

                var wordsList = dbWordsAndObjects(search).get(),
                    word;

                for (var i = 0; i < wordsList.length; i++) {
                    word = wordsList[i];
                    _addBid(list, data, word.wid, { nums: word.nums });
                    _casesToWord(wCases, word.wid, cases); // Добавляем падежи для данного слова
                }
            }

            var wordsCases = {}, // Привязка падежей к словам объектов toN. words_cases['bid'] = ['И', 'Р', ...]
                objToPass = [], // Перечень уже обработанных объектов toN.
                wordsToPass = [],
                prepsToPass = [],
                cases = {}, // Кэш падежей предлогов: cases['VID:PRIORITY:PID'] = [c1, c2, c3]
                prepsOfVerbs = {}, // Кэш предлогов глаголов: preps_of_verbs['VID:PRIORITY'] = [p1, p2, p3]
                cases2 = null;

            if ((cmd || null) == null) {
                cmd = {params: [ undefined, null, null, null ], objects: [ undefined, null, null, null ]};
            }

            if (DEBUG && DEBUG.isEnable() == true) {
                DEBUG.updatePreparsingData(cmd);
            }

            for (var priority = 1; priority <= 3; priority++) {
                if (cmd.params[priority] != null) {
                    wordsToPass.push(cmd.params[priority].bid);
                    if (cmd.params[priority].prep != null) {
                        prepsToPass.push(cmd.params[priority].prep.bid);
                    }
                }

                //if (CMD.objects[priority] != null) {
                //  obj_to_pass.push(AZ.getID(CMD.objects[priority])); //+++ на время
                //}
            }

            // Если в команде есть предлог или слова, то глагол пропускаем. Для автодополнения глагол должен идти первым.
            var passVerb = !(prepId == null && prepsToPass.length == 0 && wordsToPass.length == 0),
                rec,
                idx;

            // Если выбран глагол, то нужно подтянуть к нему предлоги и падежи слов (по слотам)
            if (verbId != null) {
                var search = { bid: verbId, priority: [] };

                // Если объект #1 не занят, то подтягиваем предлоги и падежи #1.
                if (cmd.params[1] == null || cmd.params[1].bid == prepId) {
                    search.priority.push(1);
                }

                // Если объект #2 не занят, то подтягиваем предлоги и падежи #2.
                if (cmd.params[2] == null || cmd.params[2].bid == prepId) {
                    search.priority.push(2);
                }

                // Если объект #3 не занят, то подтягиваем предлоги и падежи #3.
                if (cmd.params[3] == null || cmd.params[3].bid == prepId) {
                    search.priority.push(3);
                }

                // Если в команде последним словом стоит предлог, то ставим фильтр только по этому предлогу.
                if (prepId != null) {
                    search.prep = prepId;
                }

                prepsOfVerbs[verbId + ':1'] = [];
                prepsOfVerbs[verbId + ':2'] = [];
                prepsOfVerbs[verbId + ':3'] = [];

                var list = dict.getObjectsOfVerbs(search);  // Отбираем предлоги и падежи из данных глагола.

                for (var i = 0; i < list.length; i++) {
                    rec = list[i];
                    // В записи может быть указан либо предлог, либо предлог + падежи (уточняющие для данного глагола, потому как у предлога падежей может быть больше)
                    cases2 = [];

                    // Если в данных указаны падежи, то берём их за основу
                    if (rec.cases != null) {
                        cases2 = rec.cases.slice();
                    }

                    // Если предлог есть в данных, то пытаемся добавить его в перечень.
                    if (rec.prep != null) {
                        if (prepsToPass.indexOf(rec.prep) == -1) {
                            if (rec.prep != prepId) {
                                idx = verbId + ':' + rec.priority;

                                if (prepsOfVerbs[idx].indexOf(rec.prep) == -1) {
                                    prepsOfVerbs[idx].push(rec.prep);
                                }
                            }

                            // Если падежи ещё не определены (то есть нет уточняющего списка падежей для предлога), то берём весь перечень падежей предлога
                            if (cases2 == null) {
                                cases2 = dict.getWordCases(rec.prep, '-');
                            }
                        }
                    }

                    if (cases2.length > 0) {
                        idx = verbId + ':' + rec.priority + ':' + rec.prep;
                        if (cases[idx] === undefined) {
                            cases[idx] = cases2.slice();
                        } else {
                            add_arr2arr(cases[idx], cases2);
                        }
                    }

                }
            }

            // Шаблон фильтра отбора слов, сопоставленных с объектом
            var searchToN = {
                priority: 0,
                loc: [ locId, null ]
            };

            // Фильтр отбора записей-действий
            search = {
                obj: engine.getAvailableObjects(true), // [AZ.current_character.ID]
                priority: [1, 2, 3],
                loc: [locId, null]
            };

            if (verbId !== null) {
                search.vid = verbId;
            }

            // Отбираем все комбинации слов, используемых в действиях с доступными объектами
            list = dbWordsAndObjects(search).get();

            for (i = 0; i < list.length; i++) {
                rec = list[i];

                if (cmd.objects[rec.priority] != null && rec.obj != engine.getId(cmd.objects[rec.priority])) {
                    if (cmd.params[rec.priority] != null) {
                        continue;
                    }
                }

                // Если глагол в данных есть, а в команде его нет (и в команде нет ни предлога, ни слова), то добавляем его в перечень
                if (rec.vid != null && verbId == null && passVerb == false) {
                    _addBid(bidsList, bidsData, rec.vid);
                }

                // Если глагол есть в команде, то этот же глагол есть и в данных (условие фильтра)
                // Если глагола нет в данных, то его не может быть и в команде (от условия фильтра)

                cases2 = []; // Перечень падежей предлога из записи данных. Падежи распространяются на слово и объекты toN.

                //if (obj_to_pass.indexOf(rec.obj) == -1 && (CMD.objects[rec.priority] == null || rec.obj == AZ.getID(CMD.objects[rec.priority]))) {

                // Предлог и слово связаны с основным объектом команды. Если данный объект уже распознан в команде, то ни предлог, ни слово не нужны.
                if (objToPass.indexOf(rec.obj) == -1) {
                    // Предлог добавляем, если этого предлога в команде ещё нет.
                    if (rec.pid != null && prepId == null && prepsToPass.indexOf(rec.pid) == -1) {
                        //  1. Глагола нет ни в данных, ни в команде.
                        //  2. Глагол есть и в данных, и в команде.
                        if (rec.vid == verbId) {
                            _addBid(bidsList, bidsData, rec.pid);
                            cases2 = dict.getWordCases(rec.pid, '-');
                            _casesToWord(wordsCases, rec.wid, cases2);
                            prepsToPass.push(rec.pid);
                        }
                    }

                    // Слово добавляем если этого слова в команде ещё нет:
                    if (rec.wid != null && wordsToPass.indexOf(rec.wid) == -1 && prepId == rec.pid) {
                        //  1. Глагола нет ни в данных, ни в команде. Предлога нет ни в данных, ни в команде.
                        //  2. Глагола нет ни в данных, ни в команде. Предлог есть и в данных, и в команде.
                        //  3. Глагол есть и в данных, и в команде. Предлога нет ни в данных, ни в команде.
                        //  4. Глагол есть и в данных, и в команде. Предлог есть и в данных, и в команде.
                        if (rec.vid == verbId && rec.pid == prepId) {
                            _addBid(bidsList, bidsData, rec.wid, {'fid': rec.fid});
                            wordsToPass.push(rec.wid);
                        }
                    }
                }
                // Если...
                // Сопоставление слов с объектами
                var obj,
                    prep2;

                for (priority = 1; priority <= 3; priority++) {
                    obj = rec['to' + priority];

                    // Если слот не заполнен, либо данный объект уже обрабатывался, то пропускаем запись
                    if (obj == null || objToPass.indexOf(obj) >= 0) {
                        continue;
                    }

                    // Предлог должен совпадать и в данных и в команде (либо отсутствовать и там, и там).
                    if (verbId == rec.vid) {
                        if (verbId == null) {
                            if (rec.pid != prepId) {
                                continue;
                            }

                            // Если предлога нет, то падеж только именительный, иначе - берём из предлога.
                            cases2 = (rec.pid == null ? ['И'] : dict.getWordCases(rec.pid, '-'));
                        } else if (verbId != null) {
                            // Если есть глагол, то может быть ситуация, когда предлога в данных нет, а в команде он есть - в этом случае берём предлоги глагола
                            if (rec.pid != null && prepId != rec.pid) {
                                continue;
                            }

                            idx = verbId + ':' + priority;

                            if (prepsOfVerbs[idx].length > 0) {
                                for (var j = 0; j < prepsOfVerbs[idx].length; j++) {
                                    prep2 = prepsOfVerbs[idx][j];

                                    if (prepsToPass.indexOf(prep2) == -1) {
                                        _addBid(bidsList, bidsData, prep2);
                                        prepsToPass.push(prep2);
                                    }
                                }
                            }

                            cases2 = cases[verbId + ':' + priority + ':' + prepId];

                            if (cases2 === undefined) {
                                continue;
                            }
                            //if (cases2.indexOf(rec.pid) == -1) {continue;}
                        }

                        // Добавляем слова-сопоставления с объектом из слота
                        _addWordsFromLinks(bidsList, bidsData, obj, searchToN, wordsCases, cases2);
                    }
                }
            }

            autocomplete.init(bidsList);

            var fid = null,
                form = null,
                bid,
                morph,
                formsList,
                formsListFull,
                haveAnyVerbs;

            for (i = 0; i < bidsList.length; i++) {
                bid = bidsList[i];
                morph = bidsData[i].morph;

                if (morph === 'Г') {
                    formsList = autocomplete.getByBid(bid);
                    formsListFull = dict.getFormsListByBid({ bid: bid });

                    if (wordStr == '') {
                        for (j = 0; j < formsList.length; j++) {
                            fid = formsList[j].fid;
                            form = dict.getForm(fid).form;

                            autocomplete.add(wordStr, fid, form, morph);
                        }
                    } else { // if (word_str != '')
                        haveAnyVerbs = false;

                        for (j = 0; j < formsList.length; j++) {
                            fid = formsList[j].fid;
                            form = dict.getForm(fid).form;

                            if (form.substr(0, wordStr.length) != wordStr) {
                                continue;
                            }

                            haveAnyVerbs = true;

                            autocomplete.add(wordStr, fid, form, morph);
                        }

                        if (haveAnyVerbs == false) {
                            for (j = 0; j < formsListFull.length; j++) {
                                fid = formsListFull[j].fid;
                                form = dict.getForm(fid).form;

                                if (form.substr(0, wordStr.length) != wordStr) {
                                    continue;
                                }

                                autocomplete.add(wordStr, fid, form, morph);
                            }
                        }
                    }
                } else {
                    if (morph === 'С') {
                        if (wordsCases['bid:' + bid] !== undefined && wordsCases['bid:' + bid].length > 0) {
                            cases = wordsCases['bid:' + bid];
                        } else if (cases.length == 0) {
                            cases = ['И'];
                        }

                        if ((bidsData[i].fid || null) != null) {
                            formsList = [{ 'fid': bidsData[i].fid }];
                        } else {
                            formsList = dict.getFormsListByCaseAndNumber({
                                bid: bid,
                                case: cases,
                                number: (bidsData[i].nums || 'Е')
                            });
                        }

                        for (j = 0; j < formsList.length; j++) {
                            fid = formsList[j].fid;
                            form = dict.getForm(fid).form;

                            if (wordStr != '') {
                                if (form.substr(0, wordStr.length) != wordStr) {
                                    continue;
                                }
                            }

                            autocomplete.add(wordStr, fid, form, morph);
                        }
                    } else {
                        formsList = dict.getFormsListByBid({ bid: bid });

                        for (j = 0; j < formsList.length; j++) {
                            fid = formsList[j].fid;
                            form = formsList[j].form;

                            if (wordStr != '') {
                                if (form.substr(0, wordStr.length) != wordStr) {
                                    continue;
                                }
                            }

                            autocomplete.add(wordStr, fid, form, morph);
                        }
                    }
                }
            }

            autocomplete.sort();

            var actionId,
                action;

            for (priority = 1; priority <= 3; priority++) {
                if (cmd.objects[priority] != null) {
                    actionId = cmd.actions[priority];

                    if (actionId != null) {
                        action = cmd.objects[priority].actionsList[actionId - 1];

                        if (action != null) {
                            autocomplete.setActionFlag();
                        }

                        break;
                    }
                }
            }

            //return txt_words;
        };

    return {
        addLinkToObject: addLinkToObject,
        getLinkToObject: getLinkToObject,
        getObjectsByWord: getObjectsByWord,
        getNounOfObjectByPronoun: getNounOfObjectByPronoun,
        parse: parse,
        preParse: preParse
    };
});
