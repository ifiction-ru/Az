define(['modules/az-utils', 'modules/az-constants', 'modules/az-engine', 'modules/az-decor', 'modules/az-dictionary', 'modules/az-parser'],
function (utils, cons, engine, decor, dict, parser) {
    'use strict';

    /**
     * Объект-описание
     * @param objOwner
     * @constructor
     */
    var Description = function (objOwner) {
        Object.defineProperty(this, 'OWNER', { configurable: false, writable: false, value: objOwner });

        this.title    = '';
        this.text     = '';

        this.prefix   = {
            'AN': '', 'AS': '', 'AP': '',
            'CN': '', 'CS': '', 'CP': '',
            'IN': '', 'IS': '', 'IP': ''
        };

        this.includes = [];
    };

    /**
     *
     * @param title
     * @param description
     * @param listInside
     */
    Description.prototype.set = function (title, description, listInside) {
        this.title = title;
        this.text = description;

        listInside = engine.anyToArr(listInside, false);

        for (var i = 0; i < listInside.length; i++) {
            var id = engine.getId(listInside[i]);

            if (id != null) {
                this.includes.push(id)
            }
        }
    };

    /**
     *
     * @param type
     * @param none
     * @param singular
     * @param plural
     */
    Description.prototype.setPrefix = function (type, none, singular, plural) {
        type   = type || cons.ForAll;
        none   = none || '';

        this.prefix[type + 'N'] = none;
        this.prefix[type + 'S'] = singular;
        this.prefix[type + 'P'] = plural;
    };

    Description.prototype.getPrefix = function () {
        return this.prefix;
    };

    /**
     *
     * @param param
     * @param html
     * @returns {*}
     */
    Description.prototype.getTitle = function (param, html) {
        var title = typeof this.title === 'function' ? this.title(param) : this.title;

        html = html || false;

        return html == false ? title : decor.description.getTitle(title, this.OWNER);
    };

    /**
     *
     * @param param
     * @param html
     * @returns {*}
     */
    Description.prototype.getText = function (param, html) {
        var self = this,
            text = typeof this.text === 'function' ? this.text(param) : this.text,
            ownerID = engine.getId(this.OWNER),
            descr = {
                text:     '',
                mentions: { full: [], characters: [], items: [] },
                content:  { full: [], characters: [], items: [] },
                prefix:   this.prefix
            },
            // Получаем перечень объектов, которые автор указал как упомянутые в описании
            listAlready = this.includes.slice(),
            // Получаем содержимое объекта
            listInside  = this.OWNER.getContent(),
            obj = null,
            objInside;

        // Вставляем упоминания
        text = text.replace(/\[\[(.+?)\]\]/gim, function (str, id) {
            var mention;

            obj = engine.getObject(id);

            if (obj == null) {
                console.error('При формировании описания "' + ownerID + '" не найден упомянутый объект "' + id + '"!');

                return '???';
            } else {
                mention = obj.mentions.get(cons.FOR_DESC, self.OWNER);
                listAlready.push(id);

                return (mention === null) ? '' : (decor.getMention(mention, 0));
            }
        });

        descr.text = text;

        // Вычленяем упомянутые в тексте описания объекты
        // Последовательно перебираем все слова описания и сравниваем их с базой привязанных к объектам слов
        objInside = text.match( /[a-zA-Zа-яёА-ЯЁ0-9\-']+/mig );

        for (var i = 0; i < objInside.length; i++) {
            // Получаем слово
            var word = dict.getFormIds(objInside[i]);

            if (word != null) {
                var list = parser.getObjectsByWord({
                    priority: 0,
                    loc: [ownerID, null],
                    wid: word.bid
                });

                for (var k = 0; k < list.length; k++) {
                    listAlready.push(list[k]);
                }
            }
        }
        // Вычищаем из содержимого те объекты, что указаны автором и упомянуты в тексте описания
        i = 0;
        while (i < listInside.length) {
            if (listAlready.indexOf(engine.getId(listInside[i].what)) == -1) {
                i++;
            } else {
                listInside.splice(i, 1);
            }
        }

        // Дополняем описание содержимым объекта
        i = 0;
        while (i < listInside.length) {
            obj = listInside[i].what;

            var mention = obj.getMention(cons.FOR_CONT, this.OWNER);

            if (mention == null) {
                i++;
            } else {
                descr.mentions.full.push(mention);
                if (obj.type == 'character') {
                    descr.mentions.characters.push(mention);
                } else {
                    descr.mentions.items.push(mention);
                }

                listInside.splice(i, 1);
            }
        }

        for (i = 0; i < listInside.length; i++) {
            var rec = listInside[i];

            descr.content.full.push(rec);

            if (obj.type === 'character') {
                descr.content.characters.push(rec);
            } else {
                descr.content.items.push(rec);
            }
        }

        engine.getProtagonist().markContainerAsExam(this.OWNER);

        return decor.description.getText(descr, this.OWNER);
    };

    return Description;

});