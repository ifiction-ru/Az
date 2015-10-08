/**
 *  UI module for Az.
 *
 *  */

define(['modules/az-utils'], function (utils) {
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
                    (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
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
                        context.querySelectorAll(selector);
                    }
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
            heading: 'Название игры', // допускается HTML-код
            location: 'Название локации', // название локации
            theme: '',   // путь к css-файлу со стилями, относительно index.html,
            placeholder: '>',
            executeTitle: 'Выполнить',
            gameLookTitle: 'Осмотреться',
            gameInventoryTitle: 'Инвентарь',
            // Шаблон интерфейса
            template: '<div class="az-heading">{{ this.heading }}</div>\
                       <header class="az-location">{{ this.location }}</header>\
                       <div class="az-story"></div>\
                       <div class="az-parser">\
                           <div class="az-suggestions"></div>\
                           <div class="az-inputs">\
                               <input type="text" class="az-inputs__text" placeholder="{{ this.placeholder }}">\
                               <button type="button" class="az-inputs__btn az-inputs__execute" title="{{ this.executeTitle }}"></button>\
                               <button type="button" class="az-inputs__btn az-inputs__game-look" title="{{ this.gameLookTitle }}"></button>\
                               <button type="button" class="az-inputs__btn az-inputs__game-inv" title="{{ this.gameInventoryTitle }}"></button>\
                           </div>\
                       </div>'
        },

        selectors = {
            main: '.az-main',
            heading: '.az-heading',
            location: '.az-location',
            story: '.az-story',
            suggestions: '.az-suggestions',
            input: '.az-inputs__text',
            execute: '.az-inputs__execute',
            gameLook: '.az-inputs__game-look',
            gameInventory: '.az-inputs__game-inv'
        },
        classes = {
            main: 'az-main'
        },
        elements = {
            // Заполняются в renderView
        },

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
                location: dom.get(selectors.location, main),
                story: dom.get(selectors.story, main),
                suggestions: dom.get(selectors.suggestions, main),
                input: dom.get(selectors.input, main),
                execute: dom.get(selectors.execute, main),
                gameLook: dom.get(selectors.gameLook, main),
                gameInventory: dom.get(selectors.gameInventory, main)
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
         * Изменение заголовка локации
         * @param {string} text Заголовок локации, допускается HTML-код
         */
        setLocation = function (text) {
            if (!text) {
                return;
            }

            changeSettings({ location: text });
            elements.location.innerHtml = text;
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

            template = ' ' + template || ' <p>{{ this }}</p>';
            dom.appendTo( dom.create(render(template, text)), elements.story );
        },

        /**
         * Очистка текста
         */
        clear = function () {
            elements.story.innerHTML = '';
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

        /**
         * Обработчик ввода команды
         */
        submitInput = function () {
            var input = elements.input,
                text = input.value.trim();

            clearInput();
            text && triggerEvent('submit', { value: text });
        },

        /**
         * Очистка поля ввода
         */
        clearInput = function () {
            elements.input.value = '';
        },

        handleEvents = function () {
            dom.on(elements.input, 'keyup', function (event) {
                if (event.keyCode === 13) { // Enter
                    submitInput();
                } else if (event.keyCode === 27) {
                    clearInput();
                }
            });

            dom.on(elements.execute, 'click', function () {
                submitInput();
            });
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
                callback();
            });
        };

    if (document.readyState == "complete") {
        dom.ready = true;
        dom.readyCallback();
    } else {
        document.addEventListener('DOMContentLoaded', dom.readyCallback, false);
        window.addEventListener('load', dom.readyCallback, false);
    }

    return {
        dom: dom,
        setHeading: setHeading,
        setLocation: setLocation,
        setPlaceholder: setPlaceholder,
        write: write,
        clear: clear,
        render: render,
        on: on,
        init: init
    };
});
