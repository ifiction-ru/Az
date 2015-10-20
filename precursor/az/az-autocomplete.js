/* --------------------------------------------------------------------------- */
// Объект "AUTOCOMPLETE" предназначен для формирования перечня слов для автодополнения при вводе текстовых команд.
	// Объект используется:
	// 		— В модуле az-dictionary, в объекте "DICTIONARY" (для уточнения перечня слов, включаемых или исключаемых из автодополнения).
	// 		— В модуле az-debug, в объекте "DEBUG" (для вывода перечня слов для целей отладки).
/* --------------------------------------------------------------------------- */
window.AUTOCOMPLETE = (function() {
	//--------------------------------------------------
	var ac_data;
	var ac_morphs;
	//----------
	var ac_exclude;
	//----------
	var ac_action;
	//----------
	var ac_chars = 0;
	//--------------------------------------------------
	/* Формат базы данных "db_autocomplete":
		bid		Уникальный числовой идентификатор слова
		fid		Числовой идентификатор формы-автодополнения
		inc		Включать или нет слово в автодополнение
		---------- */
		var db_autocomplete = TAFFY();
	//--------------------------------------------------
	_init();
	//--------------------------------------------------
	function _init (_bids_list) {
		//----------
		ac_data = [];
		ac_data.push({list:{'full':[], 'Г':[], 'С':[], 'other':[]}});
		ac_data.push({list:{'full':[], 'Г':[], 'С':[], 'other':[]}});
		//----------
		_start(0);
		_start(1);
		//----------
		ac_exclude	= db_autocomplete({'bid':_bids_list, 'inc':false}).select('fid');
		ac_morphs	= {};
		ac_action	= false;
		//----------
	} // end function "init"
	//--------------------------------------------------
	function _add (_list, _word, _morph) {
		var lst = (_morph == 'Г' || _morph == 'С') ? _list[_morph] : _list['other'];
		//----------
		if (lst.indexOf(_word) == -1) {
			lst.push(_word);
			ac_morphs[_word] = _morph;
		} // end if
		//----------
	} // end function "_add"
	//--------------------------------------------------
	function _sort (_list) {
		_list['Г'].sort();
		_list['С'].sort();
		_list['other'].sort();
		//----------
		_list['full'] = _list['Г'].concat(_list['С'].concat(_list['other']));
	} // end function "_sort"
	//--------------------------------------------------
	function _start (_type) {
		ac_data[_type].position	= -1;
		ac_data[_type].word		= '';
		ac_data[_type].morph	= '';
	} // end function "_start"
	//--------------------------------------------------
	return {
		//--------------------------------------------------
		init: _init,
		//--------------------------------------------------
		addWordWithFlag: function (_bid, _fid, _inc) {
			//----------
			var search = {'bid':_bid, 'fid': _fid};
			//----------
			// Ищем, нет ли уже такой связки
			var rec = db_autocomplete(search).first();
			//----------
			if (rec == false) {
				search.inc = _inc;
				db_autocomplete.insert(search);
			} // end if
			//----------
		}, // end function "AUTOCOMPLETE.addWordWithFlag"
		//--------------------------------------------------
		getByBID: function (_bid) {
			//----------
			return db_autocomplete({'bid': _bid, 'inc':true}).get();
			//----------
		}, // end function "AUTOCOMPLETE.getByBID"
		//--------------------------------------------------
		setCharsMin: function (_quantity) {
			//----------
			if (arguments.length == 0) {
				return ac_chars;
			} else {
				ac_chars = (_quantity || 0);
			} // end if
			//----------
		}, // end function "AUTOCOMPLETE.setCharsMin"
		//--------------------------------------------------
		add: function (_str, _fid, _word, _morph) {
			//----------
			if (ac_exclude.indexOf(_fid) >= 0) {return;} // end if
			//----------
			_add(ac_data[0].list, _word, _morph);
			//----------
			if (_str.length >= ac_chars) {
				_add(ac_data[1].list, _word, _morph);
			} // end if
			//----------
		}, // end function "AUTOCOMPLETE.add"
		//--------------------------------------------------
		sort: function() {
			//----------
			_sort(ac_data[0].list);
			_sort(ac_data[1].list);
			//----------
		}, // end function "AUTOCOMPLETE.sort"
		//--------------------------------------------------
		start: function() {
			//----------
			_start(0);
			_start(1);
			//----------
		}, // end function "AUTOCOMPLETE.start"
		//--------------------------------------------------
		next: function(_type) {
			_type = _type || 0;
			//----------
			ac_data[_type].position++;
			//----------
			var pos		= ac_data[_type].position;
			var list	= ac_data[_type].list['full'];
			//----------
			if (pos >= list.length) {return false;} // end if
			//----------
			ac_data[_type].word		= list[pos];
			ac_data[_type].morph	= ac_morphs[ac_data[_type].word];
			//----------
			return true;
		}, // end function "AUTOCOMPLETE.next"
		//--------------------------------------------------
		word: function(_type) {
			_type = _type || 0;
			//----------
			return ac_data[_type].word;
		}, // end function "AUTOCOMPLETE.word"
		//--------------------------------------------------
		morph: function(_type) {
			_type = _type || 0;
			//----------
			return ac_data[_type].morph;
		}, // end function "AUTOCOMPLETE.cur_morph"
		//--------------------------------------------------
		setActionFlag: function() {
			ac_action = true;
		}, // end function "AUTOCOMPLETE.setActionFlag"
		//--------------------------------------------------
		getActionFlag: function() {
			return ac_action == true ? true : false;
		}, // end function "AUTOCOMPLETE.getActionFlag"
		//--------------------------------------------------
	};
})(); // end object "AUTOCOMPLETE"
/* --------------------------------------------------------------------------- */
