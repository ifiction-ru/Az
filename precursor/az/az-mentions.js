/* --------------------------------------------------------------------------- */
// Упоминания объекта в разных местах и для разных целей, их может быть несколько
window.tMentions = function (_object) {
	var OWNER = _object;
	//----------
	Object.defineProperty(this, 'OWNER', {configurable:false, writable:false, value:OWNER});
	//----------
	this.mentions_list = [];
	//----------
}; // end function "tMentions"
/* --------------------------------------------------------------------------- */
// Функция "add" добавляет упоминание об объекте
tMentions.prototype.add = function (_purpose, _where, _text) {
	// Если параметр "для чего" не заполнен, то приводим его к константе ANYTHING
	if ((_purpose || true) === true) {_purpose = ANYTHING;}
	//----------
	// Если объект передан строкой-идентификатором, то определяем сам объект
	_where = AZ.getID(_where);
	//----------
	// Если параметр "где" пустой, то приводим его к константе ANYTHING
	if (_where == null) {_where = ANYTHING;}
	//----------
	var mention = {
		purpose:	_purpose,
		where:		_where,
		text:		_text};
	//----------
	this.mentions_list.push(mention);
	//----------
	return true;
}; // end function "<Объект>.mentions.add"
//--------------------------------------------------
tMentions.prototype.get = function(_purpose, _where) {
	if (_purpose === undefined) {_purpose = ANYTHING;} // Если параметр "для чего" не заполнен, то приводим его к константе ANYTHING
	//----------
	_where = AZ.getID(_where);
	if (_where == null) {_where = ANYTHING}; // Если параметр "где" пустой, то приводим его к константе ANYTHING
	//----------
	var mention_for_all				= null;
	var mention_for_all_objects		= null;
	var mention_for_all_purposes	= null;
	var mention_for_this			= null;
	//----------
	// Начинаем перебор всех возможных упоминаний объекта
	for (var x=0; x<this.mentions_list.length; x++) {
		var rec = this.mentions_list[x];
		//----------
		// Данное упоминание подходит для любых ситуаций
		if (rec.purpose === ANYTHING && rec.where === ANYTHING) {
			mention_for_all = rec;
			
		// Данное упоминание подходит для любых "для чего" по переданному объекту
		} else if (rec.purpose === ANYTHING && rec.where === _where) {
			mention_for_all_purposes = rec;
			
		// Данное упоминание подходит для любого объекта по переданному "для чего"
		} else if (rec.purpose === _purpose && rec.where === ANYTHING) {
			mention_for_all_objects = rec;
			
		} else if (rec.purpose === _purpose && rec.where === _where) {
			mention_for_this = rec;
			
		} // end if
		//----------
	} // end for : Заканчиваем перебор всех возможных упоминаний объекта
	//----------
	if (mention_for_this === null) {
		if (mention_for_all_purposes !== null) {
			mention_for_this = mention_for_all_purposes;
			
		} else if (mention_for_all_objects !== null) {
			mention_for_this = mention_for_all_objects;
			
		} else if (mention_for_all !== null) {
			mention_for_this = mention_for_all;
			
		} // end if
		
	} // end if
	//----------
	if (mention_for_this === null) {
		return null;
		
	} else {
		var mention = mention_for_this.text;
		//----------
		if (typeof(mention) == 'string') {
			return mention;
		} else if (typeof(mention) == 'function') {
			return mention(_purpose, AZ.getObject(_where));
		} // end if
	} // end if
	//----------
}; // end function "<Объект>.mentions.get"
//--------------------------------------------------
