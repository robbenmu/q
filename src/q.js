(function(win, doc, undefined) {
    'use strict';

    var toString = Object.prototype.toString,
        class2type = {},
        noop = function() {},
        events = {},
        firstScript = doc.getElementsByTagName('script')[0],
        modules = {},
        definedModules = {},
        anonymousModules = [],
        hasEach = !! Array.prototype.forEach;

    function isFunction(fun) {

        return toString.call(fun) == "[object Function]";
    }

    function isString(str) {

        return toString.call(str) == "[object String]";
    }

    function isArray(arr) {

        return toString.call(arr) == "[object Array]";
    }

    function each(arr, fn, scope) {

        if (hasEach) {
            return Array.prototype.forEach.call(arr, fn, scope || arr);
        }

        for (var i = 0, len = arr.length; i < len; ++i) {
            fn.call(scope || arr, arr[i], i, arr);
        }
    }

    function extend(target) {
        var i = 0,
            len = arguments.length,
            p, src;
        while (++i < len) {
            src = arguments[i];
            if (src != null) {
                for (p in src) {
                    target[p] = src[p];
                }
            }
        }

        return target;
    }


    function subscribe(event, callback) {

        if (!events[event]) {
            events[event] = [];
        }
        events[event].push(callback);
    }

    function publish(event, data) {

        var list = events[event];
        if (list) {
            for (var i = -1, ln = list.length; ++i < ln;) {
                if (isFunction(list[i])) {
                    list[i](data);
                }
            }
        }
    }

    function getModule(name) {

        var parts = name.split('.'),
            cur = window,
            part;

        for (; part = parts.shift();) {
            if (cur[part] != null) {
                cur = cur[part];
            } else {
                return null;
            }
        }

        return cur;
    }

    function getScript(src, callback, options) {

        var script = doc.createElement('script'),
            // IE 8 and below need to poll the readyState property, while
            // Chrome, Safari, Firefox and IE 10 can use the onload handler.
            isNormal = !script.readyState || document.documentMode > 8;

        options = options || {};
        callback = isFunction(callback) ? callback : noop;

        script.src = src;
        script.type = options.type || "";

        script.async = 'async';

        function loadHandler() {
            if (isNormal || /loaded|complete/.test(script.readyState)) {
                script.onload = script.onreadystatechange = null;

                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                    script = undefined;
                }

                callback(src);
            }
        }

        if (callback) {
            if (isNormal) {
                script.onload = loadHandler;
            } else {
                script.onreadystatechange = loadHandler;
            }
        }
        firstScript.parentNode.insertBefore(script, firstScript);
    }

    // 去掉代码中的注释
    // from http://lifesinger.github.com/lab/2011/remove-comments-safely/

    function removeComments(code) {
        return code.replace(/^\s*\/\*[\s\S]*?\*\/\s*$/mg, '') // block comments
        .replace(/^\s*\/\/.*$/mg, ''); // line comments
    }

    // 根据字面值去重复

    function literalUnique(arr) {
        var ret = [],
            values = {},
            elt;
        for (var i = 0; i < arr.length; i++) {
            elt = arr[i];
            if (!values[elt]) {
                values[elt] = true;
                ret.push(elt);
            }
        }

        return ret;
    }

    // 分析出依赖的元素 from seajs

    function parseDeps(code) {
        var pattern = /(?:^|[^.$])\brequire\s*\(\s*(["'])([^"'\s\)]+)\1\s*\)/g;
        var ret = [],
            match;

        code = removeComments(code);
        while (match = pattern.exec(code)) {
            if (match[2]) {
                ret.push(match[2]);
            }
        }

        return literalUnique(ret);
    }


    function Module(names, callback) {

        this.names = names;
        this.callback = callback;
        this.count = 0;
        this.callbackArgs = [];

    }

    Module.prototype.require = function(name) {
        return modules[name];
    }

    Module.prototype.ready = function(num, name, module) {

        var args = [],
            j, k;

        if (module) {
            modules[name] = module;
        }
        console.log('modules[name]', modules[name], name)
        this.callbackArgs[num] = modules[name] || (modules[name].hasOwnProperty('__cmd__') ? modules[name].module.exports : undefined);
        this.count += 1;

        if (this.count === this.names.length) {
            for (var i = -1, ln = this.callbackArgs.length; ++i < ln;) {

                args.push(this.callbackArgs[i]);
            }

            this.callback.apply(win, args);
        }

        if (module) {
            publish(name);
        }
    }

    Module.prototype.define = function(num, name, options) {
        console.log('define', arguments)
        var module, moduleDeps, me = this,
            moduleDef = definedModules[name] || anonymousModules.shift();

        if (moduleDef) {
            moduleDeps = moduleDef.__deps__;
            console.log(moduleDeps)
            if (moduleDeps && moduleDeps.length) {
                require(options, moduleDeps, function() {
                    console.log('moduleDef1', moduleDef)
                    module = me.run(moduleDef, arguments);

                    me.ready(num, name, module);
                });
            } else {
                console.log('moduleDef2', moduleDef)
                module = me.run(moduleDef, arguments);


                me.ready(num, name, module);
            }
        } else {
            me.ready(num, name, getModule(name));
        }
    }

    Module.prototype.run = function(module, args) {
        var result;
        console.log(module)
        if (isFunction(module)) {

            if (module.__cmd__) {
                module.module = {
                    exports: {}
                };
                
                result = module.apply(win, [this.require, module.module.exports, module.module]);
                
                if (!result) {
                    result = module.module.exports;
                }
                return result;
            } else {
                return module.apply(win, args)
            }
        }
        return module;
    }

    var resolveOptions = {
        basePath: '',
        filename: function(str) {
            return str.toLowerCase();
        },
        filesuffix: '.js'
    }

    function resolve(options, module) {
        var op = extend(resolveOptions, options || {}),
            basePath = op.basePath,
            filename = op.filename(module),
            suffix = op.filesuffix;

        if (/\.js$/.test(module)) {
            filename = module;
            suffix = '';
        }

        if (/^http[s]*:\/\//.test(module)) {
            basePath = '';
        }
        return basePath + filename + suffix;
    }

    function define(name, deps, fun) {

        if (!isString(name)) {
            fun = deps;
            deps = name;
            name = undefined;
        }

        if (!isArray(deps)) {
            fun = deps;
            deps = undefined;
        }

        if (!deps && isFunction(fun)) {
            if (fun.length) {
                deps = parseDeps(fun.toString());
            }
            console.log('deps', deps)
            fun.__cmd__ = true;
        }

        if (deps) {
            fun.__deps__ = deps;
        }

        if (name) {
            definedModules[name] = fun;
        } else {
            anonymousModules.push(fun);
        }
    }
    define.amd = {
        jQuery: true
    };
    win.define = define;

    function require(customOptions, moduleNames, callback) {

        customOptions = customOptions || {};

        if (isArray(customOptions) || isString(customOptions)) {
            callback = moduleNames;
            moduleNames = customOptions;
            customOptions = {};
        }

        moduleNames = isString(moduleNames) ? [moduleNames] : moduleNames;

        var module = new Module(moduleNames, callback);

        each(moduleNames, function(name, i) {

            if (modules.hasOwnProperty(name)) {

                if (modules[name]) {
                    module.ready(i, name);
                } else {
                    subscribe(name, function() {
                        module.ready(i, name);
                    });
                }
            } else {

                modules[name] = undefined;

                if (definedModules[name]) {

                    module.define(i, name);
                } else {
                    getScript(resolve(customOptions, name), function() {
                        console.log('name', name)
                        module.define(i, name);
                    });
                }
            }
        });

    }
    require.config = resolveOptions;
    win.require = require;
})(window, document);
