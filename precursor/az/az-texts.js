/* --------------------------------------------------------------------------- */
// РАБОТА С ТЕКСТАМИ
//--------------------------------------------------
window.SimpleText = function (_id) {
    tSimpleObject.apply(this, arguments);
    //----------
    this.type           = 'text'; // Тип объекта
    //----------
    this.module = null;
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
    Object.defineProperty(this, 'ВыполнитьПосле', {
        set: function(_module) {
            //----------
            this.module = _module;
            //----------
        },
        get: function() {
            return null;
        }
    });
    //----------
    //Object.defineProperty(this, 'isObject', {configurable:false, writable:false, value:true});
    //Object.defineProperty(this, 'ID',       {configurable:false, writable:false, value:objectID});
    //Object.defineProperty(this, 'pages',    {configurable:false, writable:false, value:pages});
    //Object.defineProperty(this, 'module',   {configurable:false, writable:false, value:module});
    //----------
} // end function "SimpleText"
SimpleText.prototype = Object.create(tSimpleObject.prototype);
SimpleText.prototype.constructor = SimpleText;
//--------------------------------------------------
SimpleText.prototype.next = function () {
    //----------
    if (this.pages.current < this.pages.texts.length - 1) {
        this.pages.current++;
        //----------
        print(this.pages.texts[this.pages.current]);
    } else {
        this.pages.current = -1;
        //----------
        AZ.outputLayers.pop();
        //----------
        if (typeof(this.module) == 'function') {
            this.module();
        } // end if
        //----------
        AZ.updateAvailableObjects();
        //----------
        PARSER.pre_parse();
        DEBUG.updateWordsFullList();
        DEBUG.updateWordsShortList();
    } // end if
    //----------
} // end function "<SimpleText>.Next"
//--------------------------------------------------
SimpleText.prototype.print = function () {
    //----------
    AZ.outputLayers.push(this);
    //----------
    AZ.updateAvailableObjects();
    //this.pages.current = -1;
    //----------
    this.next();
    //----------
} // end function "<SimpleText>.Next"
//--------------------------------------------------
//SimpleText.prototype.Action = tSimpleObject.prototype.Action;
/* --------------------------------------------------------------------------- */
