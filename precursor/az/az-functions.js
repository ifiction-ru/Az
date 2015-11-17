/* --------------------------------------------------------------------------- */
window.iNN = function (param, value) {
    if (param === null || param === undefined || param === false) {
        return null;
    } else {
        if (typeof(param) != 'object') {
            return value;
        } else {
            return param[value];
        } // end if
    } // end if
}; // end function "iNN"
/* --------------------------------------------------------------------------- */
window.arr2str = function (arr, limit, level, fields, i) {
    if (level === undefined) {level = 0;} // end if
    if (i === undefined) {i=''};
    //----------
    level++;
    if (limit !== undefined && level > limit) {return '';} // end if
    //----------
    var result='';
    //----------
    for (var k in arr) {
        if (fields !== undefined && fields.indexOf(k) == -1) {continue;} // end if
        //----------
        var value = arr[k];
        //----------
        result += ''+i+k+': ';
        if (typeof(value) == 'object') {
            if (AZ.isObject(value)) {
                result += '#'+AZ.getID(value)+'\n';
            } else {
                result += arr2str(value, limit, level, fields, i+'    ');
            } // end if
        } else if (typeof(value) == 'function') {
            result += 'function(...)\n';
        } else {
            result += value+'\n';
        }
    } // end for
    //----------
    return result;
}; // end function "arr2str"
/* --------------------------------------------------------------------------- */
window.add_arr2arr = function (_arr, _values) {
    for (var x=0; x<_values.length; x++) {
        if (_arr.indexOf(_values[x]) == -1) {_arr.push(_values[x]);} // end if
    } // end for
}; // end function "add_arr2arr"
/* --------------------------------------------------------------------------- */
window.arr2arr = function (from) {
    var result = {};
    //----------
    for (var k in from) {
        result[k] = from[k];
    } // end for
    //----------
    return result;
}; // end function "arr2arr"
/* --------------------------------------------------------------------------- */
window.any2arr = function (_param, _add_null) {
    //----------
    if (_param === undefined) {
        _param = (_add_null == false ? [] : [null]);
        
    } else if (_param === null) {
        _param = (_add_null == false ? [] : [null]);
        
    } else if (typeof(_param) == 'string') {
        _param = (_param.trim() == '' && _add_null == false) ? [] : [_param];
        
    } else if (typeof(_param) == 'number') {
        _param = [_param];
        
    } else if (typeof(_param) == 'object') {
        if (_param.length === undefined) {
            _param = [_param];
            
        //} else if (AZ.isObject(_param) === true) {
        //    _param = [_param];
            
        }// end if
    } // end if
    //----------
    return _param;
}; // end function "any2arr"
/* --------------------------------------------------------------------------- */
/* ё2е("ёлка") — Возвращает слово, где Ё заменено на Е. */
window.ё2е = function (word) {
    return word.replace('ё', 'е');
}; // end function "ё2е"
/* --------------------------------------------------------------------------- */
window.length2symbol = function (_list) {
    //----------
    var value = typeof(_list) == 'number' ? _list : _list.length;
    //----------
    if (value == 0) {
        return 'N';
    } else if (value < 2) {
        return 'S';
    } else if (value > 1) {
        return 'P';
    } else {
        return null;
    } // end if
    //----------
}; // end function "any2arr"
/* --------------------------------------------------------------------------- */
window.object2table = function (data, result, fields, level, max, elem1) {
    // Начальная инициализация данных
        if (level == undefined)  {level = 0;} // end if
        //----------
        if (fields == undefined) {
            fields = [];
            for (var k in data)  {fields.push(k);} // end for
        } // end if
        //----------
        if (max == undefined)    {max = fields.length-1;} // end if
        //----------
        if (elem1 == undefined)  {elem1 = {};} // end if
        if (result == undefined) {result = [];} // end if
    //----------
    var field = fields[level];
    var value = data[field];
    //----------
    if (value === null || typeof(value) != 'object' || value.length === undefined) {
        value = [value];
    } // end if
    //----------
    var elem2 = {};
    for (var k in elem1) {elem2[k] = elem1[k];} // end for
    //----------
    for (var x=0; x<value.length; x++) {
        var value2 = value[x];
        //----------
        elem2[field] = value2;
        //----------
        if (level == max) {
            var elem3 = {};
            for (var k in elem2) {elem3[k] = elem2[k];} // end for
            result.push(elem3);
        } else {
            object2table(data, result, fields, level+1, max, elem2);
        } // end if
    } // end for
    //----------
} // end function "next_level"
//----------
window.text2html = function (_text) {
    //----------
    _text = _text.replace(/^\s+/gm, '\n');
    _text = markdown.makeHtml(_text);
    _text = typograph.execute(_text);
    //----------
    return _text;
    //----------
}; // end function "text2html"
/* --------------------------------------------------------------------------- */
window.param2data = function (_param, _data) {
    var result = {};
    //----------
    if (_param !== undefined) {
        if (typeof(_param) == 'object' && _param != null) {
            for (var k in _param) {
                result[k] = _param[k];
            } // end for
        } else {
            result['параметр'] = _param;
        } // end if
    } // end if
    //----------
    if (_data !== undefined) {
        for (var k in _data) {
            result[k] = _data[k];
        } // end for
    } // end if
    //----------
    return result;
}; // end function "iNN"
/* --------------------------------------------------------------------------- */

window.checkFuncDuration = function (func) {
    var start = new Date().getTime(),
        finish;

    func();
    finish = new Date().getTime();
    console.log(func.name + ' выполнилась за ' + (finish - start) + ' миллисекунд.')
};
