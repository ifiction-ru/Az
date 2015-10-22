/* --------------------------------------------------------------------------- */
//Установить('НазваниеИгры', 'Островок');
//----------
DEBUG.Enable();
//----------
ЧислоСимволовДляАвтодополнения(2);
//----------
var ИГРОК       = new Персонаж('ИГРОК');
//----------
var Остров      = new Локация('Остров');
    var Пальма  = new Объект('Пальма');
    var Сундук  = new Объект('Сундук');
//----------
РеакцияНаСобытие({'событие':СобытиеПереместить, 'место':Остров, 'что':Сундук, 'куда':ИГРОК}, function(data) {
    //alert('Данные: '+arr2str(data, 2));
    Вывести('<p>Сундук глубоко вкопан. Просто так не вытащить из '+data.откуда.ID+'.</p>');
    return НЕТ;
});
//----------
// ИГРОК
    //ИГРОК.Описывается(['Я', 'игрок', 'персонаж', 'герой']);
    ИГРОК.Описывается(['Я', 'игрок']);
    //----------
    ИГРОК.Описание('игрок', 'Это вы.');
    //----------
    ИГРОК.СделатьТекущим();
    //----------
    ИГРОК.Поместить(Остров);
    //----------
    ИГРОК.ПрефиксСодержимого(ДляВсего, 'У вас при себе ничего нет.', 'У вас при себе есть ', 'У вас при себе есть: ');
    //----------
    ИГРОК.Действие([
        // Вариант без глагола, например: "инвентарь".
        {'А': 'инвентарь'},
        // Вариант с глаголом "осмотреть", например: "осмотреть инвентарь"
        {'глагол': 'осмотреть', 'А': 'инвентарь'},
        ],
        //----------
        function() {
            ВывестиИнвентарь();
        });
//----------
// ОСТРОВ
    Остров.Описывается(['остров']); //
    //----------
    Остров.Описание('Островок', 'Океан лениво пенится вокруг крошечного островка, который мог бы считаться настоящим раем, будь он в длину и ширину больше дюжины шагов. Тени от единственной пальмы хватает лишь на небольшой пятачок песка, и чтобы не попасть под горячие лучи солнца, приходится сидеть, поджав ноги.');
    //----------
    Остров.ПрефиксСодержимого(ДляВсего, '', 'Также тут находится ', 'Также тут находятся: ');
    //----------
    Остров.Действие([
        // Вариант без глагола, например: "остров", "островок", "вокруг".
        {'А': [Остров, 'вокруг']},
        
        // Вариант с одним глаголом "осмотреть", например: "осмотреться", "осм"
        {'где':Остров, 'глагол': 'осмотреть'},
        
        // Вариант с глаголом "осмотреть" и словами, описывающими локацию, например: "осмотреть остров", "осм вокруг", "осм по сторонам"
        {'глагол': 'осмотреть', 'А': Остров},
        
        // Вариант с глаголом "осмотреть" и наречием "вокруг", например: "осмотреть вокруг", "осм вокруг"
        {'где': Остров, 'глагол': 'осмотреть', 'А': ['вокруг']},
        
        // Вариант с глаголом "осмотреть" и наречием "вокруг", например: "осмотреть вокруг", "осм вокруг"
        {'глагол': 'осмотреть', 'Б': Остров},
        
        // Вариант с глаголом "осмотреть" и сочетанием "по сторонам", например: "осмотреться по сторонам", "осм по сторонам"
        {'где': Остров, 'глагол': [null, 'осмотреть'], 'Б': {предлоги:'по', слова:'сторонам'}},
        
        // Вариант с глаголом "осмотреть" и сочетанием "по сторонам", например: "осмотреться по сторонам", "осм по сторонам"
        {'где': Остров, 'глагол': 'осмотреть', 'Б':Остров},
        
        // Вариант с глаголом "осмотреть" и сочетанием "по сторонам", например: "осмотреться по сторонам", "осм по сторонам"
        {'глагол': 'что', 'А':Остров},
        //----------
        ],
        //----------
        function() {
            ВывестиОписание(Остров);
        });
//----------
// ПАЛЬМА
    Пальма.Описывается(['пальма', 'дерево'], null, ['е']);
    Пальма.Описание('пальма', 'Единственная пальма на острове. Массивный гибкий ствол, цепко держащийся за клочок суши посреди океана.');
    Пальма.Поместить(Остров);
    //----------
    Пальма.Действие([
        {'А': Пальма},
        // Вариант с глаголом "осмотреть".
        {'глагол': 'осмотреть', 'А': Пальма},
        ],
        //----------
        function() {
            ВывестиОписание(Пальма);
        });
//----------
// СУНДУК
    Сундук.Описывается(['сундук', 'ящик'], null, 'е');
    Сундук.ПрефиксСодержимого(ДляВсего, '', 'Внутри сундука есть ', 'Внутри сундука есть: ');
    //----------
    Сундук.Упоминание(ДляСодержимого, Остров, 'Под пальмой из песка торчит сундук.');
    Сундук.Описание('сундук', function (param) {
        if (param == undefined) {
            return 'Приличных размеров деревянный сундук, обитый железными полосками. Крышка открыта.';
        } else if (param == 'внутри') {
            return 'Внутри сундук обит кожей.';
        }
    });
    //----------
    Сундук.Поместить(Остров);
    //----------
    Сундук.Действие([
        {'А': Сундук},
        // Вариант с глаголом "осмотреть".
        {'глагол': 'осмотреть', 'А': Сундук},
        {'глагол': 'осмотреть', 'Б': Сундук},
        ],
        //----------
        function() {
            ВывестиОписание(Сундук);
        });
    //----------
    Сундук.Действие(
        {'глагол': 'взять', 'А': Сундук},
        //----------
        function() {
            if (Сундук.Переместить(ИГРОК) == true) {
                Вывести('<p>Вы приподняли сундук.</p>');
            } // end if
        });
/* --------------------------------------------------------------------------- */

//}