/* --------------------------------------------------------------------------- */
// Модуль-прослойка для оформления игры. Связывает движок с конкретным оформлением.
window.DECOR = (function() {
	//--------------------------------------------------
	return {
	// Движок запрашивает оформление упоминания объекта
		//----------
		// Параметры:
		//		_text	- текст упоминания
		//		_type	- тип упоминания:	0 - в составе описания
		//									1 - в составе содержимого
		//		_object	- объект, в описании которого используется упоминание
	//----------
	getMention: function (_text, _type, _object) {
		//----------
		// +++ Обработчик из конкретной темы (когда она появится)
		//----------
		// А пока прописываем всё тут
		if (_text.trim() == '') {
			return '';
		} else {
			return (_type == 0 ? _text : '<p>'+_text+'</p>');
		} // end if
		//----------
	}, // end function "DECOR.getMention"
	//--------------------------------------------------
	getContent: function (_type, _list, _prefix) {
		//----------
		var result = '';
		//----------
		if (_list.length == 0) {
			result = _prefix[_type+'N'];
		} else {
			result = DECOR.Enumeration.getList(_list, _prefix[_type+length2symbol(_list.length)]);
		} // end if
		//----------
		return result;
	}, // end function "DECOR.getContent"
	//--------------------------------------------------
	Description: {
		getTitle: function  (_title, _object) {
			return '<h1>'+_title+'</h1>';
		}, // end function "DECOR.getTitle"
		//----------
		getText: function (_descr, _object) {
			// +++ Типограф
			//----------
			var result	= '';
			//----------
			result += '<p>' + _descr.text + '</p>'; // Добавляем основной текст описания
			//----------
			// Добавляем к тексту упоминания персонажей
			for (var x=0; x<_descr.mentions.characters.length; x++) {
				result += DECOR.getMention(_descr.mentions.characters[x], 1);
			} // end for
			//----------
			// Добавляем к тексту упоминания прочих объектов
			for (var x=0; x<_descr.mentions.items.length; x++) {
				result += DECOR.getMention(_descr.mentions.items[x], 1);
			} // end for
			//----------
			result += DECOR.getContent(ForAll, _descr.content.full, _descr.prefix);
			//----------
			return result;
		}, // end function "DECOR.getText"
	},
	//--------------------------------------------------
	Enumeration: {
		getElement: function (_text) {
			return _text;
		}, // end function "getElement"
		//----------
		getDelimeter: function (_is_last) {
			return (_is_last == 0 ? ', ' : ' и ');
		}, // end function "getDelimeter"
		//----------
		getEnd: function () {
			return '.';
		}, // end function "getEnd"
		//----------
		getPrefix: function (_text) {
			return _text;
		}, // end function "getPrefix"
		//----------
		getBlock: function (_text) {
			return '<p>'+_text+'</p>';
		}, // end function "getBlock"
		//----------
		getList: function (_list, _prefix) {
			if (_list.length == 0) {return '';} // end if
			//----------
			var result = '';
			//----------
			var delim_mid	= DECOR.Enumeration.getDelimeter(0);
			var delim_last	= DECOR.Enumeration.getDelimeter(1);
			//----------
			for (var x=0; x<_list.length; x++) {
				var object = _list[x].what;
				//----------
				var title = DECOR.Enumeration.getElement(object.getTitle(null, false));
				//----------
				if (result == '') {
					result = title;
				} else {
					result = result + (x == _list.length-1 ? delim_last : delim_mid) + title;
				} // end if
			} // end for
			//----------
			result = ((_prefix || '') == '' ? '' : DECOR.Enumeration.getPrefix(_prefix)) + result;
			//----------
			result += DECOR.Enumeration.getEnd();
			//----------
			result = DECOR.Enumeration.getBlock(result);
			//----------
			return result;
		}, // end function "getList"
	},
	//--------------------------------------------------
	Inventory: {
		get: function () {
			var hero = AZ.getProtagonist();
			//----------
			var result = DECOR.getContent(ForAll, hero.getContent(), hero.getPrefixForContent());
			//----------
			return result;
		}, // end function "Inventory"
	},
	//--------------------------------------------------
	Command: {
		print: function (_text) {
			return '<p><b>&gt; '+_text+'</b></p>'
		}, // end function "Inventory"
	},
	//--------------------------------------------------
	
	};
	//--------------------------------------------------
})(); // end object "DECOR"
/* --------------------------------------------------------------------------- */
