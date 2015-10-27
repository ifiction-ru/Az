/* СОГЛАШЕНИЕ О ДАННЫХ
    Части речи обозначаются заглавными буквами:
        "С" — существительное
        "Г" — глагол
        "ПР" — предлог
        "П" — прилагательное
        "М" — местоимение
        "Н" — наречие
    ----------
    Падежи обозначаются одной заглавной буквой: И|Р|Д|В|Т|П (+дополнительные, если надо)
    Числа обозначаются одной заглавной буквой: Е|М
    ----------
    */
/* --------------------------------------------------------------------------- */
window.DICTIONARY = (function() {
    //--------------------------------------------------
    var id_for_base = 0; // Числовой уникальный идентификатор каждого слова-основы в словаре
    var id_for_form = 0; // Числовой уникальный идентификатор каждой словоформы в словаре
    var dict_absend = []; // запись отсутсвующих слов в словаре
    // ---------------------------------------------------------------------------
    // БАЗЫ ДАННЫХ СЛОВАРЯ
        /* Формат базы данных "db_bases":
            bid     Уникальный числовой идентификатор слова-основы
            morph   Часть речи
            base    Основа слова
            ----------*/
            var db_bases = TAFFY();
        //------------------------------
        /* Формат базы данных "db_bases_for_tag":
            tag     Имя тега
            bids    Перечень уникальных числовых идентификаторов слов-основ
            ----------*/
            var db_bases_for_tag = {}; //TAFFY(),
        //------------------------------
        /* Формат базы данных "db_tags_for_base":
            bid     Уникальный числовой идентификатор слова-основы
            tags    Имена тегов
            ----------*/
            var db_tags_for_base = {}; //TAFFY(),
        //------------------------------
        /* Формат базы данных "db_forms":
            bid     Уникальный числовой идентификатор слова-основы
            fid     Уникальный числовой идентификатор словоформы
            form    Словоформа
            ----------
            */
            var db_forms = TAFFY();
        //------------------------------
        /* БД (массив) "db_word_genders" предназначена для хранения рода существительных и местоимений
            Формат:
                bid     Уникальный числовой идентификатор основы слова
                gender  Род
            ----------*/
            var db_word_genders = {}; //TAFFY(),
        //------------------------------
        /* БД (массив) "db_word_cases" предназначена для хранения падежей существительных, местоимений и предлогов (как отношение сущ., мест., числ.)
            Формат:
                fid     Уникальный числовой идентификатор словоформы
                cases   Падежи словоформы, массив: ['падеж1', 'падеж2', ...]
            ---------- */
            var db_word_cases = {};
        //------------------------------
        /* БД "db_word_numbers" предназначена для хранения чисел существительных и местоимений
            Формат:
            fid     Уникальный числовой идентификатор словоформы
            number  Числа словоформы, массив: ['число1', 'число2', ...]
            ----------*/
            var db_word_numbers = {};
        //------------------------------
        /* БД "db_adverb_and_prep" предназначена для хранения признака, что наречие может быть и предлогом
            Формат:
            fid     Уникальный числовой идентификатор словоформы
            _value  true/false
            ----------*/
            var db_adverb_and_prep = {};
        //------------------------------
        /* Формат базы данных "db_search_form":
            bid     Уникальный числовой идентификатор основы слова
            case    Падеж
            number  Число
            fid     Уникальный числовой идентификатор словоформы
            ---------- */
            var db_search_form = TAFFY();
        //------------------------------
        /* Формат базы данных "db_objects_of_verbs":
            bid         Уникальный числовой идентификатор глагола-основы
            priority    Приоритет объекта [0,1,2]
            prep        fid предлога
            case        Падеж [И|Р|Д|В|Т|П]
            ---------- */
            var db_objects_of_verbs = TAFFY();
    // ---------------------------------------------------------------------------
    // ВНУТРЕННИЕ ФУНКЦИИ
    // ---------------------------------------------------------------------------
    // Функция добавляет в Словарь основу слова
    function _add_base (_base, _morph, _tags) {
        _base   = _base.toLowerCase(_base.trim()); // Приводим к нижнему регистру
        //----------
        var rec = db_bases({'base':_base}).first(); // Ищем в БД запись с такой же базой
        //----------
        if (rec !== false) {
            // ??? Вставить сравнение с найдеными параметрами, чтобы автор словаря не затёр ничего
            return rec.bid;
            
        } else {
            var bid = ++id_for_base; // Увеличиваем счётчик "bid"
            //----------
            db_bases.insert({
                'bid':      bid,
                'morph':    _morph,
                'base':     _base,
                });
            //----------
            if (_tags !== undefined) {
                _tags   = _tags || [];
                //----------
                // +++ Приведение тегов к единой форме
                db_tags_for_base[bid] = _tags.slice();
                //----------
                // Перебираем теги
                for (var x=0; x<_tags.length; x++) {
                    var tag = _tags[x];
                    //----------
                    var bids_list = db_bases_for_tag[tag] || [];
                    if (bids_list.indexOf(bid) == -1) {
                        bids_list.push(bid);
                        //----------
                        db_bases_for_tag[tag]=bids_list;
                    } // end if
                } // end for x
            } // end if
            //----------
            return id_for_base;
        } // end if
    } // end function "_add_base"
    //------------------------------
    // Функция возвращает morph и base (основу слова) из Словаря по bid
    function _get_base (bid) {
        var rec = db_bases({'bid':bid}).first(); // Ищем в БД запись с такой же базой
        //----------
        if (rec === false) {
            return {
                'bid':      null,
                'morph':    null,
                'base':     null,
            };
        } else {
            return {
                'bid':      bid,
                'morph':    rec.morph,
                'base':     rec.base,
            };
        } // end if
    } // end function "_get_base"
    //------------------------------
    function _get_word_tags (bid) {
        return db_tags_for_base[bid] || [];
    } // end function "_get_word_tags"
    //------------------------------
    // Функция добавляет в Словарь отдельную словоформу слова
    function _add_form (_bid, _form) {
        _form = _form.trim().toLowerCase(); // Приводим к нижнему регистру
        //----------
        // Проверяем форму слова на наличие флагов включения/исключения слова из автодополнения
            var first   = _form.substr(1,1);
            var last    = _form.slice(-1);
            //----------
            var ac_inc = (first == '+' || last == '+') ? true : ((first == '-' || last == '-') ? false : null);
            //----------
            if (first == '+' || first == '-') {_form = _form.substr(2).trim();} // end if
            //----------
            if (last == '+' || last == '-') {_form = _form.slice(0,-1).trim();} // end if
        //----------
        var search = {'bid':_bid, 'form':_form};
        //----------
        var rec = db_forms(search).first();
        //----------
        if (rec == false) {
            search.fid = ++id_for_form; // Увеличиваем счётчик "fid"
            //----------
            db_forms.insert(search); // Сохраняем данные о словоформе
            //----------
            rec = search;
        }
        //----------
        if (ac_inc !== null) {AUTOCOMPLETE.addWordWithFlag(_bid, rec.fid, ac_inc);} // end if
        //----------
        return rec.fid;
        //----------
    } // end function "_add_form"
    //------------------------------
    // Функция возвращает словоформу из Словаря по fid
    function _get_form (_fid) {
        var rec = db_forms({'fid':_fid}).first();
        //----------
        return rec === false ? {'bid':null, 'fid':null, 'form':null} : {'bid':rec.bid, 'fid':rec.fid, 'form':rec.form};
    } // end function "_get_form"
    //------------------------------
    // Функция возвращает bid и fid из Словаря по словоформе слова
    function _get_form_ids (_form) {
        // !!! используется в Описании!
        _form = _form.trim().toLowerCase(); // Приводим к нижнему регистру
        //----------
        var rec = db_forms({'form':_form}).first();
        //----------
        return rec === false ? {'bid':null, 'fid':null} : {'bid':rec.bid, 'fid':rec.fid};
    } // end function "_get_form_ids"
    //------------------------------
    // Функция добавляет в Словарь род основы слова
    function _add_word_gender (_bid, _gender) {
        db_word_genders[String(_bid)] = _gender.trim().toUpperCase();
    } // end function "_add_word_gender"
    //------------------------------
    // Функция возвращает из Словаря род основы слова по его bid
    function _get_word_gender (_bid) {
        var result = db_word_genders[String(_bid)];
        //----------
        if (result === undefined) {result = '';} // end if
        //----------
        return result;
    } // end function "_get_word_gender"
    //------------------------------
    // Функция добавляет в Словарь падежи словоформы
    function _add_word_cases (_id, _number, _cases) {
        db_word_cases[String(_id)+':'+_number] = _cases.slice();
        //----------
    } // end function "_add_word_cases"
    //------------------------------
    // Функция возвращает из Словаря падежи словоформы по её fid
    function _get_word_cases (_id, _number) {
        _number = _number || false;
        //----------
        // Если число слова указано, то возвращаем соответствующий набор падежей
        if (_number !== false) {
            var result = db_word_cases[String(_id)+':'+_number];
            if (result === undefined) {
                result = [];
            } else {
                result = result.slice();
            } // end if
        
        // Если число слова НЕ указано, то возвращаем все наборы падежей
        } else {
            var result = {
                singular:   db_word_cases[String(_id)+':Е'] || [],
                plural:     db_word_cases[String(_id)+':М'] || []
            };
            result.singular = result.singular.slice();
            result.plural   = result.plural.slice();
            //----------
            result.united=result.singular.concat(result.plural);
        } // end if
        //----------
        return result;
    } // end function "_get_word_cases"
    //------------------------------
    // Функция добавляет в Словарь числа словоформы
    function _add_word_numbers (_fid, _numbers) {
        //, _cases
        db_word_numbers[String(_fid)]=_numbers.slice();
        //----------
    } // end function "_add_word_numbers"
    //------------------------------
    // Функция возвращает из Словаря падежи словоформы по её fid
    function _get_word_numbers (_fid) {
        var result = db_word_numbers[String(_fid)];
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
    function _add_adverb_and_prep (_bid, _can_be) {
        //----------
        db_adverb_and_prep[String(_bid)]=_can_be;
        //----------
    } // end function "_add_prep_data"
    //------------------------------
    // Функция возвращает из Словаря информацию, может ли наречие быть предлогом, по его bid
    function _get_adverb_and_prep (_bid) {
        var result = db_adverb_and_prep[String(_bid)] || false;
        //----------
        return result;
    } // end function "_get_adverb_and_prep"
    //------------------------------
    // Функция добавляет в БД существительное или местоимение
    function _add_noun_or_pronoun (_base, _gender, _data, _morph) {
        var forms_list      = []; // Перечень уникальных словоформ. Массив строковых значений.
        var cases_list      = {}; // Перечень падежей для каждой уникальной словоформы. Структура: cases_list['словоформа'] = ['падеж1', 'падеж2', ...]
        var numbers_list    = {}; // Перечень чисел для каждой уникальной словоформы. Структура: numbers_list['словоформа'] = ['число1', 'число2', ...]
        //----------
        // +++ Проверка на заполненность параметров функции
        //----------
        var bid = _add_base(_base, _morph); // Сохраняем данные об основе слова
        //----------
        _add_word_gender(bid, _gender); // Сохраняем данные о роде слова
        //----------
        // Перебираем все словоформы и сворачиваем перечень до уникальных записей, у которых падежи и числа свёрнуты в массивы
        for (var x=0; x<_data.length; x++) {
            var wform   = _data[x][0];  // словоформа
            var wcase   = _data[x][1];  // падеж словоформы
            var wnumber = _data[x][2];  // число словоформы
            //----------
            // +++ Проверка на заполненность и корректность данных
            //----------
            // Приводим данные к требуемому виду
            wform   = wform.trim().toLowerCase();
            wcase   = wcase.trim().toUpperCase();
            wnumber = wnumber.trim().toUpperCase();
            //----------
            if (forms_list.indexOf(wform) == -1) {
                forms_list.push(wform);
                //----------
                cases_list[wform+':Е']  = [];
                cases_list[wform+':М']  = [];
                //----------
                numbers_list[wform]     = [];
            } // end if
            //----------
            if (cases_list[wform+':'+wnumber].indexOf(wcase) == -1) {
                cases_list[wform+':'+wnumber].push(wcase);
            } // end if
            //----------
            if (numbers_list[wform].indexOf(wnumber) == -1) {
                numbers_list[wform].push(wnumber);
            } // end if
            //----------
        } // end for: Закончили перебирать словоформы
        //----------
        // Записываем сведения о словоформах в базу данных
        for (var x=0; x<forms_list.length; x++) {
            wform   = forms_list[x];
            //----------
            var fid = _add_form(bid, wform); // Сохраняем данные о словоформе слова
            //----------
            // Сохраняем данные о падежах словоформы слова в единственном числе
            if (cases_list[wform+':Е'].length > 0) {
                _add_word_cases(fid, 'Е', cases_list[wform+':Е']);
                //----------
                for (var y=0; y<cases_list[wform+':Е'].length; y++) {
                    db_search_form.insert({
                        'bid':      bid,
                        'case':     cases_list[wform+':Е'][y],
                        'number':   'Е',
                        'fid':      fid,
                        });
                } // end for y
            } // end if
            //----------
            // Сохраняем данные о падежах словоформы слова во множественном числе
            if (cases_list[wform+':М'].length > 0) {
                _add_word_cases(fid, 'М', cases_list[wform+':М']);
                //----------
                for (var y=0; y<cases_list[wform+':М'].length; y++) {
                    db_search_form.insert({
                        'bid':      bid,
                        'case':     cases_list[wform+':М'][y],
                        'number':   'М',
                        'fid':      fid,
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
    function _add_objects_to_verb (verb_id, priority, data) {
        if (data === undefined) {return;} // Если вообще не передали этот параметр в родительскую функцию
        //----------
        // +++ Проверка на заполненность и корректность параметров
        //----------
        for (var x=0; x<data.length; x++) {
            var rec             = data[x];
            var prep            = null;
            var cases           = null;
            var adverbs_list    = [];
            //----------
            if (typeof(rec) == 'string') { // с предлогом, без падежей
                if (rec.trim().substr(0,1) == '#') {
                    var tag = rec.trim().toLowerCase();
                    //----------
                    // Получаем перечень bid слов по переданному тегу
                    var bids_list = db_bases_for_tag[tag] || [];
                    //----------
                    // Перебираем перечень слов
                    for (var y=0; y<bids_list.length; y++) {
                        var bid = bids_list[y];
                        var word = _get_base(bid);
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
                        console.error('При заполнении данных глагола "'+_get_base(verb_id).base+'", предлог: "'+rec+'" не найден.');
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
                        console.error('При заполнении данных глагола "'+_get_base(verb_id).base+'", предлог: "'+rec+'" не найден.');
                        continue;
                    } // end if
                } // end if
                //----------
                // Анализируем падежи - rec[1]
                if (rec[1] !== null) {
                    if (typeof(rec[1]) == 'string') {
                        cases=[rec[1].trim().toUpperCase()];
                    } else {
                        // +++ Добавить приведения каждого элемента (падежа) к верхнему регистру
                        cases=(rec[1].length == 0 ? null : rec[1].slice());
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
            db_objects_of_verbs.insert({
                'bid':      verb_id,
                'priority': priority,
                'prep':     (prep === null ? null : prep.bid),
                'cases':    cases,
                'adverbs':  adverbs_list,
                });
            //----------
        } // end for x
        //----------
    } // end function "_add_objects_to_verb"
    //------------------------------
    return {
        //------------------------------
        // ДОБАВЛЕНИЕ СЛОВ В СЛОВАРЬ
            //----------
            // Добавление существительного в базу
            addNoun: function (_base, _gender, _data) {
                //----------
                return _add_noun_or_pronoun(_base, _gender, _data, 'С');
                //----------
            }, // end function "addNoun"
            //------------------------------
            // Добавление местоимения в базу
            addPronoun: function (_base, _gender, _data) {
                //----------
                return _add_noun_or_pronoun(_base, _gender, _data, 'М');
                //----------
            }, // end function "addPronoun"
            //------------------------------
            // Добавление наречия в базу
            addAdverb: function (_forms, _atags, _cases, _ptags) {
                // +++ Проверка на заполненность и корректность параметров
                //----------
                if (typeof(_forms) == 'string') {_forms = [_forms];}
                _atags = _atags || [];
                _ptags = _ptags || [];
                //----------
                var bid = _add_base(_forms[0], 'Н', _atags.concat(_ptags)); // Сохраняем данные об основе слова и получаем bid основы
                //----------
                _cases = _cases || [];
                if (typeof(_cases) == 'string') {_cases = [_cases];} // end if
                //----------
                if (_cases.length > 0) {
                    _add_adverb_and_prep(bid, true);
                    //----------
                    _add_word_cases(bid, '-', _cases); // Сохраняем данные о падежах наречия-предлога
                } // end if
                //----------
                // Перебираем перечень наречий
                for (var x=0; x<_forms.length; x++) {
                    // +++ Проверка на заполненность и корректность параметров
                    //----------
                    var fid = _add_form(bid, _forms[x]); // Сохраняем данные о словоформе слова и получаем fid словоформы
                } // end for x
                //----------
            }, // end function "addAdverb"
            //------------------------------
            // Добавление предлога в базу
            addPreposition: function (_forms, _cases, _tags) {
                // +++ Проверка на заполненность и корректность параметров
                //----------
                // +++ Заменить на any2arr
                if (typeof(_forms)  == 'string') {_forms = [_forms];}
                if (typeof(_cases)  == 'string') {_cases = [_cases];}
                if (typeof(_tags)   == 'string') {_tags = [_tags];}
                //----------
                var bid = _add_base(_forms[0], 'ПР', _tags); // Сохраняем данные об основе слова и получаем bid основы
                //----------
                //if (_can_be_adverb == true) {_add_adverb_and_prep(bid, true);} // end if
                //----------
                _add_word_cases(bid, '-', _cases); // Сохраняем данные о падежах предлога
                //----------
                // Перебираем формы предлога
                for (var x=0; x<_forms.length; x++) {
                    // +++ Проверка на заполненность и корректность параметров
                    //----------
                    var fid = _add_form(bid, _forms[x]); // Сохраняем данные о словоформе слова и получаем fid словоформы
                } // end for x
                //----------
            }, // end function "addPreposition"
            //------------------------------
            // Добавление глагола в базу
            addVerb: function (_base, _forms, data1, data2, data3) {
                //----------
                if (typeof(_forms) == 'string') {_forms=[_forms]} // end if
                //----------
                // +++ Проверка на заполненность и корректность параметров
                //----------
                var bid = _add_base(_base, 'Г'); // Сохраняем данные об основе слова
                //----------
                for (var x=0; x<_forms.length; x++) {
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
            getBase:            _get_base,
            //------------------------------
            getForm:            _get_form,
            //------------------------------
            getFormIDs:     _get_form_ids,
            //------------------------------
            //get_word_gender:  _get_word_gender,
            //------------------------------
            //get_word_numbers: _get_word_numbers,
            //------------------------------
            getWordCases:       _get_word_cases,
            //------------------------------
            // Функция по переданной словоформе определяет слово из словаря. Если это местоимение, то здесь же происходит привязка существительного
            // Если не найдено — возвращает "null"
            getWord: function (_word, _full_info, _prep, _last_nouns) {
                _full_info  = _full_info || false;
                _prep       = _prep || null;
                //----------
                var form = _word.trim().toLowerCase();
                if (form == '') {return null;} // end if
                //----------
                // Получаем параметры словоформы
                var result = _get_form_ids(form);
                //----------
                // Не найдено — возвращаем "null"
                if (result.fid === null) {return null;} // end if
                //----------
                result.word_as_is   =_word;
                result.form         =form;
                //----------
                // Получаем параметры основы слова
                var rec = _get_base(result.bid);
                //----------
                // Не найдено — возвращаем "null"
                if (rec.bid===false) {return null;}
                //----------
                result.morph    =rec.morph;
                result.base     =rec.base;
                //----------
                result.prep     =_prep;
                //----------
                // Если запрошена лишь краткая информация о слове — возвращаем, что есть
                if (_full_info === false) {return result;} // end if
                //----------
                _last_nouns = _last_nouns || null;
                //----------
                // Если получили предлог
                if (result.morph == 'ПР') {
                    result.cases    = _get_word_cases(result.bid, '-');
                    result.tags     = _get_word_tags(result.bid);
                
                // Если получили наречие
                } else if (result.morph == 'Н') {
                    result.tags         = _get_word_tags(result.bid);
                    //----------
                    result.can_be_prep = _get_adverb_and_prep(result.bid);
                    if (result.can_be_prep === true) {
                        result.cases = _get_word_cases(result.bid, '-');
                    } // end if
                    
                // Если получили существительное или местоимение
                } else if (result.morph == 'С' || result.morph == 'М') {
                    // Дополняем сведения о слове информацией о роде, падежах и числах
                    result.gender   = _get_word_gender(result.bid);
                    //----------
                    result.cases    = _get_word_cases(result.fid);
                    //----------
                    result.numbers  = _get_word_numbers(result.fid);
                    //----------
                    if (_prep !== null) {
                        var cases_list = result.cases.singular;
                        if (cases_list.length>0) {
                            for (var x=cases_list.length-1; x>=0; x--) {
                                var _case=cases_list[x];
                                //----------
                                if (_prep.cases.indexOf(_case) == -1) {
                                    cases_list.splice[x,1];
                                } // end if
                            } // end for
                        } // end if
                        //----------
                        var cases_list = result.cases.plural;
                        if (cases_list.length>0) {
                            for (var x=cases_list.length-1; x>=0; x--) {
                                var _case=cases_list[x];
                                //----------
                                if (_prep.cases.indexOf(_case) == -1) {
                                    cases_list.splice[x,1];
                                } // end if
                            } // end for
                        } // end if
                        //----------
                        result.cases.united=result.cases.singular.concat(result.cases.plural);
                    } // end if
                    //----------
                    if (result.morph == 'М') {
                        result.nouns_list = [];
                        //----------
                        // +++ обработку множественного числа местоимений "они", "любые"
                        //----------
                        var noun = null;
                        if (_last_nouns !== null) {
                            for (var x=1; x<=3; x++) {
                                noun = _last_nouns[result.gender+':'+x] || null;
                                // Если существительное не найдено и род местоимения мужской, то возможно подразумевается существительное в среднем роде
                                if (noun === null && result.gender == 'М') {
                                    noun = _last_nouns['С:'+x] || null;
                                } // end if
                                //----------
                                if (noun !== null) {break;} // end-if
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
                            var recs = db_search_form({'bid': noun.bid, 'case': result.cases.united, 'number': result.numbers}).get();
                            if (recs !== false) {
                                var added_yet = [];
                                result.nouns_list = [];
                                for (var x=0; x<recs.length; x++) {
                                    rec = recs[x];
                                    //----------
                                    if (added_yet.indexOf(rec.fid) >= 0) {continue;} // end if
                                    var form_rec = _get_form(rec.fid);
                                    //----------
                                    if (form_rec !== null) {
                                        var word_base = _get_base(noun.bid);
                                        //----------
                                        var _noun2list = {
                                            'bid':          noun.bid,
                                            'fid':          rec.fid,
                                            'morph':        word_base.morph,
                                            'base':         word_base.base,
                                            'form':         form_rec.form,
                                            'gender':       _get_word_gender(noun.bid),
                                            'cases':        _get_word_cases(rec.fid),
                                            'numbers':      _get_word_numbers(rec.fid),
                                            'nouns_list':   null,
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
            getNounPriority: function (_verb, _noun, _prep_bid, already) {
                var result = null;
                //----------
                // Отбираем данные по объектам всех типов для переданного глагола
                var objects_list = db_objects_of_verbs({'bid': _verb.bid}).get();
                //----------
                for (var x=0; x<objects_list.length; x++) {
                    var object = objects_list[x];
                    //----------
                    if (already.indexOf(object.priority) >=0 ) {continue;} // end if
                    //----------
                    var cases = object.cases || [];
                    //----------
                    if (object.prep !== null && object.prep !== _prep_bid) {continue;} // end if
                    //----------
                    if (_noun.morph == 'С') {
                        for (var z=0; z<cases.length; z++) {
                            var case_obj = cases[z];
                            if (_noun.cases.united.indexOf(case_obj) >= 0) {
                                result = {
                                    'priority': object.priority,
                                    'noun':     _noun,
                                };
                                break;
                            } // end if
                        } // end for
                        
                    } else if (_noun.morph == 'М' && _noun.nouns_list !== null) {
                        for (var y=0; y<_noun.nouns_list.length; y++) {
                            var noun2 = _noun.nouns_list[y];
                            //----------
                            for (var z=0; z<cases.length; z++) {
                                var case_obj = cases[z];
                                if (noun2.cases.indexOf(case_obj) >= 0) {
                                    result = {
                                        'priority': object.priority,
                                        'noun':     noun2,
                                    };
                                    break;
                                } // end if
                            } // end for z
                            //----------
                            if (result != null) {break;} // end if
                        } // end for y
                    } else if (_noun.morph == 'Н') {
                        var adverbs = object.adverbs || [];
                        //----------
                        if (adverbs.length > 0) {
                            if (adverbs.indexOf(_noun.bid) >=0 ) {
                                result = {
                                    'priority': object.priority,
                                    'noun':     _noun,
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
        getObjectsOfVerbs: function (_search) {
            return db_objects_of_verbs(_search).get();
        },
        //------------------------------
        /*get_forms_list: function (_search) {
            return db_search_form(_search).get();
        },*/
        //------------------------------
        getFormsListByCaseAndNumber: function (_search) {
            return db_search_form(_search).get();
        }, // end function "getFormsListByCaseAndNumber"
        //------------------------------
        getFormsListByBID: function (_search) {
            return db_forms(_search).get();
        }, // end function "getFormsListByBID"
    };
})(); // end object DICTIONARY
/* --------------------------------------------------------------------------- */
/* Существительное (параметры) — Добавляет существительное в словарь.
    Параметры:
        _base:      основа, то есть к чему приводится всё многообразие словоформ данного существительного
        _gender:    род основы слова: М|Ж|С
        _data:      данные, описывающие различные словоформы основы данного существительного. Структура данных:
            [ ['словоформа1', 'падеж1', 'число1'], ['словоформа2', 'падеж2', 'число2'], ... ]
        ----------
        Пример использования:
            Существительное('кошелёк','м',[
                ['кошелёк',     'И','е'], ['кошельки',      'И','м'],
                ['кошелька',    'Р','е'], ['кошельков',     'Р','м'],
                ['кошельку',    'Д','е'], ['кошелькам',     'Д','м'],
                ['кошелёк',     'В','е'], ['кошельки',      'В','м'],
                ['кошельком',   'Т','е'], ['кошельками',    'Т','м'],
                ['кошельке',    'П','е'], ['кошельках',     'П','м'],
                //----------
                ['кошелек',     'И','е'],
                ['кошелек',     'В','е'],
                ]);
        ----------
        Примечание: Не нужно заморачиваться с объединением нескольких словоформ в одну с указанием нескольких падежей (например, "кошелёк" — это и Именительный, и Винительный падеж) — это неудобно для автора и выглядит не особо наглядно.
        ----------
    */
window.addNoun = function () {
    //----------
    DICTIONARY.addNoun.apply(this, arguments);
    //----------
}; // end function "addNoun"
/* --------------------------------------------------------------------------- */
window.addPronoun = function () {
    //----------
    DICTIONARY.addPronoun.apply(this, arguments);
    //----------
}; // end function "addPronoun"
/* --------------------------------------------------------------------------- */
/* Предлог (параметры) — Добавляет предлог в словарь.
    Параметры:
        _form:  написание предлога. Строка или массив строк: ['предлог1', 'предлог2', ...]
        ----------
        Пример использования:
            Предлог('около');
        или
            Предлог(['в','за','из','из-за','из-под','к','на','с','со']);
        ----------
    */
window.addPrepositon = function () {
    //----------
    DICTIONARY.addPreposition.apply(this, arguments);
    //----------
}; // end function "addPrepositon"
/* --------------------------------------------------------------------------- */
/* Наречие (параметры) — Добавляет наречие в словарь.
    Параметры:
        _form:  написание предлога. Строка или массив строк: ['предлог1', 'предлог2', ...]
        ----------
        Пример использования:
            Предлог('около');
        или
            Предлог(['в','за','из','из-за','из-под','к','на','с','со']);
        ----------
    */
window.addAdverb = function () {
    //----------
    DICTIONARY.addAdverb.apply(this, arguments);
    //----------
}; // end function "addAdverb"
/* --------------------------------------------------------------------------- */
window.addVerb = function () {
    //----------
    DICTIONARY.addVerb.apply(this, arguments);
    //----------
}; // end function "addVerb"
/* --------------------------------------------------------------------------- */
