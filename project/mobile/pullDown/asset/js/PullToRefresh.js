let _PTFuntil={
    throttle(that, fn, delay, atleast){         //函数节流
        let timer = null;
        let previous = null;
        return function() {
            var now = +new Date();
            if (!previous) previous = now;
            if (atleast && now - previous > atleast) {
                fn.call(that)
                // 重置上一次开始时间为本次结束时间
                previous = now;
                clearTimeout(timer);
            } else {
                clearTimeout(timer);
                timer = setTimeout(function() {
                    fn.call(that)
                    previous = null;
                }, delay);
            }
        }
    },
    deepMerge:(function(){  //深度合并object
        const merge = (obj1,obj2={})=>{
            let key="";
            for(key in obj2) {
                // 如果target(也就是obj1[key])存在，且是对象的话再去调用deepMerge，否则就是obj1[key]里面没这个对象，需要与obj2[key]合并
                obj1[key] = obj1[key] && obj1[key].toString() === "[object Object]" ?
                _PTFuntil.deepMerge(obj1[key], obj2[key]) : obj1[key] = obj2[key];
            }
        }
        return function(...arr){
            let obj={};
            arr.forEach((item)=>{
                merge(obj,item)
            })
            return obj
        }
    })(),
    prefixStyle:(function(){        //css3兼容      
        const _elementStyle = document.createElement('div').style;
        const _vendor = (function() {
            let vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
                transform,
                i = 0,
                l = vendors.length;

            for (; i < l; i++) {
                transform = vendors[i] + 'ransform';
                if (transform in _elementStyle) return vendors[i].substr(0, vendors[i].length - 1);
            }
            return false;
        })();
        return style =>{
            if (_vendor === false) return false;
            if (_vendor === '') return style;
            return _vendor + style.charAt(0).toUpperCase() + style.substr(1);

        }
    })()
}

const transform = _PTFuntil.prefixStyle('transform');
const transitionDuration = _PTFuntil.prefixStyle('transitionDuration');

/*
container:容器
pull.set:是否启用上拉（下拉）；
pull.height:下拉height，触发刷新
pull.callback(this):满足下拉或上拉条件时触发
pull.dampRate:阻尼
*/
/*方法  参数为true说明还可以继续操作，为false时说明已经没有数据了
.endUpLoading(flag)  //上拉加载完成后调用
.endPullRefresh(flag)  //下拉刷新 完成后调用
.initUpLoading()  //当不是由下拉或上拉改变得容器里面所有内容时，一定要先重置下拉状态，否则会有bug
*/
/*默认参数 ↓↓↓↓↓↓↓↓*/
const defaults = {
    container:"body",
    pull:{
        dampRate:0.4,
        set:true,
        height:60,
        contentdown:"下拉刷新",
        contentover:"释放刷新",
        contentfresh:"刷新中……",
        success:"刷新成功"
    },
    up:{
        set:true,
        height:120,
        contentfresh:"正在加载……",
        contentnomore:"没有更多数据了"
    }

}
/*下拉刷新，上拉加载*/
class PullToRefresh{
    constructor(options){
        this.options=_PTFuntil.deepMerge({},_PTFuntil.deepMerge(defaults, options));
        if(!!!options.pull || !this.options.pull.set){      //如果没有设置pull，则默认不启用下拉刷新
            this.options.pull.set=false;
        }
        if(!!!options.up || !this.options.up.set){          //同上
            this.options.up.set=false
        }
        this.dom=document.querySelector(this.options.container)
        this.domHeight=this.dom.offsetHeight
        this.scrollBox=this.dom.children[0]
        this.progress=null
        this.data={             //存放数据和状态
            upLoading:false,    //是否增在加载更多
            firstFull:false,    //第一次调用加载时内容是否大于容器，false则继续加载，知道大于为止
            canPull:true,       //是否可以下拉
            pullLoadding:false, //当前是否正在刷新
            preY:0,             //存放上一次的Y坐标
            starX:0,            //存放开始滑动时的坐标
            starY:0,
            pullHeight:0,       //存放下拉的高度
            canRefresh:false,  //能否刷新
        }  
        this.init()
    }
    init(){     
        this.dom.classList.add("refreshWrap")

        this.createPullBox();
        this.createUpbox();
        
        this.firstLoad()
        this.loadMoreEvent();

        this.pullEvent()
    }
    firstLoad(){  //初始化组件时，要判断是否需要加载内容来让内容大于滚动容器的高度
        const childHeight=this.scrollBox.offsetHeight;
        if(childHeight<this.domHeight+this.options.up.height && !this.data.firstFull){      //滚动元素小于滚动容器
            this.loadMore(true)
        }else{
            this.data.firstFull=true;
        }
    }
    createPullBox(){    //创建下拉
        if(!this.options.pull.set) return false;
        this.pullBox=document.createElement("DIV");
        this.pullBox.className="refresh";
        this.pullBox.style.visibility="hidden"; //隐藏下拉刷新
        this.pullBox.innerHTML=`<i class="loading"></i><p class="loadTxt">${this.options.pull.contentdown}</p>`;
        this.dom.insertBefore(this.pullBox,this.scrollBox)
        this.progress=this.pullBox.querySelector(".loading")
        this.progressTxt=this.pullBox.querySelector(".loadTxt")
    }
    createUpbox(){      //创建上拉加载
        if(!this.options.up.set) return false;
        const scrollBoxColor=getComputedStyle(this.scrollBox).backgroundColor;
        this.upBox=document.createElement("DIV")
        this.upBox.className="loadingBox"
        this.upBox.style.backgroundColor=scrollBoxColor      //设置和滚动元素一样的背景，防止露底
        this.upBox.innerHTML=`<i class="loading rotate"></i><p class="loadTxt">${this.options.up.contentfresh}</p>`
        this.dom.appendChild(this.upBox)
    }
    loadMoreEvent(){//上拉加载
        this.dom.onscroll=_PTFuntil.throttle(this, this.scrollCallback, 200, 250)
    }
    scrollCallback(){
        if(!this.data.firstFull) return false;    //  当不是由下拉或上拉改变得容器里面所有内容时,如果改变之前有滚动条，改变之后没有，则可能会触发一次scroll,会造成两次请求
        this.loadMore()
    }
    loadMore(flag=false){   //加载更多  flag为true是可以跳过判断，直接加载更多
        if(this.data.upLoading) return false;
        const scrollTop=this.dom.scrollTop,
              scrollHeight=this.dom.scrollHeight;
        if(flag || scrollTop+this.domHeight+this.options.up.height>=scrollHeight){
            this.data.upLoading=true
            this.options.up.callback && this.options.up.callback(this)
        }
    }
    endUpLoading(flag=true){        //更新上拉状态,flag判断是否还有更多
        if(flag){
            this.data.upLoading=false;
            if(!this.data.firstFull) this.firstLoad();          
        }else{      //没有数据
            this.UpNoMore()
        }
    }
    endPullRefresh(flag=true){       //刷新成功（外部调用）
        this.showPullSuc(flag)
    }
    showPullSuc(flag){
        //显示刷新成功并更改图标
        this.progress.classList.add("success")
        this.progress.style[transform] = `rotate(45deg)`
        this.progressTxt.innerText=this.options.pull.success

        this.progress.classList.remove("rotate")

        setTimeout(()=>{
            this.refreshSuccess(flag)
        },1000)
    }
    refreshSuccess(flag){      //刷新成功，重置参数
        this.data.pullLoadding=false;
        this.translate(0,300)
        this.data.pullHeight=0
        this.dom.scrollTop=0
        setTimeout(()=>{this.progress.classList.remove("success")},100)     //移除刷新成功的√
        
        if(!flag){      //刷新时没有数据
            this.pullBox.style.visibility="hidden" //隐藏下拉刷新
            this.UpNoMore();
            return false;
        }
        /*重置上拉加载的参数*/
        this.initUpLoading()
        setTimeout(()=>{     
            this.firstLoad();   //下一次渲染的时候判断是否需要加载更多
            this.pullBox.style.visibility="hidden" //隐藏下拉刷新
        },100)
    }
    UpNoMore(){
        this.upBox.classList.add("noMore")
        this.upBox.querySelector(".loadTxt").innerHTML=this.options.up.contentnomore
    }
    pullEvent(){            //为下拉刷新绑定事件
        if(!this.options.pull.set) return false;
        const start = e => {
            this.data.canRefresh=false
            const scrollTop=this.dom.scrollTop;
            this.data.canPull=scrollTop>0?false:true       //根据滚动到顶部判断是否可以启用下拉
            this.data.preY=this.data.starY = e.changedTouches[0].clientY || e.clientY
            this.data.starX = e.changedTouches[0].clientX || e.clientX
        }   
        const move = e =>{
            const scrollTop=this.dom.scrollTop;
            if(this.data.pullLoadding || !this.data.canPull) return false;      //当前不是下拉状态活不是正在刷新状态
            this.pullBox.style.visibility="visible"; //隐藏下拉刷新
            const toucheX=e.changedTouches[0].clientX || e.clientX,
                  toucheY=e.changedTouches[0].clientY || e.clientY;
            const diff=toucheY-this.data.preY;  //当前移动点相对于上一次移动点的位移
            this.data.preY=toucheY
            const moveX=toucheX-this.data.starX,    //记录移动的距离
                  moveY=toucheY-this.data.starY;
            if(Math.abs(moveX)>Math.abs(moveY)){        //左右滑动
                return false
            }
            if(moveY<0){        //向上移动 
                this.data.canPull=false
                return false 
            }   
            e.preventDefault();
            if(this.options.pullHeight<this.options.pull.height){       //没有到达可以刷新的距离
                this.data.pullHeight+=diff
            }else{                  //到达可以刷新的高度
                if(diff<0){     
                    this.data.pullHeight+=diff
                }else{
                    this.data.pullHeight+=diff*this.options.pull.dampRate
                }               
            }
            this.data.pullHeight=Math.round(this.data.pullHeight)
            this.translate(this.data.pullHeight)
            this.progressRote(this.data.pullHeight)
        }   
        const end = e =>{
            const scrollTop=this.dom.scrollTop;
            if(this.data.pullLoadding) return false;  //当前是正在刷新状态
            if(!this.data.canPull){       //当前不是下拉状态
                if(this.data.pullHeight!=0){
                    this.data.pullHeight=0;
                    this.translate(0,0)
                }
                return false
            }
            this.data.preY=0;
            this.data.starY=0;
            this.data.starX=0;
            if(this.data.canRefresh){       //刷新
                this.pullRefresh()
            }else{      //不刷新
                this.pullBox.style.visibility="hidden"; //隐藏下拉刷新
                this.data.pullHeight=0;
                this.translate(0,300)
                this.dom.scrollTop=0
            }
        }
        this.dom.addEventListener('touchstart',e=>{
            start(e)
        }, false)
        this.dom.addEventListener('touchmove',e=> {
            move(e)
        }, false);
        this.dom.addEventListener('touchend',e => {
            end(e)
        }, false)
    }
    pullRefresh(){          //刷新
        this.data.pullLoadding=true
        this.translate(this.options.pull.height,300)
        this.data.pullHeight=this.options.pull.height
        this.progressTxt.innerText=this.options.pull.contentfresh
        this.options.pull.callback && this.options.pull.callback(this)
        this.progress.classList.add("rotate")
    }
    translate(h=0,duration=0){
        this.upBox.style[transitionDuration] =`${duration}ms`
        this.upBox.style[transform] = `translate3d(0,${h}px,0)`
        this.scrollBox.style[transitionDuration] =`${duration}ms`
        this.scrollBox.style[transform] = `translate3d(0,${h}px,0)`
    }
    progressRote(h=0){          //更改下拉刷新的文字和动画
        const r=360;
        let rotate=r*h/this.options.pull.height
        this.progress.style[transform] = `rotate(${rotate}deg)`
        if(h>=this.options.pull.height){        //可以刷新
            if(!this.data.canRefresh){
                this.progressTxt.innerText=this.options.pull.contentover
                this.data.canRefresh=true
            }
            return false               
        }else{          //不可以刷新
            if(this.data.canRefresh){
                this.progressTxt.innerText=this.options.pull.contentdown
                this.data.canRefresh=false
            }
            return false              
        }
    }
    initUpLoading(){  //重置上拉加载的状态        
        this.data.firstFull=false
        this.data.upLoading=false
        this.upBox.classList.remove("noMore")
        this.upBox.querySelector(".loadTxt").innerHTML=this.options.up.contentfresh
    }
    scrollToTop(){
        this.dom.scrollTop=0
    }
    triggerPullLoading(){       //主动触发刷新
        if(!this.options.pull.set) return false;
        this.pullBox.style.visibility="visible"
        this.scrollToTop()
        this.pullRefresh()
    }
    triggerUpLoading(){         //主动触发上拉加载
        this.initUpLoading()
        this.loadMore(true)
    }
}
