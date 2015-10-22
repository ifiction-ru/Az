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
        'location': 'location',
        'when':     'when',
        'what':     'what',
        'who':      'what',
        'where':    'where',
        'from':     'from',
        'to':       'to',
    };
    //----------
    var fields_localization_cache = {
        'event':    ['event'],
        'location': ['location'],
        'when':     ['when'],
        'what':     ['what', 'who'],
        'where':    ['where'],
        'from':     ['from'],
        'to':       ['to'],
    };
    //----------
    var fields_settings = {
        'event':    {save:'asis'},
        'location': {save:'object'},
        'when':     {save:'asis'},
        'what':     {save:'object'},
        'where':    {save:'object'},
        'from':     {save:'object'},
        'to':       {save:'object'},
    };
    //----------
    var events_sort = {
        'put':    'location logicaldesc, what logicaldesc, to logicaldesc',
        'remove': 'location logicaldesc, what logicaldesc, from logicaldesc',
        'move':   'location logicaldesc, what logicaldesc, from logicaldesc, to logicaldesc',
    };
    //--------------------------------------------------
    function _get_template (_event) {
        var loc = AZ.getLocation(true);
        if (_event == 'put') {
            return {'event':'put', 'location':loc, 'when':BEFORE, 'what':null, 'to':null};
            
        } else if (_event == 'remove') {
            return {'event':'remove', 'location':loc, 'when':BEFORE, 'what':null, 'from':null};
            
        } else if (_event == 'move') {
            return {'event':'move', 'location':loc, 'when':BEFORE, 'what':null, 'from':null, 'to':null};
            
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
                //----------
                var arr = fields_localization_cache[_locale[k]]
                //----------
                if (arr.indexOf(k) == -1) {arr.push(k);} // end if
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
            var search  = {};
            var data    = {};
            //----------
            for (var fname in _event) {
                if (fields_settings[fname].save == 'object') {
                    search[fname]   = [_event[fname], null];
                    data[fname]     = AZ.getObject(_event[fname]);
                } else {
                    search[fname]   = _event[fname];
                    data[fname]     = _event[fname];
                } // end if
                //----------
                var arr = fields_localization_cache[fname];
                for (var x=0; x<arr.length; x++) {
                    var fname2 = arr[x];
                    if (fname2 != fname) {
                        data[fname2] = data[fname];
                    } // end if
                } // end for
            } // end for fname
            //----------
            var reactions = db(search).order(events_sort[event_name]).get();
            //----------
            if (reactions == false) {return true;} // end if
            //----------
            var result = true;
            //----------
            var converted = false;
            //----------
            for (var x=0; x<reactions.length; x++) {
                var rec = reactions[x];
                //----------
                if (typeof(rec.module) == 'function') {
                    var res = rec.module(data);
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
