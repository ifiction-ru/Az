"use strict";
/* --------------------------------------------------------------------------- */
// Общий игровой объект
window.AZ = (function() {
	// Параметры Слой сохранения данных. Используется для реализации возможности сохранения.
		//	0 - Заполнение при инициализации.
		//	1 - Переназначение в процессе игры.
		//	2 - Переназначение в процессе последнего хода.
	//----------
	var protagonist	= {object:null, ID:null}; // Текущий персонаж
	var position	= {object:null, ID:null}; // Текущее местоположение (персонажа)
	//----------
	var available_objects		= [];
	var available_objects_IDs	= [];
	//----------
	var objects_list = {}; // Ассоциативный массив для хранения ссылок на объекты игры по их строковому ID.
	//--------------------------------------------------
	function updateAvailableObjects () {
		var objects1 = position.object.container.getContent();
		var objects2 = protagonist.object.container.getContent();
		//----------
		var objects=objects1.concat(objects2);
		//----------
		objects.unshift({'what': protagonist.object, 'where': position.object, 'quanity':1});
		objects.unshift({'what': position.object, 'where': position.object, 'quanity':1});
		//----------
		// +++ Известные игроку контейнеры в инвентаре и локации
		//----------
		available_objects		= [];
		available_objects_IDs	= [];
		//----------
		for (var x=0; x<objects.length; x++) {
			var object = AZ.getObject(objects[x].what);
			//----------
			available_objects.push(object);
			available_objects_IDs.push(AZ.getID(object));
		} // end for x
		//----------
		//return this.available_objects;
	}; // end function "CONTAINERS.get_available_objects"
	//--------------------------------------------------
	return {
		//--------------------------------------------------
		// РАБОТА С БАЗОВЫМИ ОБЪЕКТАМИ
			//--------------------------------------------------
			// Добавляем объект в "objects_list", чтобы можно было всегда получить по строковому ID сам объект.
			addObject: function(_id, _object) {
				_id = _id.trim().toUpperCase();
				//----------
				if (objects_list[_id] !== undefined) {
					console.error('Объект с ID "'+_id+'" уже есть в базе!');
					return null;
				} // end if
				//----------
				objects_list[_id] = _object;
				//----------
				return _id;
			}, // end function "AZ.addObject"
			//--------------------------------------------------
			getObject: function(_id, _error) {
				_id = _id || null;
				//----------
				if (_error === undefined) {_error = false;} // end if
				//----------
				var object = null;
				//----------
				if (_id !== null) {
					if (typeof(_id) == 'string') {
						object = objects_list[_id.trim().toUpperCase()];
					} else if (this.isObject(_id) == true) {
						object = _id;
					} // end if
				} // end if
				//----------
				if (object === null && _error == true) {
					console.error('Объект с ID "'+_id+'" не найден!');
				} // end if
				//----------
				return object;
			}, // end function "AZ.getObject"
			//--------------------------------------------------
			getID: function(_object, _error) {
				if (_error === undefined) {_error = false;} // end if
				//----------
				var object = _object || null;
				//----------
				if (object != null) {
					if (typeof(object) == 'string') {
						object = objects_list[_object.trim().toUpperCase()];
					} else if (this.isObject(object) == false) {
						object = null;
					} // end if
				} // end if
				//----------
				if (object != null) {
					return object.ID;
				} else {
					if (_error ==  true) {console.error('Объект с "'+_object+'" не найден!');} // end if
					return null;
				} // end if
				//----------
			}, // end function "AZ.getID"
			//--------------------------------------------------
			isObject: function(_object) {
				if (typeof(_object) == 'string') {
					_object = this.getObject(_object);
				} else if (_object.isObject !== true) {
					_object = null;
				} // end if
				//----------
				return (_object == null) ? false : true;
			}, // end function "AZ.addObject"
			//--------------------------------------------------
			isEqual: function(_obj1, _obj2) {
				var id1 = this.getID(_obj1);
				return (id1 != null && id1 == this.getID(_obj2)) ? true : false;
			}, // end function "AZ.addObject"
			//--------------------------------------------------
			isAvailable: function(_object) {
				var id = this.getID(_object);
				//----------
				if (id == null) {return false;} // end if
				//----------
				return available_objects_IDs.indexOf(id) == -1 ? false : true;
			}, // end function "AZ.addObject"
		//--------------------------------------------------
		// РАБОТА С ОБЪЕКТАМИ ИГРЫ
			//--------------------------------------------------
			setProtagonist: function(_character) {
				if ((_character || null) == null) {
					console.error('Передан пустой персонаж!');
				} else {
					protagonist.object	= AZ.getObject(_character);
					protagonist.ID		= AZ.getID(protagonist.object);
					//----------
					var loc = protagonist.object.container.where();
					//----------
					if (loc != null) {this.setLocation(loc);} // end if
				}// end if
			}, // end function "AZ.setProtagonist"
			//--------------------------------------------------
			getProtagonist: function(_as_id) {
				_as_id = _as_id || false;
				//----------
				return protagonist.object == null ? null : (_as_id == false ? protagonist.object : protagonist.ID);
			}, // end function "AZ.getProtagonist"
			//--------------------------------------------------
			setLocation: function(_location) {
				var loc = AZ.getObject(_location);
				//----------
				if (loc != null) {
					position.object	= loc;
					position.ID		= AZ.getID(loc);
				}// end if
			}, // end function "AZ.setProtagonist"
			//--------------------------------------------------
			getLocation: function(_as_id) {
				_as_id = _as_id || false;
				//----------
				return position.object == null ? null : (_as_id == false ? position.object : position.ID);
			}, // end function "AZ.getLocation"
			//--------------------------------------------------
			doBeforeUserAction: function() {
				updateAvailableObjects();
				//----------
				if (DEBUG.isEnable() == true) {
					DEBUG.updatePanelForObjects();
				} // end if
			}, // end function "AZ.doBeforeUserAction"
		//--------------------------------------------------
		available_objects: function (_only_id) {
			return ((_only_id || false) == false) ? available_objects.slice() : available_objects_IDs.slice();
		}, // end function "AZ.available_objects"
		//--------------------------------------------------
		addWordToCommand : function (_text) {
			var field = document.getElementById('user_command');
			//----------
			if (field == null) {return;}
			//----------
			var value	= field.value;
			var lsymbol	= value.substr(-1);
			if (lsymbol == ' ' || lsymbol == '\t') {
				field.value = value + _text + ' ';
			} else {
				var pos = value.lastIndexOf(' ');
				if (pos == -1) {
					field.value = _text + ' ';
				} else {
					field.value = value.substr(0, pos)+ ' ' + _text + ' ';
				} // end if
			} // end if
			//----------
			preparsing(field);
			//----------
			field.focus();
		}, // end function "AZ.addWordToCommand"
		/* --------------------------------------------------------------------------- */
	};
})(); // end object "AZ"
/* --------------------------------------------------------------------------- */
// Обработка нажатия клавиш игроком
window.userInput = function (field, event) {
	if (event.which == null) { // IE
		if (event.keyCode == 13) {
			parseIt(field);
		} // end if
	} // end if
	//----------
	if (event.which != 0 && event.charCode != 0) { // все кроме IE
		if (event.which == 13) {
			parseIt(field);
		} // end if
	} // end if
	//----------
	return true; // спец. символ
}; // end function "user_input"
/* --------------------------------------------------------------------------- */
window.parseIt = function (field) {
	printCommand(field.value);
	//----------
	var CMD = PARSER.parse(field.value);
	//----------
	field.value='';
	//----------
	/*if (CMD.verb===null && CMD.noun1===null && CMD.noun2===null && CMD.noun3===null) {
		SCREEN.Out('Ничего не понятно'+br+br);
		return false;
	}*/ // end if
	//----------
	/*console.log('------------------------------');
	console.log('Команда: "'+CMD.phrase+'"');
	console.log('глагол: '+(CMD.verb == null ? null : '"'+CMD.verb.base+'" ('+CMD.verb.bid+')'));
	//----------
	for (var x=1; x<=3; x++) {
		if (CMD.params[x] != null || CMD.objects[x] != null ) {
			var prep_txt = CMD.params[x] == null ? '' : (CMD.params[x].prep == null ? '' : ' "'+CMD.params[x].prep.base+'" ('+CMD.params[x].prep.bid+') + ');
			console.log('объект #'+x+': '+(CMD.params[x] == null ? '---' : 'слово '+prep_txt+'"'+CMD.params[x].base+'" ('+CMD.params[x].bid+')')+(CMD.objects[x] == null ? '' : ' [ '+CMD.objects[x].ID+', действие #'+CMD.actions[x]+' ]'));
		} // end if
	} // end for x*/
	//----------
	var action_id = null;
	//----------
	for (var priority=1; priority<=3; priority++) {
		if (CMD.objects[priority] == null) {continue;} // end if
		//----------
		action_id = CMD.actions[priority];
		//----------
		if (action_id != null) {
			var _action = CMD.objects[priority].actions_list[action_id-1];
			//----------
			_action(CMD);
			//----------
			break;
		} // end if
		//----------
	} // end for priority
	//----------
	if (action_id == null) {
		print('Ничего не понятно.');
	} // end if
	//----------
	AZ.doBeforeUserAction();
};
/* --------------------------------------------------------------------------- */
window.preparsing = function (field) {
	//----------
	var command = field.value || '';
	//----------
	if (command.trim() == '') {
		PARSER.pre_parse();
	} else {
		PARSER.parse(command, true);
	} // end if
	//----------
	DEBUG.updateWordsFullList();
	DEBUG.updateWordsShortList();
}; // end function "preparsing"
/* --------------------------------------------------------------------------- */
window.START = function (_param) {
	var character = AZ.getProtagonist() || null;
	//----------
	if (character == null) {
		console.error('Не задан текущий персонаж игры!');
		return;
	} // end if
	//----------
	if (AZ.getLocation() == null) {
		console.error('Не задано местонахождение текущего персонажа игры!');
		return;
	} // end if
	//----------
	AZ.doBeforeUserAction();
	//----------
	var loc = AZ.getLocation();
	//----------
	SCREEN.Out(loc.getTitle(null, true) + loc.getDescription());
	//----------
	preparsing({value:''});
}; // end function "START"
/* --------------------------------------------------------------------------- */
