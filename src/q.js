(function (win, doc, undefined){
    
    var toString = Object.prototype.toString,
        class2type = {},
        emptyFun = function(){},
        firstScript = doc.getElementsByTagName('script')[0];
    
    function is(obj){
        return obj == null ?
            String(obj) :
            class2type[toString.call(obj)] || "object";
    }
    
    function isFunction(obj){
        return is(obj) === 'function';
    }
    
    
    function getScript(src, callback, options){
        var script = doc.createElement('script'),
            // IE 8 and below need to poll the readyState property, while
            // Chrome, Safari, Firefox and IE 10 can use the onload handler.
            isNormal = !script.readyState || document.documentMode > 8;
            
        options = options || {};
        callback = isFunction(callback) ? callback : emptyFun;
        
        script.src = src;
        script.type = options.type || "";
        
        if (options.async !== undefined) {
            script.async = options.async;
        }
        
        function loadHandler(){
            if (isNormal || /loaded|complete/.test(script.readyState)) {
                script.onload = script.onreadystatechange = null;
                
                callback(src);
            }
        }
        
        if (callback) {
            if (isNormal) {
                script.onload = loadHandler;
            }else{
                script.onreadystatechange = loadHandler;
            }
        }
        
        firstScript.paretNode.insertBefore(script, firstScript);
    }
    
    
    
    var define = function(){
        
    };
    win.define = define;
})(window, document);