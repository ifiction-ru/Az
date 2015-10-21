/* --------------------------------------------------------------------------- */
window.EVENTS = (function() {
    //--------------------------------------------------
    /* Формат базы данных "db_reactions":
        name        Идентификатор события
        ids         Идентификаторы измерений
        module      Обработчик события */
    //----------
    var dbs = {
        'put':      TAFFY(),
        'remove':   TAFFY(),
        'move':     TAFFY(),
    };
    //----------
    var fields_localization = {
        'event':    'event',
        'when':     'when',
        'what':     'what',
        'who':      'what',
        'where':    'where',
        'from':     'from',
        'to':       'to',
    };
    //----------
    var fields_settings = {
        'event':    {save:'asis'},
        'when':     {save:'asis'},
        'what':     {save:'object'},
        'where':    {save:'object'},
        'from':     {save:'object'},
        'to':       {save:'object'},
    };
    //----------
    var events_sort = {
        'put':    'what logicaldesc, to logicaldesc',
        'remove': 'what logicaldesc, from logicaldesc',
        'move':   'what logicaldesc, from logicaldesc, to logicaldesc',
    };
    //--------------------------------------------------
    function _get_template (_event) {
        if (_event == 'put') {
            return {'event':'put', 'when':BEFORE, 'what':null, 'to':null};
            
        } else if (_event == 'remove') {
            return {'event':'remove', 'when':BEFORE, 'what':null, 'from':null};
            
        } else if (_event == 'move') {
            return {'event':'move', 'when':BEFORE, 'what':null, 'from':null, 'to':null};
            
        } else {
            return undefined;
        } // end if
    } // end function "_get_template"
    //--------------------------------------------------
    return {
        //--------------------------------------------------
        setLocalization: function (_locale) {
            //----------
            for (var k in _locale) {
                fields_localization[k] = _locale[k];
            } // end for k
            //----------
        },
        //--------------------------------------------------
        addReaction: function (_event, _module) {
            var data = {};
            for (var k in _event) {
                var fname = fields_localization[k.trim().toLowerCase()];
                //----------
                if (fname === undefined) {
                    console.error('Неизвестное поле для описания события: "'+k+'"!');
                    return;
                } // end if
                //----------
                data[fname] = (fname == 'event' ? _event[k].trim().toLowerCase() : _event[k]);
            } // end for k
            //----------
            if (data.event === undefined) {
                console.error('Не указано имя события!');
                return;
            } // end if
            //----------
            var event_name = data.event;
            //----------
            if (_module === undefined) {
                console.error('Не указан модуль для события "'+event_name+'"!');
                return;
            } // end if
            //----------
            var db = dbs[event_name];
            //----------
            if (db === undefined) {
                console.error('Указанное имя события ("'+event_name+'") системе неизвестно!');
                return;
            } // end if
            //----------
            var event_data = _get_template(event_name);
            //----------
            if (event_data === undefined) {
                console.error('Для события ("'+event_name+'") не прописан шаблон!');
                return;
            } // end if
            //----------
            for (var k in data) {
                if (fields_settings[k] === undefined) {
                    console.error('Неизвестное поле для описания события: "'+k+'"!');
                    return;
                } else {
                    if (fields_settings[k].save == 'object') {
                        event_data[k] = AZ.getID(data[k]);
                    } else {
                        event_data[k] = data[k];
                    } // end if
                } // end if
                //----------
            } // end for k
            //----------
            event_data['module'] = _module;
            //----------
            db.insert(event_data);
            //----------
        }, // end function "EVENTS.addReaction"
        //--------------------------------------------------
        checkReactions: function (_event) {
            var event_name = _event.event;
            //----------
            var db = dbs[event_name];
            //----------
            if (db === undefined) {return true;} // end if
            //----------
            // var db = TAFFY(); db.insert({a:'ИГРОК'}); db.insert({a:null}); db.insert({a:'ОСТРОВ'}); db().order('a logicaldesc').select('a');
            // var db = TAFFY(); db.insert({a:'ИГРОК', b:null}); db.insert({a:'ИГРОК', b:'Ok'}); db.insert({a:null}); db.insert({a:'ОСТРОВ', b:'Hello'}); db().order('a logicaldesc, b logicaldesc').select('a','b');
            //----------
            var reactions = db(_event).order(events_sort[event_name]).get();
            //----------
            if (reactions == false) {return true;} // end if
            //----------
            var result = true;
            //----------
            for (var x=0; x<reactions.length; x++) {
                var rec = reactions[x];
                //----------
                if (typeof(rec.module) == 'function') {
                    var res = rec.module(_event);
                    //----------
                    if (res === false) {result = false;} // end if
                } // end if
            } // end for
            //----------
            return result;
        },
        //--------------------------------------------------
    };
})(); // end object "EVENTS"
/* --------------------------------------------------------------------------- */
