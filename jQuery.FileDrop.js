/* global jQuery */
/*
  FileDrop jQuery Plugin
  by Chris Barr
  https://github.com/chrismbarr/FileDrop/
*/

(function ($) {
    'use strict';

    var exitTimer = null;
    
    function stopEvent(ev) {
        ev.stopPropagation();
        ev.preventDefault();
    }

    function decodeBase64String(str) {
        var decoded = window.atob(str);
        try {
            return decodeURIComponent(window.escape(decoded));
        } catch (ex) {
            return '';
        }
    }
    
    //The options object is passed in and normalized
    function normalizeOptions(options) {
        //If a function was passed in instead of an options object,
        //just use this as the onFileRead options instead
        if ($.isFunction(options)) {
            options = {
                onFileRead: options
            };
        }

        //Create a finalized version of the options
        var opts = $.extend({}, $.fn.fileDrop.defaults, options);

        //If we are decodeing Base64, then we must also remove the data URI Scheme form the beginning of the Base64 string
        if (opts.decodeBase64) {
            opts.removeDataUriScheme = true;
        }

        //This allows for string or jQuery selectors to be used
        opts.addClassTo = $(opts.addClassTo);

        //This option MUST be a function or else you can't really do anything...
        if (!$.isFunction(opts.onFileRead)) {
            throw ('The option "onFileRead" is not set to a function!');
        }

        return opts;
    }
    
    //This is called for each initially selected DOM element
    function setEvents(el, opts) {

        //can't bind these events with jQuery!
        el.addEventListener('dragenter', function (ev) {
            //Mouse over element
            $(opts.addClassTo).addClass(opts.overClass);
            stopEvent(ev);
        }, false);

        el.addEventListener('dragover', function (ev) {
            //Mouse exit element
            clearTimeout(exitTimer);
            exitTimer = setTimeout(function () {
                $(opts.addClassTo).removeClass(opts.overClass);
            }, 100);
            stopEvent(ev);
        }, false);

        el.addEventListener('drop', function (ev) {
            //Files dropped
            
            $(opts.addClassTo).removeClass(opts.overClass);
            stopEvent(ev);
            var fileList = ev.dataTransfer.files;

            //Create an array of file objects for us to fill in
            var fileArray = [];

            //Loop through each file
            for (var i = 0; i <= fileList.length - 1; i++) {

                //Create a new file reader to read the file
                var reader = new FileReader();

                //Create a closure so we can properly pass in the file information since this will complete async!
                var completeFn = (handleFile)(fileList[i], fileArray, fileList.length, opts);

                //Different browsers implement this in different ways, but call the complete function when the file has finished being read
                if (reader.addEventListener) {
                    // Firefox, Chrome
                    reader.addEventListener('loadend', completeFn, false);
                } else {
                    // Safari
                    reader.onloadend = completeFn;
                }

                //Actually read the file
                reader.readAsDataURL(fileList[i]);
            }
        }, false);
    }


    //This is the complete function for reading a file,
    function handleFile(theFile, fileArray, fileCount, opts) {
        //When called, it has to return a function back up to the listener event
        return function (ev) {
            var fileData = ev.target.result;

            if (opts.removeDataUriScheme) {
                fileData = $.removeUriScheme(fileData);
            }

            if (opts.decodeBase64) {
                fileData = decodeBase64String(fileData);
            }
            
            //Add the current file to the array
            fileArray.push({
                name: theFile.name,
                size: theFile.size,
                type: theFile.type,
                lastModified: theFile.lastModifiedDate,
                data: ev.target.result
            });

            //Once the correct number of items have been put in the array, call the completion function		
            if (fileArray.length === fileCount && $.isFunction(opts.onFileRead)) {
                opts.onFileRead(fileArray, opts);
            }
        };
    }
    
    
    //=============================================================================================
    
    
    //Extend jQuery to allow for this to be a public function
    $.removeUriScheme = function (str) {
        return str.replace(/^data:.*;base64,/, '');
    };

    //Extent jQuery.support to detect the support we need here
    $.support.fileDrop = (function () {
        return !!window.FileList;
    })();
    
    // jQuery plugin initialization
    $.fn.fileDrop = function (options) {
        var opts = normalizeOptions(options);

        //Return the elements & loop though them
        return this.each(function () {
            //Make a copy of the options for each selected element
            var perElementOptions = opts;
			
            //If this option was not set, make it the same as the drop area
            if (perElementOptions.addClassTo.length === 0) {
                perElementOptions.addClassTo = $(this);
            }

            setEvents(this, perElementOptions);
        });
    };

    $.fn.fileDrop.defaults = {
        overClass: 'state-over',	//The class that will be added to an element when files are dragged over the window
        addClassTo: null,			//Nothing selected by default, in this case the class is added to the selected element
        onFileRead: null,			//A function to run that will read each file
        removeDataUriScheme: true,	//Removes 'data:;base64,' or similar from the beginning of the Base64 string
        decodeBase64: false			//Decodes the Base64 into the raw file data. NOTE: when this is true, removeDataUriScheme will be set to true
    };


})(jQuery);