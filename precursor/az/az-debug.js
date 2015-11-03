/* --------------------------------------------------------------------------- */
window.DEBUG = (function() {
    //--------------------------------------------------
    var debug_enable = false;
    //----------
    var colors = {'Г':'blue', 'ПР':'gray', 'С':'red', 'Н':'green', 'М':'black'};
    //----------
    var preparsing = {
        panel:      '',
    };
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
    //--------------------------------------------------
    return {
        //--------------------------------------------------
        Enable: function () {
            debug_enable = true;
        },
        //--------------------------------------------------
        Disable: function () {
            debug_enable = false;
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
                SCREEN.Clear('debug-objects-list');
            } else {
                
            }// end if
        },
        //--------------------------------------------------
        updatePanelForObjects: function () {
            if (debug_enable == false || objects.panel == '') {return;} // end if
            //----------
            var txt_objects = AZ.availObjects(true, false);
            //----------
            SCREEN.Clear('debug-objects-list');
            //----------
            if (txt_objects.length > 0) {
                SCREEN.Out(txt_objects.join('<br/>'), 'debug-objects-list');
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
            if (AUTOCOMPLETE.getActionFlag() == true) {
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
            SCREEN.Clear(words.full_list.panel);
            SCREEN.Out(output, words.full_list.panel);
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
            /*if (AUTOCOMPLETE.getActionFlag() == true) {
                output += '<b>&lt;ввод&gt;</b>';
            } // end if*/
            //----------
            SCREEN.Clear(words.short_list.panel);
            SCREEN.Out(output,words.short_list.panel);
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
            SCREEN.Clear(preparsing.panel);
            SCREEN.Out(output,preparsing.panel);
            //----------
        },
        //--------------------------------------------------
    };
})(); // end object "DEBUG"
/* --------------------------------------------------------------------------- */
