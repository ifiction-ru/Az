/**
 * @licence Az (c) 2015, Ivan "Nafanin" Narozhny <nafan-in@yandex.ru>, Oleg Aleynikov.
 * Available via the BSD 3-Clause License.
 * @url https://github.com/Nafanin/Az
 * */

(function (global) {

    define('az', ['modules/az-utils', 'modules/az-ui'], function (utils, ui) {
        'use strict';

        var az,
            /* настройки по умолчанию */
            settings = {

            };

        /* Достаем настройки из az.settings */
        if (global.az && typeof global.az.settings === 'object') {
            utils.extend(settings, global.az.settings);
        }

        /* готовим объект для экспорта в глобальное пространство */
        az = {
            utils: utils,
            ui: ui
        };


        ui.init({}, function () {
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
