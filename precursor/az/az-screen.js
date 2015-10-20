/* --------------------------------------------------------------------------- */
// Вывод на экран
window.SCREEN = {
	Out: function (text, _panel) {
		if (_panel === undefined) {_panel = 'main-output'} // end if
		//----------
		var EL=document.getElementById(_panel);
		//----------
		if (EL!=null) {
			EL.innerHTML+=text;
		};
	}, // end function "Out"
	//----------
	Clear: function (_panel) {
		if (_panel === undefined) {_panel = 'main-output'} // end if
		//----------
		var EL=document.getElementById(_panel);
		//----------
		if (EL!=null) {
			EL.innerHTML='';
		} // end if
	}, // end function "Clear"
};
/* --------------------------------------------------------------------------- */
window.print = function (_text) {
	//----------
	SCREEN.Out(_text);
	//----------
};
/* --------------------------------------------------------------------------- */
window.printCommand = function (_text) {
	//----------
	SCREEN.Out(DECOR.Command.print(_text));
	//----------
};
/* --------------------------------------------------------------------------- */
window.printDescription = function (_object, _param) {
	var object = AZ.getObject(_object);
	//----------
	// +++ Что делать, если объект для описания не найден
	if (object != null) {
		SCREEN.Out(object.getDescription(_param));
	} // end if
	//----------
}; // end function "printDescription"
/* --------------------------------------------------------------------------- */
window.printInventory = function () {
	//----------
	SCREEN.Out(DECOR.Inventory.get());
	//----------
};
/* --------------------------------------------------------------------------- */
