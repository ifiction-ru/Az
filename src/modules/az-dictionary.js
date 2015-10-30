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

        /**
         * Возвращает morph и base (основу слова) из Словаря по bid
         * @param bid
         * @returns {*}
         * @private
         */
        _getBase = function (bid) {
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
        };

        function _get_word_tags(bid) {
            return dbTagsForBase[bid] || [];
        } // end function "_get_word_tags"
        //------------------------------
        // Функция добавляет в Словарь отдельную словоформу слова
        function _add_form(_bid, _form) {
            _form = _form.trim().toLowerCase(); // Приводим к нижнему регистру
            //----------
            // Проверяем форму слова на наличие флагов включения/исключения слова из автодополнения
            var first = _form.substr(1, 1);
            var last = _form.slice(-1);
            //----------
            var ac_inc = (first == '+' || last == '+') ? true : ((first == '-' || last == '-') ? false : null);
            //----------
            if (first == '+' || first == '-') {
                _form = _form.substr(2).trim();
            } // end if
            //----------
            if (last == '+' || last == '-') {
                _form = _form.slice(0, -1).trim();
            } // end if
            //----------
            var search = {'bid': _bid, 'form': _form};
            //----------
            var rec = dbForms(search).first();
            //----------
            if (rec == false) {
                search.fid = ++idForForm; // Увеличиваем счётчик "fid"
                //----------
                dbForms.insert(search); // Сохраняем данные о словоформе
                //----------
                rec = search;
            }
            //----------
            if (ac_inc !== null) {
                AUTOCOMPLETE.addWordWithFlag(_bid, rec.fid, ac_inc);
            } // end if
            //----------
            return rec.fid;
            //----------
        } // end function "_add_form"
        //------------------------------
        // Функция возвращает словоформу из Словаря по fid
        function _get_form(_fid) {
            var rec = dbForms({'fid': _fid}).first();
            //----------
            return rec === false ? {'bid': null, 'fid': null, 'form': null} : {
                'bid': rec.bid,
                'fid': rec.fid,
                'form': rec.form
            };
        } // end function "_get_form"
        //------------------------------
        // Функция возвращает bid и fid из Словаря по словоформе слова
        function _get_form_ids(_form) {
            // !!! используется в Описании!
            _form = _form.trim().toLowerCase(); // Приводим к нижнему регистру
            //----------
            var rec = dbForms({'form': _form}).first();
            //----------
            return rec === false ? {'bid': null, 'fid': null} : {'bid': rec.bid, 'fid': rec.fid};
        } // end function "_get_form_ids"
        //------------------------------
        // Функция добавляет в Словарь род основы слова
        function _add_word_gender(_bid, _gender) {
            db_word_genders[String(_bid)] = _gender.trim().toUpperCase();
        } // end function "_add_word_gender"
        //------------------------------
        // Функция возвращает из Словаря род основы слова по его bid
        function _get_word_gender(_bid) {
            var result = db_word_genders[String(_bid)];
            //----------
            if (result === undefined) {
                result = '';
            } // end if
            //----------
            return result;
        } // end function "_get_word_gender"
        //------------------------------
        // Функция добавляет в Словарь падежи словоформы
        function _add_word_cases(_id, _number, _cases) {
            dbWordCases[String(_id) + ':' + _number] = _cases.slice();
            //----------
        } // end function "_add_word_cases"
        //------------------------------
        // Функция возвращает из Словаря падежи словоформы по её fid
        function _get_word_cases(_id, _number) {
            _number = _number || false;
            //----------
            // Если число слова указано, то возвращаем соответствующий набор падежей
            if (_number !== false) {
                var result = dbWordCases[String(_id) + ':' + _number];
                if (result === undefined) {
                    result = [];
                } else {
                    result = result.slice();
                } // end if

                // Если число слова НЕ указано, то возвращаем все наборы падежей
            } else {
                var result = {
                    singular: dbWordCases[String(_id) + ':Е'] || [],
                    plural: dbWordCases[String(_id) + ':М'] || []
                };
                result.singular = result.singular.slice();
                result.plural = result.plural.slice();
                //----------
                result.united = result.singular.concat(result.plural);
            } // end if
            //----------
            return result;
        } // end function "_get_word_cases"
        //------------------------------
        // Функция добавляет в Словарь числа словоформы
        function _add_word_numbers(_fid, _numbers) {
            //, _cases
            dbWordNumbers[String(_fid)] = _numbers.slice();
            //----------
        } // end function "_add_word_numbers"
        //------------------------------
        // Функция возвращает из Словаря падежи словоформы по её fid
        function _get_word_numbers(_fid) {
            var result = dbWordNumbers[String(_fid)];
            if (result === undefined) {
                result = [];
            } else {
                result = result.slice();
            } // end if
            //----------
            return result;
        } // end function "_get_word_numbers"
        //------------------------------
        // Функция добавляет в Словарь информацию, может ли наречие быть предлогом
        function _add_adverb_and_prep(_bid, _can_be) {
            //----------
            dbAdverbAndPrep[String(_bid)] = _can_be;
            //----------
        } // end function "_add_prep_data"
        //------------------------------
        // Функция возвращает из Словаря информацию, может ли наречие быть предлогом, по его bid
        function _get_adverb_and_prep(_bid) {
            var result = dbAdverbAndPrep[String(_bid)] || false;
            //----------
            return result;
        } // end function "_get_adverb_and_prep"
        //------------------------------
        // Функция добавляет в БД существительное или местоимение
        function _add_noun_or_pronoun(_base, _gender, _data, _morph) {
            var forms_list = []; // Перечень уникальных словоформ. Массив строковых значений.
            var cases_list = {}; // Перечень падежей для каждой уникальной словоформы. Структура: cases_list['словоформа'] = ['падеж1', 'падеж2', ...]
            var numbers_list = {}; // Перечень чисел для каждой уникальной словоформы. Структура: numbers_list['словоформа'] = ['число1', 'число2', ...]
            //----------
            // +++ Проверка на заполненность параметров функции
            //----------
            var bid = _addBase(_base, _morph); // Сохраняем данные об основе слова
            //----------
            _add_word_gender(bid, _gender); // Сохраняем данные о роде слова
            //----------
            // Перебираем все словоформы и сворачиваем перечень до уникальных записей, у которых падежи и числа свёрнуты в массивы
            for (var x = 0; x < _data.length; x++) {
                var wform = _data[x][0];  // словоформа
                var wcase = _data[x][1];  // падеж словоформы
                var wnumber = _data[x][2];  // число словоформы
                //----------
                // +++ Проверка на заполненность и корректность данных
                //----------
                // Приводим данные к требуемому виду
                wform = wform.trim().toLowerCase();
                wcase = wcase.trim().toUpperCase();
                wnumber = wnumber.trim().toUpperCase();
                //----------
                if (forms_list.indexOf(wform) == -1) {
                    forms_list.push(wform);
                    //----------
                    cases_list[wform + ':Е'] = [];
                    cases_list[wform + ':М'] = [];
                    //----------
                    numbers_list[wform] = [];
                } // end if
                //----------
                if (cases_list[wform + ':' + wnumber].indexOf(wcase) == -1) {
                    cases_list[wform + ':' + wnumber].push(wcase);
                } // end if
                //----------
                if (numbers_list[wform].indexOf(wnumber) == -1) {
                    numbers_list[wform].push(wnumber);
                } // end if
                //----------
            } // end for: Закончили перебирать словоформы
            //----------
            // Записываем сведения о словоформах в базу данных
            for (var x = 0; x < forms_list.length; x++) {
                wform = forms_list[x];
                //----------
                var fid = _add_form(bid, wform); // Сохраняем данные о словоформе слова
                //----------
                // Сохраняем данные о падежах словоформы слова в единственном числе
                if (cases_list[wform + ':Е'].length > 0) {
                    _add_word_cases(fid, 'Е', cases_list[wform + ':Е']);
                    //----------
                    for (var y = 0; y < cases_list[wform + ':Е'].length; y++) {
                        dbSearchForm.insert({
                            'bid': bid,
                            'case': cases_list[wform + ':Е'][y],
                            'number': 'Е',
                            'fid': fid,
                        });
                    } // end for y
                } // end if
                //----------
                // Сохраняем данные о падежах словоформы слова во множественном числе
                if (cases_list[wform + ':М'].length > 0) {
                    _add_word_cases(fid, 'М', cases_list[wform + ':М']);
                    //----------
                    for (var y = 0; y < cases_list[wform + ':М'].length; y++) {
                        dbSearchForm.insert({
                            'bid': bid,
                            'case': cases_list[wform + ':М'][y],
                            'number': 'М',
                            'fid': fid,
                        });
                    } // end for y
                } // end if
                //----------
                // Сохраняем данные о числах словоформы слова
                _add_word_numbers(fid, numbers_list[wform]);
                //----------
            } // end for x: Закончили запись существительного в базу данных
            //----------
        } // end function "_add_noun_or_pronoun"
        // ---------------------------------------------------------------------------
        // Функция привязывает к глаголу объекты (1-2-3) по связкам "предлог + падеж"
        function _add_objects_to_verb(verb_id, priority, data) {
            if (data === undefined) {
                return;
            } // Если вообще не передали этот параметр в родительскую функцию
            //----------
            // +++ Проверка на заполненность и корректность параметров
            //----------
            for (var x = 0; x < data.length; x++) {
                var rec = data[x];
                var prep = null;
                var cases = null;
                var adverbs_list = [];
                //----------
                if (typeof(rec) == 'string') { // с предлогом, без падежей
                    if (rec.trim().substr(0, 1) == '#') {
                        var tag = rec.trim().toLowerCase();
                        //----------
                        // Получаем перечень bid слов по переданному тегу
                        var bids_list = dbBasesForTag[tag] || [];
                        //----------
                        // Перебираем перечень слов
                        for (var y = 0; y < bids_list.length; y++) {
                            var bid = bids_list[y];
                            var word = _getBase(bid);
                            //----------
                            // Если это наречие, и оно может быть предлогом, то добавляем его как есть
                            if (word.morph == 'Н') {
                                word.can_be_prep = _get_adverb_and_prep(bid);
                                if (word.can_be_prep === true) {
                                    _add_objects_to_verb(verb_id, priority, [word.base]);
                                } else {

                                } // end if
                                adverbs_list.push(bid);
                            } else if (word.morph == 'П') { // end if
                                _add_objects_to_verb(verb_id, priority, [word.base]);
                            }
                        } // end for y
                        //tags.push();
                    } else {
                        prep = _get_form_ids(rec);
                        if (prep.bid === null) {
                            // +++ Нет такого предлога!
                            console.error('При заполнении данных глагола "' + _getBase(verb_id).base + '", предлог: "' + rec + '" не найден.');
                            continue;
                        } // end if
                    } // end if

                    //} else if (typeof(rec) == 'number') {
                    //prep = _get_form_ids(rec);

                } else if (rec !== null) {
                    // Анализируем предлог - rec[0]
                    if (rec[0] !== null) {
                        prep = _get_form_ids(rec[0]);
                        if (prep.bid === null) {
                            // +++ Нет такого предлога!
                            console.error('При заполнении данных глагола "' + _getBase(verb_id).base + '", предлог: "' + rec + '" не найден.');
                            continue;
                        } // end if
                    } // end if
                    //----------
                    // Анализируем падежи - rec[1]
                    if (rec[1] !== null) {
                        if (typeof(rec[1]) == 'string') {
                            cases = [rec[1].trim().toUpperCase()];
                        } else {
                            // +++ Добавить приведения каждого элемента (падежа) к верхнему регистру
                            cases = (rec[1].length == 0 ? null : rec[1].slice());
                        } // end if
                    } // end if
                } // end if
                //----------
                // Если специфические падежи для данного предлога не указаны, то берём падежи самого предлога
                if (prep !== null && cases === null) {
                    cases = _get_word_cases(prep.bid, '-');
                } // end if
                //----------
                // Записываем данные глагола: тип объекта, bid предлога и падежи
                dbObjectsOfVerbs.insert({
                    'bid': verb_id,
                    'priority': priority,
                    'prep': (prep === null ? null : prep.bid),
                    'cases': cases,
                    'adverbs': adverbs_list,
                });
                //----------
            } // end for x
            //----------
        } // end function "_add_objects_to_verb"
        //------------------------------

    //------------------------------
    // ДОБАВЛЕНИЕ СЛОВ В СЛОВАРЬ
    //----------
    // Добавление существительного в базу
    var addNoun = function (_base, _gender, _data) {
            //----------
            return _add_noun_or_pronoun(_base, _gender, _data, 'С');
            //----------
        }, // end function "addNoun"
    //------------------------------
    // Добавление местоимения в базу
        addPronoun = function (_base, _gender, _data) {
            //----------
            return _add_noun_or_pronoun(_base, _gender, _data, 'М');
            //----------
        }, // end function "addPronoun"
    //------------------------------
    // Добавление наречия в базу
        addAdverb = function (_forms, _atags, _cases, _ptags) {
            // +++ Проверка на заполненность и корректность параметров
            //----------
            if (typeof(_forms) == 'string') {
                _forms = [_forms];
            }
            _atags = _atags || [];
            _ptags = _ptags || [];
            //----------
            var bid = _addBase(_forms[0], 'Н', _atags.concat(_ptags)); // Сохраняем данные об основе слова и получаем bid основы
            //----------
            _cases = _cases || [];
            if (typeof(_cases) == 'string') {
                _cases = [_cases];
            } // end if
            //----------
            if (_cases.length > 0) {
                _add_adverb_and_prep(bid, true);
                //----------
                _add_word_cases(bid, '-', _cases); // Сохраняем данные о падежах наречия-предлога
            } // end if
            //----------
            // Перебираем перечень наречий
            for (var x = 0; x < _forms.length; x++) {
                // +++ Проверка на заполненность и корректность параметров
                //----------
                var fid = _add_form(bid, _forms[x]); // Сохраняем данные о словоформе слова и получаем fid словоформы
            } // end for x
            //----------
        }, // end function "addAdverb"
    //------------------------------
    // Добавление предлога в базу
        addPreposition = function (_forms, _cases, _tags) {
            // +++ Проверка на заполненность и корректность параметров
            //----------
            // +++ Заменить на any2arr
            if (typeof(_forms) == 'string') {
                _forms = [_forms];
            }
            if (typeof(_cases) == 'string') {
                _cases = [_cases];
            }
            if (typeof(_tags) == 'string') {
                _tags = [_tags];
            }
            //----------
            var bid = _addBase(_forms[0], 'ПР', _tags); // Сохраняем данные об основе слова и получаем bid основы
            //----------
            //if (_can_be_adverb == true) {_add_adverb_and_prep(bid, true);} // end if
            //----------
            _add_word_cases(bid, '-', _cases); // Сохраняем данные о падежах предлога
            //----------
            // Перебираем формы предлога
            for (var x = 0; x < _forms.length; x++) {
                // +++ Проверка на заполненность и корректность параметров
                //----------
                var fid = _add_form(bid, _forms[x]); // Сохраняем данные о словоформе слова и получаем fid словоформы
            } // end for x
            //----------
        }, // end function "addPreposition"
    //------------------------------
    // Добавление глагола в базу
        addVerb = function (_base, _forms, data1, data2, data3) {
            //----------
            if (typeof(_forms) == 'string') {
                _forms = [_forms]
            } // end if
            //----------
            // +++ Проверка на заполненность и корректность параметров
            //----------
            var bid = _addBase(_base, 'Г'); // Сохраняем данные об основе слова
            //----------
            for (var x = 0; x < _forms.length; x++) {
                var form = _forms[x];
                //----------
                //var ac = _check_autocomplete(form);
                //----------
                var fid = _add_form(bid, form); // Сохраняем данные о словоформе слова
            } // end for x
            //----------
            _add_objects_to_verb(bid, 1, data1);
            _add_objects_to_verb(bid, 2, data2);
            _add_objects_to_verb(bid, 3, data3);
            //----------
        }, // end function "DICTIONARY.addVerb"
    //------------------------------
    // РАБОТА СО СЛОВАМИ
    //------------------------------
        getBase = _getBase,
    //------------------------------
        getForm = _get_form,
    //------------------------------
        getFormIDs = _get_form_ids,
    //------------------------------
    //get_word_gender:  _get_word_gender,
    //------------------------------
    //get_word_numbers: _get_word_numbers,
    //------------------------------
        getWordCases = _get_word_cases,
    //------------------------------
    // Функция по переданной словоформе определяет слово из словаря. Если это местоимение, то здесь же происходит привязка существительного
    // Если не найдено — возвращает "null"
        getWord = function (_word, _full_info, _prep, _last_nouns) {
            _full_info = _full_info || false;
            _prep = _prep || null;
            //----------
            var form = _word.trim().toLowerCase();
            if (form == '') {
                return null;
            } // end if
            //----------
            // Получаем параметры словоформы
            var result = _get_form_ids(form);
            //----------
            // Не найдено — возвращаем "null"
            if (result.fid === null) {
                return null;
            } // end if
            //----------
            result.word_as_is = _word;
            result.form = form;
            //----------
            // Получаем параметры основы слова
            var rec = _getBase(result.bid);
            //----------
            // Не найдено — возвращаем "null"
            if (rec.bid === false) {
                return null;
            }
            //----------
            result.morph = rec.morph;
            result.base = rec.base;
            //----------
            result.prep = _prep;
            //----------
            // Если запрошена лишь краткая информация о слове — возвращаем, что есть
            if (_full_info === false) {
                return result;
            } // end if
            //----------
            _last_nouns = _last_nouns || null;
            //----------
            // Если получили предлог
            if (result.morph == 'ПР') {
                result.cases = _get_word_cases(result.bid, '-');
                result.tags = _get_word_tags(result.bid);

                // Если получили наречие
            } else if (result.morph == 'Н') {
                result.tags = _get_word_tags(result.bid);
                //----------
                result.can_be_prep = _get_adverb_and_prep(result.bid);
                if (result.can_be_prep === true) {
                    result.cases = _get_word_cases(result.bid, '-');
                } // end if

                // Если получили существительное или местоимение
            } else if (result.morph == 'С' || result.morph == 'М') {
                // Дополняем сведения о слове информацией о роде, падежах и числах
                result.gender = _get_word_gender(result.bid);
                //----------
                result.cases = _get_word_cases(result.fid);
                //----------
                result.numbers = _get_word_numbers(result.fid);
                //----------
                if (_prep !== null) {
                    var cases_list = result.cases.singular;
                    if (cases_list.length > 0) {
                        for (var x = cases_list.length - 1; x >= 0; x--) {
                            var _case = cases_list[x];
                            //----------
                            if (_prep.cases.indexOf(_case) == -1) {
                                cases_list.splice[x, 1];
                            } // end if
                        } // end for
                    } // end if
                    //----------
                    var cases_list = result.cases.plural;
                    if (cases_list.length > 0) {
                        for (var x = cases_list.length - 1; x >= 0; x--) {
                            var _case = cases_list[x];
                            //----------
                            if (_prep.cases.indexOf(_case) == -1) {
                                cases_list.splice[x, 1];
                            } // end if
                        } // end for
                    } // end if
                    //----------
                    result.cases.united = result.cases.singular.concat(result.cases.plural);
                } // end if
                //----------
                if (result.morph == 'М') {
                    result.nouns_list = [];
                    //----------
                    // +++ обработку множественного числа местоимений "они", "любые"
                    //----------
                    var noun = null;
                    if (_last_nouns !== null) {
                        for (var x = 1; x <= 3; x++) {
                            noun = _last_nouns[result.gender + ':' + x] || null;
                            // Если существительное не найдено и род местоимения мужской, то возможно подразумевается существительное в среднем роде
                            if (noun === null && result.gender == 'М') {
                                noun = _last_nouns['С:' + x] || null;
                            } // end if
                            //----------
                            if (noun !== null) {
                                break;
                            } // end-if
                            //----------
                        } // end-for
                    } // end if
                    //----------
                    if (noun == null) {
                        noun = PARSER.get_noun_of_object_by_pronoun(result.bid);
                    } // end if "noun == null"
                    //----------
                    if (noun !== null) {
                        // Прореживаем с учётом числа местоимения
                        /*if (result.numbers.length == 1) {
                         _noun2list.cases[(result.numbers[0] == 'Е' ? 'plural' : 'singular')] == [];
                         result.cases.united=result.cases.singular.concat(result.cases.plural);
                         }*/ // end if
                        //----------
                        var recs = dbSearchForm({
                            'bid': noun.bid,
                            'case': result.cases.united,
                            'number': result.numbers
                        }).get();
                        if (recs !== false) {
                            var added_yet = [];
                            result.nouns_list = [];
                            for (var x = 0; x < recs.length; x++) {
                                rec = recs[x];
                                //----------
                                if (added_yet.indexOf(rec.fid) >= 0) {
                                    continue;
                                } // end if
                                var form_rec = _get_form(rec.fid);
                                //----------
                                if (form_rec !== null) {
                                    var word_base = _getBase(noun.bid);
                                    //----------
                                    var _noun2list = {
                                        'bid': noun.bid,
                                        'fid': rec.fid,
                                        'morph': word_base.morph,
                                        'base': word_base.base,
                                        'form': form_rec.form,
                                        'gender': _get_word_gender(noun.bid),
                                        'cases': _get_word_cases(rec.fid),
                                        'numbers': _get_word_numbers(rec.fid),
                                        'nouns_list': null,
                                    };
                                    result.nouns_list.push(_noun2list);
                                    //----------
                                    added_yet.push(rec.fid);
                                } // end if
                            } // end for x
                        } // end if
                    } // end if
                } // end if
            } // end if
            //----------
            return result;
            //----------
        }, // end function "getWord"
    //------------------------------
    // Функция возвращает тип объекта (1-2-3) для глагола по fid предлога и падежу
    // Возвращает число 1-2-3 или null.
        getNounPriority = function (_verb, _noun, _prep_bid, already) {
            var result = null;
            //----------
            // Отбираем данные по объектам всех типов для переданного глагола
            var objects_list = dbObjectsOfVerbs({'bid': _verb.bid}).get();
            //----------
            for (var x = 0; x < objects_list.length; x++) {
                var object = objects_list[x];
                //----------
                if (already.indexOf(object.priority) >= 0) {
                    continue;
                } // end if
                //----------
                var cases = object.cases || [];
                //----------
                if (object.prep !== null && object.prep !== _prep_bid) {
                    continue;
                } // end if
                //----------
                if (_noun.morph == 'С') {
                    for (var z = 0; z < cases.length; z++) {
                        var case_obj = cases[z];
                        if (_noun.cases.united.indexOf(case_obj) >= 0) {
                            result = {
                                'priority': object.priority,
                                'noun': _noun,
                            };
                            break;
                        } // end if
                    } // end for

                } else if (_noun.morph == 'М' && _noun.nouns_list !== null) {
                    for (var y = 0; y < _noun.nouns_list.length; y++) {
                        var noun2 = _noun.nouns_list[y];
                        //----------
                        for (var z = 0; z < cases.length; z++) {
                            var case_obj = cases[z];
                            if (noun2.cases.indexOf(case_obj) >= 0) {
                                result = {
                                    'priority': object.priority,
                                    'noun': noun2,
                                };
                                break;
                            } // end if
                        } // end for z
                        //----------
                        if (result != null) {
                            break;
                        } // end if
                    } // end for y
                } else if (_noun.morph == 'Н') {
                    var adverbs = object.adverbs || [];
                    //----------
                    if (adverbs.length > 0) {
                        if (adverbs.indexOf(_noun.bid) >= 0) {
                            result = {
                                'priority': object.priority,
                                'noun': _noun,
                            };
                            break;
                        } // end if
                    } // end if
                } // end if
            } // end for x
            //----------
            return result;
            //----------
        }, // end function "getNounPriority"
    //------------------------------
        getObjectsOfVerbs = function (_search) {
            return dbObjectsOfVerbs(_search).get();
        },
    //------------------------------
    /*get_forms_list: function (_search) {
     return db_search_form(_search).get();
     },*/
    //------------------------------
        getFormsListByCaseAndNumber = function (_search) {
            return dbSearchForm(_search).get();
        }, // end function "getFormsListByCaseAndNumber"
    //------------------------------
        getFormsListByBID = function (_search) {
            return dbForms(_search).get();
        }; // end function "getFormsListByBID"

    return {};
});
