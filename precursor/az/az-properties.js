/* --------------------------------------------------------------------------- */
window.PROPERTIES = (function() {
    /* --------------------------------------------------------------------------- */
    /* Формат базы данных "db_values":
        layer   Номер слоя данных
        simple  Признак свойства: false — свойство объекта "Объект.Имя", true — произвольное свойство "getProperty"
        object  Уникальный идентификатор объекта
        name    Имя свойства
        value   Значение свойства */
    var db_values = TAFFY(); // База данных для хранения данных
    //--------------------------------------------------
    LAYERS.addHandler('move', {'db':db_values, 'sort':'object asec, name asec, simple asec', 'filter':['object', 'name', 'simple']});
    //--------------------------------------------------
    return {
        //--------------------------------------------------
        create: function(_name, _value) {
            PROPERTIES.set(false, AZ.getID(this), _name, _value);
            //----------
            Object.defineProperty(this, _name, {
                set: function(_value) {
                    //----------
                    // +++ При записи свойства объекта
                    //----------
                    PROPERTIES.set(false, AZ.getID(this), _name, _value);
                },
                get: function() {
                    var value = PROPERTIES.get(false, AZ.getID(this), _name);
                    //----------
                    // Вызываем событие "При получении свойства объекта"
                    var result = EVENTS.checkReactions(EVENTS.PROPERTY, {'what':this, 'property':_name}, {'parameter': value} );
                    if (result !== undefined) {value = result} // end if
                    //----------
                    return value;
                }
            });
            //----------
        }, // end function "PROPERTIES.create"
        //--------------------------------------------------
        set: function (_simple, _object, _name, _value) {
            if (_value === undefined) {_value = null;} // end if
            //----------
            LAYERS.set(db_values, {'simple':_simple, 'object':_object, 'name':_name}, {'value':_value});
            //----------
        }, // end function "PROPERTIES.set"
        //--------------------------------------------------
        get: function (_simple, _object, _name) {
            //----------
            return LAYERS.get(db_values, {'simple':_simple, 'object':_object, 'name':_name}, 'value', undefined);
            //----------
        }, // end function "PROPERTIES.get"
        //--------------------------------------------------
        checkARGS: function (_options, _op, _defvalue) {
            var result = {object:null, name:undefined, value:undefined};
            //----------
            if (_options.length == 3) {
                //----------
                result.object = _options[0];
                if (result.object != null && AZ.isObject(result.object) == true) {
                    result.object = AZ.getID(result.object);
                } // end if
                //----------
                result.name  = _options[1];
                //----------
                result.value = _options[2];
                
            } else if (_options.length == 2) {
                if (_op == 'set') {
                    result.name  = _options[0];
                    result.value = _options[1];
                } else {
                    result.object = _options[0];
                    if (result.object != null && AZ.isObject(result.object) == true) {
                        result.object = AZ.getID(result.object);
                    } // end if
                    //----------
                    result.name = _options[1];
                } // end if
            } else {
                result.name = _options[0];
            } // end if
            //----------
            if (result.name === undefined) {
                console.error('Ошибка при передаче параметов записи свойства: '+arguments);
                return null;
            } // end if
            //----------
            if (result.value === undefined && _defvalue !== undefined) {
                result.value = _defvalue;
            } // end if
            //----------
            return result;
        }, // end function "PROPERTIES.checkARGS"
        //--------------------------------------------------
    };
})(); // end object "PROPERTIES"
/* --------------------------------------------------------------------------- */
// Присваивание значения "свободному" свойству. Свойство может быть привязано к объекту.
window.setProperty = function () {
    var params = PROPERTIES.checkARGS(arguments, 'set', null);
    //----------
    if (params == null) {return;} // end if
    //----------
    PROPERTIES.set(true, params.object, params.name, params.value);
}; // end function "setProperty"
/* --------------------------------------------------------------------------- */
window.incProperty = function () {
    var params = PROPERTIES.checkARGS(arguments, 'get', 1);
    //----------
    if (params == null) {return;} // end if
    //----------
    PROPERTIES.set(true, params.object, params.name, PROPERTIES.get(true, params.object, params.name) + params.value);
}; // end function "incProperty"
/* --------------------------------------------------------------------------- */
window.decProperty = function () {
    var params = PROPERTIES.checkARGS(arguments, 'get', 1);
    //----------
    if (params == null) {return;} // end if
    //----------
    PROPERTIES.set(true, params.object, params.name, PROPERTIES.get(true, params.object, params.name) - params.value);
}; // end function "decProperty"
/* --------------------------------------------------------------------------- */
window.getProperty = function () {
    var params = PROPERTIES.checkARGS(arguments, 'get', null);
    //----------
    if (params == null) {return;} // end if
    //----------
    var value = PROPERTIES.get(true, params.object, params.name);
    if (value === undefined && params.value !== undefined) {
        value = params.value;
    } // end if
    //----------
    return value;
}; // end function "getProperty"
/* --------------------------------------------------------------------------- */
