/* --------------------------------------------------------------------------- */
// Объект "AUTOCOMPLETE" предназначен для формирования перечня слов для автодополнения при вводе текстовых команд.
    // Данный объект используется:
    //      1.  При заполнении словаря (az-dictionary) — с помощью флагов "-" и "+" у существительных,
    //          глаголов и предлогов можно указывать нужно ли включать те или иные словоформы в автодополнение.
    //      2.  При отладке (az-debug) для вывода перечня слов для целей отладки.
    //
    // Принцип работы:
    //      Данный объект предоставляет функцию "setCharsMin", с помощью которой автор может указывать
    //      минимальное число символов для формирования перечня
    //      В процессе препарсинга вводимой игроком команды объект AUTOCOMPLETE формирует два списка: полный и краткий.
    //          Полный список   -   содержит все слова независимо от числа введённых символов.
    //          Краткий список  -   содержит ограниченный перечень слов, с учётом минимального числа символов для формирования
    //                              перечня автодополнения.
    //      Также объект содержит функцию "getActionFlag", которая возвращает TRUE, если введённая команда может быть выполнена.
    //      Также объект содержит функцию "getStatus", которая возвращает результат предварительной обработки команды:
    //          0 - ничего, -1 - ошибка в команде, 1 - есть что выполнить.
/* --------------------------------------------------------------------------- */
window.AUTOCOMPLETE = (function() {
    //--------------------------------------------------
    var prevData = {
        tabPressed: false,  // Флаг, была ли нажата последней клавиша Tab
        list:       [],     // Перечень слов для циклического автодополнения по Tab
        pos:        0       // Позиция внутри перечня
    };
    //----------
    var ac_data = null;
    var ac_morphs;
    //----------
    var ac_exclude;
    //----------
    var ac_action;
    var acStatus = 0; // Статус автодополнения: 0 - ничего, -1 - ошибка в команде, 1 - есть что выполнить
    //----------
    var ac_chars = 0;
    //----------
    var lastKeyCode = 0;
    //--------------------------------------------------
    /* Формат базы данных "db_autocomplete":
        bid     Уникальный числовой идентификатор слова
        fid     Числовой идентификатор формы-автодополнения
        inc     Включать или нет слово в автодополнение
        ---------- */
        var db_autocomplete = TAFFY();
    //--------------------------------------------------
    _init();
    //--------------------------------------------------
    /*
        При нажатии Tab:
            Если это первое нажатие, то
                1. Запоминаем текущий список автодополнения.
                2. Дополняем фразу первым словом.
                3. 
            Если это второе нажатие, то:
                1. Стираем последнее слово (пробел, слово - до пробела)
                2. Дополняем фразу очередным словом
        */
    // Инициализация данных модуля. Вызывается в модуле PARSER в функции препарсинга.
    function _init (_bids_list) {
        //----------
        ac_data = [];
        ac_data.push({list:{'full':[], 'Г':[], 'С':[], 'other':[]}});
        ac_data.push({list:{'full':[], 'Г':[], 'С':[], 'other':[]}});
        ac_data.push({list:{'full':[], 'Г':[], 'С':[], 'other':[]}});
        //----------
        _start(0);
        _start(1);
        //----------
        if (_bids_list === undefined) {
            ac_exclude = [];
        } else {
            ac_exclude = db_autocomplete({'bid':_bids_list, 'inc':false}).select('fid');
        } // end if
        //----------
        ac_morphs   = {};
        ac_action   = false;
        acStatus    = 0;
        //----------
    } // end function "init"
    //--------------------------------------------------
    // Добавление слова в перечень автодополнения.
    function _add (_list, _word, _morph) {
        var lst = (_morph == 'Г' || _morph == 'С') ? _list[_morph] : _list['other'];
        //----------
        if (lst.indexOf(_word) == -1) {
            lst.push(_word);
            ac_morphs[_word] = _morph;
        } // end if
        //----------
    } // end function "_add"
    //--------------------------------------------------
    // Итоговая сортировка внутренних массивов слов (по части речи) и формирование общего перечня.
    function _sort (_list) {
        _list['Г'].sort();
        _list['С'].sort();
        _list['other'].sort();
        //----------
        _list['full'] = _list['Г'].concat(_list['С'].concat(_list['other']));
    } // end function "_sort"
    //--------------------------------------------------
    // Начало выборки перечня слов. Параметр: 0 - полный список, 1 - краткий.
    function _start (_type) {
        ac_data[_type].position = -1;
        ac_data[_type].word     = '';
        ac_data[_type].morph    = '';
    } // end function "_start"
    //--------------------------------------------------
    return {
        //--------------------------------------------------
        // Инициализация списков. Синоним для внутренней функции
        init: _init,
        //--------------------------------------------------
        getOnTab: function () {
            var result = '';
            //----------
            if (prevData.tabPressed == false) {
                prevData.tabPressed = true;
                prevData.list       = ac_data[1].list['full'].slice();
                prevData.pos        = 0;
            } else {
                prevData.pos++;
                if (prevData.pos == prevData.list.length) {
                    prevData.pos = 0;
                } // end if
            } // end if
            //----------
            if (prevData.list.length == 0) {
                prevData.tabPressed = false;
                prevData.pos        = 0;
            } else {
                result = prevData.list[prevData.pos];
            }// end if
            //----------
            return result;
        },
        //--------------------------------------------------
        resetTab: function () {
            prevData.tabPressed = false;
            prevData.list       = [];
            prevData.pos        = 0;
        },
        //--------------------------------------------------
        // Исключение (в основном) слова в автодополнение. Вызывается из модуля DICTIONARY.
        addWordWithFlag: function (_bid, _fid, _inc) {
            //----------
            var search = {'bid':_bid, 'fid': _fid};
            //----------
            // Ищем, нет ли уже такой связки
            var rec = db_autocomplete(search).first();
            //----------
            if (rec == false) {
                search.inc = _inc;
                db_autocomplete.insert(search);
            } // end if
            //----------
        }, // end function "AUTOCOMPLETE.addWordWithFlag"
        //--------------------------------------------------
        // Получение перечня словоформ с учётом исключаемых из автодополнения. Вызывается из модуля PARSER.
        getByBID: function (_bid, word_str) {
            var search = {'bid': _bid, 'inc':true};
            //----------
            if (word_str !== undefined && word_str.length > 0) {
                search.fid = DICTIONARY.getListByWord(word_str, 'fid');
            } // end if
            //----------
            return db_autocomplete(search).get();
            //----------
        }, // end function "AUTOCOMPLETE.getByBID"
        //--------------------------------------------------
        // Установка минимального числа символов для формирования краткого перечняавтодополнения. Используется АВТОРОМ.
        setCharsMin: function (_quantity) {
            //----------
            if (arguments.length == 0) {
                return ac_chars;
            } else {
                ac_chars = (_quantity || 0);
            } // end if
            //----------
        }, // end function "AUTOCOMPLETE.setCharsMin"
        //--------------------------------------------------
        // Установка минимального числа символов для формирования краткого перечняавтодополнения. Используется АВТОРОМ.
        getCharsMin: function () {
            return ac_chars;
        }, // end function "AUTOCOMPLETE.getCharsMin"
        //--------------------------------------------------
        // Добавление словоформы в перечень автодополнения. Вызывается из модуля PARSER.
        add: function (_len, _fid, _word, _morph, _control) {
            //----------
            if (_control == true && ac_exclude.indexOf(_fid) >= 0) {return false;} // end if
            //----------
            _add(ac_data[0].list, _word, _morph);
            //----------
            if (_len < ac_chars) {
                return false;
            } else {
                _add(ac_data[1].list, _word, _morph);
                //----------
                return true;
            } // end if
        }, // end function "AUTOCOMPLETE.add"
        //--------------------------------------------------
        // Сортировка полного и краткого перечней слов для автодополнения. Вызывается из модуля PARSER.
        sort: function() {
            //----------
            _sort(ac_data[0].list);
            _sort(ac_data[1].list);
            //----------
        }, // end function "AUTOCOMPLETE.sort"
        //--------------------------------------------------
        // Начало выборки слов автодополнения. Параметр: 0 — из полного перечня, 1 — из краткого перечня (с учётом минимального числа символов).
        start: function(_type) {
            //----------
            if (_type === undefined) {
                _start(0);
                _start(1);
            } else {
                _start(_type);
            } // end if
            //----------
        }, // end function "AUTOCOMPLETE.start"
        //--------------------------------------------------
        // Сдвижка позиции выборки перечня слов автодополнения. Параметр: 0 — из полного перечня, 1 — из краткого перечня (с учётом минимального числа символов).
        next: function(_type) {
            _type = _type || 0;
            //----------
            ac_data[_type].position++;
            //----------
            var pos     = ac_data[_type].position;
            var list    = ac_data[_type].list['full'];
            //----------
            if (pos >= list.length) {return false;} // end if
            //----------
            ac_data[_type].word     = list[pos];
            ac_data[_type].morph    = ac_morphs[ac_data[_type].word];
            //----------
            return true;
        }, // end function "AUTOCOMPLETE.next"
        //--------------------------------------------------
        // Возвращает длину списка
        lenght: function(_type) {
            return ac_data[(_type || 0)].list['full'].length;
        }, // end function "AUTOCOMPLETE.lenght"
        //--------------------------------------------------
        // Возвращает первое слово из списка (или пустую строку, если список пустой)
        firstWord: function(_type) {
            _type = _type || 0;
            //----------
            var list = ac_data[_type].list['full'];
            //----------
            return list.length == 0 ? '' : ac_data[_type].list['full'][0];
        }, // end function "AUTOCOMPLETE.first"
        //--------------------------------------------------
        // Получение слова из текущей позиции выборки. Параметр: 0 — из полного перечня, 1 — из краткого перечня (с учётом минимального числа символов).
        word: function(_type) {
            _type = _type || 0;
            //----------
            return ac_data[_type].word;
        }, // end function "AUTOCOMPLETE.word"
        //--------------------------------------------------
        // Получение части речи слова из текущей позиции выборки. Параметр: 0 — из полного перечня, 1 — из краткого перечня (с учётом минимального числа символов).
        morph: function(_type) {
            _type = _type || 0;
            //----------
            return ac_data[_type].morph;
        }, // end function "AUTOCOMPLETE.cur_morph"
        //--------------------------------------------------
        // Установка признака возможного выполнения команды игрока. Вызывается из модуля PARSER.
        setActionFlag: function() {
            ac_action = true;
        }, // end function "AUTOCOMPLETE.setActionFlag"
        //--------------------------------------------------
        // Получение признака возможного выполнения команды игрока.
        getActionFlag: function() {
            return (ac_action == true ? true : false);
        }, // end function "AUTOCOMPLETE.getActionFlag"
        //--------------------------------------------------
        // Установка признака возможного выполнения команды игрока. Вызывается из модуля PARSER.
        setStatus: function(_status) {
            acStatus = _status;
        }, // end function "AUTOCOMPLETE.setStatus"
        //--------------------------------------------------
        // Получение признака возможного выполнения команды игрока.
        getStatus: function() {
            return acStatus;
        }, // end function "AUTOCOMPLETE.getStatus"
        //--------------------------------------------------
    };
})(); // end object "AUTOCOMPLETE"
/* --------------------------------------------------------------------------- */
