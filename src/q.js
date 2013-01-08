(function (win, doc, undefined){
    
    var TO_STRING = Object.prototype;
    
    function createScript(src, callback){
        var s = doc.createElement('script'),
            parentEl = doc.head || doc.getElementsByTagName('head')[0] || doc.documentElement;

        s.onprototypechange = s.onload = function(){
        
        }
    }

    var define = function(){
        
    };
    win.define = define;
})(window, document);
