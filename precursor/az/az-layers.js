/* --------------------------------------------------------------------------- */
"use strict";
/* --------------------------------------------------------------------------- */
// Объект для работы со слоями
window.LAYERS = (function() {
	/* --------------------------------------------------------------------------- */
	// Параметры Слой сохранения данных. Используется для реализации возможности сохранения.
		//	0 - Заполнение при инициализации.
		//	1 - Переназначение в процессе игры.
		//	2 - Переназначение в процессе последнего хода.
	var current = 0;	// Номер текущего слоя сохранения данных
	//----------
	var limit	= 4;	// Максимальное число команды "Отмена" + 1
	//----------
	var modules	= {move:[], cut:[]};	// Список модулей-обработчиков
	//--------------------------------------------------
	//Object.defineProperty(this, 'current', {configurable:false, writable:false, get:function () {return current;}});
	//--------------------------------------------------
	function move (_db, _sort, _fields) {
		//----------
		// Если текущий слой 0 или 1, то сворачивать смысла нет.
		if (current < 2) {return;} // end if
		//----------
		var list = _db({'layer':{'>':1}}).order(_sort+', layer asec').get();
		//----------
		for (var x=0; x<list.length; x++) {
			var rec = list[x];
			//----------
			var filter = {};
			for (var k in _fields) {filter[k] = rec[k];} // end for
			//----------
			_db({'layer':(rec.layer-1), _filter}).remove();
			_db(rec).update({'layer':(rec.layer-1)});
		} // end for
		//----------
	} // end function "move"
	//--------------------------------------------------
	return {
		//--------------------------------------------------
		// РАБОТА С ДАННЫМИ
			//--------------------------------------------------
			// Записываем данные в указанную базу данных
				// Параметры:	_db			— База данных (TAFFY)
				//				_filter		— Фильтр поиска, измерения в виде объект: {key: value}
				//				_value		— Значения ресуров, объект: {key: value}
			//----------
			set: function(_db, _filter, _value) {
				//----------
				//var search = _filter.slice(); // Копируем, чтобы не портить передаваемый объект
				var search = _filter;
				//----------
				search.layer = current;
				//----------
				var rec = _db(search).first();
				//----------
				if (rec != false) {
					_db(search).update(_value);
					
				} else {
					for (var k in _value) {search[k] = _value[k];} // end for
					//----------
					_db.insert(search);
				} // end if
				//----------
			}, // end function "LAYERS.set"
			//--------------------------------------------------
			// Получаем данные из указанной базы данных
				// Параметры:	_db				— База данных (TAFFY)
				//				_filter			— Фильтр поиска, измерения в виде объект: {поле: значение}
				//				_field			— Наименование поля, откуда нужно брать возвращаемое значение.
				//									Если строка — то значение, если массив — то объект {поле: значение}.
				//				_if_not_found	— Возвращаемое значение, если запись не найдена.
			//----------
			get: function(_db, _filter, _field, _if_not_found) {
				var rec = _db(_filter).order('layer desc').first();
				//----------
				if (rec == false) {
					return _if_not_found;
				} else {
					if (typeof(_field) == 'string') {
						return rec[_field];
					} else {
						var result = {};
						for (var x=0; x<_field.length; x++) {
							result[_field[x]] = rec[_field[x]];
						} // end for
						return result;
					} // end if
				}// end if
			}, // end function "LAYERS.get"
		//--------------------------------------------------
		// РАБОТА СО СЛОЯМИ ДАННЫХ
			//--------------------------------------------------
			addHandler: function(_type, _data) {
				modules[_type.trim().toLowerCase()].push(_data);
			}, // end function "AZ.addLayerMoveModule"
			//--------------------------------------------------
			add: function() {
				current++; // Увеличиваем счётчик слоёв
				//----------
				// Если счётчик слоёв превышает максимальное значение, то...
				if (current > limit) {
					// запускаем модули сдвижки слоёв
					for (var x=0; x<modules.move.length; x++) {
						var rec = modules.move[x];
						//----------
						move(rec.db, rec.sort, rec.filter);
					} // end for
					//----------
					current = limit; // Присваиваем счётчику слоёв максимально возможное значение
				} // end if
			}, // end function "AZ.addLayer"
			//--------------------------------------------------
			cut: function() {
				//----------
				// +++ Сделать сдвижку слоёв на нужно число, чтобы в итоге осталось равное limit
				//----------
			}, // end function "LAYERS.cut"
		//--------------------------------------------------
	}; // end return
})(); // end object "LAYERS"
/* --------------------------------------------------------------------------- */
