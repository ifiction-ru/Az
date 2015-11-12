/* --------------------------------------------------------------------------- */
// РАБОТА С ПЕРСОНАЖАМИ
//--------------------------------------------------
// Объявление объекта с типом "Персонаж"
window.Character = function (_id) {
    tSimpleObject.apply(this,arguments);
    //----------
    this.type           = 'character'; // Тип данных
    //----------
    this.what_he_saw    = {now:[], past:[]}; // Перечень увиденных персонажем объектов
    this.what_he_exam   = {now:[], past:[]}; // Перечень осмотренных персонажем контейнеров
    //----------
} // end function "Character"
Character.prototype = Object.create(tSimpleObject.prototype);
Character.prototype.constructor = Character;
//--------------------------------------------------
Character.prototype.SetCurrent = function() {
    AZ.setProtagonist(this);
    //----------
    return true;
}; //end function "<Character>.SetCurrent"
/* --------------------------------------------------------------------------- */
