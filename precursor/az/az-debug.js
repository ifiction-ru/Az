/* --------------------------------------------------------------------------- */
window.DEBUG = (function() {
    //--------------------------------------------------
    var debug_enable = false,
        debug_ready = false;

    var debugQuery = [];

    var debugWindow;
    //----------
    var colors = {'Г':'blue', 'ПР':'gray', 'С':'red', 'Н':'green', 'М':'black'};
    //----------
    var objects = {
        panel:      'debug-objects-list',
    };
    //----------
    var preparsing = {
        panel:      'debug-preparsing-objects',
    };
    //----------
    var words = {
        full_list:  {panel:     'debug-words-list-full'},
        short_list: {panel:     'debug-words-list-short'}
    };

    window.addEventListener('message', function(event) {
        if (event.data.status === 'loaded') {
            debug_ready = true;

            for (var i = 0; i < debugQuery.length; i++) {
                if (typeof debugQuery[i] === 'function') {
                    debugQuery[i]();
                }
            }
        }
    });

    function createWindow() {
        if (debug_enable) {
            debugWindow = window.open('debug.html', 'az-debug-window', 'width=600,height=400,menubar=no,toolbar=no,scrollbars=yes');
        }
    }

    function closeWindow() {
        debugWindow.close();
        debugWindow = null;
    }

    function write(content, id) {
        var func = function () {
            debugWindow.postMessage({
                content: content,
                id: id
            }, '*');
        };

        if (debugWindow && !debugWindow.closed) {
            if (debug_ready) {
                func();
            } else {
                debugQuery.push(func);
            }
        }
    }

    function clear(id) {
        var func = function () {
            debugWindow.postMessage({
                content: false,
                id: id
            }, '*')
        };

        if (debugWindow && !debugWindow.closed) {
            if (debug_ready) {
                func();
            } else {
                debugQuery.push(func);
            }
        }
    }

    //--------------------------------------------------
    return {
        //--------------------------------------------------
        Enable: function () {
            debug_enable = true;
            if (!debugWindow || debugWindow.closed) {
                createWindow();
            }
        },
        //--------------------------------------------------
        Disable: function () {
            debug_enable = false;
            if (debugWindow) {
                closeWindow();
            }
        },
        //--------------------------------------------------
        isEnable: function () {
            return debug_enable;
        },
        //--------------------------------------------------
        setPanelForPreparsing: function (_name) {
            _name = _name.trim();
            //----------
            preparsing.panel = _name;
            //----------
            if (debug_enable == false) {return;} // end if
            //----------
            if (_name == '') {

            } else {

            }// end if
        },
        //--------------------------------------------------
        setPanelForObjects: function (_name) {
            _name = _name.trim();
            //----------
            objects.panel = _name;
            //----------
            if (debug_enable == false) {return;} // end if
            //----------
            if (_name == '') {
                clear('debug-objects-list');
            } else {

            }// end if
        },
        //--------------------------------------------------
        updatePanelForObjects: function () {
            if (debug_enable == false || objects.panel == '') {return;} // end if
            //----------
            var txt_objects = AZ.availObjects(true, false);
            //----------
            clear('debug-objects-list');
            //----------
            if (txt_objects.length > 0) {
                txt_objects.sort();
                write(txt_objects.join('<br/>'), 'debug-objects-list');
            } // end if
            //----------
        },
        //--------------------------------------------------
        updateWordsFullList: function () {
            if (debug_enable == false || words.full_list.panel == '') {return;} // end if
            //----------
            AUTOCOMPLETE.start(0);
            //----------
            var output = '';
            //----------
            //if (AUTOCOMPLETE.getActionFlag() == true) {
            if (AUTOCOMPLETE.getStatus() == 1) {
                output += '<b>&lt;ввод&gt;</b><hr/>';
            } // end if
            //----------
            while (AUTOCOMPLETE.next(0) != false) {
                var word    = AUTOCOMPLETE.word(0);
                var morph   = AUTOCOMPLETE.morph(0);
                //----------
                output += '<a href="#" onclick="INTERFACE.addWordToCommand(\''+word+'\'); return false;" style="text-decoration:none; color: '+colors[morph]+'">'+word+'</a><br/>';
            } // end for
            //----------
            clear(words.full_list.panel);
            write(output, words.full_list.panel);
            //----------
        },
        //--------------------------------------------------
        updateWordsShortList: function () {
            if (debug_enable == false || words.short_list.panel == '') {return;} // end if
            //----------
            AUTOCOMPLETE.start(1);
            //----------
            var output = '';
            //----------
            while (AUTOCOMPLETE.next(1) != false) {
                var word    = AUTOCOMPLETE.word(1);
                var morph   = AUTOCOMPLETE.morph(1);
                //----------
                output += '<div class="acword"><a href="#" onclick="INTERFACE.addWordToCommand(\''+word+'\'); return false;" style="text-decoration:none; color: '+colors[morph]+'">'+word+'</a></div>';
            } // end for
            //----------
            clear(words.short_list.panel);
            write(output, words.short_list.panel);
            //----------
        },
        //--------------------------------------------------
        updatePreparsingData: function (CMD) {
            if (debug_enable == false || preparsing.panel == '') {return;} // end if
            //----------
            var br      = '<br/>';
            var output  = '';
            //----------
            output += 'Команда: "'+CMD.phrase+'"'+br;
            output += 'глагол: '+(CMD.verb == null ? '-' : DICTIONARY.getBase(CMD.verb.bid).base+' ('+CMD.verb.bid+')')+'<br/>';
            //----------
            for (var priority=1; priority<=3; priority++) {
                output += '#'+priority+': '+(CMD.params[priority] == null ? '-' : '');
                if (CMD.params[priority] != null) {
                    output += 'п: ' + (CMD.params[priority].prep == null ? '-' : DICTIONARY.getBase(CMD.params[priority].prep.bid).base+' ('+CMD.params[priority].prep.bid+')');
                    //----------
                    output += ', с: '+DICTIONARY.getBase(CMD.params[priority].bid).base+' ('+CMD.params[priority].bid+')';
                } // end if
                //----------
                output += ', о: '+(CMD.objects[priority] == null ? '-' : CMD.objects[priority].ID);
                //----------
                if (CMD.objects[priority] != null) {
                    var action_id = CMD.actions[priority];
                    //----------
                    if (action_id != null) {
                        output += ', a: #'+action_id;
                    } // end if
                } // end if
                //----------
                output += '<br/>';
            } // end for priority
            //----------
            clear(preparsing.panel);
            write(output, preparsing.panel);
            //----------
        }
        //--------------------------------------------------
    };
})(); // end object "DEBUG"
/* --------------------------------------------------------------------------- */
