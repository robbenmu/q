define('amd3', ['amd', 'amd2'],function(amd, amd2){
    console.log(arguments)
    return amd + amd2.a + amd2.b;
});