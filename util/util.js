var semver = require('semver');
var fs = require('fs');
var path = require('path');

function mkdirsSync(dirpath, mode) {
    if (!fs.existsSync(dirpath)) {
        var pathtmp="/";
        dirpath.split(path.sep).forEach(function(dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            }
            else {
                pathtmp = dirname;
            }
            if (!fs.existsSync(pathtmp)) {
                if (!fs.mkdirSync(pathtmp, mode)) {
                    return false;
                }
            }
        });
    }
    return true;
}

function fixRequire(code) {
    var resultCode=code;

    function resolvePath(_p) {//".abc.js" ==> ".abc.js" or "abc/t.js" ==> "@cortex/abc/t.js"  or "/rle.js" ==> "/rle.js"
        if (_p.length>1&&_p[0]!='.'&&_p[0]!='/'&&_p[0]!='@') {
            return '@cortex/'+_p;
        } else {
            return _p;
        }
    }

    /*
     * require("xxx") ==> require("xxx")
     * */
    resultCode= resultCode.replace(/require\s*\(\s*(["'])\s*([\S]+)\s*(["'])\s*\)/g, function (word,$1,$2,$3) {
        return "require("+$1+resolvePath($2)+$3+")";
    });


    /*
     * require.resolve("xxx") ===> require("!!file!xxx") 强制使用file-loader
     * */
    resultCode= resultCode.replace(/require\.resolve\s*\(\s*(["'])\s*([\S]+)\s*(['"])\s*\)/g, function (word,$1,$2,$3) {
        return "require("+$1+"!!file!"+resolvePath($2)+$3+")";
    });//

    /*
     *
     * require.async("xxx",callback) ==> require(["xxx"],callback)
     * */
    resultCode= resultCode.replace(/require\.async\s*\(\s*(["'])\s*([\S]+)\s*(['"])\s*,/g, function (word,$1,$2,$3) {
        return "require(["+$1+resolvePath($2)+$3+"],";
    });



    return resultCode;
}

function processJS(code) {
    code = fixRequire(code);//处理require关键字
    var fc = new Function("" +
        "var result=[];"+
        "function  define(alias,dep,func,conf) {"+
        "result.push({key:alias,code:func.toString(),isMain:!!conf.main});"+
        "}"+'\n'+
        code+'\n'+
        "return result;"+
        "");

    var result = fc();
    var returnCode = '';
    var writeCode = '';
    result.forEach(function (obj) {
        var pkg_name=obj.key;
        var code=obj.code;
        var ss=code.substring(code.indexOf('{')+1).split('}');
        ss.pop();
        if(pkg_name.indexOf('/index.js') != -1){
            returnCode = ss.join('}');
        }else{
            writeCode = ss.join('}');
            mkdirsSync(path.dirname(path.resolve(__dirname, '../../neurons/', pkg_name.replace('@','/'))));
            fs.writeFileSync(path.resolve(__dirname, '../../neurons/', pkg_name.replace('@','/')),writeCode);
        }

    });
    return returnCode;
}

module.exports={
    processJS:processJS
}
