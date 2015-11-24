"use strict";
/* --------------------------------------------------------------------------- */
// Общий игровой объект
window.AZ = (function() {
    // Параметры Слой сохранения данных. Используется для реализации возможности сохранения.
        //  0 - Заполнение при инициализации.
        //  1 - Переназначение в процессе игры.
        //  2 - Переназначение в процессе последнего хода.
    //----------
    var silence     = false;
    //----------
    var protagonist = {object:null, ID:null}; // Текущий персонаж
    var position    = {object:null, ID:null}; // Текущее местоположение (персонажа)
    //----------
    var available_objects = {full:[], full_IDs:[], limited:[], limited_IDs:[]};
    //----------
    var objects_list = {}; // Ассоциативный массив для хранения ссылок на объекты игры по их строковому ID.
    //----------
    var toDoOnStart         = null; // С чего начать игру +++ Переделать на внутреннее свойство.
    var executeAfterStart   = null;
    //----------
    var outputLayers = [];   // Перечень слоёв "с чем имеет дело игрок", для переключения парсера, области видимости объектов и т.п.
    //--------------------------------------------------
    // Инициализация параметров, которые должны сохраняться в игровой сессии:
    setProperty('turns.all', 0);
    setProperty('turns.loc', 0);
    //--------------------------------------------------
    function updateAvailableObjects () {
        // Очищаем перечень доступных объектов
        available_objects = {full:[], full_IDs:[], limited:[], limited_IDs:[]};
        //----------
        if (outputLayers.length == 0) {
            // Добавляем в перечень доступных объектов содержимое локации
            // ??? Может, стоит это делатьтолько после того, как игрок посмотрел инвентарь?
            var objects1 = position.object.container.getContent();
            //----------
            // Добавляем в перечень доступных объектов содержимое инвентаря
            var objects2 = []; //protagonist.object.container.getContent();
            //----------
            var objects=objects1.concat(objects2);
            //----------
            // Добавляем в перечень доступных объектов персонажа игрока
            objects.unshift({'what': protagonist.object, 'where': position.object, 'quantity':1});
            //----------
            // Добавляем в перечень доступных объектов текущую локацию
            objects.unshift({'what': position.object, 'where': position.object, 'quantity':1});
            //----------
            // +++ Известные игроку контейнеры в инвентаре и локации
            //----------
            for (var x=0; x<objects.length; x++) {
                var object = AZ.getObject(objects[x].what);
                //----------
                available_objects.full.push(object);
                available_objects.full_IDs.push(AZ.getID(object));
            } // end for x
            //----------
            var arr = protagonist.object.what_he_exam.now;
            for (var x=0; x<arr.length; x++) {
                var container    = AZ.getObject(arr[x]);
                var container_id = container.ID;
                //----------
                if (container.ID == position.ID) {continue;} // end if
                //----------
                var content = container.getContent();
                //----------
                for (var y=0; y<content.length; y++) {
                    var object = content[y].what;
                    var id     = AZ.getID(object);
                    //----------
                    if (available_objects.full_IDs.indexOf(id) == -1) {
                        available_objects.full.push(object);
                        available_objects.full_IDs.push(id);
                    } // end if
                } // end for
            } // end for x
            //----------
            var arr = PARSER.get_objects_by_loc_and_actions(position.ID);
            for (var x=0; x<arr.length; x++) {
                var object = AZ.getObject(arr[x]);
                //----------
                if (object.type != 'location' && object.Where() == null) {continue;} // end if
                //----------
                if (available_objects.full_IDs.indexOf(arr[x]) == -1) {
                    available_objects.full.push(object);
                    available_objects.full_IDs.push(arr[x]);
                    //----------
                    if (available_objects.limited_IDs.indexOf(arr[x]) == -1) {
                        available_objects.limited.push(object);
                        available_objects.limited_IDs.push(arr[x]);
                    } // end if
                } // end if
            } // end for x
        } else {
            var object = outputLayers[outputLayers.length - 1];
            available_objects.full.push(object);
            available_objects.full_IDs.push(AZ.getID(object));
        } // end if
        //----------
        if (DEBUG.isEnable() == true) {
            DEBUG.updatePanelForObjects();
        } // end if
        //----------
    } // end function "AZ.get_available_objects"
    //--------------------------------------------------
    return {
        //--------------------------------------------------
        outputLayers: outputLayers,
        //----------
        toDoOnStart:       toDoOnStart,
        executeAfterStart: executeAfterStart,
        updateAvailableObjects: updateAvailableObjects,
        //----------
        silence: silence,
        //--------------------------------------------------
        getSessionID: function () {
            if (document.location.hostname != 'games.ifiction.ru') {
                window.AZGameSessionID = 'test';
                return;
            }
            //----------
            var req = new XMLHttpRequest();
            //----------
            req.onreadystatechange = function() {
                if (req.readyState == 4) { 
                    if (req.status == 200) {
                        window.AZGameSessionID = req.responseText;
                        //----------
                        STORAGE.setSessionID(window.AZGameSessionID); // Устанавливаем в хранилище новый ID сессии
                        STORAGE.clearCommands(); // Очищаем в хранлище историю команд
                    }
                }
            }
            //----------
            req.open('GET','gamelogs.php?a=getID', true);
            //----------
            req.send(null);
        }, // end function "AZ.getSessionID"
        //--------------------------------------------------
        canContinue: function () {
            return (STORAGE.getSessionID() == null ? false : true);
        },
        //--------------------------------------------------
        startNewGame: function () {
            window.AZGameSessionID = null;
            //----------
            AZ.getSessionID(); // Получаем ID сессии с сервера
            //----------
        },
        //--------------------------------------------------
        continueGame: function () {
            window.AZGameSessionID = STORAGE.getSessionID();
            //----------
            if (AZGameSessionID == null) {
                startNewGame();
            } else {
                var list = STORAGE.getCommands();
                for (var x=0; x<list.length; x++) {
                    var command = list[x];
                    AZ.executeCommand(command, false);
                } // end for
                INTERFACE.clearSuggestions();
                PARSER.pre_parse();
                INTERFACE.autocomplete();
            } // end if
        },
        //--------------------------------------------------
        saveActionToLog: function (command, result) {
            if (result == true) {STORAGE.addCommand(command);} // end if
            //----------
            if (document.location.hostname != 'games.ifiction.ru') {return;}
            //----------
            if  (window.AZGameSessionID == '') {return;}
            //----------
            var req = new XMLHttpRequest();
            //----------
            req.open('GET','gamelogs.php?a=add&s='+window.AZGameSessionID+'&r='+(result==true?'t':'f')+'&c='+command, true);
            //----------
            req.send(null);
        },
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
            /*getObjectType: function(_id, _error) {
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
                return object.type;
            }, // end function "AZ.getObject" */
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
                return available_objects.full_IDs.indexOf(id) == -1 ? false : true;
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
                window.ЛОКАЦИЯ = position.object;
                //----------
            }, // end function "AZ.setProtagonist"
            //--------------------------------------------------
            getLocation: function(_as_id) {
                _as_id = _as_id || false;
                //----------
                return position.object == null ? null : (_as_id == false ? position.object : position.ID);
            }, // end function "AZ.getLocation"
        //--------------------------------------------------
        layerType: function() {
            return (outputLayers.length == 0) ? 'other' : 'text';
        }, // end function "AZ.layerType"
        //--------------------------------------------------
        // Функция вызывается перед передачей управления игроку
        startNewTurn: function() {
            AUTOCOMPLETE.init();
            //----------
            updateAvailableObjects();
            //----------
            // +++ Переделать на анализ слоёв
            if (outputLayers.length == 0) {
                INTERFACE.updateCommandPanel('other');
            } else {
                INTERFACE.updateCommandPanel('text');
            } // end if
            //----------
            // Данная команда должна идти в самом конце, чтобы все изменения (по событиям, например), происходили на предыдущем слое.
            LAYERS.add();
        }, // end function "AZ.startNewTurn"
        //--------------------------------------------------
        startWith: function(_module) {
            // +++ Вставить всякие проверки
            this.toDoOnStart = _module;
        }, // end function "AZ.startWith"
        //--------------------------------------------------
        executeAfter: function(_module) {
            this.executeAfterStart = _module;
        }, // end function "AZ.executeAfter"
        //--------------------------------------------------
        availObjects: function (_only_id, _limited) {
            if (_limited == true) {
                return (_only_id == true ? available_objects.limited_IDs.slice() : available_objects.limited.slice());
            } else {
                return (_only_id == true ? available_objects.full_IDs.slice() : available_objects.full.slice());
            } // end if
        }, // end function "AZ.availObjects"
        /* --------------------------------------------------------------------------- */
        executeCommand: function (_command, _real) {
            if (_command.length == 0) {return;} // end if
            _real = _real || false;
            //----------
            printCommand(_command);
            var CMD = PARSER.parse(_command);
            if (CMD == null || CMD.action == null) {
                print('Не совсем понятно, что вы хотите сделать.');
                if (_real == true) {AZ.saveActionToLog(CMD.phrase, false);} // Сохраняем команду в лог
            } else {
                if (_real == true) {AZ.saveActionToLog(CMD.phrase, true);} // Сохраняем команду в лог
                //----------
                // Вызываем событие "Перед выполнением действия с объектом"
                var check = true;
                if (AZ.outputLayers.length == 0) {
                    check = EVENTS.checkReactions(EVENTS.ACTION, {'what':CMD.object, 'when':EVENTS.BEFORE}, {'parameter': CMD});
                } // end if
                if (check == true) {
                    //----------
                    incProperty('turns.all');
                    incProperty('turns.loc');
                    //----------
                    CMD.action(CMD);
                    //----------
                    // Вызываем событие "После выполнением действия с объектом"
                    if (AZ.outputLayers.length == 0) {
                        EVENTS.checkReactions(EVENTS.ACTION, {'what':CMD.object, 'when':EVENTS.AFTER}, {'parameter': CMD});
                    } // end if
                } // end if
            } // end if
            //----------
            AZ.startNewTurn();
            if (_real == true) {PARSER.pre_parse();};
        }, // end function "AZ.executeCommand"
    };
})(); // end object "AZ"
/* --------------------------------------------------------------------------- */
window.startWith = function (_module) {
    AZ.startWith(_module);
}
/* --------------------------------------------------------------------------- */
window.Execute = function(text) {
    AZ.executeCommand(text, false);
}
/* --------------------------------------------------------------------------- */
window.START = function (_param) {
    window.markdown  = new showdown.Converter();
    window.typograph = new Typograf({lang: 'ru'});
    //----------
    var character = AZ.getProtagonist() || null;
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
    INTERFACE.init({
        title:       getProperty('ИГРА.Название'),
        heading:     getProperty('ИГРА.Название'),
        placeholder: getProperty('ИГРА.ПодсказкаДляДействия'),
    }, function () {
        if (typeof(AZ.toDoOnStart) == 'function') {
            AZ.toDoOnStart();
        } else {
            AZ.updateAvailableObjects();
            //----------
            var loc = AZ.getLocation();
            //----------
            INTERFACE.write(loc.getTitle(null, true));
            INTERFACE.write(loc.getDescription());
        } // end if
        //----------
        AZ.startNewTurn();
        //----------
        PARSER.pre_parse();
        DEBUG.updateWordsFullList();
        DEBUG.updateWordsShortList();
        //----------
        //AZ.getSessionID();
        //----------
        if (typeof(AZ.executeAfterStart) == 'function') {
            AZ.executeAfterStart();
        }
        //----------
    });
}; // end function "START"
/* --------------------------------------------------------------------------- */
window.addEventListener('load', window.START, false);
