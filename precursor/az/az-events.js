/* --------------------------------------------------------------------------- */
window.EVENTS = (function() {
    //--------------------------------------------------
    /* Формат базы данных "db_reactions":
        id       - ID реакции
        enable   - "Включена" ли реакция
        location - В какой локации срабатывает
        ids...   - Идентификаторы измерений */
    //----------
    var dbs = {
        '_events.free':     TAFFY(),
        //----------
        '_events.put':      TAFFY(),
        '_events.remove':   TAFFY(),
        '_events.move':     TAFFY(),
        //----------
        '_events.property': TAFFY(),
        //----------
        '_events.action': TAFFY(),
    };
    //----------
    var fields_localization = {
        'location':  'location',
        'when':      'when',
        'what':      'what',
        'who':       'what',
        'where':     'where',
        'from':      'from',
        'to':        'to',
        'property':  'property',
        'parameter': 'parameter',
    };
    //----------
    var fields_localization_cache = {
        'location':  ['location'],
        'when':      ['when'],
        'what':      ['what', 'who'],
        'where':     ['where'],
        'from':      ['from'],
        'to':        ['to'],
        'property':  ['property'],
        'parameter': ['parameter'],
    };
    //----------
    var fields_settings = {
        'id':        {save:'as-is'},
        'enable':    {save:'as-is'},
        'location':  {save:'object'},
        'when':      {save:'as-is'},
        'what':      {save:'object'},
        'where':     {save:'object'},
        'from':      {save:'object'},
        'to':        {save:'object'},
        'property':  {save:'with-null'},
        'parameter': {save:'as-is'},
    };
    //----------
    var events_sort = {
        '_events.free':     'location logicaldesc',
        //----------
        '_events.put':      'location logicaldesc, what logicaldesc, to logicaldesc',
        '_events.remove':   'location logicaldesc, what logicaldesc, from logicaldesc',
        '_events.move':     'location logicaldesc, what logicaldesc, from logicaldesc, to logicaldesc',
        //----------
        '_events.property': 'location logicaldesc, what logicaldesc, property logicaldesc',
        //----------
        '_events.action':   'location logicaldesc, what logicaldesc',
    };
    //--------------------------------------------------
    var events_id = 0;
    //--------------------------------------------------
    function _get_template (_event) {
        if (_event == EVENTS.FREE) {
            return {'enable':false, 'location':null }; //, 'when':EVENTS.BEFORE
        //----------
        } else if (_event == EVENTS.PUT) {
            return {'enable':false, 'location':null, 'when':EVENTS.BEFORE, 'what':null, 'to':null };
            
        } else if (_event == EVENTS.REMOVE) {
            return {'enable':false, 'location':null, 'when':EVENTS.BEFORE, 'what':null, 'from':null };
            
        } else if (_event == EVENTS.MOVE) {
            return {'enable':false, 'location':null, 'when':EVENTS.BEFORE, 'what':null, 'from':null, 'to':null };
        //----------
        } else if (_event == EVENTS.PROPERTY) {
            return {'enable':false, 'location':null, 'what':null, 'property':null };
        //----------
        } else if (_event == EVENTS.ACTION) {
            return {'enable':false, 'location':null, 'when':EVENTS.BEFORE, 'what':null };
        //----------
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
        updateAfterLoad: function () {
            //----------
            for (var dbname in dbs) {
                var reactions = dbs[dbname]().map(function(rec) {
                    var object = AZ.getObject(rec.id);
                    if (object != null) {
                        dbs[dbname](rec).update({'enable':getProperty(object,'enable')});
                    } // end if
                });
            } // end for "dbname"
            //----------
        },
        //--------------------------------------------------
        updateEnable: function (_event, _ID, _enable) {
            //----------
            var db = dbs[_event];
            if (db === undefined) {
                db = dbs[EVENTS.FREE];
            } // end if
            //----------
            db({'id':_ID}).update({'enable':_enable});
            //----------
        },
        //--------------------------------------------------
        addReaction: function (_event, _reaction, _data) {
            var event_name = _event;
            var event_type = null;
            var event_data = null;
            //----------
            var db = dbs[event_name];
            if (db !== undefined) {
                event_type = event_name;
            } else {
                event_type = EVENTS.FREE;
                db = dbs[event_type];
            } // end if
            //----------
            event_data = _get_template(event_type);
            //----------
            if (event_data === undefined) {
                console.error('Для события ("'+event_name+'") не прописан шаблон!');
                return null;
            } // end if
            //----------
            if (event_type != EVENTS.FREE) {
                for (var k in _data) {
                    var fname = fields_localization[k.trim().toLowerCase()];
                    //----------
                    if (fname === undefined) {
                        console.error('Неизвестное поле для описания события: "'+k+'"!');
                        return null;
                    } // end if
                    //----------
                    event_data[fname] = _data[k];
                } // end for k
            } // end if
            //----------
            events_id = events_id + 1;
            //----------
            var id = 'ROE:'+events_id;
            event_data['id'] = id;
            //----------
            var table = [];
            object2table(event_data, table);
            //----------
            for (var x=0; x<table.length; x++) {
                var record = table[x];
                for (var fname in record) {
                    var save_as = fields_settings[fname].save;
                    if (save_as == 'object') {
                        record[fname] = AZ.getID(record[fname]);
                    } // end if
                } // end for "fname"
                //----------
                db.insert(record);
            } // end for x
            return {'ID':id, 'type':event_type};
            //----------
        }, // end function "EVENTS.addReaction"
        //--------------------------------------------------
        checkReactions: function (_event, _data, _params) {
            var event_type = null;
            var event_name = _event;
            var event_data = null;
            //----------
            var db = dbs[event_name];
            if (db !== undefined) {
                event_type = _event;
            } else {
                event_type = EVENTS.FREE;
                db = dbs[event_type];
            } // end if
            //----------
            var search  = {'enable':true, 'location': [AZ.getLocation(true), null]};
            var data    = {};
            //----------
            if (event_type == EVENTS.FREE) {
                data = arr2arr(_data);
            } else {
                for (var fname in _data) {
                    var save_as = fields_settings[fname].save;
                    if (save_as == 'object') {
                        search[fname]   = [AZ.getID(_data[fname]), null];
                        data[fname]     = AZ.getObject(_data[fname]);
                    } else if (save_as == 'with-null') {
                        search[fname]   = [_data[fname], null];
                        data[fname]     = _data[fname];
                    } else {
                        search[fname]   = _data[fname];
                        data[fname]     = _data[fname];
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
            } // end if
            //----------
            // Если переданы дополнительные параметры, для передачи в обработчик события, то добавляем их
            if (_params !== undefined) {
                if (typeof(_params) != 'object') {
                    _params = {'parameter': _params};
                } // end if
                //----------
                for (var k in _params) {
                    var arr = fields_localization_cache[k];
                    for (var x=0; x<arr.length; x++) {
                        data[arr[x]] = _params[k];
                    } // end for
                } // end for k
                
            } // end if
            //----------
            if (event_type == EVENTS.PROPERTY) {
                var result = undefined;
            } else {
                var result = true;
            } // end if
            //----------
            var reactions = db(search).order(events_sort[event_type]).get();
            //----------
            if (reactions != false) {
                for (var x=0; x<reactions.length; x++) {
                    var rec = reactions[x];
                    //----------
                    var reaction = AZ.getObject(rec.id);
                    if (typeof(reaction.module) == 'function') {
                        var res = reaction.module(data);
                        //----------
                        if (event_type == EVENTS.PROPERTY) {
                            result = res;
                        } else {
                            if (res === false) {result = false;} // end if
                        } // end if
                    } // end if
                } // end for
            } // end if
            //----------
            return result;
        }, // end function "EVENTS.checkReactions"
        //--------------------------------------------------
    };
})(); // end object "EVENTS"
/* --------------------------------------------------------------------------- */
Object.defineProperty(EVENTS, 'BEFORE', {configurable:false, writable:false, value:'_events.before'});
Object.defineProperty(EVENTS, 'AFTER',  {configurable:false, writable:false, value:'_events.after'});
Object.defineProperty(EVENTS, 'DURING', {configurable:false, writable:false, value:'_events.during'});
//--------------------------------------------------
Object.defineProperty(EVENTS, 'FREE',    {configurable:false, writable:false, value:'_events.free'});
//----------
Object.defineProperty(EVENTS, 'PUT',    {configurable:false, writable:false, value:'_events.put'});
Object.defineProperty(EVENTS, 'REMOVE', {configurable:false, writable:false, value:'_events.remove'});
Object.defineProperty(EVENTS, 'MOVE',   {configurable:false, writable:false, value:'_events.move'});
//----------
Object.defineProperty(EVENTS, 'PROPERTY', {configurable:false, writable:false, value:'_events.property'});
Object.defineProperty(EVENTS, 'ACTION',   {configurable:false, writable:false, value:'_events.action'});
/* --------------------------------------------------------------------------- */
// СОБЫТИЕ
    window.runEvent = function (_event, _data) {
        //----------
        return EVENTS.checkReactions(_event, _data);
        //----------
    } // end class "runEvent"
/* --------------------------------------------------------------------------- */
// РЕАКЦИЯ НА СОБЫТИЕ
    window.ReactionOnEvent = function (_event, _data, _module) {
        var type       = null;
        var event_type = null;
        var objectID   = null;
        var module     = null;
        //----------
        if (arguments.length == 2 && typeof(arguments[1]) == 'function') {
            _module = arguments[1];
            _data   = null;
        } // end if
        //----------
        if (_module === undefined) {
            console.error('Не указан модуль для события!');
            return null;
        } // end if
        //----------
        var rec = EVENTS.addReaction(_event, this, _data);
        //----------
        type       = 'event'; // Тип объекта
        event_type = rec.type;
        objectID   = AZ.addObject(rec.ID, this); //Строковый ID объекта
        var module = _module;
        //----------
        Object.defineProperty(this, 'isObject',  {configurable:false, writable:false, value:true});
        Object.defineProperty(this, 'ID',        {configurable:false, writable:false, value:objectID});
        Object.defineProperty(this, 'event',     {configurable:false, writable:false, value:event_type});
        Object.defineProperty(this, 'module',    {configurable:false, writable:false, value:module});
        //----------
        setProperty(this, 'enable', false);
        //----------
        rec = null;
        //----------
    } // end class "ReactionOnEvent"
    //--------------------------------------------------
    ReactionOnEvent.prototype.Enable = function () {
        //----------
        EVENTS.updateEnable(this.event, this.ID, true);
        setProperty(this, 'enable', true);
        //----------
    }; // end function "<ReactionOnEvent>.Enable"
    //--------------------------------------------------
    ReactionOnEvent.prototype.Disable = function () {
        //----------
        EVENTS.updateEnable(this.event, this.ID, false);
        setProperty(this, 'enable', false);
        //----------
    }; // end function "<ReactionOnEvent>.Disable"
    //--------------------------------------------------
    ReactionOnEvent.prototype.isActive = function () {
        //----------
        return getProperty(this, 'enable');
        //----------
    }; // end function "<ReactionOnEvent>.IsEnable"
/* --------------------------------------------------------------------------- */


