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
        // Функция вызывается из методов REMOVE и MOVE объекта и предназачена для проверки параметра ОТКУДА. Он может быть незаполнен,
        // тогда нужно удалять объект отовсюду, а следовательно нужен перечень контейнеров.
        checkParamWhere: function (_what, _where) {
            //----------
            var result = null;
            //----------
            if ((_where || null) == null) {
                result = CONTAINERS.getWhere(_what);
            } else {
                result = [{'what':_what, 'where':_where}];
            } // end if
            //----------
            return result;
            //----------
        }, // end function "CONTAINERS.checkParamWhere"
        //--------------------------------------------------
        getContent: function (_where) {
            if ((_where || null) == null) {return [];} // end if
            //----------
            var result  = []; // Перечень результатов
            var list    = []; // Перечень уже добавленных объектов (чтобы пропускать нижние слои)
            //----------
            //db_arrangement({'where':_where, 'quantity':{'>':0}}).order('what asec, layer desc').each(function (rec) {
            db_arrangement({'where':_where}).order('what asec, layer desc').each(function (rec) {
                if (list.indexOf(rec.what) == -1) {
                    if (rec.quantity > 0) {
                        result.push({'what':rec.what, 'where':_where, 'quantity':rec.quantity});
                    } // end if
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
            //db_arrangement({'what':_what, 'quantity':{'>':0}}).order('where asec, layer desc').each(function (rec) {
            db_arrangement({'what':_what}).order('where asec, layer desc').each(function (rec) {
                if (list.indexOf(rec.where) == -1) {
                    if (rec.quantity > 0) {
                        result.push({'what':_what, 'where':rec.where, 'quantity':rec.quantity});
                    } // end if
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
tContainer.prototype.put = function(_where, _quantity) { // Containers
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
    // Запись для события "Перед удалением объекта"
    var event = {'when':EVENTS.BEFORE, 'what':this.OWNER, 'to':_where};
    //----------
    // Вызываем событие "Перед добавлением объекта"
    result = EVENTS.checkReactions(EVENTS.PUT, event);
    //----------
    // Если событие вернуло "Отбой", то пропускаем добавление
    if (result == false) {return false;} // end if
    //----------
    var how_many = CONTAINERS.get(this.OWNER, _where); // Получаем количество, сколько было
    //----------
    CONTAINERS.set(this.OWNER, _where, (how_many + _quantity)); // Устанавливаем новое количество
    //----------
    // Если помещаем куда-либо ГЕРОЯ игры, то меняем его локацию.
    if (this.OWNER == AZ.getProtagonist(true)) {AZ.moveProtagonist(_where);} // end if
    //----------
    event['when'] = EVENTS.AFTER; // Дополняем запись для события "ПОСЛЕ добавления объекта"
    //----------
    EVENTS.checkReactions(EVENTS.PUT, event); // Вызываем событие "ПОСЛЕ добавления объекта"
    //----------
    return true;
}; // end function "tContainer.put"
//--------------------------------------------------
tContainer.prototype.remove = function(_where, _quantity) { // Containers
    //----------
    if (typeof(_where) == 'number') {
        _quantity   = _where;
        _where      = null;
    } else if (_where === undefined) {
        _where = null;
    } // end if
    //----------
    var remove_all = (_quantity === undefined ? true : false);
    //----------
    from_list = CONTAINERS.checkParamWhere(this.OWNER, AZ.getID(_where)); // Список объектов, откуда нужно удалить объект
    //----------
    var counter = from_list.length; // Счётчик необходимых удалений
    //----------
    event = {'what':this.OWNER}; // Запись для события "Перед удалением объекта"
    //----------
    for (var x=0; x<from_list.length; x++) {
        //----------
        // Дополняем запись для события "ПЕРЕД удалением объекта"
        event['when'] = EVENTS.BEFORE;
        event['from'] = from_list[x].where;
        //----------
        // Вызываем событие "Перед удалением объекта"
        var result = EVENTS.checkReactions(EVENTS.REMOVE, event);
        //----------
        // Если событие вернуло "Отбой", то пропускаем удаление
        if (result == false) {continue;} // end if
        //----------
        CONTAINERS.remove(this.OWNER, from_list[x].where, _quantity, remove_all);
        //----------
        // Если убираем откуда-либо ГЕРОЯ игры, то очищаем его локацию.
        if (this.OWNER == AZ.getProtagonist(true)) {AZ.setLocation(null);} // end if
        //----------
        // Дополняем запись для события "ПОСЛЕ удаления объекта"
        event['when'] = EVENTS.AFTER;
        //----------
        // Вызываем событие "ПОСЛЕ удаления объекта"
        EVENTS.checkReactions(EVENTS.REMOVE, event);
        //----------
        counter--;
        //----------
    } // end for x
    //----------
    if (from_list.length == 0) {
        return false;
    } else {
        // Если хоть одно удаление не прошло, то возвращаем FALSE, иначе TRUE
        return (counter == 0 ? true : false);
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
    } // end if
    //----------
    if (object_to == null) {
        console.error('Не указано содержимое, куда нужно перемещать объект "'+this.OWNER+'"!');
        return false;
    } // end if
    //----------
    var remove_all = (_quantity === undefined ? true : false);
    //----------
    var from_list = CONTAINERS.checkParamWhere(this.OWNER, object_from); // Список объектов, откуда нужно переместить объект
    //----------
    var success = null; // Было ли хоть одно успешное удаление
    //----------
    var event = {'what':this.OWNER, 'to':object_to}; // Запись для события "ПЕРЕД перемещением объекта"
    //----------
    var list4put = []; // Список контейнеров, откуда удалялся объект, для события "ПОСЛЕ перемещения объекта"
    //----------
    for (var x=0; x<from_list.length; x++) {
        //----------
        var where = from_list[x].where;
        //----------
        // Дополняем запись для события "ПЕРЕД перемешением объекта"
        event['when'] = EVENTS.BEFORE;
        event['from'] = where;
        //----------
        // Вызываем событие "Перед перемещением объекта"
        var result = EVENTS.checkReactions(EVENTS.MOVE, event);
        //----------
        // Если событие вернуло "Отбой", то пропускаем перемещение
        if (result == false) {
            // Отмечаем неудачу, только если нет удачных вариантов.
            if (success == null) {success = false;} // end if
            //----------
            continue;
        } // end if
        //----------
        CONTAINERS.remove(this.OWNER, where, _quantity, remove_all);
        //----------
        list4put.push(where);
        //----------
        success = true;
        //----------
    } // end for x
    //----------
    if (success == false) {return false;} // end if
    //----------
    // ??? Нужно ли вызывать какое-либо событие после удаления перемещаемого объекта, но до его добавления?
    //----------
    _quantity = _quantity || 1;
    //----------
    var how_many = CONTAINERS.get(this.OWNER, object_to); // Получаем количество, сколько было
    //----------
    CONTAINERS.set(this.OWNER, object_to, (how_many+_quantity)); // Устанавливаем новое количество
    //----------
    // Если помещаем куда-либо ГЕРОЯ игры, то меняем его локацию.
    if (this.OWNER == AZ.getProtagonist(true)) {AZ.moveProtagonist(object_to);} // end if
    //----------
    // Дополняем запись для события "ПОСЛЕ добавления объекта"
    event['when'] = EVENTS.AFTER;
    event['from'] = list4put;
    //----------
    EVENTS.checkReactions(EVENTS.MOVE, event); // Вызываем событие "ПОСЛЕ добавления объекта"
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
