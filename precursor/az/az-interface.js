window.INTERFACE = (function () {
    'use strict';

    /* Polyfill Custom Event */
    (function () {
        function CustomEvent(event, params) {
            params = params || {bubbles: false, cancelable: false, detail: undefined};
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }

        if (!window.CustomEvent) {
            CustomEvent.prototype = window.Event.prototype;
            window.CustomEvent = CustomEvent;
        }
    })();

    var NAMESPACE = 'az.ui';

    var utils = {
        /**
         *
         * @param target
         * @param source
         * @returns {*|{}}
         */
        extend: function (target, source) {
            var src, copy;

            target = target || {};

            for (var name in source) {
                src = target[name];
                copy = source[name];

                if (target === copy) {
                    continue;
                }

                if (typeof copy === 'object') {
                    target[name] = Array.isArray(src) ? [] : {};
                    target[name] = utils.extend(copy, src);
                } else if (copy !== undefined) {
                    target[name] = copy;
                }
            }

            return target;
        },

        /**
         *
         * @param arg
         * @returns {*}
         */
        typeOf: function (arg) {
            if (arg === null) {
                return 'null';
            } else if (Array.isArray(arg)) {
                return 'array';
            }

            return typeof arg;
        },

        /**
         *
         * @param element
         * @returns {Array.<T>}
         */
        toArray: function (element) {
            return Array.prototype.slice.call(element);
        }
    };

    /**
     * Template Engine via Krasimir Tsonev
     * https://github.com/krasimir/absurd/blob/master/lib/processors/html/helpers/TemplateEngine.js
     * Usage: render( '{{ this.foo }}' , { foo: 'bar' });
     * @param {string} tpl
     * @param context
     */
    var render = function (tpl, context) {
        var re = /\{\{([^%>]+)?}}/g,
            reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g,
            code = 'var r=[];\n',
            cursor = 0,
            match,
            add = function(line, js) {
                js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
                    (code += line != '' ? 'r.push("' + line.replace(/\"/g, '\\"') + '");\n' : '');
                return add;
            };
        while(match = re.exec(tpl)) {
            add(tpl.slice(cursor, match.index))(match[1], true);
            cursor = match.index + match[0].length;
        }
        add(tpl.substr(cursor, tpl.length - cursor));
        code += 'return r.join("");';
        return new Function(code.replace(/[\r\t\n]/g, '')).apply(context);
    };

    /*
     * Inspired via Atom https://github.com/theshock/atomjs
     */
    var dom = {
        regexp: {
            'tag': /^[-_a-z0-9]+$/i,
            'class': /^\.[-_a-z0-9]+$/i,
            'id': /^#[-_a-z0-9]+$/i
        },

        ready: false,
        readyQueue: [],
        readyCallback: function () {
            if (!dom.ready) {
                dom.ready = true;

                for (var i = 0; i < dom.readyQueue.length; i++) {
                    dom.readyQueue[i]();
                }

                dom.readyQueue = [];
            }
        },

        camelCase: function (str) {
            return String(str).replace(/-\D/g, function (match) {
                return match[1].toUpperCase();
            });
        },

        hyphenate: function (str) {
            return String(str).replace(/[A-Z]/g, function (match) {
                return '-' + match[0].toLowerCase();
            });
        },

        each: function (elements, func) {
            elements = Array.isArray(elements) ? elements : [elements];
            Array.prototype.forEach.call(elements, func);
        },

        on: function (elements, event, callback) {
            if (elements && event && callback) {
                dom.each(elements, function (elem) {
                    elem.addEventListener(event, callback, false);
                });
            }
        },

        off: function (elements, event, callback) {
            if (elements && event) {
                dom.each(elements, function (elem) {
                    elem.removeEventListener(event, callback, false);
                });
            }
        },

        onReady: function (callback) {
            if (typeof callback === 'function') {
                dom.ready ? setTimeout(callback, 1) : dom.readyQueue.push(callback);
            }
        },

        query: function (selector, context) {
            if (typeof selector === 'string') {
                context = context || document;

                if (selector.match(dom.regexp.id)) {
                    return context.getElementById(selector.substr(1));
                } else if (selector.match(dom.regexp.class)) {
                    return context.getElementsByClassName(selector.substr(1));
                } else if (selector.match(dom.regexp.tag)) {
                    return context.getElementsByTagName(selector);
                } else {
                    return context.querySelectorAll(selector);
                }
            }
        },

        is: function (element, selector) {
            var filter;

            if (!selector) {
                return;
            }

            if (element.length) {
                element = elements[0];
            }

            filter = dom.query(selector, element.parentNode);

            if (Array.isArray(filter) ? filter.length : filter) {
                return utils.toArray(filter).indexOf(element) >= 0;
            } else {
                return false;
            }
        },

        get: function (selector, context) {
            return dom.query(selector, context)[0];
        },

        isElement: function (node) {
            return !!(node && node.nodeName);
        },

        create: function (str, properties) {
            var elem;

            str = str ? str.toString() : undefined;

            if (str) {
                if (str.indexOf('<') >=0 && str.indexOf('>') >=0) {
                    elem = document.createRange().createContextualFragment(str);
                } else {
                    elem = document.createElement(str);

                    if (utils.typeOf(properties) === 'object') {
                        for (var i in properties) {
                            if (properties.hasOwnProperty(i)) {
                                elem[i] = properties[i];
                            }
                        }
                    }
                }

                return elem;
            }
        },

        attr: function (elements, name, value) {
            if (!elements || !elements.length || !name) {
                return;
            }

            var i = elements.length;

            if (value === undefined && dom.isElement(elements[0])) {
                return elements[0].getAttribute(name);
            } else if (value === null) {
                for (i; i--;) {
                    elements[i].removeAttribute(name);
                }
            } else {
                for (i; i--;) {
                    elements[i].setAttribute(name, value);
                }
            }
        },

        /**
         * @private
         * Helper for addClass and removeClass
         * */
        withClass: function (elements, classes, func) {
            if (!elements && !classes) {
                return;
            }

            if (!Array.isArray(classes)) {
                classes = [classes];
            }

            dom.each(elements, function (elem) {
                var elemClasses = elem.className.split(/\s+/);

                for (var i = classes.length; i--;) {
                    func.call(undefined, elemClasses, classes[i]);
                }

                elem.className = elemClasses.join(' ').trim();
            });
        },

        addClass: function (elements, classes) {
            dom.withClass(elements, classes, function (all, item) {
                if (all.indexOf(item) < 0) {
                    all.push(item);
                }
            });
        },

        removeClass: function (elements, classes) {
            dom.withClass(elements, classes, function (all, item) {
                for (var i = all.length; i--;) {
                    if (all[i] == item) {
                        all.splice(i, 1);
                    }
                }
            });
        },

        hasClass: function (elements, classes) {
            if (!elements || !classes) {
                return;
            }

            if (!Array.isArray(classes)) {
                classes = [classes];
            }

            var result = false;

            dom.each(elements, function (elem) {
                if (result) {
                    return;
                }

                var all = elem.className.split(/\s+/);

                for (var i = classes.length; i--;) {
                    if (all.indexOf(classes[i]) < 0) {
                        return;
                    }
                }

                result = true;
            });

            return result;
        },

        css: function (elements, styles) {
            if (!elements) {
                return;
            }

            var result = {},
                i;

            if (!styles) {
                for (i in styles) {
                    if (styles.hasOwnProperty(i)) {
                        result[i] = window.getComputedStyle(elements[0], '').getPropertyValue(dom.hyphenate(i));
                    }
                }

                return result;
            } else if (typeof styles === 'string') {
                return window.getComputedStyle(elements[0], '').getPropertyValue(dom.hyphenate(styles));
            }

            dom.each(elements, function (elem) {
                for (i in styles) {
                    if (styles.hasOwnProperty(i)) {
                        elem.style[dom.camelCase(i)] = styles[i];
                    }
                }
            });
        },

        empty: function (elements) {
            dom.each(elements, function (elem) {
                while (elem.hasChildNodes()) {
                    elem.removeChild(elem.firstChild);
                }
            });
        },

        destroy: function (elements) {
            dom.each(elements, function (elem) {
                if (elem.parentNode) {
                    elem.parentNode.removeChild(elem);
                }
            });
        },

        offset: function (element) {
            element = element.length ? element[0] : element;

            if (element.offsetX != null) {
                return {
                    x: element.offsetX,
                    y: element.offsetY
                };
            }

            var box = element.getBoundingClientRect(),
                body    = document.body,
                docElem = document.documentElement,
                scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft,
                scrollTop  = window.pageYOffset || docElem.scrollTop  || body.scrollTop,
                clientLeft = docElem.clientLeft || body.clientLeft    || 0,
                clientTop  = docElem.clientTop  || body.clientTop     || 0;

            return {
                x: Math.round(box.left + scrollLeft - clientLeft),
                y: Math.round(box.top  + scrollTop  - clientTop )
            };
        },

        appendTo: function (elements, target) {
            var fragment = document.createDocumentFragment();

            dom.each(elements, function (elem) {
                fragment.appendChild(elem);
            });
            target.appendChild(fragment);
        },

        appendBefore: function (elements, target) {
            var fragment = document.createDocumentFragment();

            dom.each(elements, function (elem) {
                fragment.appendChild(elem);
            });
            target.parentNode.insertBefore(fragment, target);
        },

        appendAfter: function (elements, target) {
            var parent = target.parentNode,
                next = target.nextSibling,
                fragment = document.createDocumentFragment();

            dom.each(elements, function (elem) {
                fragment.appendChild(elem);
            });

            if (next) {
                parent.insertBefore(fragment, next);
            } else {
                parent.appendChild(fragment);
            }

            return this;
        }
    };

    var settings = {
            title: 'Название игры',
            heading: 'Название игры', // допускается HTML-код
            theme: '',   // путь к css-файлу со стилями, относительно index.html,
            placeholder: '>',
            executeTitle: 'Выполнить',
            gameLookTitle: 'Осмотреться',
            gameInventoryTitle: 'Инвентарь',
            gameMoreTitle: 'Далее',
            // Шаблон интерфейса
            template: '<header class="az-header">\
                           <div class="az-title">{{ this.title }}</div>\
                       </header>\
                       <div class="az-story"></div>\
                       <footer class="az-footer">\
                           <div class="az-parser">\
                               <div class="az-suggestions"></div>\
                               <div class="az-inputs">\
                                   <input type="text" class="az-inputs__text" placeholder="{{ this.placeholder }}">\
                                   <button type="button" class="az-inputs__btn az-inputs__execute" title="{{ this.executeTitle }}"></button>\
                                   <button type="button" class="az-inputs__btn az-inputs__game-look" title="{{ this.gameLookTitle }}"></button>\
                                   <button type="button" class="az-inputs__btn az-inputs__game-inv" title="{{ this.gameInventoryTitle }}"></button>\
                                   <button type="button" class="az-inputs__btn az-inputs__game-more" title="{{ this.gameMoreTitle }}"></button>\
                               </div>\
                           </div>\
                       </footer>',
            templateSuggestion: '<span class="az-suggestions__item">{{ this }}</span>'
        },

        selectors = {
            main: '.az-main',
            heading: '.az-title',
            story: '.az-story',
            suggestions: '.az-suggestions',
            suggestionItem: '.az-suggestions__item',
            input: '.az-inputs__text',
            execute: '.az-inputs__execute',
            gameLook: '.az-inputs__game-look',
            gameInventory: '.az-inputs__game-inv',
            gameMore: '.az-inputs__game-more',
            storyCommand: '.az-story__command'
        },
        classes = {
            main: 'az-main'
        },
        elements = {
            // Заполняются в renderView
        },

        _ready = false,
        _readyQueue = [],

        /**
         * Строим базовый интерфейс игры.
         */
        renderView = function () {
            var main = dom.create('div', {
                id: classes.main,
                className: classes.main,
                innerHTML: render(settings.template, settings)
            });

            document.body.appendChild(main);

            utils.extend(elements, {
                main: main,
                heading: dom.get(selectors.heading, main),
                story: dom.get(selectors.story, main),
                suggestions: dom.get(selectors.suggestions, main),
                input: dom.get(selectors.input, main),
                execute: dom.get(selectors.execute, main),
                gameLook: dom.get(selectors.gameLook, main),
                gameInventory: dom.get(selectors.gameInventory, main),
                gameMore: dom.get(selectors.gameMore, main)
            });
        },

        /**
         * Изменение настроек интерфейса
         * @param options
         */
        changeSettings = function (options) {
            options = options || {};
            utils.extend(settings, options);
        },

        /**
         * Изменение placeholder у поля ввода
         * @param {string} text
         */
        setPlaceholder = function (text) {
            if (!text) {
                return;
            }

            changeSettings({ placeholder: text });
            elements.input.placeholder = text;
        },

        /**
         * Изменение заголовка игры
         * @param {string} text Заголовок окна игры
         */
        setTitle = function (text) {
            if (!text) {
                return;
            }

            changeSettings({ title: text });
            document.title = text;
        },

        /**
         * Изменение заголовка игры
         * @param {string} text Заголовок игры, допускается HTML-код
         */
        setHeading = function (text) {
            if (!text) {
                return;
            }

            changeSettings({ heading: text });
            elements.heading.innerHtml = text;
        },

        /**
         * Добавить фрагмент текста
         * @param text Текст, допускается HTML-код
         * @param template Шаблон для функции render.
         */
        write = function (text, template) {
            if (!text) {
                return;
            }

            var commands = dom.query(selectors.storyCommand),
                lastCommand = commands && commands[commands.length - 1];

            template = template ? ' ' + template : '<p>{{ this }}</p>';
            dom.appendTo( dom.create( render(template, text2html(text)) ), elements.story );
            lastCommand && window.scrollTo(0, lastCommand.offsetTop - elements.heading.offsetHeight);
        },

        /**
         * Очистка текста
         */
        clear = function () {
            elements.story.innerHTML = '';
        },

        /**
         * Вывести догадки парсера
         * @param {Array} data Массив догадок
         */
        setSuggestions = function (data) {
            var i = 0,
                result = '';

            if (data && Array.isArray(data)) {
                for (i; i < data.length; i++) {
                    result += render(settings.templateSuggestion, data[i]);
                }

                elements.suggestions.innerHTML = result;
                elements.suggestions.style.display = 'block';
            }
        },

        /**
         * Применение догадки
         * @param {string} text Текст догадки
         */
        applySuggestion = function (text) {
            var value,
                words;

            if (text && typeof text === 'string') {
                value = elements.input.value.trim().replace(/\s+/g, ' ');
                words = value.split(' ');
                words[words.length - 1] = text;
                elements.input.value = words.join(' ') + ' ';
                elements.input.focus();

                PARSER.parse(elements.input.value, true);
                checkMaySubmit();
                clearSuggestions();
            }
        },

        /**
         * Очистка догадок
         */
        clearSuggestions = function () {
            elements.suggestions.innerHTML = '';
            elements.suggestions.style.display = 'none';
        },

        /**
         * Обработчик ввода команды
         * @param text
         */
        submitInput = function (text) {
            text = text || elements.input.value.trim();

            // Если выводим текст и команда при нажатии Enter пустая, а в перечне автодополнения есть один-единственный вариант ("далее") - вставляем его
            if (AZ.layerType() == 'text') {
                if (text.trim() == '') {
                    if (AUTOCOMPLETE.lenght(0) == 1) {
                        text = AUTOCOMPLETE.firstWord(0);
                    } // end if
                } // end if
            } // end if

            if (text) {
                printCommand(text);

                var CMD = PARSER.parse(text);

                clearInput();
                clearSuggestions();
                // text && triggerEvent('submit', { value: text });

                if (CMD == null || CMD.action == null) {
                    print('Ничего не понятно.');
                } else {
                    // Вызываем событие "Перед выполнением действия с объектом"
                    if (EVENTS.checkReactions(EVENTS.ACTION, {'what':CMD.object, 'when':EVENTS.BEFORE}, {'parameter': CMD}) == true) {
                        //----------
                        incProperty('turns.all');
                        incProperty('turns.loc');
                        //----------
                        CMD.action(CMD);
                        //----------
                        // Вызываем событие "После выполнением действия с объектом"
                        EVENTS.checkReactions(EVENTS.ACTION, {'what':CMD.object, 'when':EVENTS.AFTER}, {'parameter': CMD});
                    } // end if
                } // end if
                //----------
                AZ.startNewTurn();
                PARSER.pre_parse();

                autocomplete();
            }

            elements.input.focus();
        },

        /**
         * Очистка поля ввода
         */
        clearInput = function () {
            elements.input.value = '';
        },

        checkMaySubmit = function () {
            var field = elements.input;

            if (!field) {
                return;
            }

            var status = AUTOCOMPLETE.getStatus();
            field.style.color = ((status == 1) ? "#00F" : ((status == -1) ? "#F00" : null));
        },

        /**
         * Вызов события интерфейса
         * @param event Имя события
         * @param data Объект данных события
         */
        triggerEvent = function (event, data) {
            var eventObj;

            data = utils.typeOf(data) === 'object' ? data : {};

            if (event) {
                eventObj = new document.defaultView.CustomEvent(NAMESPACE + '.' + event, { detail: data });
                document.dispatchEvent(eventObj);
            }
        },

        /**
         * Подписка на событие
         * @param event Имя события
         * @param callback Обработчик
         */
        on = function (event, callback) {
            dom.on(document, event, callback);
        },

        handleEvents = function () {
            dom.on(elements.input, 'keydown', function (event) {
                var key = event.keyCode,
                    item;

                if (key === 13) { // Enter
                    submitInput();
                } else if (key === 27) {
                    clearInput();
                    clearSuggestions();
                } else if (key === 9) {
                    event.preventDefault();
                    item = dom.query(selectors.suggestionItem)[0];

                    if (item) {
                        applySuggestion(item.innerHTML);
                    }
                }
            });

            dom.on(elements.input, 'input', function (event) {
               // triggerEvent('input', { text : elements.input.value.trim() });
                //----------
                var command = elements.input.value || ''; // Тут нельзя обрезать хвостовой пробел! Пробел — признак того, что слово закончено, и нужно подбирать следующее.
                //----------
                if (command == '') {
                    PARSER.pre_parse();
                } else {
                    PARSER.parse(command, true);
                } // end if
                //----------
                checkMaySubmit();
                //----------
                DEBUG.updateWordsFullList();
                DEBUG.updateWordsShortList();
                DEBUG.updatePanelForObjects();

                autocomplete();
            });

            dom.on(elements.execute, 'click', function () {
                submitInput();
            });

            dom.on(elements.gameLook, 'click', function () {
                submitInput('Осмотреться');
            });

            dom.on(elements.gameInventory, 'click', function () {
                submitInput('Инвентарь');
            });

            dom.on(elements.gameMore, 'click', function () {
                submitInput('Далее');
            });

            dom.on(elements.suggestions, 'click', function (event) {
                if (dom.is(event.target, selectors.suggestionItem)) {
                    applySuggestion(event.target.innerHTML.trim());
                }
            });
        },

        autocomplete = function () {
            var data = [];

            AUTOCOMPLETE.start(1);

            while (AUTOCOMPLETE.next(1) != false) {
                data.push(AUTOCOMPLETE.word(1));
            }

            setSuggestions(data);
        },

        _runReadyQueue = function () {
            for (var i = 0; i < _readyQueue.length; i++) {
                _readyQueue[i]();
            }

            _readyQueue = [];
            _ready = true;
        },

        /**
         *
         * @param callback
         */
        ready = function (callback) {
            if (_ready) {
                callback && callback();
            } else {
                _readyQueue.push(callback);
            }
        },

        /**
         * Инициализация интерфейса игры
         * @param options Настройки интерфейса. Значения по умолчанию см. в переменной settings.
         * @param callback Функция, вызываемая после инициализации интерфейса.
         * */
        init = function (options, callback) {
            dom.onReady(function () {
                changeSettings(options);
                renderView();
                handleEvents();
                clearSuggestions();
                elements.input.focus();

                callback && callback();
                _runReadyQueue();
                autocomplete();
            });
        };

    if (document.readyState === "complete") {
        dom.ready = true;
        dom.readyCallback();
    } else {
        document.addEventListener('DOMContentLoaded', dom.readyCallback, false);
        window.addEventListener('load', dom.readyCallback, false);
    }

    return {
        dom: dom,
        ready: ready,
        changeSettings: changeSettings,
        setTitle: setTitle,
        setHeading: setHeading,
        setPlaceholder: setPlaceholder,
        write: write,
        clear: clear,
        clearInput: clearInput,
        setSuggestions: setSuggestions,
        render: render,
        on: on,
        init: init,
        updateCommandPanel: function (mode) {
            // Обновление командной панели игрока
            if (mode === 'text') {
                // Кнопки для текста
                elements.gameInventory.style.display = 'none';
                elements.gameLook.style.display = 'none';
                elements.gameMore.style.display = null;
            } else {
                // Кнопки для всего остального
                elements.gameInventory.style.display = null;
                elements.gameLook.style.display = null;
                elements.gameMore.style.display = 'none';
            }
        }
    };
})();

/* --------------------------------------------------------------------------- */
// ВЫВОД НА ЭКРАН
window.SCREEN = {
    Out: function (text, _panel) {
        if (_panel === undefined) {
            INTERFACE.write(text2html(text));
        } else {
            var EL=document.getElementById(_panel);

            if (EL) {
                EL.innerHTML += text2html(text);
            }
        }
    }, // end function "Out"
    //----------
    Clear: function (_panel) {
        if (_panel === undefined) {
            INTERFACE.clear();
        } else {
            var EL=document.getElementById(_panel);

            if (EL) {
                EL.innerHTML = '';
            }
        }
    } // end function "Clear"
};
//----------
// ФУНКЦИИ РАБОТЫ С ЭКРАНОМ
window.print = function (_text) {
    //----------
    SCREEN.Out(_text);
    //----------
};
//--------------------------------------------------
window.printOnes = function (_name, _text) {
    //----------
    var value = getProperty(_name);
    //----------
    if (value === undefined || value != true) {
        print(_text);
        //----------
        setProperty(_name, true);
        //----------
        return true;
    } else {
        return false;
    } // end if
};
//--------------------------------------------------
window.printCommand = function (_text) {
    //----------
    SCREEN.Out(DECOR.Command.print(_text));
    //----------
};
//--------------------------------------------------
window.printInventory = function () {
    //----------
    var protagonist = AZ.getProtagonist();
    if (protagonist != null) {protagonist.examineContainer();} // end if
    //----------
    SCREEN.Out(DECOR.Inventory.get());
};
/* --------------------------------------------------------------------------- */