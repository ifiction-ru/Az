"use strict";
/* --------------------------------------------------------------------------- */
// Общий игровой объект
window.AZ = (function() {
    // Параметры Слой сохранения данных. Используется для реализации возможности сохранения.
        //  0 - Заполнение при инициализации.
        //  1 - Переназначение в процессе игры.
        //  2 - Переназначение в процессе последнего хода.
    //----------
    var protagonist = {object:null, ID:null}; // Текущий персонаж
    var position    = {object:null, ID:null}; // Текущее местоположение (персонажа)
    //----------
    var available_objects       = [];
    var available_objects_IDs   = [];
    //----------
    var objects_list = {}; // Ассоциативный массив для хранения ссылок на объекты игры по их строковому ID.
    //--------------------------------------------------
    // Инициализация параметров, которые должны сохраняться в игровой сессии:
    setProperty('turns.all', 0);
    setProperty('turns.loc', 0);
    //--------------------------------------------------
    function updateAvailableObjects () {
        var objects1 = position.object.container.getContent();
        var objects2 = protagonist.object.container.getContent();
        //----------
        var objects=objects1.concat(objects2);
        //----------
        objects.unshift({'what': protagonist.object, 'where': position.object, 'quanity':1});
        objects.unshift({'what': position.object, 'where': position.object, 'quanity':1});
        //----------
        // +++ Известные игроку контейнеры в инвентаре и локации
        //----------
        available_objects       = [];
        available_objects_IDs   = [];
        //----------
        for (var x=0; x<objects.length; x++) {
            var object = AZ.getObject(objects[x].what);
            //----------
            available_objects.push(object);
            available_objects_IDs.push(AZ.getID(object));
        } // end for x
        //----------
        var arr = protagonist.object.what_he_exam.now;
        for (var x=0; x<arr.length; x++) {
            var container    = AZ.getObject(arr[x]);
            var container_id = AZ.getObject(arr[x]);
            //----------
            if (AZ.getID(container_id) == position.ID) {continue;} // end if
            //----------
            var content = container.getContent();
            //----------
            for (var y=0; y<content.length; y++) {
                var object = content[y].what;
                var id     = AZ.getID(object);
                //----------
                if (available_objects_IDs.indexOf(id) == -1) {
                    available_objects.push(object);
                    available_objects_IDs.push(id);
                } // end if
            } // end for
        } // end for x
        //----------
    }; // end function "AZ.get_available_objects"
    //--------------------------------------------------
    return {
        //--------------------------------------------------
        // РАБОТА С БАЗОВЫМИ ОБЪЕКТАМИ
            //--------------------------------------------------
            // Добавляем объект в "objects_list", чтобы можно было всегда получить по строковому ID сам объект.
            addObject: function(_id, _object) {
                _id = _id.trim().toUpperCase();
                //----------
                if (objects_list[_id] !== undefined) {
                    console.error('Объект с ID "'+_id+'" уже есть в базе!');
                    return null;
                } // end if
                //----------
                objects_list[_id] = _object;
                //----------
                return _id;
            }, // end function "AZ.addObject"
            //--------------------------------------------------
            getObject: function(_id, _error) {
                _id = _id || null;
                //----------
                if (_error === undefined) {_error = false;} // end if
                //----------
                var object = null;
                //----------
                if (_id !== null) {
                    if (typeof(_id) == 'string') {
                        object = objects_list[_id.trim().toUpperCase()];
                    } else if (this.isObject(_id) == true) {
                        object = _id;
                    } // end if
                } // end if
                //----------
                if (object === null && _error == true) {
                    console.error('Объект с ID "'+_id+'" не найден!');
                } // end if
                //----------
                return object;
            }, // end function "AZ.getObject"
            //--------------------------------------------------
            getID: function(_object, _error) {
                if (_error === undefined) {_error = false;} // end if
                //----------
                var object = _object || null;
                //----------
                if (object != null) {
                    if (typeof(object) == 'string') {
                        object = objects_list[_object.trim().toUpperCase()];
                    } else if (this.isObject(object) == false) {
                        object = null;
                    } // end if
                } // end if
                //----------
                if (object != null) {
                    return object.ID;
                } else {
                    if (_error ==  true) {console.error('Объект с "'+_object+'" не найден!');} // end if
                    return null;
                } // end if
                //----------
            }, // end function "AZ.getID"
            //--------------------------------------------------
            isObject: function(_object) {
                if (typeof(_object) == 'string') {
                    _object = this.getObject(_object);
                } else if (_object.isObject !== true) {
                    _object = null;
                } // end if
                //----------
                return (_object == null) ? false : true;
            }, // end function "AZ.addObject"
            //--------------------------------------------------
            isEqual: function(_obj1, _obj2) {
                var id1 = this.getID(_obj1);
                return (id1 != null && id1 == this.getID(_obj2)) ? true : false;
            }, // end function "AZ.addObject"
            //--------------------------------------------------
            isAvailable: function(_object) {
                var id = this.getID(_object);
                //----------
                if (id == null) {return false;} // end if
                //----------
                return available_objects_IDs.indexOf(id) == -1 ? false : true;
            }, // end function "AZ.addObject"
        //--------------------------------------------------
        // РАБОТА С ОБЪЕКТАМИ ИГРЫ
            //--------------------------------------------------
            setProtagonist: function(_character) {
                if ((_character || null) == null) {
                    console.error('Передан пустой персонаж!');
                } else {
                    protagonist.object  = AZ.getObject(_character);
                    protagonist.ID      = AZ.getID(protagonist.object);
                    //----------
                    var loc = protagonist.object.container.where();
                    //----------
                    if (loc != null) {this.setLocation(loc);} // end if
                }// end if
            }, // end function "AZ.setProtagonist"
            //--------------------------------------------------
            getProtagonist: function(_as_id) {
                _as_id = _as_id || false;
                //----------
                return protagonist.object == null ? null : (_as_id == false ? protagonist.object : protagonist.ID);
            }, // end function "AZ.getProtagonist"
            //--------------------------------------------------
            moveProtagonist: function(_location) {
                this.setLocation(_location);
                //----------
                setProperty('turns.loc', 0);
            }, // end function "AZ.getProtagonist"
            //--------------------------------------------------
            setLocation: function(_location) {
                var loc = AZ.getObject(_location);
                //----------
                if (loc == null) {
                    position.object = null;
                    position.ID     = null;
                } else {
                    position.object = loc;
                    position.ID     = AZ.getID(loc);
                } // end if
            }, // end function "AZ.setProtagonist"
            //--------------------------------------------------
            getLocation: function(_as_id) {
                _as_id = _as_id || false;
                //----------
                return position.object == null ? null : (_as_id == false ? position.object : position.ID);
            }, // end function "AZ.getLocation"
            //--------------------------------------------------
            startNewTurn: function() {
                AUTOCOMPLETE.init();
                //----------
                updateAvailableObjects();
                //----------
                if (DEBUG.isEnable() == true) {
                    DEBUG.updatePanelForObjects();
                } // end if
                //----------
                // ...
                //----------
                // Данная команда должна идти в самом конце, чтобы все изменения (по событиям, например), происходили на предыдущем слое.
                LAYERS.add();
            }, // end function "AZ.startNewTurn"
        //--------------------------------------------------
        available_objects: function (_only_id) {
            return ((_only_id || false) == false) ? available_objects.slice() : available_objects_IDs.slice();
        }, // end function "AZ.available_objects"
        /* --------------------------------------------------------------------------- */
    };
})(); // end object "AZ"
/* --------------------------------------------------------------------------- */
window.START = function (_param) {
    var character = AZ.getProtagonist() || null;
    //----------
    if (character == null) {
        console.error('Не задан текущий персонаж игры!');
        return;
    } // end if
    //----------
    if (AZ.getLocation() == null) {
        console.error('Не задано местонахождение текущего персонажа игры!');
        return;
    } // end if
    //----------
    AZ.startNewTurn();
    //----------
    var loc = AZ.getLocation();
    //----------
    SCREEN.Out(loc.getTitle(null, true) + loc.getDescription());
    //----------
    INTERFACE.preparsing({value:''});
    //----------
    LAYERS.add();
}; // end function "START"
/* --------------------------------------------------------------------------- */
