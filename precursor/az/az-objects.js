/* --------------------------------------------------------------------------- */
window.tSimpleObject = function (_id) {
    var objectID        = AZ.addObject(_id, this); //Строковый ID объекта
    this.type           = 'object'; // Тип данных
    this.actions_list   = []; // Перечень обработчиков действий. Индекс массива используется как ID обработчика.
    //--------------------------------------------------
    Object.defineProperty(this, 'isObject',     {configurable:false, writable:false, value:true});
    Object.defineProperty(this, 'ID',           {configurable:false, writable:false, value:objectID});
    //--------------------------------------------------
    var description     = new tDescription(this); // Описание объекта
    var mentions        = new tMentions(this); // Упоминания объекта
    var container       = new tContainer(this); // Контейнер объекта
    //this.properties       = new tProperties(this); // Свойства объекта
    //----------
    var hideContent     = false; // Скрывать содержимое при просмотре описания
    var hideInContent   = false; // Скрывать объект при просмотре содержимого другого объекта
    //--------------------------------------------------
    Object.defineProperty(this, 'СкрыватьСодержимое', {
        set: function(_value) {hideContent = (_value == true ? true : false);},
        get: function()       {return hideContent;}
    });
    //--------------------------------------------------
    Object.defineProperty(this, 'СкрыватьВСодержимом', {
        set: function(_value) {hideInContent = (_value == true ? true : false);},
        get: function()       {return hideInContent;}
    });
    //--------------------------------------------------
    Object.defineProperty(this, 'СодержимоеИзвестно', {
        set: function(_value) {
                var protagonist = AZ.getProtagonist();
                if (protagonist == null) {return false;} // end if
                //----------
                var pos_now  = protagonist.what_he_exam.now.indexOf(this.ID);
                var pos_past = protagonist.what_he_exam.past.indexOf(this.ID);
                //----------
                if (_value == true) {
                    if (pos_now  == -1) {protagonist.what_he_exam.now.push(this.ID);} // end if
                    if (pos_past == -1) {protagonist.what_he_exam.past.push(this.ID);} // end if
                } else {
                    if (pos_now  >= 0) {protagonist.what_he_exam.now.splice(pos_now, 1);} // end if
                    if (pos_past >= 0) {protagonist.what_he_exam.past.splice(pos_past, 1);} // end if
                } // end if
                //----------
            },
        //----------
        get: function() {
                var protagonist = AZ.getProtagonist();
                if (protagonist == null) {return false;} // end if
                //----------
                return (protagonist.what_he_exam.now.indexOf(this.ID) >= 0) ? true : false;
            }
    });
    //--------------------------------------------------
    /*tSimpleObject.prototype.examineContainer = function () {
        var protagonist = AZ.getProtagonist();
        if (protagonist == null) {return false;} // end if
        //----------
        if (protagonist.what_he_exam.now.indexOf(this.ID) == -1) {
            protagonist.what_he_exam.now.push(this.ID);
        } // end if
        //----------
        if (protagonist.what_he_exam.past.indexOf(this.ID) == -1) {
            protagonist.what_he_exam.past.push(this.ID);
        } // end if
        //----------
        return true;
    }; // end function "tSimpleObject.examineContainer"*/
    
    /*Object.defineProperty(this, 'type', {
        get: function()       {return type;}
    });*/
    //--------------------------------------------------
    Object.defineProperty(this, 'description',  {configurable:false, writable:false, value:description});
    Object.defineProperty(this, 'mentions',     {configurable:false, writable:false, value:mentions});
    Object.defineProperty(this, 'container',    {configurable:false, writable:false, value:container});
    //--------------------------------------------------
}; //end function tSimpleObject
/* --------------------------------------------------------------------------- */
// СОЗДАНИЕ ОБЪЕКТОВ
    //--------------------------------------------------
    // Объявление объекта с типом "Location"
    window.Location = function (_id) {
        tSimpleObject.apply(this, arguments);
    }; // end function "Location"
    //----------
    Location.prototype = Object.create(tSimpleObject.prototype);
    Location.prototype.constructor = Location;
    //--------------------------------------------------
    // Объявление объекта с типом "Объект" (предмет)
    window.Item = function (_id) {
        tSimpleObject.apply(this, arguments);
    }; // end function "Объект"
    //----------
    Item.prototype = Object.create(tSimpleObject.prototype);
    Item.prototype.constructor = Item;
/* --------------------------------------------------------------------------- */
// ОБЩИЕ МЕТОДЫ
    //--------------------------------------------------
    // Функция сравнивает переданный параметр с идентификатором объекта.
    // Возвращает true или false.
    tSimpleObject.prototype.Is = function (_id) {
        //----------
        return (AZ.getID(_id) == this.ID) ? true : false;
        //----------
    }; // end function "<Объект>.Is"
    //--------------------------------------------------
    tSimpleObject.prototype.addMention = function (_purpose, _object, _text) {
        //----------
        this.mentions.add(_purpose, _object, _text);
        //----------
    }; // end function "<Объект>.addMention"
    //--------------------------------------------------
    tSimpleObject.prototype.getMention = function (_purpose, _where) {
        //----------
        return this.mentions.get(_purpose, _where);
        //----------
    }; // end function "<Объект>.getMention"
    //--------------------------------------------------
    tSimpleObject.prototype.setDescription = function (_title, _description, _list_inside) {
        //----------
        this.description.set(_title, _description, _list_inside);
        //----------
    }; // end function "<Объект>.Description"
    //--------------------------------------------------
    tSimpleObject.prototype.setPrefixForContent = function () {
        //----------
        this.description.setPrefix.apply(this.description, arguments);
        //----------
    }; // end function "<Объект>.Title"
    //--------------------------------------------------
    tSimpleObject.prototype.getPrefixForContent = function () {
        //----------
        return this.description.getPrefix.apply(this.description, arguments);
        //----------
    }; // end function "<Объект>.Title"
    //--------------------------------------------------
    tSimpleObject.prototype.getTitle = function () {
        //----------
        return this.description.getTitle.apply(this.description, arguments);
        //----------
    }; // end function "<Объект>.Title"
    //--------------------------------------------------
    tSimpleObject.prototype.getDescription = function () {
        //----------
        return this.description.getText.apply(this.description, arguments);
        //----------
    }; // end function "<Объект>.Description"
    //--------------------------------------------------
    tSimpleObject.prototype.printDescription = function (_param) {
        //----------
        print(this.getDescription(_param));
        //----------
    }; // end function "<Объект>.Description"
    //--------------------------------------------------
    tSimpleObject.prototype.printTitleAndDescription = function (_param) {
        //----------
        print(this.getTitle(_param, true));
        print(this.getDescription(_param));
        //----------
    }; // end function "<Объект>.Description"
    //--------------------------------------------------
    tSimpleObject.prototype.isAvailable = function () {
        //----------
        return AZ.isAvailable(objectID);
        //----------
    }; // end function "<Объект>.isAvailable"
/* --------------------------------------------------------------------------- */
// РАБОТА С МЕСТОНАХОЖДЕНИЕМ ОБЪЕКТОВ
    //--------------------------------------------------
    // Помещает объект в контейнер. Параметры: КУДА, <КОЛИЧЕСТВО = 1>
    tSimpleObject.prototype.Put = function () {
        return this.container.put.apply(this.container, arguments);
    }; // end function "Поместить"
    //--------------------------------------------------
    // Убирает объект из контейнера. Параметры: ОТКУДА, <КОЛИЧЕСТВО = ВСЁ>
    tSimpleObject.prototype.Remove = function () {
        return this.container.remove.apply(this.container, arguments);
    }; // end function "Убрать"
    //--------------------------------------------------
    // Перемещает объект из одного контейнера в другой. Параметры: ОТКУДА, КУДА, <КОЛИЧЕСТВО = ВСЁ> / КУДА, <КОЛИЧЕСТВО = ВСЁ>
    tSimpleObject.prototype.Move = function () {
        return this.container.move.apply(this.container, arguments);
    }; // end function "Переместить"
    //--------------------------------------------------
    tSimpleObject.prototype.Where = function (_as_array) {
        return this.container.where.apply(this.container, arguments);
    }; // end function "tSimpleObject.where"
    //--------------------------------------------------
    tSimpleObject.prototype.isThere = function () {
        return this.container.isThere.apply(this.container, arguments);
    }; // end function "Находится"
    //--------------------------------------------------
    tSimpleObject.prototype.Includes = function () {
        return this.container.includes.apply(this.container, arguments);
    }; // end function "Содержит"
    //--------------------------------------------------
    tSimpleObject.prototype.getContent = function () {
        return this.container.getContent.apply(this.container, arguments);
    }; // end function "tSimpleObject.getContent"
/* --------------------------------------------------------------------------- */
// РАБОТА СО СВОЙСТВАМИ ОБЪЕКТОВ
    //--------------------------------------------------
    tSimpleObject.prototype.Property = function () {
        PROPERTIES.create.apply(this, arguments);
    } // end function "Property"
/* --------------------------------------------------------------------------- */
// РАБОТА С ПАРСЕРОМ
    //--------------------------------------------------
    tSimpleObject.prototype.Notation = function (_words, _locations, _number) {
        // +++ Проверка на заполненность и корректность параметров
        //----------
        _words      = any2arr(_words, true);
        _locations  = any2arr(_locations, true);
        _numbers    = any2arr(_number || 'Е');
        //----------
        for (var x=0; x<_numbers.length; x++) {
            _numbers[x] = _numbers[x].toUpperCase();
        } // end for x
        //----------
        for (var x=0; x<_words.length; x++) {
            var word = _words[x];
            //----------
            var word = DICTIONARY.getWord(word);
            //----------
            if (word === null) {
                console.warn('Не найдено слово "'+_words[x]+'" для привязки к объекту: '+this.ID);
                //DICTIONARY.dict_absend.push({'word': _words[x], 'morph': 'С', 'object': this});
                continue;
            } // end if
            //----------
            var object_id = AZ.getID(this);
            //----------
            for (var y=0; y<_locations.length; y++) {
                PARSER.add_link_to_object({'enable':true, name:null, 'obj':object_id, 'priority':0, 'loc':(_locations[x]==null ? null: AZ.getID(_locations[x])), 'wid1':word.bid, 'nums':_numbers});
            } // end for y
            //----------
        } // end for x
        //----------
        return true;
    }; // end function "tSimpleObject.Notation"
    //--------------------------------------------------
    tSimpleObject.prototype.Action = function () {
        var _name    = undefined;
        var _options = undefined;
        var _execute = undefined;
        //----------
        for (var x=0; x<3; x++) {
            var type = typeof(arguments[x]);
            if (type == 'string') {
                _name = arguments[x];
            } else if (type == 'object') {
                _options = arguments[x];
            } else if (type == 'function') {
                _execute  = arguments[x];
            } // end if
        } // end for
        //----------
        _name = _name || null;
        //----------
        if ((_execute || null) === null) {
            console.warn('У объекта "'+this.ID+'" при добавлении действия нет модуля!');
            // +++ Ошибка. Нет модуля действия!
            return;
        } // end if
        //----------
        this.actions_list.push(_execute);
        var action_id = this.actions_list.length;
        //----------
        var object_id = AZ.getID(this.ID);
        //----------
        _options = any2arr(_options, true);
        //----------
        for (var opx=0; opx<_options.length; opx++) {
            var optrec = _options[opx];
            //----------
            var verbs       = any2arr(optrec['глагол'], true);
            var locations   = any2arr(optrec['где'], true);
            //----------
            var data = [
                null,
                (optrec['А'] === undefined ? null: any2arr(optrec['А'], true)),
                (optrec['Б'] === undefined ? null: any2arr(optrec['Б'], true)),
                (optrec['В'] === undefined ? null: any2arr(optrec['В'], true)),
            ];
            //----------
            var verbs2pass = [];
            //----------
            for (var vx=0; vx<verbs.length; vx++) {
                var verb_id = null;
                //----------
                if (verbs[vx] != null) {
                    var word = DICTIONARY.getWord(verbs[vx]);
                    //----------
                    if (word === null) {
                        console.warn('У объекта "'+this.ID+'" в качестве глагола указано неизвестное слово: "'+verbs[vx]+'"!');
                        //DICTIONARY.dict_absend.push({'word': verb, 'morph': 'Г', 'object': this});
                        continue;
                    } // end if
                    //----------
                    verb_id = word.bid;
                } // end if
                //----------
                // Глагол могли уже обрабатывать, если автор указал несколько словоформ с одной основой.
                if (verbs2pass.indexOf(verb_id) >= 0) {continue;} // end if
                verbs2pass.push(verb_id);
                //----------
                for (var locx=0; locx<locations.length; locx++) {
                    var loc_id = AZ.getID(locations[locx], false);
                    //----------
                    var have_not_null = false;
                    //----------
                    // +++ Добавить проверку, чтобы объект не мог повторяться в полях А, Б и В. Должен быть в каком-то одном!
                    for (var priority=1; priority<=3; priority++) {
                        if (data[priority] !== null) {have_not_null = true; break;} // end if
                    } // end for priority
                    //----------
                    if (have_not_null == false) {
                        PARSER.add_link_to_object({'name':_name, 'enable':true, 'obj':object_id, 'priority':1, 'loc':loc_id, 'vid':verb_id, 'action':action_id});
                        continue;
                    } // end if
                    //----------
                    var rec_list = [];
                    //----------
                    var priority_all = null;
                    var priority_obj = null;
                    //var obj_priority_abs = false;
                    //----------
                    var rec_data = [];
                    //----------
                    for (var priority=1; priority<=3; priority++) {
                        var objdata = data[priority];
                        //----------
                        if (objdata === null) {continue;} // end if
                        //----------
                        var rec_elems = [];
                        //----------
                        for (var objx=0; objx<objdata.length; objx++) {
                            var rec = objdata[objx];
                            //----------
                            if (rec == null) {
                                rec_elems.push(null);
                                //----------
                                priority_all = priority;
                                
                            } else if (typeof(rec) == 'string') {
                                if (rec == ANYTHING) {
                                    rec_elems.push({'any':priority});
                                } else {
                                    var word = DICTIONARY.getWord(rec);
                                    //----------
                                    if (word === null) {
                                        console.warn('У объекта "'+this.ID+'" в качестве связки указано неизвестное слово: "'+rec+'"!');
                                        continue;
                                    } // end if
                                    //----------
                                    var e = {};
                                    e['wid'+priority] = word.bid;
                                    //e['fid'+priority] = word.fid; // Удаляем фиксацию формы слова. Это отличает данный способ заполнения слота от варианта с предлогами.
                                    rec_elems.push(e);
                                } // end if
                                //----------
                                priority_all = priority;
                                
                            } else if (typeof(rec) == 'object') {// end if
                                if (AZ.isObject(rec) === true) {
                                    //----------
                                    var rec_id = AZ.getID(rec);
                                    //----------
                                    var data_tmp = {};
                                    data_tmp['to'+priority] = rec_id;
                                    //----------
                                    rec_elems.push(data_tmp);
                                    //----------
                                    if (rec_id == object_id) {
                                        priority_obj = priority;
                                    } // end if
                                    
                                } else if (rec.length === undefined) {
                                    var preps_list = any2arr(rec['предлоги'], true);
                                    var words_list = any2arr(rec['слова'], true);
                                    //----------
                                    for (var p=0; p<preps_list.length; p++) {
                                        var prep = DICTIONARY.getWord(preps_list[p]);
                                        //----------
                                        if (prep === null) {
                                            console.warn('У объекта "'+this.ID+'" в качестве предлога указано неизвестное слово: "'+preps_list[p]+'"!');
                                            continue;
                                        } // end if
                                        //----------
                                        for (var w=0; w<words_list.length; w++) {
                                            var word = words_list[w];
                                            //----------
                                            if (typeof(word) == 'string') {
                                                var word = DICTIONARY.getWord(word);
                                                //----------
                                                if (word === null) {
                                                    console.warn('У объекта "'+this.ID+'" в качестве слова-отсылки указано неизвестное слово: "'+words_list[w]+'"!');
                                                    return;
                                                } // end if
                                                //----------
                                                var e = {};
                                                e['pid'+priority] = prep.bid;
                                                e['wid'+priority] = word.bid;
                                                e['fid'+priority] = word.fid;
                                                rec_elems.push(e);
                                                
                                            } else if (typeof(word) == 'object' && word != null) {
                                                if (AZ.isObject(word) == true) {
                                                    var e = {};
                                                    e['pid'+priority] = prep.bid;
                                                    e['to'+priority] = AZ.getID(word);
                                                    rec_elems.push(e);
                                                } // end if
                                            } // end if
                                            
                                        } // end for w
                                    } // end for p
                                    //----------
                                    priority_all = priority;
                                } // end if
                            }
                        } // end for objx
                        //----------
                        rec_data[priority]=rec_elems;
                    } // end for priority
                    //----------
                    function fill_elem (rec, data, key) {
                        //if (rec[key] === undefined) {
                            if (data == null) {
                                //rec[key] = null;
                            } else if (data[key] !== undefined) {
                                rec[key] = data[key];
                            } // end if
                        //} // end if
                    } // end function "fill_elem"
                    //----------
                    function fill_data (priority, data, rec) {
                        var elems_list = data[priority];
                        if (elems_list === undefined) {
                            if (priority < 3) {
                                fill_data(priority+1, data, rec);
                            } else {
                                PARSER.add_link_to_object(rec);
                            } // end if
                        } else {
                            for (var x=0; x<elems_list.length; x++) {
                                var elem = elems_list[x];
                                //----------
                                //if (priority == 1) {rec = {};} // end if
                                var rec2 = arr2arr(rec);
                                //----------
                                fill_elem(rec2, elem, 'to1');
                                fill_elem(rec2, elem, 'pid1');
                                fill_elem(rec2, elem, 'wid1');
                                fill_elem(rec2, elem, 'fid1');
                                //----------
                                fill_elem(rec2, elem, 'to2');
                                fill_elem(rec2, elem, 'pid2');
                                fill_elem(rec2, elem, 'wid2');
                                fill_elem(rec2, elem, 'fid2');
                                //----------
                                fill_elem(rec2, elem, 'to3');
                                fill_elem(rec2, elem, 'pid3');
                                fill_elem(rec2, elem, 'wid3');
                                fill_elem(rec2, elem, 'fid3');
                                //----------
                                fill_elem(rec2, elem, 'any');
                                //----------
                                if (priority < 3) {
                                    fill_data(priority+1, data, rec2);
                                } else {
                                    PARSER.add_link_to_object(rec2);
                                } // end if
                            } // end for x
                        }// end if
                    } // end function "fill_data"
                    //----------
                    fill_data(1, rec_data, {'name':_name, 'enable':true, 'obj':object_id, 'priority':(priority_obj !== null ? priority_obj : priority_all), 'loc':loc_id, 'vid':verb_id, 'action':action_id});
                    //----------
                } // end for locx
                //----------
            } // end for vx
        } // end for opx
        //----------
        return true;
    }; // end function tSimpleObject.prototype.Action
    //--------------------------------------------------
    tSimpleObject.prototype.DisableAction = function (_name) {
        PARSER.actionEnableDisable(this.ID, _name, false);
    }; // end function tSimpleObject.prototype.DisableAction
    //--------------------------------------------------
    tSimpleObject.prototype.ExecuteAction = function (_name, _params) {
        PARSER.executeAction(this.ID, _name, _params);
    }; // end function tSimpleObject.prototype.EnableAction
    //--------------------------------------------------
    tSimpleObject.prototype.EnableAction = function (_name) {
        PARSER.actionEnableDisable(this.ID, _name, true);
    }; // end function tSimpleObject.prototype.EnableAction
/* --------------------------------------------------------------------------- */
