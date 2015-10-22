/* --------------------------------------------------------------------------- */
// КОНСТАНТЫ
    window.ДА               = true;
    window.НЕТ              = false;
    window.БезРазницы       = ANYTHING;
    window.ДляОписания      = for_description;
    window.ДляСодержимого   = for_container;
    //----------
    window.Перед            = BEFORE;
    window.После            = AFTER;
    //----------
    window.СобытиеПоместить     = EVENT_PUT;
    window.СобытиеУбрать        = EVENT_REMOVE;
    window.СобытиеПереместить   = EVENT_MOVE;
/* --------------------------------------------------------------------------- */
// ТИПЫ ОБЪЕКТОВ
    window.Локация  = Location;
    window.Объект   = Item;
    window.Персонаж = Character;
/* --------------------------------------------------------------------------- */
// РАБОТА С ОБЪЕКТАМИ
    //--------------------------------------------------
    tSimpleObject.prototype.Это         = tSimpleObject.prototype.Is;
    tSimpleObject.prototype.Описание    = tSimpleObject.prototype.setDescription;
    tSimpleObject.prototype.Упоминание  = tSimpleObject.prototype.addMention;
    //----------
/* --------------------------------------------------------------------------- */
// РАБОТА С ОПИСАНИЕМ
    window.ДляВсего     = ForAll;
    window.ДляПерсонажей    = ForChars;
    window.ДляОбъектов      = ForItems;
    //----------
    tSimpleObject.prototype.ПрефиксСодержимого = tSimpleObject.prototype.setPrefixForContent;
/* --------------------------------------------------------------------------- */
// РАБОТА С ПЕРСОНАЖАМИ
    //--------------------------------------------------
    tSimpleObject.prototype.СделатьТекущим  = Character.prototype.SetCurrent;
/* --------------------------------------------------------------------------- */
// РАБОТА СО СВОЙСТВАМИ ОБЪЕКТОВ
    //--------------------------------------------------
    tSimpleObject.prototype.Свойство = tSimpleObject.prototype.Property;
    window.Установить   = setProperty;
    window.Получить = getProperty;
/* --------------------------------------------------------------------------- */
// РАБОТА С МЕСТОНАХОЖДЕНИЕМ ОБЪЕКТОВ
    //--------------------------------------------------
    tSimpleObject.prototype.Поместить   = tSimpleObject.prototype.Put;
    tSimpleObject.prototype.Убрать      = tSimpleObject.prototype.Remove;
    tSimpleObject.prototype.Переместить = tSimpleObject.prototype.Move;
    tSimpleObject.prototype.Где         = tSimpleObject.prototype.Where;
    tSimpleObject.prototype.Находится   = tSimpleObject.prototype.isThere;
    tSimpleObject.prototype.Содержит    = tSimpleObject.prototype.Includes;
    tSimpleObject.prototype.Содержимое  = tSimpleObject.prototype.getContent;
/* --------------------------------------------------------------------------- */
// РАБОТА СО СЛОВАРЁМ
    //--------------------------------------------------
    window.Существительное  = addNoun;
    window.Местоимение      = addPronoun;
    window.Предлог          = addPrepositon;
    window.Наречие          = addAdverb;
    window.Глагол           = addVerb;
/* --------------------------------------------------------------------------- */
// РАБОТА С ПАРСЕРОМ
    //--------------------------------------------------
    tSimpleObject.prototype.Описывается = tSimpleObject.prototype.Notation;
    tSimpleObject.prototype.Действие    = tSimpleObject.prototype.Action;
/* --------------------------------------------------------------------------- */
// РАБОТА С АВТОДОПОЛНЕНИЕМ
    //--------------------------------------------------
    window.ЧислоСимволовДляАвтодополнения = AUTOCOMPLETE.setCharsMin;
/* --------------------------------------------------------------------------- */
// РАБОТА С ЭКРАНОМ
    //--------------------------------------------------
    window.Вывести          = print;
    window.ВывестиОписание  = printDescription;
    window.ВывестиИнвентарь = printInventory;
/* --------------------------------------------------------------------------- */
// РАБОТА С СОБЫТИЯМИ
    //----------
    EVENTS.setLocalization ({
        'событие': 'event',
        'локация': 'location',
        'место':   'location',
        'когда':   'when',
        'что':     'what',
        'кто':     'what',
        'кого':    'what',
        'чего':    'what',
        'где':     'where',
        'откуда':  'from',
        'куда':    'to',
    });
    //----------
    var РеакцияНаСобытие = EVENTS.addReaction;