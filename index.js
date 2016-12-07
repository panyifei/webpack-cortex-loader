// var define = require('./neuron-lite');
var util = require('./util/util.js');


module.exports = function (source) {
    if(source.indexOf('define(_') != -1){
        var newSource = util.processJS(source);
        return newSource;
    }else{
        return source;
    }

}
