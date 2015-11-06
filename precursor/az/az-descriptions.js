/* --------------------------------------------------------------------------- */
// Описание объекта-описания
window.tDescription = function (_object) {
    var OWNER = _object;
    //----------
    Object.defineProperty(this, 'OWNER', {configurable:false, writable:false, value:OWNER});
    //----------
    this.descr_title    = '';
    this.descr_text     = '';
    //----------
    this.descr_prefix   = {
        'AN':'', 'AS':'', 'AP':'',
        'CN':'', 'CS':'', 'CP':'',
        'IN':'', 'IS':'', 'IP':'',
        };
    //----------
    this.descr_includes = [];
    //----------
} // end function "tDescription"
/* --------------------------------------------------------------------------- */
tDescription.prototype.set = function (_title, _description, _list_inside) {
    //----------
    this.descr_title    = _title;
    this.descr_text     = _description;
    //----------
    _list_inside = any2arr(_list_inside, false);
    //----------
    for (var x=0; x<_list_inside.length; x++) {
        var id = AZ.getID(_list_inside[x]);
        if (id != null) {this.descr_includes.push(id)} // end if
    } // end for x
    //----------
}; // end function "<Объект>.set"
/* --------------------------------------------------------------------------- */
tDescription.prototype.setPrefix = function (_type, _none, _singular, _plural) {
    _type   = _type || ForAll;
    _none   = _none || '';
    //----------
    this.descr_prefix[_type+'N']    = _none;
    this.descr_prefix[_type+'S']    = _singular;
    this.descr_prefix[_type+'P']    = _plural;
    //----------
}; // end function "<Объект>.setPrefix"
/* --------------------------------------------------------------------------- */
tDescription.prototype.getPrefix = function () {
    //----------
    return this.descr_prefix;
    //----------
}; // end function "<Объект>.setPrefix"
/* --------------------------------------------------------------------------- */
tDescription.prototype.getTitle = function (_param, _html) {
    _html = _html || false;
    //----------
    var _title = (typeof(this.descr_title) == 'function') ? this.descr_title(_param) : this.descr_title;
    //----------
    return _html == false ? _title : DECOR.Description.getTitle(_title, this.OWNER);
    //----------
}; // end function "<Объект>.getTitle"
/* --------------------------------------------------------------------------- */
tDescription.prototype.getText = function (_param, _html) {
    /*var counter = getProperty(this.OWNER, 'descr.counter');
    if (counter === undefined) {
        setProperty(this.OWNER, 'descr.counter', 1);
        counter = 1;
    } // end if
    //----------
    if (_param === undefined) {
        _param = {'счётчик': counter};
    } // end if*/
    var text    = (typeof(this.descr_text) == 'function') ? this.descr_text(_param) : this.descr_text;
    //----------
    //setProperty(this.OWNER, 'descr.counter', counter+1);
    //----------
    var ownerID = AZ.getID(this.OWNER);
    //----------
    var descr = {
        text:       '',
        mentions:   {full:[], characters:[], items:[]},
        content:    {full:[], characters:[], items:[]},
        prefix:     this.descr_prefix,
    };          
    //----------
    // Получаем перечень объектов, которые автор указал как упомянутые в описании
    var list_already    = this.descr_includes.slice();
    //----------
    // Получаем содержимое объекта
    var list_inside = this.OWNER.getContent();
    //----------
    var obj = null;
    //----------
    // Вставляем упоминания
    text = text.replace(/\[\[(.+?)\]\]/gim, function (_str, _id) {
        //----------
        obj = AZ.getObject(_id);
        //----------
        if (obj == null) {
            console.error('При формировании описания "'+ownerID+'" не найден упомянутый объект "'+_id+'"!');
            return '???';
        } else {
            var mention = obj.mentions.get(for_description, this.OWNER);
            //----------
            list_already.push(_id);
            //----------
            return (mention === null) ? '' : (DECOR.getMention(mention, 0));
        } // end if
    }); // Конец перебора упоминаний в описании объекта
    //----------
    descr.text = text;
    //----------
    // Вычленяем упомянутые в тексте описания объекты
    // Последовательно перебираем все слова описания и сравниваем их с базой привязанных к объектам слов
    var obj_inside = text.match( /[a-zA-Zа-яёА-ЯЁ0-9\-\']+/mig );
    for (var x=0; x<obj_inside.length; x++) {
        // Получаем слово
        var word = DICTIONARY.getFormIDs(obj_inside[x]);
        //----------
        if (word != null) {
            var list = PARSER.get_objects_by_word({'priority':0, 'loc':[ownerID,null], 'wid':word.bid}); // Ищем по этому слову объект
            //----------
            for (var y=0; y<list.length; y++) {list_already.push(list[y]);} // end for y
        } // end if
    } // end for x - Закончили перебирать слова текста
    //----------
    // Вычищаем из содержимого те объекты, что указаны автором и упомянуты в тексте описания
    var x=0;
    while (x < list_inside.length) {
        if (list_already.indexOf(AZ.getID(list_inside[x].what)) == -1) {
            x++;
        } else {
            list_inside.splice(x, 1);
        } // end if
    } // end while
    //----------
    // Дополняем описание содержимым объекта
    var x=0;
    while (x < list_inside.length) {
        obj = list_inside[x].what;
        //----------
        var mention = obj.getMention(for_container, this.OWNER);
        if (mention == null) {
            x++;
        } else {
            descr.mentions.full.push(mention);
            if (obj.type == 'character') {
                descr.mentions.characters.push(mention);
            } else {
                descr.mentions.items.push(mention);
            } // end if
            //----------
            list_inside.splice(x, 1);
        } // end if
    } // end while
    //----------
    for (var x=0; x<list_inside.length; x++) {
        var rec = list_inside[x];
        //----------
        descr.content.full.push(rec);
        if (obj.type == 'character') {
            descr.content.characters.push(rec);
        } else {
            descr.content.items.push(rec);
        } // end if
        //----------
    } // end for
    //----------
    AZ.getProtagonist().markContainerAsExam(this.OWNER);
    //----------
    return DECOR.Description.getText(descr, this.OWNER);
    //----------
}; // end function "<Объект>.description.getText"
/* --------------------------------------------------------------------------- */
