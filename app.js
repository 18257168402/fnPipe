var Aync = require('./FnPipe');



var AsyncFunc1 = function (param,next) {//进行一个异步操作，返回一个数字
    console.log("first async function begin!! param:"+param);
    setTimeout(function () {
        console.log("first async function!!");
        next(1024);
    },1000);
};

var AsyncFunc2 = function (value,next) {//进行一个异步操作，这个操作吧传入的数字加1
    console.log("second async function begin!!");
    setTimeout(function () {
        console.log("second async function!! value:"+value);
        next(value+1);
    },1000);
};
//console.log(">>>>最简单的组合，开启这段注释<<<<<");
// Aync.FnPipe.from(AsyncFunc1)
//     .on(function (value) {
//         console.log("first sync function!! value:"+value);
//         return value+1;
//     })
//     .to(AsyncFunc2)
//     .on(function (value) {
//         console.log("last function!! value:"+value);
//     }).fire("hello pipe!");



function composeMore(pipeUp) {
   return pipeUp.to(function (value,next) {
        setTimeout(function () {
            next(value);
            next(value+1);
        },1000);
    });
}

// console.log(">>>>试试其他操作符开启此段<<<<<");
// Aync.FnPipe.from(AsyncFunc1)
//     .on(function (value) {
//         console.log("first sync function!! value:"+value);
//         return value+1;
//     })
//     .delay(5000)//延迟五秒
//     .to(AsyncFunc2)
//     .compose(composeMore)//组合操作符
//     .filter(function (value) {//过滤1026
//         console.log("will filter 1026 you give me:"+value);
//         return value===1026;
//     }).on(function (value) {
//         console.log("last function!! value:"+value);
//     }).fire("hello pipe!");


console.log(">>>>错误处理<<<<<");

Aync.FnPipe.from(AsyncFunc1)
    .on(function (value) {
        console.log("first sync function!! value:"+value);
        return value+1;
    }).compose(composeMore)//组合操作符
    .catch(function (value,next) {
        console.log("some error occoured must fix:"+value);
        setTimeout(function () {
            console.log("fix failured will not continue");
        },1000);
    }).when(function (value) {
        return value === 1026
    }).on(function (value) {
         console.log("last function!! value:"+value);
    }).fire("hello");