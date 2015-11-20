/* --------------------------------------------------------------------------- */
// РАБОТА С ТЕКСТАМИ
//--------------------------------------------------
window.tSimpleText = function (_id) {
    tSimpleObject.apply(this, arguments);
    //----------
    this.type = 'text'; // Тип объекта
    //----------
    this.moduleBefore = null;
    this.moduleAfter  = null;
    //----------
    this.text   = '';
    this.pages  = {texts:[], current:-1};
    //----------
    Object.defineProperty(this, 'Текст', {
        set: function(_text) {
            //----------
            this.text = _text;
            //----------
            // Нарезаем текст на страницы
            this.pages.texts = _text.split(/[\s|\n]*\<\-\s*далее\s*\-\>[\s|\n]*/gi);
            for (var x=0; x<this.pages.texts.length; x++) {
                this.pages.texts[x] = this.pages.texts[x].trim().replace(/^\s+/gm, '\n');
            } // end for
            //----------
        },
        get: function() {
            return this.text;
        }
    });
    //----------
    Object.defineProperty(this, 'ВыполнитьПеред', {
        set: function(_module) {
            //----------
            this.moduleBefore = _module;
            //----------
        },
        get: function() {
            return null;
        }
    });
    //----------
    Object.defineProperty(this, 'ВыполнитьПосле', {
        set: function(_module) {
            //----------
            this.moduleAfter = _module;
            //----------
        },
        get: function() {
            return null;
        }
    });
} // end function "tSimpleText"
//----------
tSimpleText.prototype = Object.create(tSimpleObject.prototype);
tSimpleText.prototype.constructor = tSimpleText;
//--------------------------------------------------
tSimpleText.prototype.next = function () {
    //----------
    this.pages.current++;
    //----------
    print(this.pages.texts[this.pages.current]);
    //----------
    INTERFACE.setPlaceholder(getProperty('ИГРА.ПодсказкаДляТекста'));
    //----------
    if (this.pages.current == this.pages.texts.length - 1) {
        this.pages.current = -1;
        //----------
        AZ.outputLayers.pop();
        //----------
        if (typeof(this.moduleAfter) == 'function') {
            this.moduleAfter();
        } // end if
        //----------
        // Вызываем событие "После вывода текста"
        EVENTS.checkReactions(EVENTS.TEXT, {'when':EVENTS.AFTER, 'what':this});
        //----------
        AZ.updateAvailableObjects();
        //----------
        PARSER.pre_parse();
        DEBUG.updateWordsFullList();
        DEBUG.updateWordsShortList();
        //----------
        INTERFACE.setPlaceholder(getProperty('ИГРА.ПодсказкаДляДействия'));
    } // end if
    //----------
} // end function "<tSimpleText>.Next"
//--------------------------------------------------
tSimpleText.prototype.print = function () {
    //----------
    if (AZ.silence == true) {
        // Вызываем событие "Перед выводом текста"
        EVENTS.checkReactions(EVENTS.TEXT, {'when':EVENTS.BEFORE, 'what':this});
        //----------
        if (typeof(this.moduleBefore) == 'function') {
            this.moduleBefore();
        } // end if
        //----------
        // ...
        //----------
        if (typeof(this.moduleAfter) == 'function') {
            this.moduleAfter();
        } // end if
        //----------
        // Вызываем событие "После вывода текста"
        EVENTS.checkReactions(EVENTS.TEXT, {'when':EVENTS.AFTER, 'what':this});
        //----------
        AZ.updateAvailableObjects();
        //----------
        PARSER.pre_parse();
        DEBUG.updateWordsFullList();
        DEBUG.updateWordsShortList();
        //----------
        return;
    } // end if
    //----------
    AZ.outputLayers.push(this);
    //----------
    AZ.updateAvailableObjects();
    //----------
    this.pages.current = -1;
    //----------
    // Вызываем событие "Перед выводом текста"
    EVENTS.checkReactions(EVENTS.TEXT, {'when':EVENTS.BEFORE, 'what':this});
    //----------
    if (typeof(this.moduleBefore) == 'function') {
        this.moduleBefore();
    } // end if
    //----------
    this.next();
    //----------
} // end function "<tSimpleText>.print"
/* --------------------------------------------------------------------------- */
