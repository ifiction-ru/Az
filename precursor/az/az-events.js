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
    var templates = {
        'put':      {'event':'put', 'when':BEFORE, 'what':null, 'to':null},
        'remove':   TAFFY(),
        'move':     TAFFY(),
    };
    //--------------------------------------------------
    function _getEventID (_name) {
        _name = (_name || '').trim().toUpperCase();
        //----------
        if (_name == '') {return null;} // end if
        //----------
        return _name;
        /*var id = events_ids[_name];
        //----------
        if (id == undefined) {
            id = ++id_counter;
            //----------
            events_ids[_name] = id;
        } // end if
        //----------
        return id;*/
    } // end function "_getEventID"
    //--------------------------------------------------
    function _get_template (_event) {
        if (_event == 'put') {
            return {'event':'put', when:BEFORE, 'what':null, 'to':null};
        } else {
            
        } // end if
    } // end function "_getEventID"
    //--------------------------------------------------
    return {
        //--------------------------------------------------
        addReaction: function (_event, _module) {
            var db = dbs[_event.event];
            //----------
            if (db === undefined) {return;} // end if
            //----------
            var event = _get_template(_event.event);
            //----------
            for (var k in _event) {
                var data = _event[k];
                //----------
                if (typeof(data) == 'object' && data != null) {
                    event[k] = AZ.getID(data);
                } else {
                    event[k] = data;
                } // end if
                //----------
            } // end for k
            //----------
            event['module'] = _module;
            //----------
            db.insert(event);
            //----------
        },
        //--------------------------------------------------
        checkReactions: function (_event) {
            var db = dbs[_event.event];
            //----------
            if (db === undefined) {return true;} // end if
            //----------
            /*var event = _get_template(_event.event);
            //----------
            for (var k in _event) {
                var data = _event[k];
                //----------
                if (k != 'event') {
                } // end if
                if (typeof(data) == 'object' && data != null) {
                    event[k] = [AZ.getID(data), null];
                } else {
                    event[k] = [data, null];
                } // end if
                //----------
            } // end for k*/
            // var db = TAFFY(); db.insert({a:'ИГРОК'}); db.insert({a:null}); db.insert({a:'ОСТРОВ'}); db().order('a logicaldesc').select('a');
            //----------
            var reactions = db(_event).get();
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
                    if (res === false) {
                        result = false;
                    } // end if
                } // end if
            } // end for
            //----------
            return result;
        },
        //--------------------------------------------------
    };
})(); // end object "EVENTS"
/* --------------------------------------------------------------------------- */
