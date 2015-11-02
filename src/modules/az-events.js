define(['modules/az-utils', 'modules/az-constants', 'modules/az-engine', 'libs/taffy'], function (utils, cons, engine, Taffy) {
    'use strict';

    /*
     Формат базы данных "db_reactions":
     id       - ID реакции
     enable   - "Включена" ли реакция
     location - В какой локации срабатывает
     ids...   - Идентификаторы измерений
     */

    var dbs = {
            '_events.free':     Taffy(),

            '_events.put':      Taffy(),
            '_events.remove':   Taffy(),
            '_events.move':     Taffy(),

            '_events.property': Taffy(),

            '_events.action':   Taffy()
        },

        fieldsLocalization = {
            'location':  'location',
            'when':      'when',
            'what':      'what',
            'who':       'what',
            'where':     'where',
            'from':      'from',
            'to':        'to',
            'property':  'property',
            'parameter': 'parameter'
        },

        fieldsLocalizationCache = {
            'location':  ['location'],
            'when':      ['when'],
            'what':      ['what', 'who'],
            'where':     ['where'],
            'from':      ['from'],
            'to':        ['to'],
            'property':  ['property'],
            'parameter': ['parameter']
        },

        fieldsSettings = {
            'id':        { save: 'as-is' },
            'enable':    { save: 'as-is' },
            'location':  { save: 'object' },
            'when':      { save: 'as-is' },
            'what':      { save: 'object' },
            'where':     { save: 'object' },
            'from':      { save: 'object' },
            'to':        { save: 'object' },
            'property':  { save: 'with-null' },
            'parameter': { save: 'as-is' }
        },

        eventsSort = {
            '_events.free':     'location logicaldesc',

            '_events.put':      'location logicaldesc, what logicaldesc, to logicaldesc',
            '_events.remove':   'location logicaldesc, what logicaldesc, from logicaldesc',
            '_events.move':     'location logicaldesc, what logicaldesc, from logicaldesc, to logicaldesc',

            '_events.property': 'location logicaldesc, what logicaldesc, property logicaldesc',

            '_events.action':   'location logicaldesc, what logicaldesc'
        },

        eventId = 0,

        _getTemplate = function (event) {
            if (event == self.FREE) {
                return {
                    enable:  false,
                    location: null
                };
            } else if (event == self.PUT) {
                return {
                    enable:   false,
                    location: null,
                    when:     self.BEFORE,
                    what:     null,
                    to:       null
                };
            } else if (event == self.REMOVE) {
                return {
                    enable:   false,
                    location: null,
                    when:     self.BEFORE,
                    what:     null,
                    from:     null
                };
            } else if (event == self.MOVE) {
                return {
                    enable:   false,
                    location: null,
                    when:     self.BEFORE,
                    what:     null,
                    from:     null,
                    to:       null
                };
            } else if (event == self.PROPERTY) {
                return {
                    enable:   false,
                    location: null,
                    what:     null,
                    property: null
                };
            } else if (event == self.ACTION) {
                return {
                    enable:   false,
                    location: null,
                    when:     self.BEFORE,
                    what:     null
                };
            }
        },

        setLocalization = function (locale) {
            var arr;

            for (var key in locale) {
                arr = fieldsLocalizationCache[locale[key]];
                fieldsLocalization[key] = locale[key];

                if (arr.indexOf(key) < 0) {
                    arr.push(key);
                }
            }
        },

        updateAfterLoad = function () {
            for (var dbname in dbs) {
                dbs[dbname]().map(function(rec) {
                    var object = engine.getObject(rec.id);

                    if (object != null) {
                        dbs[dbname](rec).update({
                            enable: getProperty(object,'enable')
                        });
                    }
                });
            }
        },

        updateEnable = function (event, id, enable) {
            var db = dbs[event];

            if (db === undefined) {
                db = dbs[self.FREE];
            }

            db({ 'id': id }).update({
                enable: enable
            });
        },

        addReaction = function (event, reaction, data) {
            var eventName = event,
                eventType = null,
                eventData = null,
                db = dbs[eventName];

            if (db !== undefined) {
                eventType = eventName;
            } else {
                eventType = self.FREE;
                db = dbs[eventType];
            }

            eventData = _getTemplate(eventType);

            if (eventData === undefined) {
                console.error('Для события ("' + eventName + '") не прописан шаблон!');
                return null;
            }

            var fName,
                id = 'ROE:' + eventId,
                table = [],
                record,
                saveAs;

            if (eventType != self.FREE) {
                for (var key in data) {
                    fName = fieldsLocalization[key.trim().toLowerCase()];

                    if (fName === undefined) {
                        console.error('Неизвестное поле для описания события: "'+key+'"!');
                        return null;
                    }

                    eventData[fName] = data[key];
                }
            }

            eventId++;
            eventData['id'] = id;
            utils.objectToTable(eventData, table);

            for (var i = 0; i < table.length; i++) {
                record = table[i];

                for (fName in record) {
                    saveAs = fieldsSettings[fName].save;

                    if (utils.typeOf(saveAs) === 'object' ) {
                        record[fName] = engine.getId(record[fName]);
                    }
                }

                db.insert(record);
            }

            return {
                id:   id,
                type: eventType
            };
        },

        checkReactions = function (event, data, params) {
            var eventName = event,
                eventType = null,
                db = dbs[eventName],
                search  = {
                    enable:    true,
                    location: [ engine.getLocation(true), null ]
                },
                _data = {},
                saveAs,
                arr,
                result;

            if (db !== undefined) {
                eventType = event;
            } else {
                eventType = self.FREE;
                db = dbs[eventType];
            }

            if (eventType == self.FREE) {
                _data = utils.arrToArr(data);
            } else {
                for (var fName in data) {
                    saveAs = fieldsSettings[fName].save;

                    if (saveAs == 'object') {
                        search[fName]    = [ engine.getId(data[fName]), null ];
                        _data[fName]     = engine.getObject(data[fName]);
                    } else if (saveAs == 'with-null') {
                        search[fName]    = [data[fName], null];
                        _data[fName]     = data[fName];
                    } else {
                        search[fName]    = data[fName];
                        _data[fName]     = data[fName];
                    }

                    arr = fieldsLocalizationCache[fName];

                    for (var i = 0; i < arr.length; i++) {
                        var fName2 = arr[i];

                        if (fName2 != fName) {
                            _data[fName2] = data[fName];
                        }
                    }
                }
            }

            // Если переданы дополнительные параметры, для передачи в обработчик события, то добавляем их
            if (params !== undefined) {
                if (typeof(params) != 'object') {
                    params = { parameter: params };
                }

                for (var key in params) {
                    arr = fieldsLocalizationCache[key];

                    for (i = 0; i <arr.length; i++) {
                        _data[arr[i]] = params[key];
                    }
                }
            }

            if (eventType == self.PROPERTY) {
                result = undefined;
            } else {
                result = true;
            }

            var reactions = db(search).order(eventsSort[eventType]).get();

            if (reactions != false) {
                for (i = 0; i < reactions.length; i++) {
                    var rec = reactions[i],
                        reaction = engine.getObject(rec.id);

                    if (typeof reaction.module === 'function') {
                        var res = reaction.module(_data);

                        if (eventType == self.PROPERTY) {
                            result = res;
                        } else {
                            if (res === false) {
                                result = false;
                            }
                        }
                    }
                }
            }

            return result;
        },

        run = function (event, data) {
            return checkReactions(event, data);
        },

        Reaction = function (event, data, module) {
            var eventType,
                objectId;

            if (arguments.length == 2 && typeof(arguments[1]) == 'function') {
                module = arguments[1];
                data   = null;
            }

            if (module === undefined) {
                console.error('Не указан модуль для события!');
                return;
            }

            var rec = addReaction(event, this, data);

            eventType  = rec.type;
            objectId   = engine.addObject(rec.id, this); //Строковый ID объекта

            Object.defineProperty(this, 'isObject',  { configurable: false, writable: false, value: true });
            Object.defineProperty(this, 'id',        { configurable: false, writable: false, value: objectId });
            Object.defineProperty(this, 'event',     { configurable: false, writable: false, value: eventType });
            Object.defineProperty(this, 'module',    { configurable: false, writable: false, value: module });

            setProperty(this, 'enable', false);
            rec = null;
        };

    Reaction.prototype.enable = function () {
        updateEnable(this.event, this.id, true);
        setProperty(this, 'enable', true);
    };

    Reaction.prototype.disable = function () {
        updateEnable(this.event, this.id, false);
        setProperty(this, 'enable', false);
    };

    Reaction.prototype.isActive = function () {
        return getProperty(this, 'enable');
    };

    var self = {
        setLocalization: setLocalization,
        updateAfterLoad: updateAfterLoad,
        updateEnable:    updateEnable,
        addReaction:     addReaction,
        checkReactions:  checkReactions,
        run:             run,

        Reaction:        Reaction
    };

    Object.defineProperty(self, 'BEFORE',   { configurable:false, writable:false, value:'_events.before' });
    Object.defineProperty(self, 'AFTER',    { configurable:false, writable:false, value:'_events.after' });
    Object.defineProperty(self, 'DURING',   { configurable:false, writable:false, value:'_events.during' });

    Object.defineProperty(self, 'FREE',     { configurable:false, writable:false, value:'_events.free' });

    Object.defineProperty(self, 'PUT',      { configurable:false, writable:false, value:'_events.put' });
    Object.defineProperty(self, 'REMOVE',   { configurable:false, writable:false, value:'_events.remove' });
    Object.defineProperty(self, 'MOVE',     { configurable:false, writable:false, value:'_events.move' });

    Object.defineProperty(self, 'PROPERTY', { configurable:false, writable:false, value:'_events.property' });
    Object.defineProperty(self, 'ACTION',   { configurable:false, writable:false, value:'_events.action' });

    return self;
});
