/**
 * @licence Az (c) 2015, Ivan "Nafanin" Narozhny <nafan-in@yandex.ru>, Oleg Aleynikov.
 * Available via the BSD 3-Clause License.
 * @url https://github.com/Nafanin/Az
 * */

(function (global) {

    'use strict';

    requirejs.config({
        shim: {
            taffy: {
                exports: 'TAFFY'
            }
        }
    });

    define('az', ['modules/az-constants', 'modules/az-utils', 'modules/az-ui'],
    function (cons, utils, ui) {

        var az,
            settings = {
                ui: {

                }
            },

            exportToGlobal = function () {
                utils.extend(window, cons);
            },

            start = function () {
                var character = AZ.getProtagonist() || null,
                    loc       = AZ.getLocation();

                if (character == null) {
                    console.error('Не задан текущий персонаж игры!');
                    return;
                }

                if (loc == null) {
                    console.error('Не задано местонахождение текущего персонажа игры!');
                    return;
                }

                AZ.startNewTurn();
                INTERFACE.preparsing({value:''});
                layers.add();
            };

        /* Достаем настройки из az.settings */
        if (global.az && typeof global.az.settings === 'object') {
            utils.extend(settings, global.az.settings);
        }

        /* готовим объект для экспорта в глобальное пространство */
        az = {
            settings : settings,
            'export' : exportToGlobal,
            start    : start
        };

        ui.init(settings.ui, function () {
            ui.on('az.ui.submit', function (event) {
                console.log(event.detail);
            });

            ui.on('az.ui.input', function (event) {
                console.log(event.detail);
            });
        });

        global.az = az;

    });

})(this);
