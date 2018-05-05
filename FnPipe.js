
module.exports = Util = {};

function PipeSyncToASync(fn) {
    return function () {
        var args = Util.argsToArray(arguments);
        var next = args.pop();
        var ret = undefined;
        var er = undefined;
        ret = fn.apply(null,args);
        if(!!ret){
            if(!!next){
                next.apply(null,[ret]);
            }
        }else{
            if(!!next){
                //console.log(">>>PipeSyncToASync nextcall");
                next.apply(null,[]);
            }
        }
    }
}
Util.argsToArray = function (args) {
    return Array.prototype.slice.call(args);
};
Util.FnPipe = function (fn1) {
    this.fn1 = fn1;
    this.flowTail = undefined;
    this.errorCatch = undefined;
};
//起始执行函数为异步函数，异步函数的最后一个参数作为回调给下个函数的参数，
//其中第一个参数为Error，如果没有错误，那么第一个参数为null，如果执行函数时抛出异常，那么会将异常传递到下个函数的第一个参数中
Util.FnPipe.from = function (fn1) {
    return new Util.FnPipe(fn1);
};
//起始执行函数为同步函数，返回值作为下个函数的第二个参数，如果执行的时候抛出异常，错误传递给下个函数的第一个参数
Util.FnPipe.on = function (fn1) {
    return new Util.FnPipe(PipeSyncToASync(fn1));
};

var PipeCatch = function (pipe) {
    this.pipe = pipe;
};
PipeCatch.prototype.when = function (guideErrFn) {
    var self = this;
    return this.pipe.to(function () {
        var args = Util.argsToArray(arguments);
        var next = args.pop();
        var ret = guideErrFn.apply(null,args);//如果返回true就进入errorCatch处理
        if(ret){
            if(!!self.pipe.errorCatch){
                args.push(next);
                self.pipe.errorCatch.apply(null,args)
            }
        }else{
            next.apply(null,args);
        }
    });
};

Util.FnPipe.prototype.catch = function (fn) {
    this.errorCatch = fn;
    return new PipeCatch(this);
};

//下个函数为异步函数
Util.FnPipe.prototype.to = function (fn2) {
    this.fn2 = fn2;
    var self = this;
    var nextPipe = new Util.FnPipe(function () {//把整个this当做fn1，this执行fn1,fn2完毕会调用flowTail回调，这个时候通过next调用下游的fn2
        var args = Util.argsToArray(arguments);
        var next = args.pop();
        self.flowTail = function () {//下游调用
            var flowargs = Util.argsToArray(arguments);
            //console.log("<<<flowTail:"+flowargs);
            next.apply(null,flowargs);
        };
        //console.log(">>>>>pipe1.fire called!!");
        self.fire.apply(self,args);//启动上游
    });
    nextPipe.catch(this.errorCatch);
    return nextPipe;
};

Util.FnPipe.prototype.filter = function (filterFn) {//过滤,return true的不会进入下一个fn
    return this.to(function () {
        var args = Util.argsToArray(arguments);
        var next = args.pop();
        var ret = filterFn.apply(null,args);
        if(!ret){
            next.apply(null,args);
        }
    });
};

Util.FnPipe.prototype.delay = function (ms) {//延迟
    return this.to(function () {
        var args = Util.argsToArray(arguments);
        var next = args.pop();
        setTimeout(function () {
            next.apply(null,args);
        },ms);
    });
};

Util.FnPipe.prototype.compose = function (composeFn) {//组合
    return composeFn(this);
};
//下个函数为同步函数
Util.FnPipe.prototype.on = function (fn2) {
    return this.to(PipeSyncToASync(fn2));
};
//启动执行，参数传递给起始函数，如果起始函数时undefined那么将调用 转接函数fn2
Util.FnPipe.prototype.fire = function () {
    var args = Util.argsToArray(arguments);
    var self = this;
    var fn1cb = function () {//fn1回调
        //console.log(">>>>>fn1 called!!");
        if(!!self.fn2){
            var arg2 = Util.argsToArray(arguments);
            //console.log(">>>>>fn2 call!!:"+arg2);
            arg2.push(function () {//fn2回调
                //console.log(">>>>>fn2 called!!");
                if(!!self.flowTail){//通知下游
                    self.flowTail.apply(null,Util.argsToArray(arguments));
                }
            });
            try {
                self.fn2.apply(null, arg2);
            }catch (e){
                console.error(e);
                if(!!self.errorCatch){
                    self.errorCatch.apply(null,[e]);
                }else{
                    throw e;
                }
            }
        }
    };
    args.push(fn1cb);
    if(!!this.fn1){
        try {
            //console.log("fn1:"+this.fn1);
            this.fn1.apply(null,args);
        }catch (e){
            console.error(e);
            if(!!self.errorCatch){
                self.errorCatch.apply(null,[e]);
            }else{
                throw e;
            }
        }
    }else{
        args.pop();
        fn1cb.apply(null,args);
    }
};
