document.body.addEventListener('touchmove',function(e){e.preventDefault()})
;(function($, window, document,undefined) {
    var _elementStyle = document.createElement('div').style;
    var _vendor = (function () {
        var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
            transform,
            i = 0,
            l = vendors.length;

        for ( ; i < l; i++ ) {
            transform = vendors[i] + 'ransform';
            if ( transform in _elementStyle ) return vendors[i].substr(0, vendors[i].length-1);
        }
        return false;
    })();    
    function _prefixStyle (style) {
        if ( _vendor === false ) return false;
        if ( _vendor === '' ) return style;
        return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
    }
    var styleTransform=_prefixStyle('transform');
    var styletransition=_prefixStyle('transitionDuration');
    var getDom=function(ele){
        return document.querySelectorAll(ele)
    };
    var moveFlat=false;  //是否再运动
    /*
    *@param  {Object} option        参数描述
    *@param  {Object} opttion.btn   选择器
    *@param  {string} opttion.btn   翻页选择器
    *@param  {string} opttion.box   每页的选择器
    *@param  {number} opttion.time  动画持续时间
    */
    var pullPage = function(option) {
        option=option||{};
        this.btn= option.btn?getDom(option.btn):getDom('.down');
        this.page= option.box?getDom(option.box):getDom('.pageBox');
        this.time=option.time || 400;       //动画持续时间（ms）
        this.box=document.body;
        this.pageLength=this.page.length;
        this.index=0;        //当前页面的索引
        this.pageH=0;       //屏幕的高度高度
    }
    pullPage.prototype = {
        constructor:pullPage,
        init: function() {
            this.initPage();
            this.event()
        },
        initPage:function(){            //获取屏幕的高度
            var h=window.innerHeight;
            this.pageH=h;
            document.getElementById('pullPage').style.height=h+"px"
        },
        event:function(){
            var _this=this;
            if(this.btn){           //如果有向下按钮，则为每个按钮绑定单击事件
                for(var i=0;i<this.btn.length;i++){
                    (function(n){
                        var item=_this.btn[n];
                        item.addEventListener('click',function(){                    
                            if(this.index>=this.pageLength-1) return false;
                            _this.index++;
                            _this.pageMove()
                        })
                    })(i)
                }
            };
            for(var j=0;j<this.pageLength;j++){
                (function(item){              
                    _this.touchEvent(item)
                })(this.page[j]);
            }
        },
        touchEvent:function(ele){
            var dom=ele,_this=this,flag=true,moveIndex=0,starTime=endTime=0;       //moveIndex:即将出现的page;flag:是否允许翻页
            ele.addEventListener('touchstart',function(e){
                starTime=new Date();            //记录划屏时间，如果时间特别短说明事快速滑动，允许翻页
                _this.starY=e.changedTouches[0].clientY;
                _this.starX=e.changedTouches[0].clientX;
                flag=false;
            });
            ele.addEventListener('touchmove',function(e){
                if(moveFlat) return false;
                var moveY=e.changedTouches[0].pageY;
                var moveX=e.changedTouches[0].clientX;
                if(Math.abs(moveX-_this.starX)>Math.abs(moveY-_this.starY)) return false;
                var moveH=moveY-_this.starY;
                if(moveH<0 && _this.index>=_this.pageLength-1) return false;
                if(moveH>0 && _this.index<=0) return false;
                if(moveH<0){        //向上滑动屏幕
                    if(_this.index>=_this.pageLength-1) return false;
                    flag=true;
                    moveIndex=_this.index+1;
                    _this.page[moveIndex].style[styleTransform]="translateY("+(_this.pageH+moveH)+"px)"
                }else{          //向下滑动屏幕
                    if(_this.index<=0) return false;
                    flag=true;
                    moveIndex=_this.index-1;
                    _this.page[moveIndex].style[styleTransform]="translateY("+(-_this.pageH+moveH)+"px)"
                };             
            });
            ele.addEventListener('touchend',function(e){
                if(!flag || moveFlat) return false;
                endTime=new Date();
                var moveDom;    //存储即将跳转的page
                var time=endTime-starTime;
                var moveY=e.changedTouches[0].pageY;
                var moveX=e.changedTouches[0].clientX;
                var moveH=moveY-_this.starY;
                if(Math.abs(moveH)>100 || time<=150){        //允许翻页
                    if(moveH<0){
                        _this.index++
                    }else{
                        _this.index--
                    }
                    _this.pageMove();
                    return false;
                };
                if(moveH<0){        //没有达到翻页条件的话滑动复原
                    moveDom=_this.page[_this.index+1];
                    moveDom.style[styletransition]=_this.time+'ms';
                    moveDom.style[styleTransform]="translateY("+_this.pageH+"px)";
                }else{
                    moveDom=_this.page[_this.index-1]
                    moveDom.style[styletransition]=_this.time+'ms';
                    moveDom.style[styleTransform]="translateY(-"+_this.pageH+"px)";                    
                };
                setTimeout(function(){
                    moveDom.style[styletransition]='0ms';
                },_this.time);
            })
        },
        pageMove:function(){
            var _this=this;
            moveFlat=true;
            _this.page[_this.index].style[styletransition]=_this.time+'ms';
            _this.page[_this.index].style[styleTransform]="translateY(0)";
            setTimeout(function(){
                for(var i=0;i<_this.pageLength;i++){
                    var dom=_this.page[i];
                    if(i==_this.index){     //为当前页面加active
                        dom.classList.add('active');
                        continue;
                    };
                    dom.classList.remove('active')
                    dom.style[styletransition]="0ms";
                    if(i<_this.index){
                        dom.style[styleTransform]="translateY(-"+_this.pageH+"px)";
                    };
                    if(i>_this.index){
                        dom.style[styleTransform]="translateY("+_this.pageH+"px)";
                    }; 
                };
                moveFlat=false;
            },_this.time)
        },
        goPage:function(index){     //跳转到制定页面
            if(index<1 || index>this.pageLength){
                throw '第'+index+'不存在';
                return false;
            };
            this.index=index-1;
            this.pageMove()
        }
    }
    window.pullPage=pullPage;
})(Zepto, window, document);
 /*全屏*/
(function(){
    var h=window.innerHeight;       //获取屏幕的高度
    document.body.style.height=h+'px'
})();
$(function(){
    $('.diog .close').on('click',function(){
        $('.diog').hide()
    })
    $('#page0>p').on('click',function(){
        $('.hdgz').show()
    })
})