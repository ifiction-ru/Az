/* --------------------------------------------------------------------------- */
// Объект, содержащий базу данных местоположения и базовые методы работы с ней.
window.CONTAINERS = (function() {
    /* --------------------------------------------------------------------------- */
    /* Формат базы данных "db_arrangement":
        layer       Номер слоя данных
        what        Уникальный идентификатор объекта (что)
        where       Уникальный идентификатор объекта-содержимого (где)
        quantity    Количество (сколько) */
    var db_arrangement = TAFFY();
    //--------------------------------------------------
    LAYERS.addHandler('move',{'db':db_arrangement, 'sort':'what asec, where asec', 'filter':['what', 'where']});
    /* --------------------------------------------------------------------------- */
    return {
        //--------------------------------------------------
        // Записываем в БД данные СКОЛЬКО ЧЕГО ГДЕ
        set: function (_what, _where, _quantity) {
            //----------
            LAYERS.set(db_arrangement, {'what':_what, 'where':_where}, {'quantity':_quantity});
            //----------
            return true;
        }, // end function "CONTAINERS.put"
        //--------------------------------------------------
        // Получаем из БД данные СКОЛЬКО ЧЕГО ГДЕ
        get: function (_what, _where) {
            //----------
            return LAYERS.get(db_arrangement, {'what':_what, 'where':_where}, 'quantity', 0);
            //----------
        }, // end function "CONTAINERS.put"
        //--------------------------------------------------
        remove: function (_what, _where, _quantity, _remove_all) {
            //if (_what == null || _where == null) {return false;} // end if
            //----------
            // Обрабатываем параметр "Удалить всё"
            _remove_all = _remove_all || false;
            //----------
            if (_quantity === undefined) {_remove_all = true;} // end if
            //----------
            if (_remove_all == true) {
                this.set(_what, _where, 0);
                
            } else {
                var how_many = this.get(_what, _where);
                //----------
                this.set(_what, _where, Math.max(0, how_many - _quantity));
            } // end if
            //----------
            return true;
        }, // end function "CONTAINERS.remove"
        //--------------------------------------------------
        getContent: function (_where) {
            if ((_where || null) == null) {return [];} // end if
            //----------
            var result  = []; // Перечень результатов
            var list    = []; // Перечень уже добавленных объектов (чтобы пропускать нижние слои)
            //----------
            db_arrangement({'where':_where, 'quantity':{'>':0}}).order('what asec, layer desc').each(function (rec) {
                if (list.indexOf(rec.what) == -1) {
                    result.push({'what':rec.what, 'where':_where, 'quantity':rec.quantity});
                    list.push(rec.what);
                } // end if
            }); // end query
            //----------
            return result;
        }, // end function "CONTAINERS.get_content"
        //--------------------------------------------------
        getWhere: function(_what) {
            if ((_what || null) == null) {return [];} // end if
            //----------
            var result  = []; // Перечень результатов
            var list    = []; // Перечень уже добавленных объектов (чтобы пропускать нижние слои)
            //----------
            db_arrangement({'what':_what, 'quantity':{'>':0}}).order('where asec, layer desc').each(function (rec) {
                if (list.indexOf(rec.where) == -1) {
                    result.push({'what':_what, 'where':rec.where, 'quantity':rec.quantity});
                    list.push(rec.where);
                } // end if
            }); // end query
            //----------
            return result;
        }, // end function "CONTAINERS.get_where"
    };
    //--------------------------------------------------
})(); // end object "CONTAINERS"
/* --------------------------------------------------------------------------- */
window.tContainer = function (_object) {
    var OWNER = AZ.getID(_object); // Объект-владелец модуля контейнеров. Сразу запоминаем ID, потому как сам объект особо и не нужен.
    //----------
    Object.defineProperty(this, 'OWNER', {configurable:false, writable:false, value:OWNER});
    //--------------------------------------------------
} // end class "tContainer"
/* --------------------------------------------------------------------------- */
tContainer.prototype.put = function(_where, _quantity, _events) { // Containers
    //_events = _from || null; // Данный реквизит нужен для генерации события
    //----------
    // Приводим переданный объект к однозначному значению, содержащему идентификатор
    _where = AZ.getID(_where);
    //----------
    if (_where == null) {
        console.error('Не указан объект для помещения в контейнер!');
        return false;
    } // end if
    //----------
    _quantity = _quantity || 1;
    //----------
    // +++ Событие "Перед помещением объекта куда-либо"
    if (_events === undefined) {
        _events = [{'event':EVENT_PUT, 'when':BEFORE, 'what':[this.OWNER, null], 'to':[_where, null]}];
        //----------
        var result = true;
        //----------
        result = EVENTS.checkReactions(_events[0]);
        //----------
        // Если реакция на событие "ПЕРЕД ПОМЕЩЕНИЕМ ОБЪЕКТА КУДА-ЛИБО" возвратило FALSE, то отбой
        if (result = false) {return false;} // end if
    } // end if
    //----------
    var how_many = CONTAINERS.get(this.OWNER, _where);
    //----------
    CONTAINERS.set(this.OWNER, _where, (how_many + _quantity));
    //----------
    if (this.OWNER == AZ.getProtagonist(true)) {AZ.setLocation(_where);} // end if
    //----------
    // +++ Событие "После помещения объекта куда-либо"
    for (var x=0; x<_events.length; x++) {
        var event = _events[x];
        //----------
        event['when'] = AFTER;
        //----------
        EVENTS.checkReactions(event);
    } // end for x
    //----------
    return true;
}; // end function "tContainer.put"
//--------------------------------------------------
tContainer.prototype.remove = function(_where, _quantity, _events) { // Containers
    //----------
    _where  = _where || null;
    //----------
    if (typeof(_where) == 'number') {
        _quantity   = _where;
        _where      = null;
    } // end if
    //----------
    var remove_all = (_quantity === undefined ? true : false);
    //----------
    // Список объектов, откуда нужно удалить переданный объект
    var remove_list = [];
    //----------
    var event = null;
    if (_events === undefined) {
        event = {'event':EVENT_REMOVE, 'what':[this.OWNER, null]};
    } else {
        event = _events;
    } // end if
    //----------
    var events_list = []; // Перечень событий для последующей передачи далее по процессу "Переместить"
    //----------
    // Определяемся, откуда убирать объект:
        // Если параметр "откуда перемещать" не заполнен, то убираем объект отовсюду
        if (_where == null) {
            remove_list = CONTAINERS.getWhere(this.OWNER);
        
        } else {
            _where = AZ.getID(_where);
            //----------
            if (_where == null) {return false;} // end if
            //----------
            //remove_list.push({'what':this.OWNER, 'where':_where, 'quantity':CONTAINERS.get(this.OWNER, _where)});
            remove_list.push({'what':this.OWNER, 'where':_where}); // Параметр 'quantity' в данном случае не нужен.
            
        } // end if
    //----------
    var counter = remove_list.length;
    //----------
    for (var x=0; x<remove_list.length; x++) {
        //----------
        // +++ Событие "Перед удалением объекта откуда-либо"
        event['when'] = BEFORE;
        event['from'] = [remove_list[x].where, null];
        //----------
        if (event['event'] == EVENT_MOVE) {
            events_list.push(event);
        } // end if
        //----------
        var result = EVENTS.checkReactions(event);
        //----------
        if (result == false) {continue;} // end if
        //----------
        CONTAINERS.remove(this.OWNER, remove_list[x].where, _quantity, remove_all);
        counter--;
        //----------
        // +++ Событие "После удаления объекта откуда-либо"
        if (event['event'] == EVENT_REMOVE) {
            event['when'] = AFTER;
            //----------
            EVENTS.checkReactions(event);
        } // end if
        //----------
    } // end for x
    //----------
    //return (remove_list.length == 0 ? null : (remove_list.length ==1 ? remove_list[0] : remove_list));
    if (remove_list.length == 0) {
        return false;
    } else {
        return (counter == 0 ? events_list: false);
    } // end if
    //----------
}; // end function "tContainer.remove"
//--------------------------------------------------
tContainer.prototype.move = function(_from, _to, _quantity) { // Containers
    if (arguments.length == 1 || typeof(_to) == 'number') {
        var object_from = null;
        var object_to   = AZ.getID(_from);
        var quantity    = _to;
    } else {
        var object_from = AZ.getID(_from);
        var object_to   = AZ.getID(_to);
        var quantity    = _quantity;
        //----------
        if (object_from == null) {
            console.error('Некорректно указано содержимое ("'+_from+'"), откуда нужно перемещать объект "'+this.OWNER+'"!');
            return false;
        } // end if
    }
    //----------
    if (object_to == null) {
        console.error('Не указано содержимое, куда нужно перемещать объект "'+this.OWNER+'"!');
        return false;
    } // end if
    //----------
    var result  = true;
    //----------
    // +++ Событие "Перед перемещением объекта откуда-либо куда-либо"
    //----------
    var events = this.remove(object_from, quantity, {'event':EVENT_MOVE, 'what':[this.OWNER, null], 'to':[object_to, null]});
    //----------
    if (events == false) {return false;} // end if
    //----------
    this.put(object_to, quantity, events);
    //----------
    // +++ Событие "После перемещения объекта откуда-либо куда-либо"
    //----------
    return true;
}; // end function "tContainer.move"
//--------------------------------------------------
tContainer.prototype.where = function(_as_array) {
    _as_array = _as_array || false;
    //----------
    var where_list = CONTAINERS.getWhere(this.OWNER);
    //----------
    // +++ Событие "При получении информации о местонахождении объекта"
    //----------
    if (where_list.length == 0) {
        return (_as_array === true) ? [] : null;
        
    } else {
        for (var x=0; x<where_list.length; x++) {
            where_list[x].what  = AZ.getObject(where_list[x].what);
            where_list[x].where = AZ.getObject(where_list[x].where);
        }
        return (_as_array === true) ? where_list : where_list[0].where;
        
    } // end if
}; // end function "tContainer.where"
//--------------------------------------------------
tContainer.prototype.isThere = function(_where) {
    var object_where = AZ.getID(_where);
    //----------
    if (object_where == null) {return false;} // end if
    //----------
    var result = (CONTAINERS.get(this.OWNER, object_where) > 0) ? true : false;
    //----------
    // +++ Событие "При проверке наличия объекта в переданном местонахождении"
    //----------
    return result;
}; // end function "tContainer.is_there"
//--------------------------------------------------
tContainer.prototype.includes = function(_what) {
    var object_what = AZ.getID(_what);
    //----------
    if (object_what == null) {return false;} // end if
    //----------
    var result = (CONTAINERS.get(object_what, this.OWNER) > 0) ? true : false;
    //----------
    // +++ Событие "При проверке нахождения переданного объекта"
    //----------
    return result;
}; // end function "tContainer.includes"
//--------------------------------------------------
tContainer.prototype.getContent = function(_ids_only) {
    _ids_only = _ids_only || false;
    //----------
    var result = [];
    //----------
    var content = CONTAINERS.getContent(this.OWNER);
    //----------
    var hero_id = AZ.getProtagonist(true);
    //----------
    for (var x=0; x<content.length; x++) {
        if (hero_id == null) {continue;} // end if
        //----------
        // Персонажа игрока в перечень не включаем никогда
        if (hero_id == content[x].what) {continue;} // end if
        //----------
        if (_ids_only == false) {
            content[x].what     = AZ.getObject(content[x].what);
            content[x].where    = AZ.getObject(content[x].where);
        } // end if
        //----------
        result.push(content[x]);
    }
    //----------
    return result;
    //----------
}; // end function "tContainer.get_content"
/* --------------------------------------------------------------------------- */
