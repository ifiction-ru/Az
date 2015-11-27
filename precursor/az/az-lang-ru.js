/* --------------------------------------------------------------------------- */
// КОНСТАНТЫ
    window.ДА               = true;
    window.НЕТ              = false;
    //----------
    window.БезРазницы       = ANYTHING;
    window.ЧтоУгодно        = ANYTHING;
    //----------
    window.ЛюбоеСлово       = ANYTHING;
    //----------
    window.ДляОписания      = for_description;
    window.ДляСодержимого   = for_container;
    //----------
/* --------------------------------------------------------------------------- */
// ТИПЫ ОБЪЕКТОВ
    window.Локация  = Location;
    window.Объект   = Item;
    window.Персонаж = Character;
/* --------------------------------------------------------------------------- */
// РАБОТА С ИГРОЙ
    //--------------------------------------------------
    СЧегоНачать     = startWith;
/* --------------------------------------------------------------------------- */
// РАБОТА С ОБЪЕКТАМИ
    //--------------------------------------------------
    tSimpleObject.prototype.Это         = tSimpleObject.prototype.Is;
    tSimpleObject.prototype.Описание    = tSimpleObject.prototype.setDescription;
    tSimpleObject.prototype.Упоминание  = tSimpleObject.prototype.addMention;
/* --------------------------------------------------------------------------- */
// РАБОТА С ОПИСАНИЕМ
    window.ДляВсего      = ForAll;
    window.ДляПерсонажей = ForChars;
    window.ДляОбъектов   = ForItems;
    //----------
    tSimpleObject.prototype.ВывестиОписание            = tSimpleObject.prototype.printDescription;
    tSimpleObject.prototype.ВывестиОписаниеСЗаголовком = tSimpleObject.prototype.printTitleAndDescription;
    //----------
    tSimpleObject.prototype.ПрефиксСодержимого = tSimpleObject.prototype.setPrefixForContent;
/* --------------------------------------------------------------------------- */
// РАБОТА С ПЕРСОНАЖАМИ
    //--------------------------------------------------
    tSimpleObject.prototype.СделатьТекущим  = Character.prototype.SetCurrent;
/* --------------------------------------------------------------------------- */
// РАБОТА С ТЕКСТАМИ
    //--------------------------------------------------
    window.Текст = tSimpleText;
    tSimpleText.prototype.Вывести  = tSimpleText.prototype.print;
    tSimpleText.prototype.Далее    = tSimpleText.prototype.next;
    //tSimpleText.prototype.Действие = tSimpleObject.prototype.Action;
/* --------------------------------------------------------------------------- */
// РАБОТА СО СВОЙСТВАМИ ОБЪЕКТОВ
    //--------------------------------------------------
    tSimpleObject.prototype.Свойство = tSimpleObject.prototype.Property;
    window.Установить = setProperty;
    window.Получить   = getProperty;
    window.Увеличить  = incProperty;
    window.Уменьшить  = decProperty;
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
    tSimpleObject.prototype.ВключитьДействие  = tSimpleObject.prototype.EnableAction;
    tSimpleObject.prototype.ВыключитьДействие = tSimpleObject.prototype.DisableAction;
    tSimpleObject.prototype.ВыполнитьДействие = tSimpleObject.prototype.ExecuteAction;
    //----------
    ВключитьДействие  = EnableAction;
    ВыключитьДействие = DisableAction;
    //--------------------------------------------------
    window.localizeCMD = function (CMD) {
        //----------
        CMD.Фраза        = CMD.phrase;
        CMD.Действие     = CMD.action_name;
        CMD.Команда      = CMD.phrase;
        CMD.Глагол       = CMD.verb;
        CMD.Объект       = CMD.object;
        CMD.ПрочиеСлова  = CMD.anyword;
        CMD.А            = {Объект:CMD.A.object, Слово:CMD.A.word, Предлог:CMD.A.prep};
        CMD.Б            = {Объект:CMD.B.object, Слово:CMD.B.word, Предлог:CMD.B.prep};
        CMD.В            = {Объект:CMD.C.object, Слово:CMD.C.word, Предлог:CMD.C.prep};
        //----------
        if (CMD.verb == null) {
            CMD.ФормаГлагола  = '';
            CMD.ОсноваГлагола = '';
        } else {
            CMD.ФормаГлагола  = CMD.verb.form;
            CMD.ОсноваГлагола = CMD.verb.base;
        } // end if
    }
/* --------------------------------------------------------------------------- */
// РАБОТА С АВТОДОПОЛНЕНИЕМ
    //--------------------------------------------------
    window.ЧислоСимволовДляАвтодополнения = AUTOCOMPLETE.setCharsMin;
/* --------------------------------------------------------------------------- */
// РАБОТА С ЭКРАНОМ
    //--------------------------------------------------
    window.Вывести          = print;
    window.ВывестиОдинРаз   = printOnes;
    window.ВывестиИнвентарь = printInventory;
/* --------------------------------------------------------------------------- */
// СОБЫТИЯ
    window.События = EVENTS;
    //----------
    Object.defineProperty(EVENTS, 'Перед',       {configurable:false, writable:false, value:EVENTS.BEFORE});
    Object.defineProperty(EVENTS, 'После',       {configurable:false, writable:false, value:EVENTS.AFTER});
    Object.defineProperty(EVENTS, 'ВоВремя',     {configurable:false, writable:false, value:EVENTS.DURING});
    //----------
    Object.defineProperty(EVENTS, 'Поместить',   {configurable:false, writable:false, value:EVENTS.PUT});
    Object.defineProperty(EVENTS, 'Убрать',      {configurable:false, writable:false, value:EVENTS.REMOVE});
    Object.defineProperty(EVENTS, 'Переместить', {configurable:false, writable:false, value:EVENTS.MOVE});
    //----------
    Object.defineProperty(EVENTS, 'Свойство',    {configurable:false, writable:false, value:EVENTS.PROPERTY});
    //----------
    Object.defineProperty(EVENTS, 'Действие',    {configurable:false, writable:false, value:EVENTS.ACTION});
    //----------
    Object.defineProperty(EVENTS, 'Текст',       {configurable:false, writable:false, value:EVENTS.TEXT});
    //----------
    EVENTS.setLocalization ({
        //'имя':     'name',
        //'событие': 'event',
        'локация':  'location',
        'место':    'location',
        'когда':    'when',
        'что':      'what',
        'кто':      'what',
        'кого':     'what',
        'чего':     'what',
        'текст':    'what',
        'объект':   'what',
        'предмет':  'what',
        'персонаж': 'what',
        'где':      'where',
        'откуда':   'from',
        'куда':     'to',
        'свойство': 'property',
        'значение': 'parameter',
        'параметр': 'parameter',
    });
    //----------
    window.Событие          = runEvent;
    window.РеакцияНаСобытие = ReactionOnEvent;
    //----------
    ReactionOnEvent.prototype.Включить  = ReactionOnEvent.prototype.Enable;
    ReactionOnEvent.prototype.Выключить = ReactionOnEvent.prototype.Disable;
    ReactionOnEvent.prototype.Включена  = ReactionOnEvent.prototype.IsEnable;
/* --------------------------------------------------------------------------- */
