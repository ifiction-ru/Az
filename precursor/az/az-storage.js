/* --------------------------------------------------------------------------- */
window.STORAGE = (function() {
    /* --------------------------------------------------------------------------- */
    /* Формат базы данных "dbStorage":
        key    Имя свойства
        value   Значение свойства */
    var dbStorage = TAFFY(); // База данных для хранения данных
    //----------
    dbStorage.store('az.island-clyde.storage');
    //--------------------------------------------------
    return {
        //--------------------------------------------------
        setSessionID: function(_SessionID) {
            var rec = dbStorage({key:'SessionID'}).first();
            //----------
            if (rec != false) {
                dbStorage(rec).update({value:_SessionID});
            } else {
                dbStorage.insert({key:'SessionID', value:_SessionID});
            }
        }, // end function "STORAGE.setSessionID"
        //--------------------------------------------------
        getSessionID: function () {
            var rec = dbStorage({key:'SessionID'}).first();
            //----------
            if (rec == false) {
                return null;
            } else {
                if (rec.value == undefined) {
                    return null;
                } // end if
                return rec.value;
            }
        }, // end function "STORAGE.getSessionID"
        //--------------------------------------------------
        clearCommands: function () {
            //----------
            var rec = dbStorage({key:'Commands'}).first();
            //----------
            if (rec != false) {
                dbStorage(rec).update({value:''});
            }
            //----------
        }, // end function "STORAGE.addCommand"
        //--------------------------------------------------
        addCommand: function (_command) {
            //----------
            var rec = dbStorage({key:'Commands'}).first();
            //----------
            _command = _command.replace('|','');
            //----------
            if (rec == false) {
                dbStorage.insert({key:'Commands', value:_command});
            } else {
                var list = rec.value;
                //----------
                list += (list.length == 0 ? '' : '|') + _command;
                //----------
                dbStorage(rec).update({value:list});
            }
            //----------
        }, // end function "STORAGE.addCommand"
        //--------------------------------------------------
        getCommands: function () {
            //----------
            var result = [];
            //----------
            var rec = dbStorage({key:'Commands'}).first();
            //----------
            if (rec == false) {
                return [];
            } else {
                return rec.value.split('|');
            }
            //----------
        }, // end function "STORAGE.getCommands"
        //--------------------------------------------------
    };
})(); // end object "STORAGE"
/* --------------------------------------------------------------------------- */
