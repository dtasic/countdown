/*!
 * Countdown v0.1.0
 * https://github.com/fengyuanchen/countdown
 *
 * Copyright 2016 Fengyuan Chen
 * Released under the MIT license
 */

(function (factory) {
    if (typeof define === "function" && define.amd) {
        // AMD. Register as anonymous module.
        define(["jquery"], factory);
    } else {
        // Browser globals.
        factory(jQuery);
    }
})(function ($) {

    "use strict";

    var Countdown = function (element, options) {
            this.$element = $(element);
            this.defaults = $.extend({}, Countdown.defaults, this.$element.data(), $.isPlainObject(options) ? options : {});
            this.init();
        };

    Countdown.prototype = {
        constructor: Countdown,

        init: function () {
            var content = this.$element.html(),
                date = new Date(this.defaults.date || content);

            if (date.getTime()) {
                this.content = content;
                this.date = date;
                this.find();

                if (this.defaults.autoStart) {
                    this.start();
                }
            }
        },

        find: function () {
            var $element = this.$element;

            this.$days = $element.find("[data-days]");
            this.$hours = $element.find("[data-hours]");
            this.$minutes = $element.find("[data-minutes]");
            this.$seconds = $element.find("[data-seconds]");

            if ((this.$days.length + this.$hours.length + this.$minutes.length + this.$seconds.length) > 0) {
                this.found = true;
            }
        },

        reset: function () {
            if (this.found) {
                this.output("days");
                this.output("hours");
                this.output("minutes");
                this.output("seconds");
            } else {
                this.output();
            }
        },

        ready: function () {
            var date = this.date,
                decisecond = 100,
                second = 1000,
                minute = 60000,
                hour = 3600000,
                day = 86400000,
                remainder = {},
                diff;

            if (!date) {
                return false;
            }

            diff = date.getTime() - (new Date()).getTime();

            if (diff <= 0) {
                this.end();
                return false;
            }

            remainder.days = diff;
            remainder.hours = remainder.days % day;
            remainder.minutes = remainder.hours % hour;
            remainder.seconds = remainder.minutes % minute;
            remainder.milliseconds = remainder.seconds % second;

            this.days = Math.floor(remainder.days / day);
            this.hours = Math.floor(remainder.hours / hour);
            this.minutes = Math.floor(remainder.minutes / minute);
            this.seconds = Math.floor(remainder.seconds / second);
            this.deciseconds = Math.floor(remainder.milliseconds / decisecond);

            return true;
        },

        start: function () {
            if (!this.active && this.ready()) {
                this.active = true;
                this.reset();
                this.autoUpdate = this.defaults.fast ?
                    setInterval($.proxy(this.fastUpdate, this), 100) :
                    setInterval($.proxy(this.update, this), 1000);
            }
        },

        stop: function () {
            if (this.active) {
                this.active = false;
                clearInterval(this.autoUpdate);
            }
        },

        end: function () {
            if (!this.date) {
                return;
            }

            this.stop();

            this.days = 0;
            this.hours = 0;
            this.minutes = 0;
            this.seconds = 0;
            this.deciseconds = 0;
            this.reset();
            this.defaults.end();
        },

        destroy: function () {
            if (!this.date) {
                return;
            }

            this.stop();

            this.$days = null;
            this.$hours = null;
            this.$minutes = null;
            this.$seconds = null;

            this.$element.empty().html(this.content);
            this.$element.removeData("countdown");
        },

        fastUpdate: function () {
            if (--this.deciseconds >= 0) {
                this.output("deciseconds");
            } else {
                this.deciseconds = 9;
                this.update();
            }
        },

        update: function () {
            if (--this.seconds >= 0) {
                this.output("seconds");
            } else {
                this.seconds = 59;

                if (--this.minutes >= 0) {
                    this.output("minutes");
                } else {
                    this.minutes = 59;

                    if (--this.hours >= 0) {
                        this.output("hours");
                    } else {
                        this.hours = 23;

                        if (--this.days >= 0) {
                            this.output("days");
                        } else {
                            this.end();
                        }
                    }
                }
            }
        },

        output: function (type) {
            var daystoevent = new Date().getTime() + (this.defaults.daysbefore * 24 * 60 * 60 * 1000);
            var dayofevent = new Date(this.defaults.date).getTime();
            if (daystoevent > dayofevent) {
              if (this.days !== 0 && this.hours !== 0 && this.minutes !== 0 && this.seconds !== 0) {
                if (!this.found) {
                    this.$element.empty().html(this.template()).show();
                    return;
                }
              }
            } 

            switch (type) {
                case "deciseconds":
                    this.$seconds.text(this.getSecondsText());
                    break;

                case "seconds":
                    this.$seconds.text(this.seconds);
                    break;

                case "minutes":
                    this.$minutes.text(this.minutes);
                    break;

                case "hours":
                    this.$hours.text(this.hours);
                    break;

                case "days":
                    this.$days.text(this.days);
                    break;

                // No default
            }
        },

        template: function () {
            return this.defaults.text
                    .replace("%d", this.padNumber(this.days))
                    .replace("%h", this.padNumber(this.hours))
                    .replace("%m", this.padNumber(this.minutes))
                    .replace("%s", this.padNumber(this.getSecondsText()));
         },

         padNumber: function (n){
         	if(this.defaults.pad){
 	        	return (n < 10) ? "0" + n : n;
         	}
         	else{
        		return n;
         	}
        },

        getSecondsText: function () {
            return this.active && this.defaults.fast ? (this.seconds + "." + this.deciseconds) : this.seconds;
        }
    };

    // Default settings
    Countdown.defaults = {
        autoStart: true,
        date: null,
        fast: false,
        end: $.noop,
        text: "%d d, %h h, %m m, %s s",
        pad: true,
        daysbefore: 7
    };

    // Set default settings
    Countdown.setDefaults = function (options) {
        $.extend(Countdown.defaults, options);
    };

    // Register as jQuery plugin
    $.fn.countdown = function (options) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data("countdown");

            if (!data) {
                $this.data("countdown", (data = new Countdown(this, options)));
            }

            if (typeof options === "string" && $.isFunction(data[options])) {
                data[options]();
            }
        });
    };

    $.fn.countdown.constructor = Countdown;
    $.fn.countdown.setDefaults = Countdown.setDefaults;

    $(function () {
        $("[countdown]").countdown();
    });

});
