define(function(require, exports, module){
    console.log('arguments', arguments)
    var amd = require('amd'),
        amd2 = require('amd2');
        console.log('amd2', amd2)
    exports.a = amd + amd2.a;

})