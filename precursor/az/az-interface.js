/* --------------------------------------------------------------------------- */
// ВЫВОД НА ЭКРАН
    window.SCREEN = {
        Out: function (text, _panel) {
            if (_panel === undefined) {_panel = 'main-output'} // end if
            //----------
            var EL=document.getElementById(_panel);
            //----------
            if (EL!=null) {
                //EL.innerHTML += TYPOGRAPH.text2html(text);
                EL.innerHTML += text;
            };
        }, // end function "Out"
        //----------
        Clear: function (_panel) {
            if (_panel === undefined) {_panel = 'main-output'} // end if
            //----------
            var EL=document.getElementById(_panel);
            //----------
            if (EL!=null) {
                EL.innerHTML='';
            } // end if
        }, // end function "Clear"
    };
/* --------------------------------------------------------------------------- */
// ВЫВОД НА ЭКРАН
    window.INTERFACE = {
        //--------------------------------------------------
        // Обработка нажатия клавиш игроком
        userInput: function (field, event) {
            if (event.which == null) { // IE
                if (event.keyCode == 13) {
                    INTERFACE.ExecuteCMD(field);
                } // end if
            } // end if
            //----------
            if (event.which != 0 && event.charCode != 0) { // все кроме IE
                if (event.which == 13) {
                    INTERFACE.ExecuteCMD(field);
                } // end if
            } // end if
            //----------
            return true; // спец. символ
        }, // end function "userInput"
        //--------------------------------------------------
        preparsing: function (field) {
            //----------
            var command = field.value || '';
            //----------
            if (command.trim() == '') {
                PARSER.pre_parse();
            } else {
                PARSER.parse(command, true);
            } // end if
            //----------
            INTERFACE.checkENTER();
            //----------
            DEBUG.updateWordsFullList();
            DEBUG.updateWordsShortList();
        }, // end function "preparsing"
        //--------------------------------------------------
        // Добавление (остатка) слова к команде игрока
        addWordToCommand: function (_text) {
            var field = document.getElementById('user_command');
            //----------
            if (field == null) {return;}
            //----------
            var value   = field.value;
            var lsymbol = value.substr(-1);
            if (lsymbol == ' ' || lsymbol == '\t') {
                field.value = value + _text + ' ';
            } else {
                var pos = value.lastIndexOf(' ');
                if (pos == -1) {
                    field.value = _text + ' ';
                } else {
                    field.value = value.substr(0, pos)+ ' ' + _text + ' ';
                } // end if
            } // end if
            //----------
            INTERFACE.preparsing(field);
            //----------
            field.focus();
        }, // end function "addWordToCommand"
        //--------------------------------------------------
        checkENTER: function () {
            var field = document.getElementById('user_command');
            if (field == null) {return;}
            //----------
            field.style.color = (AUTOCOMPLETE.getActionFlag() == true) ? "#00F" : "#000";
        }, // end function "addWordToCommand"
        //--------------------------------------------------
        ExecuteCMD: function (field) {
            // Выводим на экран команду игрока
            printCommand(field.value);
            //----------
            // Разбираем команду игрока
            var CMD = PARSER.parse(field.value);
            //----------
            field.value='';
            //----------
            if (CMD.action == null) {
                print('Ничего не понятно.');
            } else {
                // Вызываем событие "Перед выполнением действия с объектом"
                if (EVENTS.checkReactions(EVENTS.ACTION, {'what':CMD.object, 'when':EVENTS.BEFORE}, {'parameter': CMD}) == true) {
                    //----------
                    incProperty('turns.all');
                    incProperty('turns.loc');
                    //----------
                    CMD.action(CMD);
                    //----------
                    // Вызываем событие "После выполнением действия с объектом"
                    EVENTS.checkReactions(EVENTS.ACTION, {'what':CMD.object, 'when':EVENTS.AFTER}, {'parameter': CMD});
                } // end if
            } // end if
            //----------
            AZ.startNewTurn();
        },
        //--------------------------------------------------
    };
/* --------------------------------------------------------------------------- */
// ФУНКЦИИ РАБОТЫ С ЭКРАНОМ
    window.print = function (_text) {
        //----------
        SCREEN.Out(_text);
        //----------
    };
    //--------------------------------------------------
    window.printCommand = function (_text) {
        //----------
        SCREEN.Out(DECOR.Command.print(_text));
        //----------
    };
    //--------------------------------------------------
    window.printDescription = function (_object, _param) {
        var object = AZ.getObject(_object);
        //----------
        // +++ Что делать, если объект для описания не найден
        if (object != null) {
            SCREEN.Out(object.getDescription(_param));
        } // end if
        //----------
    }; // end function "printDescription"
    //--------------------------------------------------
    window.printInventory = function () {
        //----------
        SCREEN.Out(DECOR.Inventory.get());
        //----------
    };
/* --------------------------------------------------------------------------- */
