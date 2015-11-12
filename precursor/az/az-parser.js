/* ---------------------------------------------------------------------------
    ++++
    TO-DO
        +++ Добавить проверку наличия объекта в текущем контексте. А лучше фильтр
        ----------
        Формат параметров для "tSimpleObject.prototype.Описывается":
            2. Перечень: [{words:[слова1], locs:[локации1]}, {words:[слова2], locs:[локации2]}]
        ----------
        +++ Добавить прилагательные: возьми золотой кубок // возьми деревянный кубок
            
--------------------------------------------------------------------------- */
window.PARSER = (function() {
    //--------------------------------------------------
    var last_params     = {};
    //--------------------------------------------------
    var LOC_ID          = null;
    //--------------------------------------------------
    /* Формат базы данных "db_words_and_objects":
        bid         Уникальный числовой идентификатор существительного
        object      Строковый идентификатор объекта
        location    Строковый идентификатор расположения объекта
        ---------- */
        var db_words_and_objects = TAFFY();
    /* --------------------------------------------------------------------------- */
    function _get_link_to_object (_options) {
        var priority    = _options['priority'] || 0;
        //----------
        var L   = _options['loc'] || null;
        var V   = _options['vid'] || null;
        var P   = _options['pid'] || null;
        var W   = _options['wid'] || null;
        //var F = _options['fid'] || null;
        var to1 = _options['to1'] || null;
        var to2 = _options['to2'] || null;
        var to3 = _options['to3'] || null;
        //----------
        var any = _options['any'] || null;
        //----------
        var search = {'obj':AZ.availObjects(true, false), 'priority':priority, 'loc':L, 'vid':V, 'pid':P, 'wid':W, 'to1':to1, 'to2':to2, 'to3':to3, 'any':any};
        //----------
        var object_id   = null;
        var priority    = null;
        var action_id   = null;
        //----------
        var rec = db_words_and_objects(search).first();
        //----------
        if (rec == false) {
            search.loc = null;
            //----------
            rec = db_words_and_objects(search).first();
        } // end if
        //----------
        if (rec != false) {
            object_id   = rec.obj;
            priority    = rec.priority;
            action_id   = rec.action;
        } // end if
        //----------
        return object_id === null ? null : {'object':AZ.getObject(object_id), 'priority':priority, 'action':action_id};
        //----------
    } // end function "_get_link_to_object"
    /* --------------------------------------------------------------------------- */
    function _get_objects_by_word (_search, _morph) {
        _search.obj = AZ.availObjects(true, false);
        //----------
        var list = db_words_and_objects(_search).get();
        //----------
        var result = [];
        //----------
        for (var x=0; x<list.length; x++) {
            result.push(list[x].obj);
        } // end for
        //----------
        return result;
    } // end function "_get_objects_by_word"
    /* --------------------------------------------------------------------------- */
    function _get_noun_of_object_by_pronoun (_wid) {
        var result = null;
        //----------
        var search = {
            priority: 0,
            obj:      AZ.availObjects(true, false),
            loc:      [AZ.getLocation(true), null],
            wid:      _wid,
        }; // end search
        //----------
        var list = db_words_and_objects(search).get();
        if (list.length == 0) {return null;} // end if
        //----------
        var object = list[0].obj;
        //----------
        search.obj = list[0].obj;
        delete search.wid;
        //----------
        var list = db_words_and_objects(search).get();
        for (var x=0; x<list.length; x++) {
            var wid = list[x].wid;
            //----------
            var rec = DICTIONARY.getBase(wid);
            if (rec.morph == 'С') {
                result = rec;
                break;
            } // end if
        } // end for
        //----------
        return result;
    } // end function "_get_noun_of_object_by_pronoun"
    /* --------------------------------------------------------------------------- */
    // Добавляем наречие в перечень наречий
    function _add_adverb (_adverbs, _word) {
        _adverbs.list.push(_word);
        _adverbs.bids.push(_word.bid);
    } // end function "_add_adverb"
    /* --------------------------------------------------------------------------- */
    // Удаляем наречие из перечня наречий
    function _remove_adverb (_adverbs, _word) {
        if (_word == null) {return;} // end if
        //----------
        var pos = _adverbs.bids.indexOf(_word.bid);
        if (pos >= 0) {
            _adverbs.list.splice(pos,1);
            _adverbs.bids.splice(pos,1);
        } // end if
    } // end function "_remove_adverb"
    /* --------------------------------------------------------------------------- */
    function _set_cmd_param (CMD, _priority, _word, _prep, _objrec, _nouns4pronouns, _pr_occupied) {
        //----------
        if (CMD.params[_priority] === null) {
            //----------
            CMD.params[_priority]       = _word;
            CMD.params[_priority].prep  = _prep;
            //----------
            // В перечень последних существительных добавляем только существительные
            if (_word.morph == 'С') {
                _nouns4pronouns[_word.gender+':'+_priority] = _word;
            } // end if
            //----------
            if (_objrec !== null) {
                CMD.objects[_priority] = _objrec.object;
                CMD.actions[_priority] = _objrec.action;
            } // end if
            //----------
            _pr_occupied.push(_priority);
        } // end if
        //----------
    } // end function "_set_cmd_param"
    /* --------------------------------------------------------------------------- */
    function _check_param_priority (CMD, word, prep, _nouns4pronouns, _pr_occupied) {
        var prep_id = (prep === null ? null : prep.bid);
        var priority = DICTIONARY.getNounPriority(CMD.verb, word, prep_id, _pr_occupied);
        if (priority === null) {return null;} // end if
        //----------
        priority = priority['priority'];
        //----------
        if (priority>=1 && priority<=3) {
            var search = {'priority':priority, 'loc':LOC_ID, 'vid':CMD.verb.bid, 'pid':prep_id, 'wid':word.bid};
            //----------
            if (CMD.unknown.length > 0) {search.any = [1,2,3];} // end if
            //----------
            var objrec = _get_link_to_object(search);
            //----------
            if (objrec != null) {CMD.unknown = [];} // end if
            //----------
            _set_cmd_param(CMD, priority, word, prep, objrec, _nouns4pronouns, _pr_occupied);
            //----------
            return priority;
            
        } else {
            return null;
        } // end-if
        //----------
    } // end function "_check_param_priority"
    /* --------------------------------------------------------------------------- */
    // Проверяем, подходит ли предлог существительному по падежу
    function _check_prep_by_noun (_noun, _prep) {
        if (_prep == null) {return null;}
        //----------
        for (var y=0; y<_prep.cases.length; y++) {
            var prep_case = _prep.cases[y];
            if (_noun.cases.united.indexOf(prep_case) >= 0) {
                is_prep_correct = true;
                return _prep;
            } // end if
        }
        //----------
        return null;
    } // end function "_check_prep_by_noun"
    /* --------------------------------------------------------------------------- */
    // Примеряем накопившиеся наречия
    function _check_adverbs (CMD, _adverbs, _nouns4pronouns, _pr_occupied) {
        var objrec = null;
        //----------
        // Если после разбора фразы остались наречия, которые не были использованы как предлоги
        if (_adverbs.list.length > 0) {
            // Перебираем список неразобранных наречий
            for (var x=0; x<_adverbs.list.length; x++) {
                var adverb = _adverbs.list[x];
                //----------
                objrec = null;
                // Пытаемся пристроить наречие в порядке приоритета типа: 1-2-3
                for (priority=1; priority<=3; priority++) {
                    // Если параметр команды данного приоритета не занят...
                    if (_pr_occupied.indexOf(priority) == -1) {
                        // ...пытаемся опеределить, подходит ли данное слово к какому либо объекту
                        objrec = _get_link_to_object({
                                        'priority':priority,
                                        'loc':LOC_ID,
                                        'vid':(CMD.verb == null ? null : CMD.verb.bid),
                                        'wid':adverb.bid});
                        //----------
                        if (objrec !== null) {
                            break;
                        } // end if
                    } // end if
                } // end for priority
                if (objrec !== null) {
                    //----------
                    _set_cmd_param(CMD, objrec.priority, adverb, null, objrec, _nouns4pronouns, _pr_occupied);
                    //----------
                    _remove_adverb(_adverbs, adverb);
                    //----------
                    continue;
                } // end if
                //----------
                if (CMD.verb !== null) {
                    priority = DICTIONARY.getNounPriority(CMD.verb, adverb, null, _pr_occupied);
                    if (priority === null) {continue;} // end if
                    //----------
                    priority = priority['priority'];
                    //----------
                    if (priority>=1 && priority<=3) {
                        //----------
                        objrec = _get_link_to_object({'priority':priority, 'loc':LOC_ID, 'vid':CMD.verb.bid, 'wid':adverb.bid});
                        //----------
                        _set_cmd_param(CMD, priority, adverb, null, objrec, _nouns4pronouns, _pr_occupied);
                        //----------
                        _remove_adverb(_adverbs, adverb);
                    } // end if
                } // end if
            } // end for x
        } // end if
    } // end function "_check_adverbs"
    /* --------------------------------------------------------------------------- */
    // Ищем объект по сопоставленным с ним словам с нулевым приоритетом
    function _search_object_by_priority (CMD, _verb_id, _word_id, _priority) {
        //----------
        //_priority = _priority || 1;
        var maxmin = (_priority === undefined ? {min:1, max:3} : {min:_priority, max:_priority});
        var result = null;
        //----------
        var full_IDs    = AZ.availObjects(true, false); // Получаем перечень объектов, доступных лишь из-за действия с ними в данной локации
        var limited_ids = AZ.availObjects(true, true); // Получаем перечень объектов, доступных лишь из-за действия с ними в данной локации
        //----------
        // Получаем перечень объектов, сопоставленных с переданным словом в текущей локации (или во всех).
        var search = {'obj':full_IDs, 'priority':0, 'loc':[LOC_ID, null], 'wid':_word_id};
        //if (CMD.unknown.length > 0) {search.any = [1,2,3];} // end if
        var objs_list = db_words_and_objects(search).get();
        for (var x=0; x<objs_list.length; x++) {
            var objrec = objs_list[x];
            //----------
            // Теперь ищем действия с каким-либо приоритетом, где указана ссылка на объект, найденный по слову: to1, to2 или to3
            var search = {'obj':full_IDs, 'priority':[1,2,3], 'loc':[LOC_ID, null], 'vid': _verb_id};
            //----------
            if (CMD.unknown.length > 0) {search.any = [1,2,3];} // end if
            //----------
            for (var priority=maxmin.min; priority<=maxmin.max; priority++) {
                if (CMD.objects[priority] != null) {continue;} // end if
                //----------
                // Если объект из "неполного перечня", то локация должна совпадать.
                search['loc'] = (limited_ids.indexOf(objrec.obj) == -1 ? [LOC_ID, null]: LOC_ID);
                //----------
                search['to'+priority] = objrec.obj;
                //----------
                // Получаем перечень записей объект + локация + приоритет + глагол
                var actions_list = db_words_and_objects(search).get();
                for (var y=0; y<actions_list.length; y++) {
                    var actrec = actions_list[y];
                    if (actrec != null) {
                        if (actrec.priority == priority) {
                            CMD.objects[priority]   = AZ.getObject(actrec.obj);
                            CMD.actions[priority]   = actrec.action;
                            //----------
                            result = actrec;
                            //----------
                            if (CMD.unknown.length > 0) {CMD.unknown = [];} // end if
                            //----------
                            break;
                        } // end if
                    } // end if
                    //----------
                    if (result != null) {break;} // end if
                } // end for y
                //----------
                delete search['to'+priority];
                //----------
                if (result != null) {break;} // end if
            } // end for priority
            //----------
            if (result != null) {break;} // end if
        } // end for x
        //----------
        return result === null ? null : {'object':AZ.getObject(result.obj), 'priority':result.priority, 'action':result.action};
    } // end function "_search_object_by_priority"
    /* --------------------------------------------------------------------------- */
    return {
        add_link_to_object: function (_options) {
            //_object_id, _priority, _location_id, _verb_id, _prep_id, _word_id, _tobj1, _tobj2, _tobj3, _action_id
            //----------
            var search = {
                'obj':      _options.obj,
                'priority': _options.priority,
                //----------
                'loc':      _options.loc || null,
                'vid':      _options.vid || null,
                'pid':      _options.pid || null,
                'wid':      _options.wid || null,
                'fid':      _options.fid || null,
                'to1':      _options.to1 || null,
                'to2':      _options.to2 || null,
                'to3':      _options.to3 || null,
                //----------
                'any':      _options.any || null,
                };
            //----------
            if ((search.vid && search.pid && search.wid && search.to1 && search.to2 && search.to3 && search.any) == false) {return false;} // end if
            //----------
            // Ищем, нет ли уже такой связки
            var rec = db_words_and_objects(search).first();
            //----------
            if (rec !== false) {
                console.error('У объекта "'+search.obj+'" дублирующий набор параметров действия:');
                console.log(
                    '    1: L:'+rec.loc+
                    ', v:'+(rec.vid == null ? '-' : DICTIONARY.getBase(rec.vid).base+' ('+rec.vid+')')+
                    ', p:'+(rec.pid == null ? '-' : DICTIONARY.getBase(rec.pid).base+' ('+rec.pid+')')+
                    ', w:'+(rec.wid == null ? '-' : DICTIONARY.getBase(rec.wid).base+' ('+rec.wid+')')+
                    ', t1:'+(rec.to1 || '-')+
                    ', t2:'+(rec.to2 || '-')+
                    ', t3:'+(rec.to3 || '-')+
                    ', any:'+(rec.any || '-')+
                    ', a:'+rec.action);
                console.log(
                    '    2: L:'+search.loc+
                    ', v:'+(search.vid == null ? '-' : DICTIONARY.getBase(search.vid).base+' ('+search.vid+')')+
                    ', p:'+(search.pid == null ? '-' : DICTIONARY.getBase(search.pid).base+' ('+search.pid+')')+
                    ', w:'+(search.wid == null ? '-' : DICTIONARY.getBase(search.wid).base+' ('+search.wid+')')+
                    ', t1:'+(search.to1 || '-')+
                    ', t2:'+(search.to2 || '-')+
                    ', t3:'+(search.to3 || '-')+
                    ', any:'+(search.any || '-')+
                    ', a:'+_options.action);
            } else {
                search['action']    = _options.action || null;
                search['nums']      = _options.nums || null;
                //----------
                if (search.obj == 'БЕРЕГ') {
                   console.log(
                        'id:'+search.obj+', t:'+search.priority+', n:'+search.nums+
                        ', L:'+search.loc+
                        ', v:'+(search.vid == null ? '-' : DICTIONARY.getBase(search.vid).base+' ('+search.vid+')')+
                        ', p:'+(search.pid == null ? '-' : DICTIONARY.getBase(search.pid).base+' ('+search.pid+')')+
                        ', w:'+(search.wid == null ? '-' : DICTIONARY.getBase(search.wid).base+' ('+search.wid+')')+
                        ', f:'+(search.fid == null ? '-' : DICTIONARY.getForm(search.fid).form+' ('+search.fid+')')+
                        ', t1:'+(search.to1 || '-')+
                        ', t2:'+(search.to2 || '-')+
                        ', t3:'+(search.to3 || '-')+
                        ', any:'+(search.any || '-')+
                        ', a:'+search.action);
                } // end if
                //----------
                db_words_and_objects.insert(search);
                //----------
            } // end if
            //----------
            return true;
        }, // end function "add_link_to_object"
        //--------------------------------------------------
        // Возвращает массив с идентификаторами объектов, которые имеют действия в указанной локации
        get_objects_by_loc_and_actions: function (_loc) {
            //----------
            var result = db_words_and_objects({'priority':[1,2,3], 'loc':_loc}).distinct('obj');
            //----------
            return (result == false ? [] : result);
            //----------
        }, // end function "get_objects_by_loc_and_actions"
        //--------------------------------------------------
        get_link_to_object: _get_link_to_object,
        //--------------------------------------------------
        get_objects_by_word:            _get_objects_by_word,
        get_noun_of_object_by_pronoun:  _get_noun_of_object_by_pronoun,
        //--------------------------------------------------
        parse: function (_phrase, _preparsing, _prepart2) {
            _prepart2 = _prepart2 || false;
            //----------
            /*  
                1. Фраза должна начинаться с действия / глагола.
                2. Если у действия есть качественная характеристика (быстро, аккуратно), оно должно идти перед действием.
                3. Если 
                */
            _preparsing = _preparsing || false;
            //----------
            var CMD = {
                phrase:     _phrase, // Текст команды
                //----------
                any_errors: false,
                error:      {type:null, word:''}, // Описание ошибки
                //----------
                unknown:    [],
                anyword:    [],
                //----------
                verb:       null,
                params:     [undefined, null, null, null], // undefined - пустой элемент на 0-й позиции массива
                objects:    [undefined, null, null, null], // undefined - пустой элемент на 0-й позиции массива
                actions:    [undefined, null, null, null], // undefined - пустой элемент на 0-й позиции массива
            }; // end CMD
            //----------
            var nouns4pronouns  = {};
            var pr_occupied     = [];
            var adverbs         = {list:[], bids:[]};
            //----------
            LOC_ID  = AZ.getLocation(true);
            //----------
            AUTOCOMPLETE.setStatus(0);
            //----------
            var priority    = null; // Приоритет параметра команды
            var objrec      = null;
            //----------
            var buffer       = [];
            var preposition  = null;
            var buffer_after = []; // Буфер существительных для (пост)постобработки ("кто я такой" -> "кто такой я")
            //----------
            // Если это препарсинг, то проверяем, есть ли в конце фразы пробел. Если нет — считаем, что он там есть, чтобы последнее слово обрабатывалось как законченное.
            var have_a_space = (_preparsing == false || _phrase.substr(-1) == ' ') ? true : false;
            //----------
            // Убираем из команды лишние символы
            _phrase = _phrase.replace(/[^а-яёА-ЯЁa-zA-Z0-9\-\s]/gim, '');
            //----------
            _phrase = _phrase.trim().toLowerCase().replace(/\s+/g,' ');
            if (_phrase == '') {
                return {phrase:CMD.phrase, object:null, action:null};
            } // end if
            //----------
            var words_list = _phrase.split(' ');
            //if (words_list.length == 0) {return null;} // end if
            //----------
            var word_str    = '';
            var word        = null;
            //----------
            var maxwx   = words_list.length;
            //----------
            // +++ Нужно понять, есть ли во фразе незнакомые слова
            var wx = 0;
            while (wx <= maxwx-1) {
                word_str = words_list[wx++];
                //----------
                if (_preparsing == true && wx == maxwx && have_a_space == false) {
                    break;
                } // end if
                // Получаем информацию о полученном слове
                word = DICTIONARY.getWord(word_str, true, preposition, last_params);
                //----------
                if (word === null) {
                    if (AUTOCOMPLETE.lenght(0) == 1) {
                        var ac_word = AUTOCOMPLETE.firstWord(0);
                        //----------
                        if (ac_word.substr(0, word_str.length) == word_str) {
                            word = DICTIONARY.getWord(ac_word, true, preposition, last_params);
                        } // end if
                    } // end if
                } // end if
                //----------
                if (word === null) {
                    if (CMD.unknown.indexOf(word_str) == -1) {
                        CMD.unknown.push(word_str);
                        CMD.anyword.push(word_str);
                    } // end if
                } // end if
            } // end while wx
            //----------
            var wx = 0;
            while (wx <= maxwx-1) {
                // Если есть глагол и буфер слов не пуст, то берём слово из него
                if (CMD.verb !== null && buffer.length > 0) {
                    word = buffer.shift();
                    
                // Иначе получаем очередное слово из фразы и преобразуем его в объект
                } else {
                    // Получаем из фразы очередную порцию
                    word_str = words_list[wx++];
                    //----------
                    if (CMD.unknown.indexOf(word_str) >= 0) {continue;}
                    //----------
                    if (_preparsing == true && wx == maxwx && have_a_space == false) {
                        break;
                    } // end if
                    // Получаем информацию о полученном слове
                    word = DICTIONARY.getWord(word_str, true, preposition, last_params);
                    //----------
                    // +++ Если слово незнакомое
                    if (word === null) {
                        if (AUTOCOMPLETE.lenght(0) == 1) {
                            var ac_word = AUTOCOMPLETE.firstWord(0);
                            //----------
                            if (ac_word.substr(0, word_str.length) == word_str) {
                                word = DICTIONARY.getWord(ac_word, true, preposition, last_params);
                            } // end if
                        } // end if
                    } // end if
                    //----------
                    if (word === null) {continue;} // end if
                    /*if (word === null) {
                        if (CMD.unknown.indexOf(word_str) == -1) {
                            CMD.unknown.push(word_str);
                            //buffer.push(DICTIONARY.getWord(ANYTHING, true, preposition, last_params));
                        } // end if
                        //----------
                        continue;
                        CMD.any_errors = true;
                        //----------
                        CMD.error.type  = 1; // 1 - незнакомое слово
                        CMD.error.word  = word_str;
                        //----------
                        break;
                    } // end if */
                    //----------
                    // Если глагол ещё не нашли, то помещаем слово в буфер
                    if (word.morph != 'Г' && CMD.verb === null) {
                        buffer.push(word);
                        continue;
                    } // end if
                } // end if
                //----------
                // Обрабатываем глагол
                if (word.morph == 'Г') {
                    CMD.verb            = word;
                    CMD.verb.adverb = null;
                    //----------
                    // Проверяем, не является ли предыдущее слово из буфера наречием и не относится ли оно к глаголу
                    if (buffer.length > 0) {
                        word = buffer[buffer.length-1];
                        if (word.morph == 'Н') {
                            if (word.can_be_prep == false) { // К глаголу не может относится наречие, которое может быть предлогом
                                CMD.verb.adverb = word;
                                //----------
                                buffer.pop();
                                //----------
                                _remove_adverb(word);
                            } // end if
                        } // end if
                    } // end if
                    //----------
                
                // Обрабатываем предлог
                } else if (word.morph == 'ПР') {
                    if (CMD.verb !== null) {
                        preposition = word;
                    } // Запоминаем предлог, только если уже получили глагол. Иначе — пропускаем.
                
                // Обрабатываем наречие
                } else if (word.morph == 'Н') {
                    // Если наречие может быть предлогом, то запоминаем его ещё и как предлог
                    if (word.can_be_prep == true) {
                        preposition = word;
                    } // end if
                    //----------
                    // Добавляем наречие в список на последующий разбор наречий как самостоятельных единиц
                    _add_adverb(adverbs, word);
                    //----------
                    continue;
                
                // Обрабатываем существительное
                } else if (word.morph == 'С') {
                    // Если есть предлог, стоящий перед этим словом, то проверяем, подходит ли предлог по падежу
                    preposition = _check_prep_by_noun(word, preposition);
                    //----------
                    priority = _check_param_priority(CMD, word, preposition, nouns4pronouns, pr_occupied);
                    //----------
                    if (preposition !== null && priority !== null) {
                        // Если предлог ещё и наречие, то удаляем его из списка
                        _remove_adverb(preposition);
                    } // end if
                    //----------
                    if (priority == null) {
                        buffer_after.push(word);
                    } // end if
                
                // Обрабатываем местоимение
                } else if (word.morph == 'М') {
                    for (var x=0; x<word.nouns_list.length; x++) {
                        var noun2 = word.nouns_list[x];
                        var prep2 = _check_prep_by_noun(noun2, prep2);
                        //----------
                        priority = _check_param_priority(CMD, noun2, prep2, nouns4pronouns, pr_occupied);
                        //----------
                        if (priority == null) {
                            buffer_after.push(noun2);
                        } else {
                            if (preposition !== null) {
                                _remove_adverb(preposition);
                            } // end if
                            //----------
                            break;
                        } // end if
                    } // end for x
                } // end if (word.morph) ...
                //----------
                // Если обработанное слово не является предлогом, то сбрасываем предлог, который шёл перед этим словом
                if (word.morph != 'ПР' && preposition !== null) {
                    preposition = null;
                } // end if
                //----------
            } // end while (true)
            //----------
            /*if (CMD.any_errors == true) {
                if (_preparsing == false || (wx < maxwx || (wx == maxwx && have_a_space == true))) {
                    if (_preparsing == false) {
                        print('Слово "<strong>'+word_str+'</strong>" мне незнакомо.');
                    } // end if
                    //----------
                    AUTOCOMPLETE.setStatus(-1);
                    //----------
                    return {phrase:CMD.phrase, object:null, action:null};
                } // end if
                //----------
                
            } else {
                if (have_a_space == true) {word_str = '';} // end if
            } // end if*/
            if (have_a_space == true) {word_str = '';} // end if
            //----------
            // Если после разбора фразы у нас осталось наречие, то пытаемся определить к чему оно относится
            priority = null;
            //----------
            // Если после разбора фразы остались наречия, которые не были использованы как предлоги
            _check_adverbs(CMD, adverbs, nouns4pronouns, pr_occupied);
            //----------
            buffer = buffer.concat(buffer_after);
            //----------
            // Попробуем обработать накопишуюся в буфере очередь
            if (buffer.length > 0) {
                preposition = null;
                for (var x=0; x<buffer.length; x++) {
                    word = buffer[x];
                    //----------
                    if (word.morph == 'ПР') {
                        preposition = word;
                        
                    // Обрабатываем наречие
                    } else if (word.morph == 'Н') {
                        //----------
                        _add_adverb(adverbs, word);
                        //----------
                        
                    // Обрабатываем существительное
                    } else if (word.morph == 'С') {
                        // Если есть предлог, стоящий перед этим словом, то проверяем, подходит ли предлог по падежу
                        preposition = _check_prep_by_noun(word, preposition);
                        //----------
                        objrec = null;
                        //----------
                        // Пытаемся пристроить существительное в порядке приоритета типа: 1-2-3
                        for (priority=1; priority<=3; priority++) {
                            // Если параметр команды данного приоритета не занят...
                            if (pr_occupied.indexOf(priority) == -1) {
                                // ...пытаемся опеределить, подходит ли данное слово к какому либо объекту по приоритету
                                var search = {'priority':priority, 'loc':LOC_ID, 'pid':(preposition == null ? null : preposition.bid), 'wid':word.bid};
                                //----------
                                if (CMD.verb != null) {search.vid = CMD.verb.bid;} // end if
                                //----------
                                objrec = _get_link_to_object(search);
                                if (objrec !== null) {
                                    break;
                                } // end if
                            } // end if
                        } // end for priority
                        if (objrec == null) {
                            // ...пытаемся опеределить, подходит ли данное слово к какому либо объекту вообще
                            objrec = _search_object_by_priority(CMD, (CMD.verb == null ? null : CMD.verb.bid), word.bid);
                        }
                        if (objrec !== null) {
                            //----------
                            _set_cmd_param(CMD, objrec.priority, word, preposition, objrec, nouns4pronouns, pr_occupied);
                            //----------
                            _remove_adverb(preposition);
                        } // end if
                        //----------
                        
                    // Обрабатываем местоимение
                    } else if (word.morph == 'М') {
                        for (var x=0; x<word.nouns_list.length; x++) {
                            var noun2 = word.nouns_list[x];
                            var prep2 = _check_prep_by_noun(noun2, prep2);
                            //----------
                            objrec = null;
                            //----------
                            // Пытаемся пристроить существительное в порядке приоритета типа: 1-2-3
                            for (priority=1; priority<=3; priority++) {
                                // Если параметр команды данного приоритета не занят...
                                if (pr_occupied.indexOf(priority) == -1) {
                                    // ...пытаемся опеределить, подходит ли данное слово к какому либо объекту
                                    objrec = _get_link_to_object({'priority':priority, 'loc':LOC_ID, 'pid':(prep2 == null ? null : prep2.bid), 'wid':noun2.bid});
                                    if (objrec !== null) {
                                        break;
                                    } // end if
                                } // end if
                            } // end for priority
                            if (objrec == null) {
                                // ...пытаемся опеределить, подходит ли данное слово к какому либо объекту вообще
                                objrec = _search_object_by_priority(CMD, (CMD.verb == null ? null : CMD.verb.bid), noun2.bid);
                            }
                            if (objrec !== null) {
                                //----------
                                _set_cmd_param(CMD, objrec.priority, word, preposition, objrec, nouns4pronouns, pr_occupied);
                                //----------
                                _remove_adverb(preposition);
                            } // end if
                            //----------
                        } // end for x
                        
                    } // end if word.morph == ...
                    //----------
                    // Если обработанное слово не является предлогом, то сбрасываем предлог, который шёл перед этим словом
                    if (word.morph != 'ПР' && preposition !== null) {
                        preposition = null;
                    } // end if
                    //----------
                } // end for x
            } // end if buffer.length > 0
            //----------
            // Если после разбора буфера остались наречия, которые не были использованы как предлоги
            _check_adverbs(CMD, adverbs, nouns4pronouns, pr_occupied);
            //----------
            if (CMD.verb != null && CMD.params[1] == null && CMD.params[2] == null && CMD.params[3] == null) {
                objrec = null;
                priority = null;
                for (priority=1; priority<=3; priority++) {
                    if (pr_occupied.indexOf(priority) == -1) {
                        var search = {'priority':priority, 'loc':LOC_ID, 'vid':CMD.verb.bid};
                        //----------
                        if (CMD.unknown.length > 0) {search.any = [1,2,3];} // end if
                        //----------
                        objrec = _get_link_to_object(search);
                        if (objrec !== null) {
                            priority = objrec.priority;
                            //----------
                            if (CMD.unknown.length > 0) {CMD.unknown = [];} // end if
                            break;
                        } // end if
                    } // end if
                } // end for x
                //----------
                if (objrec !== null && word_str == '') {
                    CMD.params[objrec.priority] = null;
                    //----------
                    CMD.objects[objrec.priority]    = objrec.object;
                    CMD.actions[objrec.priority]    = objrec.action;
                    //----------
                    pr_occupied.push(objrec.priority);
                } // end if
            } // end if
            //----------
            if (CMD.verb != null && word_str == '') {
                for (var priority=1; priority<=3; priority++) {
                    if (CMD.objects[priority] != null) {continue;} // end if
                    //----------
                    var param = CMD.params[priority] || null;
                    if (param == null) {continue;} // end if
                    //----------
                    objrec = _search_object_by_priority(CMD, CMD.verb.bid, param.bid, priority);
                    if (objrec != null) {break;} // end if
                    //----------
                } // end for priority
            } // end if
            //----------
            if (CMD.unknown.length > 0) {
                CMD.any_errors = true;
                CMD.error.type  = 1; // 1 - незнакомое слово
                //----------
                if (_preparsing == false) {
                    for (var x=0; x<CMD.unknown.length; x++) {
                        print('Слово "<strong>'+CMD.unknown[x]+'</strong>" мне незнакомо.');
                    } // end for x
                }
                //----------
                AUTOCOMPLETE.setStatus(-1);
                //----------
                return {phrase:CMD.phrase, object:null, action:null};
            } // end if
            //----------
            CMD.object = null;
            CMD.action = null;
            CMD.A      = {object:null, word:null, prep:null};
            CMD.B      = {object:null, word:null, prep:null};
            CMD.C      = {object:null, word:null, prep:null};
            //----------
            if (CMD.objects[1] != null) {CMD.A.object = CMD.objects[1];} // end if
            if (CMD.objects[2] != null) {CMD.B.object = CMD.objects[2];} // end if
            if (CMD.objects[3] != null) {CMD.B.object = CMD.objects[3];} // end if
            //----------
            if (CMD.params[1] != null) {CMD.A.word = CMD.params[1]; CMD.A.prep = CMD.params[1].prep;} // end if
            if (CMD.params[2] != null) {CMD.B.word = CMD.params[2]; CMD.B.prep = CMD.params[2].prep;} // end if
            if (CMD.params[3] != null) {CMD.C.word = CMD.params[3]; CMD.C.prep = CMD.params[3].prep;} // end if
            //----------
            for (var priority=1; priority<=3; priority++) {
                var obj = CMD.objects[priority];
                var act = CMD.actions[priority];
                //----------
                if (obj != null && act != null) {
                    CMD.object = obj;
                    CMD.action = obj.actions_list[act-1];
                    //----------
                    AUTOCOMPLETE.setStatus(1);
                    //----------
                    break;
                } // end if
            } // end for priority
            //----------
            for (var key in nouns4pronouns) {
                last_params[key] = nouns4pronouns[key];
            } // end for
            //----------
            if (typeof(localizeCMD) == 'function') {
                localizeCMD(CMD);
            } // end if
            //----------
            if (_preparsing == true) {
                this.pre_parse(word_str, iNN(CMD.verb, 'bid'), iNN(preposition, 'bid'), CMD, _prepart2);
            } // end if
            //----------
            return CMD;
            //----------
        }, // end function "parse"
        //--------------------------------------------------
        pre_parse: function (word_str, verb_id, prep_id, CMD, _prepart2) {
            word_str    = word_str || '';
            //----------
            verb_id     = verb_id || null;
            prep_id     = prep_id || null;
            //----------
            _prepart2   = _prepart2 || false;
            //----------
            var bids_list = [];
            var bids_data = [];
            //----------
            var word = null;
            //----------
            LOC_ID = AZ.getLocation(true);
            //----------
            //var cash_preps_cases = {};
            //--------------------------------------------------
            // Добавляем слово в список на выдачу (+ доп. информация в values)
            function _add_bid (_list, _data, _bid, _values) {
                if (_list.indexOf(_bid) == -1) {
                    _list.push(_bid);
                    //----------
                    var word = DICTIONARY.getBase(_bid);
                    var rec = {'wid':_bid, 'base':word.base, 'morph':word.morph};
                    //----------
                    if (_values != undefined) {
                        for (var key in _values) {
                            rec[key] = _values[key];
                        } // end for
                    } // end if
                    //----------
                    _data.push(rec);
                } // end if
                
            } // end function "_add_bid"
            //--------------------------------------------------
            // Добавляем возможные падежи к конкретному слову
            function _cases2word (_wcases, _bid, _cases) {
                if (_cases != null && _bid != null) {
                    var id = 'bid:'+_bid;
                    if (_wcases[id] === undefined) {
                        _wcases[id] = _cases.slice();
                    } else {
                        add_arr2arr(_wcases[id], _cases);
                    } // end if
                } // end if
            } // end function "_cases2word"
            //--------------------------------------------------
            function _add_words_from_links (_list, _data, _obj, _search, _wrdcases, _cases) {
                if (_obj == null) {return;} // end if
                if (obj_to_pass.indexOf(_obj) >= 0) {return;} // end if
                //----------
                _search.obj = _obj;
                _cases      = _cases || null;
                //----------
                //obj_to_pass.push(_obj);
                //----------
                var words_list = db_words_and_objects(_search).get();
                //----------
                for (var x=0; x<words_list.length; x++) {
                    var word = words_list[x];
                    //----------
                    _add_bid(_list, _data, word.wid, {'nums':word.nums});
                    //----------
                    _cases2word(_wrdcases, word.wid, _cases); // Добавляем падежи для данного слова
                } // end for wx
            } // end function "_add_words_from_links"
            //--------------------------------------------------
            var words_cases     = {}; // Привязка падежей к словам объектов toN. words_cases['bid'] = ['И', 'Р', ...]
            //----------
            var obj_to_pass     = []; // Перечень уже обработанных объектов toN.
            var words_to_pass   = [];
            var preps_to_pass   = [];
            //----------
            var cases           = {}; // Кэш падежей предлогов: cases['VID:PRIORITY:PID'] = [c1, c2, c3]
            var preps_of_verbs  = {}; // Кэш предлогов глаголов: preps_of_verbs['VID:PRIORITY'] = [p1, p2, p3]
            var cases2          = null;
            //----------
            if ((CMD || null) == null) {
                CMD = {params:[undefined,null,null,null], objects:[undefined,null,null,null]};
            } // end if
            //----------
            DEBUG.updatePreparsingData(CMD);
            //----------
            // Запоминаем уже распознанные в команде слова и предлоги <<
            for (var priority=1; priority<=3; priority++) {
                if (CMD.params[priority] != null) {
                    words_to_pass.push(CMD.params[priority].bid);
                    //----------
                    if (CMD.params[priority].prep != null) {
                        preps_to_pass.push(CMD.params[priority].prep.bid);
                    } // end if
                } // end if
                //----------
                //if (CMD.objects[priority] != null) {
                //  obj_to_pass.push(AZ.getID(CMD.objects[priority])); //+++ на время
                //} // end if
            } // end for x
            // >> Закончили запоминать уже распознанные в команде слова
            //----------
            // Если в команде есть предлог или слова, то глагол пропускаем. Для автодополнения глагол должен идти первым.
            var pass_verb = (prep_id == null && preps_to_pass.length == 0 && words_to_pass.length == 0) ? false : true;
            //----------
            // Если выбран глагол, то нужно подтянуть к нему предлоги и падежи слов (по слотам)
            if (verb_id != null) {
                var search = {'bid':verb_id, 'priority':[]};
                //----------
                if (CMD.params[1] == null || CMD.params[1].bid == prep_id) {search.priority.push(1);} // Если объект #1 не занят, то подтягиваем предлоги и падежи #1.
                if (CMD.params[2] == null || CMD.params[2].bid == prep_id) {search.priority.push(2);} // Если объект #2 не занят, то подтягиваем предлоги и падежи #2.
                if (CMD.params[3] == null || CMD.params[3].bid == prep_id) {search.priority.push(3);} // Если объект #3 не занят, то подтягиваем предлоги и падежи #3.
                //----------
                if (prep_id != null) {search.prep = prep_id;} // Если в команде последним словом стоит предлог, то ставим фильтр только по этому предлогу.
                //----------
                preps_of_verbs[verb_id+':1'] = [];
                preps_of_verbs[verb_id+':2'] = [];
                preps_of_verbs[verb_id+':3'] = [];
                //----------
                // Начинаем перебор предлогов и падежей из данных глагола <<
                var list = DICTIONARY.getObjectsOfVerbs(search); // Отбираем предлоги и падежи из данных глагола.
                for (var x=0; x<list.length; x++) {
                    var rec = list[x];
                    //----------
                    // В записи может быть указан либо предлог, либо предлог + падежи (уточняющие для данного глагола, потому как у предлога падежей может быть больше)
                    //----------
                    cases2 = [];
                    //----------
                    // Если в данных указаны падежи, то берём их за основу
                    if (rec.cases != null) {cases2 = rec.cases.slice();}
                    //----------
                    // Если предлог есть в данных, то пытаемся добавить его в перечень
                    if (rec.prep != null) {
                        if (preps_to_pass.indexOf(rec.prep) == -1) {
                            if (rec.prep != prep_id) {
                                var idx = verb_id+':'+rec.priority;
                                //----------
                                if (preps_of_verbs[idx].indexOf(rec.prep) == -1) {
                                    preps_of_verbs[idx].push(rec.prep);
                                } // end if
                            }
                            //----------
                            // Если падежи ещё не определены (то есть нет уточняющего списка падежей для предлога), то берём весь перечень падежей предлога
                            if (cases2 == null) {cases2 = DICTIONARY.getWordCases(rec.prep, '-');} // end if
                        } // end if
                    }
                    //----------
                    if (cases2.length > 0) {
                        var idx = verb_id+':'+rec.priority+':'+rec.prep;
                        if (cases[idx] === undefined) {
                            cases[idx] = cases2.slice();
                        } else {
                            add_arr2arr(cases[idx], cases2);
                        } // end if
                    } // end if
                    //----------
                } // end for x
                // >> Заканчиваем перебор предлогов и падежей из данных глагола
                //----------
            } // end if
            //----------
            // Шаблон фильтра отбора слов, сопоставленных с объектом
            var search_toN = {'priority':0, 'loc':[LOC_ID, null]};
            //----------
            // Фильтр отбора записей-действий
            var search = {
                'obj':      AZ.availObjects(true, false), // [AZ.current_character.ID]
                'priority': [1,2,3],
                //----------
                'loc':      [LOC_ID, null],
                };
                if (verb_id !== null) {search.vid = verb_id;} // end if
            //----------
            // Отбираем все комбинации слов, используемых в действиях с доступными объектами
            var list = db_words_and_objects(search).get();
            //----------
            var limited_ids = AZ.availObjects(true, true); // Получаем перечень объектов, доступных лишь из-за действия с ними в данной локации
            //----------
            for (var x=0; x<list.length; x++) {
                var rec = list[x];
                //----------
                if (limited_ids.indexOf(rec.obj) != -1) {
                    if (rec.loc == null) {continue;} // end if
                } // end if
                //----------
                if (CMD.objects[rec.priority] != null && rec.obj != AZ.getID(CMD.objects[rec.priority])) {
                    if (CMD.params[rec.priority] != null) {continue;} // end if
                } // end if
                //----------
                // Если глагол в данных есть, а в команде его нет (и в команде нет ни предлога, ни слова), то добавляем его в перечень
                if (rec.vid != null && verb_id == null && pass_verb == false) {
                    _add_bid(bids_list, bids_data, rec.vid);
                } // end if
                //----------
                // Если глагол есть в команде, то этот же глагол есть и в данных (условие фильтра)
                // Если глагола нет в данных, то его не может быть и в команде (от условия фильтра)
                //----------
                cases2 = []; // Перечень падежей предлога из записи данных. Падежи распространяются на слово и объекты toN.
                //----------
                // Предлог и слово связаны с основным объектом команды. Если данный объект уже распознан в команде, то ни предлог, ни слово не нужны.
                //if (obj_to_pass.indexOf(rec.obj) == -1 && (CMD.objects[rec.priority] == null || rec.obj == AZ.getID(CMD.objects[rec.priority]))) {
                //if (obj_to_pass.indexOf(rec.obj) == -1) {
                //----------
                // Предлог добавляем, если этого предлога в команде ещё нет.
                if (rec.pid != null && prep_id == null && preps_to_pass.indexOf(rec.pid) == -1) {
                    //  1. Глагола нет ни в данных, ни в команде.
                    //  2. Глагол есть и в данных, и в команде.
                    if (rec.vid == verb_id) {
                        _add_bid(bids_list, bids_data, rec.pid);
                        //----------
                        cases2 = DICTIONARY.getWordCases(rec.pid, '-');
                        _cases2word(words_cases, rec.wid, cases2);
                        //----------
                        preps_to_pass.push(rec.pid);
                    } // end if
                } // end if
                //----------
                // Слово добавляем если этого слова в команде ещё нет:
                if (rec.wid != null && words_to_pass.indexOf(rec.wid) == -1 && prep_id == rec.pid) {
                    //  1. Глагола нет ни в данных, ни в команде. Предлога нет ни в данных, ни в команде.
                    //  2. Глагола нет ни в данных, ни в команде. Предлог есть и в данных, и в команде.
                    //  3. Глагол есть и в данных, и в команде. Предлога нет ни в данных, ни в команде.
                    //  4. Глагол есть и в данных, и в команде. Предлог есть и в данных, и в команде.
                    if (rec.vid == verb_id && rec.pid == prep_id) {
                        _add_bid(bids_list, bids_data, rec.wid, {'fid':rec.fid});
                        words_to_pass.push(rec.wid);
                    } // end if
                } // end if
                //} // end if "obj_to_pass"
                //----------
                // Если...
                // Сопоставление слов с объектами
                for (var priority=1; priority<=3; priority++) {
                    var obj = rec['to'+priority];
                    //----------
                    // Если слот не заполнен, либо данный объект уже обрабатывался, то пропускаем запись
                    if (obj == null || obj_to_pass.indexOf(obj) >= 0) {continue;} // end if
                    //----------
                    // Предлог должен совпадать и в данных и в команде (либо отсутствовать и там, и там).
                    if (verb_id == rec.vid) {
                        if (verb_id == null) {
                            if (rec.pid != prep_id) {continue;} // end if
                            //----------
                            // Если предлога нет, то падеж только именительный, иначе - берём из предлога.
                            cases2 = (rec.pid == null ? ['И'] : DICTIONARY.getWordCases(rec.pid, '-'));
                            
                        } else if (verb_id != null) {
                            // Если есть глагол, то может быть ситуация, когда предлога в данных нет, а в команде он есть - в этом случае берём предлоги глагола
                            if (rec.pid != null && prep_id != rec.pid) {continue;} // end if
                            //----------
                            var idx = verb_id+':'+priority;
                            if (preps_of_verbs[idx].length>0) {
                                for (var y=0; y<preps_of_verbs[idx].length; y++) {
                                    var prep2 = preps_of_verbs[idx][y];
                                    if (preps_to_pass.indexOf(prep2) == -1) {
                                        _add_bid(bids_list, bids_data, prep2);
                                        preps_to_pass.push(prep2);
                                    } // end if
                                } // end for
                            } // end if
                            //----------
                            cases2 = cases[verb_id+':'+priority+':'+prep_id];
                            if (cases2 === undefined) {continue;} // end if
                            //if (cases2.indexOf(rec.pid) == -1) {continue;} // end if
                        } // end if
                        //----------
                        // Добавляем слова-сопоставления с объектом из слота
                        _add_words_from_links(bids_list, bids_data, obj, search_toN, words_cases, cases2);
                    } // end if
                } // end for "priority"
            } // end for x
            //----------
            AUTOCOMPLETE.init(bids_list);
            //----------
            var fid     = null;
            var form    = null;
            //----------
            for (var x=0; x<bids_list.length; x++) {
                var bid = bids_list[x];
                //----------
                var morph   = bids_data[x].morph;
                //----------
                if (morph == 'Г') {
                    var forms_list      = AUTOCOMPLETE.getByBID(bid);
                    var forms_list_full = DICTIONARY.getFormsListByBID({'bid': bid});
                    //----------
                    if (word_str == '') {
                        for (var y=0; y<forms_list.length; y++) {
                            fid     = forms_list[y].fid;
                            form    = DICTIONARY.getForm(fid).form;
                            //----------
                            AUTOCOMPLETE.add(word_str, fid, form, morph);
                        } // end for
                    } else { // if (word_str != '')
                        var have_any_verbs = false;
                        //----------
                        for (var y=0; y<forms_list.length; y++) {
                            fid     = forms_list[y].fid;
                            form    = DICTIONARY.getForm(fid).form;
                            //----------
                            if (form.substr(0, word_str.length) != word_str) {continue;} // end if
                            //----------
                            have_any_verbs = true;
                            //----------
                            AUTOCOMPLETE.add(word_str, fid, form, morph);
                        } // end for
                        //----------
                        if (have_any_verbs == false) {
                            for (var y=0; y<forms_list_full.length; y++) {
                                fid     = forms_list_full[y].fid;
                                form    = DICTIONARY.getForm(fid).form;
                                //----------
                                if (form.substr(0, word_str.length) != word_str) {continue;} // end if
                                //----------
                                AUTOCOMPLETE.add(word_str, fid, form, morph);
                            } // end for
                        } // end if
                    } // end if
                
                } else {
                    if (morph == 'С') {
                        if (words_cases['bid:'+bid] !== undefined && words_cases['bid:'+bid].length > 0) {
                            cases = words_cases['bid:'+bid];
                        } else if (cases.length == 0) {
                            cases = ['И'];
                        } // end if
                        //----------
                        if ((bids_data[x].fid || null) != null) {
                            var forms_list = [{'fid':bids_data[x].fid}];
                        } else {
                            var forms_list = DICTIONARY.getFormsListByCaseAndNumber({'bid':bid, 'case':cases, 'number':(bids_data[x].nums || 'Е')});
                        } // end if
                        //----------
                        for (var y=0; y<forms_list.length; y++) {
                            fid     = forms_list[y].fid;
                            form    = DICTIONARY.getForm(fid).form;
                            //----------
                            if (word_str != '') {
                                if (form.substr(0, word_str.length) != word_str) {continue;} // end if
                            } // end if
                            //----------
                            AUTOCOMPLETE.add(word_str, fid, form, morph);
                        } // end for
                    
                    } else {
                        var forms_list = DICTIONARY.getFormsListByBID({'bid': bid});
                        for (var y=0; y<forms_list.length; y++) {
                            fid     = forms_list[y].fid;
                            form    = forms_list[y].form;
                            //----------
                            if (word_str != '') {
                                if (form.substr(0, word_str.length) != word_str) {continue;} // end if
                            } // end if
                            //----------
                            AUTOCOMPLETE.add(word_str, fid, form, morph);
                        } // end for
                    } // end if
                } // end if
                //----------
            } // end for x
            //----------
            AUTOCOMPLETE.sort();
            //----------
            if (CMD.action != null) {
                AUTOCOMPLETE.setActionFlag(); // --- Убрать
                AUTOCOMPLETE.setStatus(1);
            } // end if
            /*for (var priority=1; priority<=3; priority++) {
                if (CMD.objects[priority] != null) {
                    var action_id = CMD.actions[priority];
                    //----------
                    if (action_id != null) {
                        var _action = CMD.objects[priority].actions_list[action_id-1];
                        if (_action != null) {
                            AUTOCOMPLETE.setActionFlag(); // --- Убрать
                            AUTOCOMPLETE.setStatus(1);
                        } // end if
                        //----------
                        break;
                    } // end if
                } // end if
            } // end for priority*/
            //----------
            //return txt_words;
        }, // end function "pre_parse"
        //--------------------------------------------------
    };
    //--------------------------------------------------
})(); // end object "PARSER"
/* --------------------------------------------------------------------------- */
/*
"привязать пистолет за деревом " - "за деревом" попадает в третий слот


CMD
    phrase
    object
    action
    A: object, word
    B
    C
*/