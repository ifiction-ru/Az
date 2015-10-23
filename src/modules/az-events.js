define(['modules/az-utils'], function (utils) {

    'use strict';

    /*
        Формат базы данных "db_reactions":
        name        Идентификатор события
        ids         Идентификаторы измерений
        module      Обработчик события
    */

    var dbs = {
            put:    TAFFY(),
            remove: TAFFY(),
            move:   TAFFY()
        },
        templates = {
            put:    {
                event: 'put',
                when: BEFORE,
                what: null,
                to: null
            },
            remove: TAFFY(),
            move:   TAFFY()
        },
        id_counter = 0,
        events_ids = {

        },
        getEventId = function (name) {
            name = (name || '').trim().toUpperCase();

            if (!name) {
                return null;
            }

            var id = events_ids[name];

            if (id === undefined) {
                id = ++id_counter;
                events_ids[name] = id;
            }

            return id;
        },

        getTemplate = function (event) {
            if (event === 'put') {
                return {
                    event: 'put',
                    when: BEFORE,
                    what: null,
                    to: null
                };
            }
        },

        addReaction = function (event, module, getIdFunc /* AZ.getID */) {
            if (!event || !module || !getIdFunc) {
                return;
            }

            var db = dbs[event.event];

            if (!db) {
                return;
            }

            var _event = getTemplate(event.event);

            for (var key in _event) {
                var data = _event[key];

                if (utils.typeOf(data) === 'object') {
                    _event[key] = getIdFunc(data);
                } else {
                    _event[key] = data;
                }
            }

            _event['module'] = module;
            db.insert(_event);
        },

        checkReactions = function (event) {
            var db = dbs[event.event];

            if (!db) {
                return true;
            }

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

            var reactions = db(event).get();

            if (!reactions) {
                return true;
            }

            var result = true;

            for (var i = 0; i < reactions.length; i++) {
                var rec = reactions[i];

                if (typeof rec.module === 'function') {
                    var res = rec.module(event);

                    if (res === false) {
                        result = false;
                    }
                }
            }

            return result;
        };

    return {
        addReaction: addReaction,
        checkReactions: checkReactions
    };

});
