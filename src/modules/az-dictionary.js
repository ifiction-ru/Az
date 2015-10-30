define(['modules/az-utils'], function (utils) {
    'use strict';

    var idForBase  = 0, // Числовой уникальный идентификатор каждого слова-основы в словаре
        idForForm  = 0, // Числовой уникальный идентификатор каждой словоформы в словаре
        dictAbsend = [], // запись отсутсвующих слов в словаре

        // БАЗЫ ДАННЫХ СЛОВАРЯ

        /*
         Формат базы данных "dbBases":
         bid     Уникальный числовой идентификатор слова-основы
         morph   Часть речи
         base    Основа слова
         */
        dbBases = TAFFY(),

        /*
         Формат базы данных "dbBasesForTag":
         tag     Имя тега
         bids    Перечень уникальных числовых идентификаторов слов-основ
         */
        dbBasesForTag = {}, //TAFFY(),

        /*
         Формат базы данных "dbTagsForBase":
         bid     Уникальный числовой идентификатор слова-основы
         tags    Имена тегов
         */
        dbTagsForBase = {}, //TAFFY(),

        /* Формат базы данных "dbForms":
         bid     Уникальный числовой идентификатор слова-основы
         fid     Уникальный числовой идентификатор словоформы
         form    Словоформа
         */
        dbForms = TAFFY(),

        /*
         БД (массив) "dbWordGenders" предназначена для хранения рода существительных и местоимений
         Формат:
         bid     Уникальный числовой идентификатор основы слова
         gender  Род
         */
        dbWordGenders = {}, //TAFFY(),

        /*
         БД (массив) "dbWordCases" предназначена для хранения падежей существительных, местоимений и предлогов (как отношение сущ., мест., числ.)
         Формат:
         fid     Уникальный числовой идентификатор словоформы
         cases   Падежи словоформы, массив: ['падеж1', 'падеж2', ...]
         */
        dbWordCases = {},

        /*
         БД "dbWordNumbers" предназначена для хранения чисел существительных и местоимений
         Формат:
         fid     Уникальный числовой идентификатор словоформы
         number  Числа словоформы, массив: ['число1', 'число2', ...]
         */
        dbWordNumbers = {},

        /*
         БД "dbAdverbAndPrep" предназначена для хранения признака, что наречие может быть и предлогом
         Формат:
         fid     Уникальный числовой идентификатор словоформы
         value  true/false
         */
        dbAdverbAndPrep = {},

        /*
         Формат базы данных "dbSearchForm":
         bid     Уникальный числовой идентификатор основы слова
         case    Падеж
         number  Число
         fid     Уникальный числовой идентификатор словоформы
         */
        dbSearchForm = TAFFY(),

        /*
         Формат базы данных "dbObjectsOfVerbs":
         bid         Уникальный числовой идентификатор глагола-основы
         priority    Приоритет объекта [0,1,2]
         prep        fid предлога
         case        Падеж [И|Р|Д|В|Т|П]
         */
        dbObjectsOfVerbs = TAFFY(),

        // ВНУТРЕННИЕ ФУНКЦИИ

        /**
         * Добавляет в Словарь основу слова
         * @param base
         * @param morph
         * @param tags
         * @returns {*}
         * @private
         */
        _addBase = function (base, morph, tags) {
            // Приводим к нижнему регистру
            base = base.toLowerCase.trim();

            // Ищем в БД запись с такой же базой
            var rec = dbBases({ base : base }).first(),
                bid,
                tag,
                bidsList;

            if (rec !== false) {
                // TODO: Вставить сравнение с найдеными параметрами, чтобы автор словаря не затёр ничего
                return rec.bid;
            } else {
                // Увеличиваем счётчик "bid"
                bid = ++idForBase;

                dbBases.insert({
                    bid:   bid,
                    morph: morph,
                    base:  base
                });

                if (tags !== undefined) {
                    tags = tags || [];

                    // Приведение тегов к единой форме
                    dbTagsForBase[bid] = tags.slice();

                    // Перебираем теги
                    for (var i = 0; i < tags.length; i++) {
                        tag = tags[i];
                        bidsList = dbBasesForTag[tag] || [];

                        if (bidsList.indexOf(bid) < 0) {
                            bidsList.push(bid);
                            dbBasesForTag[tag] = bidsList;
                        }
                    }
                }

                return idForBase;
            }
        },



        _getWordTags = function (bid) {
            return dbTagsForBase[bid] || [];
        },

        /**
         * Добавляет в Словарь отдельную словоформу слова
         * @param bid
         * @param form
         * @returns {*}
         * @private
         */
        _addForm = function (bid, form) {
            // Приводим к нижнему регистру
            form = form.toLowerCase().trim();

            // Проверяем форму слова на наличие флагов включения/исключения слова из автодополнения
            var first = form.substr(1, 1),
                last = form.slice(-1),
                acInc = (first === '+' || last === '+') ? true : ((first === '-' || last === '-') ? false : null),
                search,
                rec;

            if (first === '+' || first === '-') {
                form = form.substr(2).trim();
            }

            if (last === '+' || last === '-') {
                form = form.slice(0, -1).trim();
            }

            search = {
                bid: bid,
                form: form
            };
            rec = dbForms(search).first();

            if (rec == false) {
                // Увеличиваем счётчик "fid"
                search.fid = ++idForForm;
                // Сохраняем данные о словоформе
                dbForms.insert(search);
                rec = search;
            }

            if (acInc !== null) {
                AUTOCOMPLETE.addWordWithFlag(bid, rec.fid, acInc);
            }

            return rec.fid;

        },



        /**
         * Добавляет в Словарь род основы слова
         * @param bid
         * @param gender
         * @private
         */
        _addWordGender = function (bid, gender) {
            dbWordGenders[String(bid)] = gender.trim().toUpperCase();
        },

        /**
         * Возвращает из Словаря род основы слова по его bid
         * @param bid
         * @returns {*}
         * @private
         */
        _getWordGender = function (bid) {
            var result = dbWordGenders[String(bid)];

            if (result === undefined) {
                result = '';
            }

            return result;
        },

        // Функция добавляет в Словарь падежи словоформы
        /**
         * Добавляет в Словарь падежи словоформы
         * @param id
         * @param number
         * @param cases
         * @private
         */
        _addWordCases = function (id, number, cases) {
            dbWordCases[String(id) + ':' + number] = cases.slice();
        },



        /**
         * Добавляет в Словарь числа словоформы
         * @param fid
         * @param numbers
         * @private
         */
        _addWordNumbers = function (fid, numbers) { //, _cases
            dbWordNumbers[String(fid)] = numbers.slice();
        },

        /**
         * Возвращает из Словаря падежи словоформы по её fid
         * @param fid
         * @returns {*}
         * @private
         */
        _getWordNumbers = function(fid) {
            var result = dbWordNumbers[String(fid)];

            if (result === undefined) {
                result = [];
            } else {
                result = result.slice();
            }

            return result;
        },

        /**
         * Добавляет в Словарь информацию, может ли наречие быть предлогом
         * @param bid
         * @param canBePrep
         * @private
         */
        _addAdverbAndPrep = function (bid, canBePrep) {
            dbAdverbAndPrep[String(bid)] = canBePrep;
        },

        /**
         * Возвращает из Словаря информацию, может ли наречие быть предлогом, по его bid
         * @param bid
         * @returns {*|boolean}
         * @private
         */
        _getAdverbAndPrep = function (bid) {
            return dbAdverbAndPrep[String(bid)] || false;
        },

        /**
         * Добавляет в БД существительное или местоимение
         * @param base
         * @param gender
         * @param data
         * @param morph
         * @private
         */
        _addNounOrPronoun = function (base, gender, data, morph) {
            // TODO: Проверка на заполненность параметров функции

                // Перечень уникальных словоформ. Массив строковых значений.
            var formsList = [],
                // Перечень падежей для каждой уникальной словоформы. Структура: casesList['словоформа'] = ['падеж1', 'падеж2', ...]
                casesList = {},
                // Перечень чисел для каждой уникальной словоформы. Структура: numbersList['словоформа'] = ['число1', 'число2', ...]
                numbersList = {},
                // Сохраняем данные об основе слова
                bid = _addBase(base, morph),
                wForm, wCase, wNumber, fid;

            // Сохраняем данные о роде слова
            _addWordGender(bid, gender);

            // Перебираем все словоформы и сворачиваем перечень до уникальных записей, у которых падежи и числа свёрнуты в массивы
            for (var i = 0; i < data.length; i++) {
                wForm   = data[i][0].trim().toLowerCase();  // словоформа
                wCase   = data[i][1].trim().toUpperCase();  // падеж словоформы
                wNumber = data[i][2].trim().toUpperCase();  // число словоформы

                // TODO: Проверка на заполненность и корректность данных

                if (formsList.indexOf(wForm) == -1) {
                    formsList.push(wForm);

                    casesList[wForm + ':Е'] = [];
                    casesList[wForm + ':М'] = [];

                    numbersList[wForm] = [];
                }

                if (casesList[wForm + ':' + wNumber].indexOf(wCase) < 0) {
                    casesList[wForm + ':' + wNumber].push(wCase);
                }

                if (numbersList[wForm].indexOf(wNumber) < 0) {
                    numbersList[wForm].push(wNumber);
                }

            }

            // Записываем сведения о словоформах в базу данных
            for (i = 0; i < formsList.length; i++) {
                wForm = formsList[i];
                // Сохраняем данные о словоформе слова
                fid = _addForm(bid, wForm);

                // Сохраняем данные о падежах словоформы слова в единственном числе
                if (casesList[wForm + ':Е'].length > 0) {
                    _addWordCases(fid, 'Е', casesList[wForm + ':Е']);

                    for (var j = 0; j < casesList[wForm + ':Е'].length; j++) {
                        dbSearchForm.insert({
                            bid: bid,
                            case: casesList[wForm + ':Е'][j],
                            number: 'Е',
                            fid: fid
                        });
                    }
                }

                // Сохраняем данные о падежах словоформы слова во множественном числе
                if (casesList[wForm + ':М'].length > 0) {
                    _addWordCases(fid, 'М', casesList[wForm + ':М']);

                    for (j = 0; j < casesList[wForm + ':М'].length; j++) {
                        dbSearchForm.insert({
                            bid: bid,
                            case: casesList[wForm + ':М'][j],
                            number: 'М',
                            fid: fid
                        });
                    }
                }

                // Сохраняем данные о числах словоформы слова
                _addWordNumbers(fid, numbersList[wForm]);
            }
        },

        /**
         * Привязывает к глаголу объекты (1-2-3) по связкам "предлог + падеж"
         * @param verbId
         * @param priority
         * @param data
         * @private
         */
        _addObjectsToVerb = function (verbId, priority, data) {
            // Если вообще не передали этот параметр в родительскую функцию
            if (data === undefined) {
                return;
            }

            // TODO: Проверка на заполненность и корректность параметров
            
            var rec, prep, cases, adverbsList, tag, bidsList, bid, word;

            for (var i = 0; i < data.length; i++) {
                rec = data[i];
                prep = null;
                cases = null;
                adverbsList = [];

                if (typeof rec === 'string') {
                    // с предлогом, без падежей
                    if (rec.trim().substr(0, 1) == '#') {
                        tag = rec.trim().toLowerCase();
                        // Получаем перечень bid слов по переданному тегу
                        bidsList = dbBasesForTag[tag] || [];

                        // Перебираем перечень слов
                        for (var y = 0; y < bidsList.length; y++) {
                            bid = bidsList[y];
                            word = getBase(bid);

                            // Если это наречие, и оно может быть предлогом, то добавляем его как есть
                            if (word.morph == 'Н') {
                                word.canBePrep = _getAdverbAndPrep(bid);
                                if (word.canBePrep === true) {
                                    _addObjectsToVerb(verbId, priority, [word.base]);
                                }

                                adverbsList.push(bid);
                            } else if (word.morph == 'П') {
                                _addObjectsToVerb(verbId, priority, [word.base]);
                            }
                        }
                        //tags.push();
                    } else {
                        prep = getFormIds(rec);

                        if (prep.bid === null) {
                            // TODO: Нет такого предлога
                            console.error('При заполнении данных глагола "' + getBase(verbId).base + '", предлог: "' + rec + '" не найден.');
                            continue;
                        }
                    }

                    //} else if (typeof(rec) == 'number') {
                    //prep = _get_form_ids(rec);
                } else if (rec !== null) {
                    // Анализируем предлог - rec[0]
                    if (rec[0] !== null) {
                        prep = getFormIds(rec[0]);

                        if (prep.bid === null) {
                            // TODO: Нет такого предлога!
                            console.error('При заполнении данных глагола "' + getBase(verbId).base + '", предлог: "' + rec + '" не найден.');
                            continue;
                        }
                    }

                    // Анализируем падежи - rec[1]
                    if (rec[1] !== null) {
                        if (typeof rec[1] === 'string') {
                            cases = [ rec[1].trim().toUpperCase() ];
                        } else {
                            // TODO: Добавить приведения каждого элемента (падежа) к верхнему регистру
                            cases = (rec[1].length == 0 ? null : rec[1].slice());
                        }
                    }
                }

                // Если специфические падежи для данного предлога не указаны, то берём падежи самого предлога
                if (prep !== null && cases === null) {
                    cases = getWordCases(prep.bid, '-');
                }

                // Записываем данные глагола: тип объекта, bid предлога и падежи
                dbObjectsOfVerbs.insert({
                    bid: verbId,
                    priority: priority,
                    prep: prep === null ? null : prep.bid,
                    cases: cases,
                    adverbs: adverbsList
                });
            }
        },

        // ДОБАВЛЕНИЕ СЛОВ В СЛОВАРЬ

        /* Существительное (параметры) — Добавляет существительное в словарь.
            Параметры:
                _base:      основа, то есть к чему приводится всё многообразие словоформ данного существительного
                _gender:    род основы слова: М|Ж|С
                _data:      данные, описывающие различные словоформы основы данного существительного. Структура данных:
                    [ ['словоформа1', 'падеж1', 'число1'], ['словоформа2', 'падеж2', 'число2'], ... ]

                Пример использования:
                    Существительное('кошелёк','м',[
                        ['кошелёк',     'И','е'], ['кошельки',      'И','м'],
                        ['кошелька',    'Р','е'], ['кошельков',     'Р','м'],
                        ['кошельку',    'Д','е'], ['кошелькам',     'Д','м'],
                        ['кошелёк',     'В','е'], ['кошельки',      'В','м'],
                        ['кошельком',   'Т','е'], ['кошельками',    'Т','м'],
                        ['кошельке',    'П','е'], ['кошельках',     'П','м'],

                        ['кошелек',     'И','е'],
                        ['кошелек',     'В','е'],
                        ]);

                Примечание: Не нужно заморачиваться с объединением нескольких словоформ в одну с указанием нескольких падежей
                (например, "кошелёк" — это и Именительный, и Винительный падеж) — это неудобно для автора и выглядит не особо наглядно.
        */

        /**
         * Добавление существительного в базу
         * @param base
         * @param gender
         * @param data
         */
        addNoun = function (base, gender, data) {
            return _addNounOrPronoun(base, gender, data, 'С');
        },

        /**
         * Добавление местоимения в базу
         * @param base
         * @param gender
         * @param data
         */
        addPronoun = function (base, gender, data) {
            return _addNounOrPronoun(base, gender, data, 'М');
        },

        /**
         * Добавление наречия в базу
         * @param forms
         * @param aTags
         * @param cases
         * @param pTags
         */
        addAdverb = function (forms, aTags, cases, pTags) {
            // TODO: Проверка на заполненность и корректность параметров

            if (typeof forms === 'string') {
                forms = [forms];
            }

            aTags = aTags || [];
            pTags = pTags || [];

            // Сохраняем данные об основе слова и получаем bid основы
            var bid = _addBase(forms[0], 'Н', aTags.concat(pTags));

            cases = cases || [];

            if (typeof cases === 'string') {
                cases = [cases];
            }

            if (cases.length > 0) {
                _addAdverbAndPrep(bid, true);
                // Сохраняем данные о падежах наречия-предлога
                _addWordCases(bid, '-', cases);
            }

            // Перебираем перечень наречий
            for (var i = 0; i < forms.length; i++) {
                // TODO: Проверка на заполненность и корректность параметров
                // Сохраняем данные о словоформе слова и получаем fid словоформы
                _addForm(bid, forms[i]);
            }
        },

        /* Предлог (параметры) — Добавляет предлог в словарь.
            Параметры:
                forms:  написание предлога. Строка или массив строк: ['предлог1', 'предлог2', ...]

                Пример использования:
                    Предлог('около');
                или
                    Предлог(['в','за','из','из-за','из-под','к','на','с','со']);
        */

        /**
         * Добавление предлога в базу
         * @param forms
         * @param cases
         * @param tags
         */
        addPreposition = function (forms, cases, tags) {
            // TODO: Проверка на заполненность и корректность параметров
            // TODO: Заменить на any2arr
            if (typeof forms === 'string') {
                forms = [forms];
            }
            if (typeof cases === 'string') {
                cases = [cases];
            }
            if (typeof tags === 'string') {
                tags = [tags];
            }

            // Сохраняем данные об основе слова и получаем bid основы
            var bid = _addBase(forms[0], 'ПР', tags);

            //if (_canBeAdverb == true) {_addAdverbAndPrep(bid, true);} // end if

            // Сохраняем данные о падежах предлога
            _addWordCases(bid, '-', cases);

            // Перебираем формы предлога
            for (var i = 0; i < forms.length; i++) {
                // TODO: Проверка на заполненность и корректность параметров
                // Сохраняем данные о словоформе слова и получаем fid словоформы
                 _addForm(bid, forms[i]);
            }
        },

        /**
         * Добавление глагола в базу
         * @param base
         * @param forms
         * @param dataWords
         * @param dataCase
         * @param dataPreps
         */
        addVerb = function (base, forms, dataWords, dataCase, dataPreps) {
            if (typeof forms === 'string') {
                forms = [forms]
            }

            var form;

            // TODO: Проверка на заполненность и корректность параметров

            // Сохраняем данные об основе слова
            var bid = _addBase(base, 'Г');

            for (var i = 0; i < forms.length; i++) {
                form = forms[i];

                //var ac = _check_autocomplete(form);
                _addForm(bid, form); // Сохраняем данные о словоформе слова
            }

            _addObjectsToVerb(bid, 1, dataWords);
            _addObjectsToVerb(bid, 2, dataCase);
            _addObjectsToVerb(bid, 3, dataPreps);
        },

        // РАБОТА СО СЛОВАМИ
        /**
         * Возвращает morph и base (основу слова) из Словаря по bid
         * @param bid
         * @returns {*}
         * @private
         */
        getBase = function (bid) {
            // Ищем в БД запись с такой же базой
            var rec = dbBases({ bid: bid }).first();

            if (rec === false) {
                return {
                    bid:   null,
                    morph: null,
                    base:  null
                };
            } else {
                return {
                    bid:   bid,
                    morph: rec.morph,
                    base:  rec.base
                };
            }
        },

        /**
         * Возвращает словоформу из Словаря по fid
         * @param fid
         * @returns {*}
         * @private
         */
        getForm = function(fid) {
            var rec = dbForms({ fid: fid}).first();

            return rec === false ? {
                bid:  null,
                fid:  null,
                form: null
            } : {
                bid:  rec.bid,
                fid:  rec.fid,
                form: rec.form
            };
        },

        /**
         * Возвращает bid и fid из Словаря по словоформе слова. Используется в Описании!
         * @param form
         * @returns {*}
         * @private
         */
        getFormIds = function (form) {
            // Приводим к нижнему регистру
            form = form.trim().toLowerCase();

            var rec = dbForms({ form: form}).first();

            return rec === false ? {
                bid:  null,
                fid:  null
            } : {
                bid:  rec.bid,
                fid:  rec.fid
            };
        },

        /**
         * Возвращает из Словаря падежи словоформы по её fid
         * @param id
         * @param number
         * @returns {*|{singular: (*|Array), plural: (*|Array)}}
         */
        getWordCases = function (id, number) {
            number = number || false;

            var result;

            // Если число слова указано, то возвращаем соответствующий набор падежей
            if (number !== false) {
                result = dbWordCases[String(id) + ':' + number];
                if (result === undefined) {
                    result = [];
                } else {
                    result = result.slice();
                }
            // Если число слова НЕ указано, то возвращаем все наборы падежей
            } else {
                result = {
                    singular: dbWordCases[String(id) + ':Е'] || [],
                    plural:   dbWordCases[String(id) + ':М'] || []
                };
                result.singular = result.singular.slice();
                result.plural = result.plural.slice();
                result.united = result.singular.concat(result.plural);
            }

            return result;
        },

        /**
         * Функция по переданной словоформе определяет слово из словаря. Если это местоимение,
         * то здесь же происходит привязка существительного
         * Если не найдено — возвращает "null"
         * @param word
         * @param fullInfo
         * @param prep
         * @param lastNouns
         * @returns {*}
         */
        getWord = function (word, fullInfo, prep, lastNouns) {
            fullInfo = fullInfo || false;
            prep = prep || null;

            var form = word.trim().toLowerCase();

            if (form == '') {
                return null;
            }

            // Получаем параметры словоформы
            var result = getFormIds(form),
                casesList, _case, noun, recs, addedYet, formRec, wordBase, nounToList;

            // Не найдено — возвращаем "null"
            if (result.fid === null) {
                return null;
            }

            result.wordAsIs = word;
            result.form = form;

            // Получаем параметры основы слова
            var rec = getBase(result.bid);

            // Не найдено — возвращаем "null"
            if (rec.bid === false) {
                return null;
            }

            result.morph = rec.morph;
            result.base = rec.base;
            result.prep = prep;

            // Если запрошена лишь краткая информация о слове — возвращаем, что есть
            if (fullInfo === false) {
                return result;
            }

            lastNouns = lastNouns || null;

            // Если получили предлог
            if (result.morph === 'ПР') {
                result.cases = getWordCases(result.bid, '-');
                result.tags = _getWordTags(result.bid);
            // Если получили наречие
            } else if (result.morph == 'Н') {
                result.tags = _getWordTags(result.bid);
                result.canBePrep = _getAdverbAndPrep(result.bid);

                if (result.canBePrep === true) {
                    result.cases = getWordCases(result.bid, '-');
                }
            // Если получили существительное или местоимение
            } else if (result.morph === 'С' || result.morph === 'М') {
                // Дополняем сведения о слове информацией о роде, падежах и числах
                result.gender = _getWordGender(result.bid);
                result.cases = getWordCases(result.fid);
                result.numbers = _getWordNumbers(result.fid);

                if (prep !== null) {
                    casesList = result.cases.singular;

                    if (casesList.length > 0) {
                        for (var i = casesList.length - 1; i >= 0; i--) {
                            _case = casesList[i];

                            if (prep.cases.indexOf(_case) == -1) {
                                casesList.splice(i, 1);
                            }
                        }
                    }

                    casesList = result.cases.plural;

                    if (casesList.length > 0) {
                        for (i = casesList.length - 1; i >= 0; i--) {
                            _case = casesList[i];

                            if (prep.cases.indexOf(_case) == -1) {
                                casesList.splice(i, 1);
                            }
                        }
                    }

                    result.cases.united = result.cases.singular.concat(result.cases.plural);
                }

                if (result.morph === 'М') {
                    result.nounsList = [];

                    // TODO: обработку множественного числа местоимений "они", "любые"

                    noun = null;

                    if (lastNouns !== null) {
                        for ( i = 1; i <= 3; i++) {
                            noun = lastNouns[result.gender + ':' + i] || null;

                            // Если существительное не найдено и род местоимения мужской, то возможно подразумевается существительное в среднем роде
                            if (noun === null && result.gender === 'М') {
                                noun = lastNouns['С:' + i] || null;
                            }

                            if (noun !== null) {
                                break;
                            }
                        }
                    }

                    if (noun == null) {
                        noun = PARSER.get_noun_of_object_by_pronoun(result.bid);
                    }

                    if (noun !== null) {
                        // Прореживаем с учётом числа местоимения
                        /*if (result.numbers.length == 1) {
                         _noun2list.cases[(result.numbers[0] == 'Е' ? 'plural' : 'singular')] == [];
                         result.cases.united=result.cases.singular.concat(result.cases.plural);
                         }*/ // end if

                        recs = dbSearchForm({
                            'bid': noun.bid,
                            'case': result.cases.united,
                            'number': result.numbers
                        }).get();

                        if (recs !== false) {
                            addedYet = [];

                            result.nounsList = [];
                            for (i = 0; i < recs.length; i++) {
                                rec = recs[i];

                                if (addedYet.indexOf(rec.fid) >= 0) {
                                    continue;
                                }

                                formRec = getForm(rec.fid);

                                if (formRec !== null) {
                                    wordBase = getBase(noun.bid);
                                    nounToList = {
                                        bid:        noun.bid,
                                        fid:        rec.fid,
                                        morph:      wordBase.morph,
                                        base:       wordBase.base,
                                        form:       formRec.form,
                                        gender:     _getWordGender(noun.bid),
                                        cases:      getWordCases(rec.fid),
                                        numbers:    _getWordNumbers(rec.fid),
                                        nounsList:  null
                                    };
                                    result.nounsList.push(nounToList);
                                    addedYet.push(rec.fid);
                                }
                            }
                        }
                    }
                }
            }

            return result;
        },

        /**
         * Функция возвращает тип объекта (1-2-3) для глагола по fid предлога и падежу
         * Возвращает число 1-2-3 или null.
         * @param verb
         * @param noun
         * @param prepBid
         * @param already
         * @returns {*}
         */
        getNounPriority = function (verb, noun, prepBid, already) {
            var result = null,
                // Отбираем данные по объектам всех типов для переданного глагола
                objectsList = dbObjectsOfVerbs({ bid: verb.bid }).get(),
                object, cases, caseObj, noun2, adverbs;

            for (var i = 0; i < objectsList.length; i++) {
                object = objectsList[i];

                if (already.indexOf(object.priority) >= 0) {
                    continue;
                }

                cases = object.cases || [];

                if (object.prep !== null && object.prep !== prepBid) {
                    continue;
                }

                if (noun.morph === 'С') {
                    for (var j = 0; j < cases.length; j++) {
                        caseObj = cases[j];

                        if (noun.cases.united.indexOf(caseObj) >= 0) {
                            result = {
                                priority: object.priority,
                                noun: noun
                            };

                            break;
                        }
                    }

                } else if (noun.morph === 'М' && noun.nounsList !== null) {
                    for (j = 0; j < noun.nounsList.length; j++) {
                        noun2 = noun.nounsList[j];

                        for (var k = 0; k < cases.length; k++) {
                            caseObj = cases[k];

                            if (noun2.cases.indexOf(caseObj) >= 0) {
                                result = {
                                    priority: object.priority,
                                    noun: noun2
                                };

                                break;
                            }
                        }

                        if (result != null) {
                            break;
                        }
                    }
                } else if (noun.morph == 'Н') {
                    adverbs = object.adverbs || [];

                    if (adverbs.length > 0) {
                        if (adverbs.indexOf(noun.bid) >= 0) {
                            result = {
                                priority: object.priority,
                                noun: noun
                            };

                            break;
                        }
                    }
                }
            }

            return result;
        },

        /**
         *
         * @param search
         * @returns {*}
         */
        getObjectsOfVerbs = function (search) {
            return dbObjectsOfVerbs(search).get();
        },

        /*get_forms_list: function (_search) {
         return db_search_form(_search).get();
         },*/

        /**
         *
         * @param search
         * @returns {*}
         */
        getFormsListByCaseAndNumber = function (search) {
            return dbSearchForm(search).get();
        },

        /**
         *
         * @param search
         * @returns {*}
         */
        getFormsListByBid = function (search) {
            return dbForms(search).get();
        };

    return {
        addNoun: addNoun,
        addPronoun: addPronoun,
        addAdverb: addAdverb,
        addPreposition: addPreposition,
        addVerb: addVerb,
        getBase: getBase,
        getForm: getForm,
        getFormIds: getFormIds,
        getWordCases: getWordCases,
        getWord: getWord,
        getNounPriority: getNounPriority,
        getObjectsOfVerbs: getObjectsOfVerbs,
        getFormsListByCaseAndNumber: getFormsListByCaseAndNumber,
        getFormsListByBid: getFormsListByBid
    };
});
