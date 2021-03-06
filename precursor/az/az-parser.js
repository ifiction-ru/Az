/* ---------------------------------------------------------------------------
    ++++
    TO-DO
        +++ Добавить проверку наличия объекта в текущем контексте. А лучше фильтр
        ----------
        +++ Добавить понятие числа слова. Потому как сейчас число есть только у объекта, и у игрока вылазят "инвентари"
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
    // Проверяем, подходит ли предлог к существительному по падежу
    function _check_prep_by_noun (_noun, _prep) {
        if (_prep == null) {return null;}
        //----------
        for (var y=0; y<_prep.cases.length; y++) {
            var prep_case = _prep.cases[y];
            if (_noun.cases.united.indexOf(prep_case) >= 0) {
                is_prep_correct = true;
                return _prep;
            } // end if
        } // end for
        //----------
        return null;
    } // end function "_check_prep_by_noun"
    /* --------------------------------------------------------------------------- */
    function _get_link_to_object (_options) {
        var enable   = _options['enable'] || true;
        //----------
        var priority = _options['priority'] || 0;
        //----------
        var L   = _options['loc'] || null;
        var V   = _options['vid'] || null;
        //----------
        var to1 = _options['to1'] || null;
        var P1  = _options['pid1'] || null;
        var W1  = _options['wid1'] || null;
        //----------
        var to2 = _options['to2'] || null;
        var P2  = _options['pid2'] || null;
        var W2  = _options['wid2'] || null;
        //----------
        var to3 = _options['to3'] || null;
        var P3  = _options['pid3'] || null;
        var W3  = _options['wid3'] || null;
        //----------
        var any = _options['any'] || null;
        //----------
        var search = {'enable':enable, 'obj':AZ.availObjects(true, false), 'priority':priority, 'loc':L, 'vid':V, 'to1':to1, 'pid1':P1, 'wid1':W1, 'to2':to2, 'pid2':P2, 'wid2':W2, 'to3':to3, 'pid3':P3, 'wid3':W3, 'any':any};
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
    // Заполняем указанный слот данными слова
    function _set_cmd_param (CMD, _priority, _word, _prep, _nouns4pronouns, _pr_occupied) {
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
            _pr_occupied.push(_priority);
        } // end if
        //----------
    } // end function "_set_cmd_param"
    /* --------------------------------------------------------------------------- */
    // Проставляем слово в нужный слот по словарю
    function _check_param_priority (CMD, word, prep, _nouns4pronouns, _pr_occupied) {
        var prep_id = (prep === null ? null : prep.bid);
        //----------
        var priority = null;
        //----------
        if (CMD.verb == null) {
            priority = 1;
        } else {
            priority = DICTIONARY.getNounPriority(CMD.verb, word, prep_id, _pr_occupied);
            if (priority == null) {return null;} // end if
            //----------
            priority = priority['priority'];
        } // end if
        //----------
        // Проверяем, может ли это слово стоять в данном слоте по данным возможных действий
        if (priority >= 1 && priority <= 3) {
            _set_cmd_param(CMD, priority, word, prep, _nouns4pronouns, _pr_occupied);
            //----------
            return priority;
            
        } else {
            return null;
        } // end-if
        //----------
    } // end function "_check_param_priority"
    /* --------------------------------------------------------------------------- */
    // Примеряем накопившиеся наречия
    function _check_adverbs (CMD, _adverbs, _nouns4pronouns, _pr_occupied) {
        var rec = null;
        //----------
        // Если после разбора фразы остались наречия, которые не были использованы как предлоги
        if (_adverbs.list.length > 0) {
            // Перебираем список неразобранных наречий
            for (var x=0; x<_adverbs.list.length; x++) {
                var adverb = _adverbs.list[x];
                //----------
                rec = null;
                // Пытаемся пристроить наречие в порядке приоритета типа: 1-2-3
                for (priority=1; priority<=3; priority++) {
                    // Если параметр команды данного приоритета не занят...
                    if (_pr_occupied.indexOf(priority) == -1) {
                        // ...пытаемся опеределить, подходит ли данное наречие к какому либо объекту вообще
                        var search = { 'enable':true, 'priority':priority, 'loc':LOC_ID, 'vid':(CMD.verb == null ? null : CMD.verb.bid) };
                        search['wid'+priority] = adverb.bid;
                        //----------
                        rec = _get_link_to_object(search);
                        //----------
                        if (rec != null) {break;} // end if
                    } // end if
                } // end for priority
                if (rec != null) {
                    //----------
                    _set_cmd_param(CMD, rec.priority, adverb, null, _nouns4pronouns, _pr_occupied);
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
                        _set_cmd_param(CMD, priority, adverb, null, _nouns4pronouns, _pr_occupied);
                        //----------
                        _remove_adverb(_adverbs, adverb);
                    } // end if
                } // end if
            } // end for x
        } // end if
    } // end function "_check_adverbs"
    /* --------------------------------------------------------------------------- */
    return {
        actionEnableDisable: function (_obj, _name, _enable) {
            var search = {'name':_name};
            if ((_obj || null) !== null) {search.obj = _obj} // end if
            //----------
            db_words_and_objects(search).update({'enable':_enable});
        }, // end function "PARSER.actionEnableDisable"
        //--------------------------------------------------
        executeAction: function (_obj, _name, _params) {
            var rec = db_words_and_objects({'enable':true, 'obj':_obj, 'name':_name}).first();
            //----------
            if (rec == false) {return;} // end if
            //----------
            var obj = AZ.getObject(_obj);
            var action = obj.actions_list[rec.action-1];
            if (typeof(action) == 'function') {
                AZ.silence = true;
                //----------
                action(_params);
                //----------
                AZ.silence = false;
            } // end if
        }, // end function "PARSER.executeAction"
        //--------------------------------------------------
        add_link_to_object: function (_options) { // *** проверено
            //----------
            var search = {
                'name':      _options.name,
                'enable':    _options.enable,
                //----------
                'obj':      _options.obj,
                'priority': _options.priority,
                //----------
                'loc':      _options.loc || null,
                'vid':      _options.vid || null,
                //----------
                'to1':      _options.to1 || null,
                'pid1':     _options.pid1 || null,
                'wid1':     _options.wid1 || null,
                'fid1':     _options.fid1 || null,
                //----------
                'to2':      _options.to2 || null,
                'pid2':     _options.pid2 || null,
                'wid2':     _options.wid2 || null,
                'fid2':     _options.fid2 || null,
                //----------
                'to3':      _options.to3 || null,
                'pid3':     _options.pid3 || null,
                'wid3':     _options.wid3 || null,
                'fid3':     _options.fid3 || null,
                //----------
                'any':      _options.any || null,
                };
            //----------
            if ((search.vid && search.to1 && search.pid1 && search.wid1 && search.to2 && search.pid2 && search.wid2 && search.to3 && search.pid3 && search.wid3 && search.any) == false) {return false;} // end if
            //----------
            // Ищем, нет ли уже такой связки
            var rec = db_words_and_objects(search).first();
            //----------
            if (rec !== false) {
                console.error('У объекта "'+search.obj+'" дублирующий набор параметров действия:');
                console.log(
                    '    1: PR:'+rec.priority+
                    ', L:'+rec.loc+
                    ', v:'+(rec.vid == null ? '-' : DICTIONARY.getBase(rec.vid).base+' ('+rec.vid+')')+
                    ', t1:'+(rec.to1 || '-')+
                    ', p1:'+(rec.pid1 == null ? '-' : DICTIONARY.getBase(rec.pid1).base+' ('+rec.pid1+')')+
                    ', w1:'+(rec.wid1 == null ? '-' : DICTIONARY.getBase(rec.wid1).base+' ('+rec.wid1+')')+
                    ', t2:'+(rec.to2 || '-')+
                    ', p2:'+(rec.pid2 == null ? '-' : DICTIONARY.getBase(rec.pid2).base+' ('+rec.pid2+')')+
                    ', w2:'+(rec.wid2 == null ? '-' : DICTIONARY.getBase(rec.wid2).base+' ('+rec.wid2+')')+
                    ', t3:'+(rec.to3 || '-')+
                    ', p3:'+(rec.pid3 == null ? '-' : DICTIONARY.getBase(rec.pid3).base+' ('+rec.pid3+')')+
                    ', w3:'+(rec.wid3 == null ? '-' : DICTIONARY.getBase(rec.wid3).base+' ('+rec.wid3+')')+
                    ', any:'+(rec.any || '-')+
                    ', a:'+rec.action);
                console.log(
                    '    2: PR:'+search.priority+
                    ', L:'+search.loc+
                    ', v:'+(search.vid == null ? '-' : DICTIONARY.getBase(search.vid).base+' ('+search.vid+')')+
                    ', t1:'+(search.to1 || '-')+
                    ', p1:'+(search.pid1 == null ? '-' : DICTIONARY.getBase(search.pid1).base+' ('+search.pid1+')')+
                    ', w1:'+(search.wid1 == null ? '-' : DICTIONARY.getBase(search.wid1).base+' ('+search.wid1+')')+
                    ', t2:'+(search.to2 || '-')+
                    ', p2:'+(search.pid2 == null ? '-' : DICTIONARY.getBase(search.pid2).base+' ('+search.pid2+')')+
                    ', w2:'+(search.wid2 == null ? '-' : DICTIONARY.getBase(search.wid2).base+' ('+search.wid2+')')+
                    ', t3:'+(search.to3 || '-')+
                    ', p3:'+(search.pid3 == null ? '-' : DICTIONARY.getBase(search.pid3).base+' ('+search.pid3+')')+
                    ', w3:'+(search.wid3 == null ? '-' : DICTIONARY.getBase(search.wid3).base+' ('+search.wid3+')')+
                    ', any:'+(search.any || '-')+
                    ', a:'+_options.action);
            } else {
                search['action']    = _options.action || null;
                search['nums']      = _options.nums || null;
                //----------
                //if (search.obj == 'ПОРОХ' || search.obj == 'ФИТИЛЬ') {
                /*if (search.obj == 'ПАЛЬМА') {
                   console.log(
                        'name:'+(search.name == null ? '-' : search.name)+', '+
                        'id:'+search.obj+', p:'+search.priority+', n:'+search.nums+
                        ', L:'+search.loc+
                        ', v:'+(search.vid == null ? '-' : DICTIONARY.getBase(search.vid).base+' ('+search.vid+')')+
                        ', t1:'+(search.to1 || '-')+
                        ', p1:'+(search.pid1 == null ? '-' : DICTIONARY.getBase(search.pid1).base+' ('+search.pid1+')')+
                        ', w1:'+(search.wid1 == null ? '-' : DICTIONARY.getBase(search.wid1).base+' ('+search.wid1+')')+
                        ', f1:'+(search.fid1 == null ? '-' : DICTIONARY.getForm(search.fid1).form+' ('+search.fid1+')')+
                        ', t2:'+(search.to2 || '-')+
                        ', p2:'+(search.pid2 == null ? '-' : DICTIONARY.getBase(search.pid2).base+' ('+search.pid2+')')+
                        ', w2:'+(search.wid2 == null ? '-' : DICTIONARY.getBase(search.wid2).base+' ('+search.wid2+')')+
                        ', f2:'+(search.fid2 == null ? '-' : DICTIONARY.getForm(search.fid2).form+' ('+search.fid2+')')+
                        ', t3:'+(search.to3 || '-')+
                        ', p3:'+(search.pid3 == null ? '-' : DICTIONARY.getBase(search.pid3).base+' ('+search.pid3+')')+
                        ', w3:'+(search.wid3 == null ? '-' : DICTIONARY.getBase(search.wid3).base+' ('+search.wid3+')')+
                        ', f3:'+(search.fid3 == null ? '-' : DICTIONARY.getForm(search.fid3).form+' ('+search.fid3+')')+
                        ', any:'+(search.any || '-')+
                        ', a:'+search.action);
                } // end if*/
                //----------
                db_words_and_objects.insert(search);
                //----------
            } // end if
            //----------
            return true;
        }, // end function "add_link_to_object"
        //--------------------------------------------------
        // Возвращает массив с идентификаторами объектов, которые имеют действия в указанной локации
        get_objects_by_loc_and_actions: function (_loc) { // *** проверено
            //----------
            var result = db_words_and_objects({'enable':true, 'priority':[1,2,3], 'loc':_loc}).distinct('obj');
            //----------
            return (result == false ? [] : result);
            //----------
        }, // end function "get_objects_by_loc_and_actions"
        //--------------------------------------------------
        get_objects_by_word: function (_search, _morph) { // *** проверено
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
        }, // end function "get_objects_by_word"
        /* --------------------------------------------------------------------------- */
        get_noun_of_object_by_pronoun: function (_wid) { // *** проверено
            var result = null;
            //----------
            var search = {
                priority: 0,
                obj:      AZ.availObjects(true, false),
                loc:      [AZ.getLocation(true), null],
                wid1:     _wid,
            }; // end search
            //----------
            var list = db_words_and_objects(search).get();
            if (list.length == 0) {return null;} // end if
            //----------
            var object = list[0].obj;
            //----------
            search.obj = list[0].obj;
            delete search.wid1;
            //----------
            var list = db_words_and_objects(search).get();
            for (var x=0; x<list.length; x++) {
                var wid = list[x].wid1;
                //----------
                var rec = DICTIONARY.getBase(wid);
                if (rec.morph == 'С') {
                    result = rec;
                    break;
                } // end if
            } // end for
            //----------
            return result;
        }, // end function "get_noun_of_object_by_pronoun"
        //--------------------------------------------------
        parse: function (_phrase, _preparsing) {
            _preparsing = _preparsing || false;
            //----------
            var CMD = {
                phrase:     _phrase, // Текст команды
                object:     null,
                action:     null,
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
                //----------
                notparams:  [], // сюда сваливаются слова, которые игра знает, но не понимает, куда отнести: "возьми пила"
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
            if (_phrase == '') {return {phrase:CMD.phrase, object:null, action:null};} // end if
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
                    priority    = _check_param_priority(CMD, word, preposition, nouns4pronouns, pr_occupied);
                    //----------
                    if (priority == null) {
                        buffer_after.push(word);
                        
                    } else if (preposition != null && priority != null) {
                        // Если предлог ещё и наречие, то удаляем его из списка
                        _remove_adverb(preposition);
                    } // end if
                    //----------
                
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
                    // Обрабатываем предлог
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
                        priority    = _check_param_priority(CMD, word, preposition, nouns4pronouns, pr_occupied);
                        //----------
                        if (priority == null) {
                            CMD.notparams.push(word);
                            
                        } else if (preposition != null && priority != null) {
                            // Если предлог ещё и наречие, то удаляем его из списка
                            _remove_adverb(preposition);
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
                                CMD.notparams.push(word);
                                
                            } else if (preposition != null && priority != null) {
                                // Если предлог ещё и наречие, то удаляем его из списка
                                _remove_adverb(preposition);
                            } // end if
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
            // Если все слова в команде завершены, то разбираем команду
            if (word_str == '') {
                var full_IDs    = AZ.availObjects(true, false); // Получаем перечень доступных объектов
                var limited_ids = AZ.availObjects(true, true);  // Получаем перечень объектов, доступных лишь из-за действия с ними в данной локации
                //----------
                var list = null;
                //----------
                var search = {'enable':true, 'obj':full_IDs, 'loc':[null,LOC_ID], 'priority':[1,2,3], 'vid':(CMD.verb == null ? null : CMD.verb.bid)};
                //----------
                var obj_by_word = {};
                //----------
                for (var priority=1; priority<=3; priority++) {
                    if (CMD.params[priority] == null) {continue;} // end if
                    //----------
                    search['pid'+priority] = [null];
                    var prep2 = CMD.params[priority].prep;
                    if (prep2 != null) {search['pid'+priority].push(prep2.bid);} // end if
                    //----------
                    search['wid'+priority] = [null, CMD.params[priority].bid];
                    //----------
                    search['to' +priority] = [null];
                    //----------
                    // Получаем список объектов по найденному в команде слову
                    list = PARSER.get_objects_by_word({'priority':0, 'loc':[null,LOC_ID], 'wid1':CMD.params[priority].bid});
                    for (var x=0; x<list.length; x++) {
                        search['to'+priority].push(list[x]);
                    } // end for x
                    // Запоминаем перечень объектов по этому слову
                    obj_by_word[''+CMD.params[priority].bid] = list.slice();
                    //----------
                } // end for priority
                //----------
                if (CMD.unknown.length > 0) {search.any = [1,2,3];} // end if
                //----------
                var list  = db_words_and_objects(search).get();
                var list2 = [];
                //----------
                for (var x=0; x<list.length; x++) {
                    var rec = list[x];
                    //----------
                    // Если объект из ограниченного перечня, то локация у действия должна быть заполнена
                    if (limited_ids.indexOf(rec.obj) != -1) {
                        if (rec.loc == null) {continue;} // end if
                    } // end if
                    //----------
                    var include = true;
                    var pass_it = 0;
                    //----------
                    for (var priority=1; priority<=3; priority++) {
                        if (CMD.params[priority] == null && rec['pid'+priority] == null && rec['wid'+priority] == null && rec['to'+priority] == null) {
                            pass_it++;
                            continue;
                        } // end if
                        //----------
                        // Если в данных действия слот заполнен, то и в команде должно быть какое-то слово
                            if (rec['pid'+priority] != null || rec['wid'+priority] != null || rec['to'+priority] != null) {
                                if (CMD.params[priority] == null) {
                                    include = false;
                                    break;
                                } // end if
                            } // end if
                            //----------
                            // Если в данных действия заполнен предлог, то и в команде он должен быть заполнен
                            if (rec['pid'+priority] != null) {
                                if (CMD.params[priority].prep == null || CMD.params[priority].prep.bid != rec['pid'+priority]) {
                                    include = false;
                                    break;
                                } // end if
                            } // end if
                            //----------
                            // Если в данных действия заполнено слово, то и в команде оно должно быть заполнено
                            if (rec['wid'+priority] != null) {
                                if (CMD.params[priority].bid != rec['wid'+priority]) {
                                    include = false;
                                    break;
                                } // end if
                            } // end if
                            //----------
                            // Если в данных действия заполнен объект, то и в команде оно должно быть заполнено
                            //if ((rec['to'+priority] != null) && ()) {
                            if (rec['to'+priority] != null) {
                                /*if (full_IDs.indexOf(rec['to'+priority]) >= 0) {
                                    include = false;
                                    break;
                                } // end if*/
                                //----------
                                if (obj_by_word[''+CMD.params[priority].bid].indexOf(rec['to'+priority]) == -1) {
                                    include = false;
                                    break;
                                } // end if
                            } // end if
                        //----------
                        // Если в команде слот заполнен, то и в данных действия должно быть какие-то данные
                        if (CMD.params[priority] != null) {
                            if (rec.any == null && rec['pid'+priority] == null && rec['wid'+priority] == null && rec['to'+priority] == null) {
                                include = false;
                                break;
                            } // end if
                        } // end if
                        
                    } // end for priority
                    if (include == true && (pass_it<3 || CMD.verb != null)) {
                        list2.push(rec);
                    } // end if
                } // end for x
                //----------
                if (list2.length > 0) {
                    rec = list2[0];
                    //----------
                    CMD.object = AZ.getObject(rec.obj);
                    CMD.action = CMD.object.actions_list[rec.action-1];
                    CMD.action_name = rec.name || '';
                    //----------
                    for (var priority=1; priority<=3; priority++) {
                        if (CMD.params[priority] != null) {
                            list = obj_by_word[''+CMD.params[priority].bid];
                            if (list !== undefined) {
                                CMD.objects[priority] = AZ.getObject(list[0]);
                            } // end if
                        } // end if
                        //----------
                        /*if (CMD.unknown.length > 0 && rec.any != null && CMD.params[rec.any] != null) {
                        } // end if*/
                    } // end if
                    //----------
                    if (CMD.unknown.length > 0) {CMD.unknown = [];} // end if
                } // end if
            } // end if
            //----------
            // Ругаемся на незнакомые слова
            if (CMD.unknown.length > 0 || CMD.notparams.length > 0) {
                CMD.any_errors = true;
                //CMD.error.type  = 1; // 1 - незнакомое слово
                //----------
                if (_preparsing == false) {
                    if (CMD.unknown.length > 0) {
                        for (var x=0; x<CMD.unknown.length; x++) {
                            print('Слово "<strong>'+CMD.unknown[x]+'</strong>" мне незнакомо.');
                        } // end for x
                    }
                    //----------
                    if (CMD.notparams.length > 0) {
                        for (var x=0; x<CMD.notparams.length; x++) {
                            print('Слово "<strong>'+CMD.notparams[x].form+'</strong>" знакомо, но его форма не подходит к команде.');
                        } // end for x
                    }
                }
                //----------
                AUTOCOMPLETE.setStatus(-1);
                //----------
                return {phrase:CMD.phrase, object:null, action:null};
            } // end if
            //----------
            CMD.A      = {object:null, word:null, prep:null};
            CMD.B      = {object:null, word:null, prep:null};
            CMD.C      = {object:null, word:null, prep:null};
            //----------
            if (CMD.objects[1] != null) {CMD.A.object = CMD.objects[1];} // end if
            if (CMD.objects[2] != null) {CMD.B.object = CMD.objects[2];} // end if
            if (CMD.objects[3] != null) {CMD.C.object = CMD.objects[3];} // end if
            //----------
            if (CMD.params[1] != null) {CMD.A.word = CMD.params[1]; CMD.A.prep = CMD.params[1].prep;} // end if
            if (CMD.params[2] != null) {CMD.B.word = CMD.params[2]; CMD.B.prep = CMD.params[2].prep;} // end if
            if (CMD.params[3] != null) {CMD.C.word = CMD.params[3]; CMD.C.prep = CMD.params[3].prep;} // end if
            //----------
            if (CMD.action != null) {
                AUTOCOMPLETE.setStatus(1);
            } // end if
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
                this.pre_parse(word_str, iNN(CMD.verb, 'bid'), iNN(preposition, 'bid'), CMD);
            } // end if
            //----------
            return CMD;
            //----------
        }, // end function "parse"
        //--------------------------------------------------
        pre_parse: function (word_str, verb_id, prep_id, CMD) {
            word_str = word_str || '';
            //----------
            if (DEBUG.isEnable() == false) {
                if (word_str.length < AUTOCOMPLETE.getCharsMin()) {
                    AUTOCOMPLETE.init();
                    return;
                } // end if
            } // end if
            //----------
            verb_id     = verb_id || null;
            prep_id     = prep_id || null;
            //----------
            var availableBIDs = (word_str.length == 0) ? null : DICTIONARY.getListByWord(word_str, 'bid');
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
                if (availableBIDs !== null) {
                    if (availableBIDs.indexOf(_bid) == -1) {return false;} // end if
                } // end if
                //----------
                if (_list.indexOf(_bid) >= 0) {
                    return false;
                } else {
                    _list.push(_bid);
                    //----------
                    var word = DICTIONARY.getBase(_bid);
                    var rec = {'wid':_bid, 'base':word.base, 'morph':word.morph};
                    //----------
                    if (_values !== undefined) {
                        for (var key in _values) {
                            rec[key] = _values[key];
                        } // end for
                    } // end if
                    //----------
                    _data.push(rec);
                    //----------
                    return true;
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
            function _add_words_from_links (bids_to_add, _obj, _search, _cases) {
                if (_obj == null) {return;} // end if
                if (obj_to_pass.indexOf(_obj) >= 0) {return;} // end if
                //----------
                _search.obj = _obj;
                _cases      = _cases || null;
                //----------
                var words_list = db_words_and_objects(_search).get();
                //----------
                for (var x=0; x<words_list.length; x++) {
                    var word = words_list[x];
                    //----------
                    bids_to_add.push({'bid':word.wid1, 'value':{nums:word.nums}, 'cases':_cases.slice()});
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
            // Перечень доступных в настоящий момент объектов
            var availableObjects = AZ.availObjects(true, false); // Получаем перечень доступных объектов
            var isText = (availableObjects.length == 1 && AZ.getObject(availableObjects[0]).type == 'text') ? true : false;
            //----------
            // Шаблон фильтра отбора слов, сопоставленных с объектом
            var search_toN = {'priority':0};
            if (isText == false) {search_toN.loc = [LOC_ID, null];} // end if
            //----------
            // Фильтр отбора записей-действий
            var search = {
                'enable':   true, 
                'obj':      availableObjects,
                'priority': [1,2,3],
                //----------
                //'loc':      [LOC_ID, null],
                };
            if (verb_id !== null) {search.vid = verb_id;} // end if
            //if (prep_id !== null) {search.vid = verb_id;} // end if
            //availableBIDs
            if (isText == false)  {search.loc = [LOC_ID, null];} // end if
            //----------
            // Отбираем все комбинации слов, используемых в действиях с доступными объектами
            var list = db_words_and_objects(search).get();
            //----------
            var limited_ids = AZ.availObjects(true, true); // Получаем перечень объектов, доступных лишь из-за действия с ними в данной локации
            //----------
            for (var x=0; x<list.length; x++) {
                var rec = list[x];
                //----------
                var bids_to_add   = []; // Массив с данными для добавления
                var pass_this_rec = false;
                //----------
                // Если объект из ограниченного перечня, то локация у действия должна быть заполнена
                if (limited_ids.indexOf(rec.obj) >= 0) {
                    if (rec.loc == null) {continue;} // end if
                } // end if
                //----------
                if (CMD.objects[rec.priority] != null && rec.obj != AZ.getID(CMD.objects[rec.priority])) {
                    if (CMD.params[rec.priority] != null) {continue;} // end if
                } // end if
                //----------
                // Если глагол в данных есть, а в команде его нет (и в команде нет ни предлога, ни слова), то добавляем его в перечень
                if (rec.vid != null && verb_id == null && pass_verb == false) {
                    bids_to_add.push({'bid':rec.vid, 'value':undefined});
                } // end if
                //----------
                // Если глагол есть в команде, то этот же глагол есть и в данных (условие фильтра)
                // Если глагола нет в данных, то его не может быть и в команде (от условия фильтра)
                //----------
                cases2 = []; // Перечень падежей предлога из записи данных. Падежи распространяются на слово и объекты toN.
                //----------
                // Сопоставление слов с объектами
                for (var priority=1; priority<=3; priority++) {
                    if (CMD.params[priority] != null) {continue;} // end if
                    //----------
                    // Предлог добавляем, если этого предлога в команде ещё нет.
                    if (rec['pid'+priority] != null && prep_id == null && preps_to_pass.indexOf(rec['pid'+priority]) == -1) {
                        //  1. Глагола нет ни в данных, ни в команде.
                        //  2. Глагол есть и в данных, и в команде.
                        if (rec.vid == verb_id) {
                            bids_to_add.push({'bid':rec['pid'+priority], 'value':undefined});
                            //----------
                            cases2 = DICTIONARY.getWordCases(rec['pid'+priority], '-');
                            _cases2word(words_cases, rec['wid'+priority], cases2);
                            //----------
                            preps_to_pass.push(rec['pid'+priority]);
                        } // end if
                    } // end if
                    //----------
                    // Слово добавляем если этого слова в команде ещё нет:
                    if (rec['wid'+priority] != null && words_to_pass.indexOf(rec['wid'+priority]) == -1) {
                        //  1. Глагола нет ни в данных, ни в команде. Предлога нет ни в данных, ни в команде.
                        //  2. Глагола нет ни в данных, ни в команде. Предлог есть и в данных, и в команде.
                        //  3. Глагол есть и в данных, и в команде. Предлога нет ни в данных, ни в команде.
                        //  4. Глагол есть и в данных, и в команде. Предлог есть и в данных, и в команде.
                        if (verb_id == null) {
                            // Если глагола в команде нет, то предлог данных должен совпадать с предлогом в команде
                            if (rec['pid'+priority] != prep_id) {pass_this_rec = true; continue;} // end if
                            //----------
                            // Если предлога нет, то падеж только именительный, иначе - берём из предлога.
                            cases2 = (rec['pid'+priority] == null ? ['И'] : DICTIONARY.getWordCases(rec['pid'+priority], '-'));
                            
                        } else if (verb_id != null) {
                            cases2 = cases[verb_id+':'+priority+':'+prep_id];
                        } // end if
                        //----------
                        if ((cases2 || null) == null) {pass_this_rec = true; continue;} // end if
                        //----------
                        // Добавляем слова-сопоставления с объектом из слота
                        bids_to_add.push({'bid':rec['wid'+priority], 'value':{nums:['Е','М']}, 'cases':cases2.slice()});
                        //_add_words_from_links(bids_to_add, obj, search_toN, cases2);
                    } // end if
                    //} // end if "obj_to_pass"
                    //----------
                    var obj = rec['to'+priority];
                    //----------
                    // Если слот не заполнен, либо данный объект уже обрабатывался, то пропускаем запись
                    if (obj == null || obj_to_pass.indexOf(obj) >= 0) {continue;} // end if
                    //----------
                    // Пропускаем комбинации, где один из объектов недоступен
                    if (availableObjects.indexOf(obj) == -1) {pass_this_rec = true; continue;} // end if
                    //----------
                    // Пропускаем комбинации, где один из объектов в ограниченном списке - с ним можно манипулировать только по его действиям
                    if (obj != rec.obj && limited_ids.indexOf(obj) >= 0) {pass_this_rec = true; continue;} // end if
                    //----------
                    // Предлог должен совпадать и в данных и в команде (либо отсутствовать и там, и там).
                    if (verb_id == rec.vid) {
                        if (verb_id == null) {
                            if (rec['pid'+priority] != prep_id) {continue;} // end if
                            //----------
                            // Если предлога нет, то падеж только именительный, иначе - берём из предлога.
                            cases2 = (rec['pid'+priority] == null ? ['И'] : DICTIONARY.getWordCases(rec['pid'+priority], '-'));
                            
                        } else if (verb_id != null) {
                            // Если есть глагол, то может быть ситуация, когда предлога в данных нет, а в команде он есть - в этом случае берём предлоги глагола
                            if (rec['pid'+priority] != null && prep_id != rec['pid'+priority]) {continue;} // end if
                            //----------
                            var idx = verb_id+':'+priority;
                            if (preps_of_verbs[idx].length>0) {
                                for (var y=0; y<preps_of_verbs[idx].length; y++) {
                                    var prep2 = preps_of_verbs[idx][y];
                                    if (preps_to_pass.indexOf(prep2) == -1) {
                                        if (_add_bid(bids_list, bids_data, prep2) == true) {
                                            preps_to_pass.push(prep2);
                                        } // end if
                                    } // end if
                                } // end for
                            } // end if
                            //----------
                            cases2 = cases[verb_id+':'+priority+':'+prep_id];
                            if (cases2 === undefined) {continue;} // end if
                            //if (cases2.indexOf(rec['pid'+priority]) == -1) {continue;} // end if
                        } // end if
                        //----------
                        // Добавляем слова-сопоставления с объектом из слота
                        _add_words_from_links(bids_to_add, obj, search_toN, cases2);
                    } // end if
                } // end for "priority"
                //----------
                if (pass_this_rec == false) {
                    for (var bx=0; bx<bids_to_add.length; bx++) {
                        var brec = bids_to_add[bx];
                        // DICTIONARY.getObjectsOfVerbs({'bid':rec.vid, 'priority':[1,2,3]})
                        if (_add_bid(bids_list, bids_data, brec.bid, brec.value) == true) {
                            if (brec.cases !== undefined) {
                                _cases2word(words_cases, brec.bid, brec.cases); // Добавляем падежи для данного слова
                            } // end if
                        } // end if
                    } // end for
                } // end if
            } // end for x
            //----------
            AUTOCOMPLETE.init(bids_list);
            //----------
            var fid     = null;
            var form    = null;
            //----------
            var word_len = word_str.length;
            //----------
            for (var x=0; x<bids_list.length; x++) {
                var bid = bids_list[x];
                //----------
                var morph   = bids_data[x].morph;
                //----------
                var missed_forms   = [];
                var have_any_forms = false;
                //----------
                if (morph == 'Г') {
                    var forms_list = AUTOCOMPLETE.getByBID(bid, word_str);
                    //----------
                    var fsearch = {'bid': bid};
                    if (word_len > 0) { fsearch.form = {leftnocase:word_str}; } // Если в искомом слове есть буквы, то ограничиваем фильтр ими
                    var forms_list_full = DICTIONARY.getFormsListByBID(fsearch);
                    //----------
                    for (var y=0; y<forms_list.length; y++) {
                        fid     = forms_list[y].fid;
                        form    = DICTIONARY.getForm(fid).form;
                        //----------
                        if (word_len > 0 && form.substr(0, word_len) != word_str) {continue;} // end if
                        //----------
                        if (AUTOCOMPLETE.add(word_len, fid, form, morph, true) == true) {
                            have_any_forms = true;
                        } // end if
                    } // end for
                    //----------
                    if (have_any_forms == false) {
                        for (var y=0; y<forms_list_full.length; y++) {
                            fid  = forms_list_full[y].fid;
                            form = DICTIONARY.getForm(fid).form;
                            //----------
                            if (word_len > 0 && form.substr(0, word_len) != word_str) {continue;} // end if
                            //----------
                            missed_forms.push({'fid':fid, 'form':form, 'morph':morph});
                        } // end for
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
                            fid  = forms_list[y].fid;
                            form = DICTIONARY.getForm(fid).form;
                            //----------
                            if (word_len > 0 && form.substr(0, word_len) != word_str) {continue;} // end if
                            //----------
                            if (AUTOCOMPLETE.add(word_len, fid, form, morph, true) == true) {
                                have_any_forms = true;
                            } else {
                                missed_forms.push({'fid':fid, 'form':form, 'morph':morph});
                            } // end if
                        } // end for
                    
                    } else {
                        var forms_list = DICTIONARY.getFormsListByBID({'bid': bid});
                        for (var y=0; y<forms_list.length; y++) {
                            fid  = forms_list[y].fid;
                            form = forms_list[y].form;
                            //----------
                            if (word_len > 0 && form.substr(0, word_len) != word_str) {continue;} // end if
                            //----------
                            if (AUTOCOMPLETE.add(word_len, fid, form, morph, true) == true) {
                                have_any_forms = true;
                            } else {
                                missed_forms.push({'fid':fid, 'form':form, 'morph':morph});
                            } // end if
                        } // end for
                    } // end if
                } // end if
                //----------
                if (have_any_forms == false && missed_forms.length > 0) {
                    for (var y=0; y<missed_forms.length; y++) {
                        AUTOCOMPLETE.add(word_len, missed_forms[y].fid, missed_forms[y].form, missed_forms[y].morph, false);
                    } // end for
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
        }, // end function "pre_parse"
        //--------------------------------------------------
    };
    //--------------------------------------------------
})(); // end object "PARSER"
/* --------------------------------------------------------------------------- */
function EnableAction (_name) {
    PARSER.actionEnableDisable(null, _name, true);
}
//--------------------------------------------------
function DisableAction (_name) {
    PARSER.actionEnableDisable(null, _name, false);
}
/* --------------------------------------------------------------------------- */
