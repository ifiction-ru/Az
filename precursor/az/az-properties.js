/* --------------------------------------------------------------------------- */
window.PROPERTIES = (function() {
	/* --------------------------------------------------------------------------- */
	/* Формат базы данных "db_values":
		layer	Номер слоя данных
		simple	Признак свойства: false — свойство объекта "Объект.Имя", true — произвольное свойство Получить(Имя, Объект)
		object	Уникальный идентификатор объекта
		name	Имя свойства
		value	Значение свойства */
	var db_values = TAFFY(); // База данных для хранения данных
	//--------------------------------------------------
	LAYERS.addHandler('move', {'db':db_values, 'sort':'object asec, name asec, simple asec', 'filter':['object', 'name', 'simple']});
	//--------------------------------------------------
	return {
		//--------------------------------------------------
		create: function(_name, _value) {
			PROPERTIES.set(false, AZ.getID(this), _name, _value);
			//----------
			Object.defineProperty(this, _name, {
				set: function(_value) {
					//----------
					// +++ При записи свойства объекта
					//----------
					PROPERTIES.set(false, AZ.getID(this), _name, _value);
				},
				get: function() {
					var value = PROPERTIES.get(false, AZ.getID(this), _name);
					//----------
					// +++ При получении свойства объекта
					//----------
					return value;
				}
			});
			//----------
		}, // end function "PROPERTIES.create"
		//--------------------------------------------------
		set: function (_simple, _object, _name, _value) {
			if (_value === undefined) {_value = null;} // end if
			//----------
			LAYERS.set(db_values, {'simple':_simple, 'object':_object, 'name':_name}, {'value':_value});
			//----------
		}, // end function "PROPERTIES.set"
		//--------------------------------------------------
		get: function(_simple, _object, _name) {
			//----------
			return LAYERS.get(db_values, {'simple':_simple, 'object':_object, 'name':_name}, 'value', undefined);
			//----------
		}, // end function "PROPERTIES.get"
		//--------------------------------------------------
	};
})(); // end object "PROPERTIES"
/* --------------------------------------------------------------------------- */
window.setProperty = function (_name, _object, _value) {
	if (arguments.length == 2) {
		_value	= _object;
		_object = null;
	} else {
		_object = _object || null;
	} // end if
	//----------
	if (_object != null && AZ.isObject(_object) == true) {
		_object = AZ.getID(_object);
	} // end if
	//----------
	PROPERTIES.set(true, _object, _name, _value);
}; // end function "setProperty"
/* --------------------------------------------------------------------------- */
window.getProperty = function (_name, _object) {
	_object = _object || null;
	//----------
	if (_object != null && AZ.isObject(_object) == true) {
		_object = AZ.getID(_object);
	} // end if
	//----------
	return PROPERTIES.get(true, _object, _name);
}; // end function "getProperty"
/* --------------------------------------------------------------------------- */
