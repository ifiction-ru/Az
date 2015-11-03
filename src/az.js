/**
 * @licence Az (c) 2015, Ivan "Nafanin" Narozhny <nafan-in@yandex.ru>, Oleg Aleynikov.
 * Available via the BSD 3-Clause License.
 * @url https://github.com/Nafanin/Az
 * */

(function (global) {

    'use strict';

    var _ = 'modules/az-';

    requirejs.config({
        shim: {
            taffy: {
                exports: 'TAFFY'
            }
        }
    });

    define('az', [_+'constants', _+'utils', _+'ui', _+'engine', _+'layers'],
    function (cons, utils, ui, engine, layers) {

        var az,
            settings = {
                ui: {}
            },

            exportToGlobal = function () {
                utils.extend(window, cons);
            },

            start = function () {
                var character = engine.getProtagonist() || null,
                    loc       = engine.getLocation();

                if (character == null) {
                    console.error('Не задан текущий персонаж игры!');
                    return;
                }

                if (loc == null) {
                    console.error('Не задано местонахождение текущего персонажа игры!');
                    return;
                }

                engine.startNewTurn();
                ui.clearInput();
                layers.add();
            },

            changeSettings = function (options) {
                utils.extend(settings, options);
            },

            init = function (options) {
                changeSettings(options);

                ui.init(settings.ui, function () {
                    ui.on('az.ui.submit', function (event) {
                        console.log(event.detail);
                    });

                    ui.on('az.ui.input', function (event) {
                        console.log(event.detail);
                    });
                });
            };

        /* готовим объект для экспорта в глобальное пространство */
        az = {
            'export':       exportToGlobal,
            changeSettings: changeSettings,
            init:           init,
            start:          start,
            ui:             ui
        };

        global.az = az;
    });

})(this);
