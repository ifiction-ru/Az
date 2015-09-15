/*  */

define(['modules/az-utils'], function (utils) {
    'use strict';

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

            isElement: function (node) {
                return !!(node && node.nodeName);
            },

            create: function (tagName, attrs) {
                if (tagName) {
                    var elem = document.createElement(tagName);

                    if (utils.typeOf(attrs) === 'object') {

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
            }
        };

    document.addEventListener('DOMContentLoaded', dom.readyCallback, false);
    window.addEventListener('load', dom.readyCallback, false);

    return {
        dom: dom
    }
});

