//深度合并
const deepMerge= (obj1, obj2={})=> {
    var key;
    for(key in obj2) {
        // 如果target(也就是obj1[key])存在，且是对象的话再去调用deepMerge，否则就是obj1[key]里面没这个对象，需要与obj2[key]合并
        obj1[key] = obj1[key] && obj1[key].toString() === "[object Object]" ?
        deepMerge(obj1[key], obj2[key]) : obj1[key] = obj2[key];
    }
    return obj1;
}
const throttle =(that, fn, delay, atleast)=> { //节流
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
    }
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

function _prefixStyle(style) {
    if (_vendor === false) return false;
    if (_vendor === '') return style;
    return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
}
const transform = _prefixStyle('transform');
const transitionDuration = _prefixStyle('transitionDuration');

class PullToRefresh{
	constructor(options){
		this.options=deepMerge(PullToRefresh.default, options);
		if(!!!options.pull || !this.options.pull.set){		//如果没有设置pull，则默认不启用下拉刷新
			this.options.pull.set=false;
		}
		if(!!!options.up || !this.options.up.set){			//同上
			this.options.up.set=false
		}
		this.dom=document.querySelector(this.options.container);
		this.domHeight=this.dom.offsetHeight;
		this.scrollBox=this.dom.children[0];
		this.progress=null;
		this.data={				//存放数据和状态
			upLoading:false,	//是否增在加载更多
			firstFull:false,	//第一次调用加载时内容是否大于容器，false则继续加载，知道大于为止
			canPull:true,		//是否可以下拉
			pullLoadding:false, //当前是否正在刷新
			preY:0,				//存放上一次的Y坐标
			starX:0,			//存放开始滑动时的坐标
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
		if(childHeight+this.options.up.height<this.domHeight && !this.data.firstFull){		//滚动元素小于滚动容器
			this.loadMore(true)
		}else{
			this.data.firstFull=true;
		}
	}
	createPullBox(){  	//创建下拉
		if(!this.options.pull.set) return false;
		this.pullBox=document.createElement("DIV");
		this.pullBox.className="refresh";
		this.pullBox.innerHTML=`<i class="loading"></i><p class="loadTxt">${this.options.pull.contentdown}</p>`;
		this.dom.insertBefore(this.pullBox,this.scrollBox)
		this.progress=this.pullBox.querySelector(".loading")
		this.progressTxt=this.pullBox.querySelector(".loadTxt")
	}
	createUpbox(){		//创建上拉加载
		if(!this.options.up.set) return false;
		this.upBox=document.createElement("DIV");
		this.upBox.className="loadingBox";
		this.upBox.innerHTML=`<i class="loading rotate"></i><p class="loadTxt">${this.options.up.contentfresh}</p>`;
		this.dom.append(this.upBox)
	}
	loadMoreEvent(){//上拉加载
		const box=this.dom;
		this.dom.onscroll=throttle(this, this.loadMore, 200, 250)
	}
	loadMore(flag=false){	//加载更多  flag为true是可以跳过判断，直接加载更多
		if(this.data.upLoading) return false;
		const scrollTop=this.dom.scrollTop,
			  scrollHeight=this.dom.scrollHeight;
		console.log(scrollTop+this.domHeight+this.options.up.height,scrollHeight,scrollTop+this.domHeight+this.options.up.height>=scrollHeight,flag)
		if(scrollTop+this.domHeight+this.options.up.height>=scrollHeight || flag){
			this.data.upLoading=true;
			this.options.up.callback && this.options.up.callback()
		}
	}
	endUpLoading(flag=true){		//更新上拉状态,flag判断是否还有更多
		if(flag){
			this.data.upLoading=false;
			if(!this.data.firstFull) this.firstLoad();			
		}else{		//没有数据
			this.UpNoMore()
		}
	}
	endPullRefresh(){		//刷新成功
		this.data.pullLoadding=false;
		this.translate(0,300)
		this.data.pullHeight=0;
		this.progress.classList.remove("rotate");
		this.dom.scrollTop=0;

		/*重置上拉加载的参数*/
		this.data.firstFull=false;
		this.data.upLoading=false;
		this.upBox.classList.remove("noMore");
		this.upBox.querySelector(".loadTxt").innerHTML=this.options.up.contentfresh
		setTimeout(()=>{		//下一次渲染的时候判断是否需要加载更多
			this.firstLoad()
		},100)
	}
	UpNoMore(){
		this.upBox.classList.add("noMore")
		this.upBox.querySelector(".loadTxt").innerHTML=this.options.up.contentnomore
	}
	pullEvent(){
		const start = e => {
			const scrollTop=this.dom.scrollTop;
			this.data.canPull=scrollTop>0?false:true;		//根据滚动到顶部判断是否可以启用下拉
			this.data.preY=this.data.starY = e.changedTouches[0].clientY || e.clientY;
        	this.data.starX = e.changedTouches[0].clientX || e.clientX;
		}	
		const move = e =>{
			const scrollTop=this.dom.scrollTop;
			if(this.data.pullLoadding || !this.data.canPull) return false;		//当前不是下拉状态活不是正在刷新状态
			const toucheX=e.changedTouches[0].clientX || e.clientX,
				  toucheY=e.changedTouches[0].clientY || e.clientY;
			const diff=toucheY-this.data.preY;	//当前移动点相对于上一次移动点的位移
			this.data.preY=toucheY;
			const moveX=toucheX-this.data.starX,	//记录移动的距离
				  moveY=toucheY-this.data.starY;
			if(Math.abs(moveX)>Math.abs(moveY)){		//左右滑动
				return false
			}
			if(moveY<0){
				this.data.canPull=false
				return false //向上移动	
			}	
			e.preventDefault();
			if(this.options.pullHeight<this.options.pull.height){		//没有到达可以刷新的距离
				this.data.pullHeight+=diff
			}else{					//到达可以刷新的高度
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
			if(!this.data.canPull || this.data.pullLoadding){		//当前不是下拉状态活不是正在刷新状态
				if(this.data.pullHeight!=0){
					this.data.pullHeight=0;
					this.translate(0,0)
				}
				return false
			}
			this.preY=0;
			this.starY=0;
			this.starX=0;
			if(this.data.canRefresh){		//刷新
				this.data.pullLoadding=true;
				this.translate(this.options.pull.height,300)
				this.data.pullHeight=this.options.pull.height;
				this.progressTxt.innerText=this.options.pull.contentfresh;
				this.options.pull.callback && this.options.pull.callback()
				this.progress.classList.add("rotate")
			}else{		//不刷新
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
	translate(h=0,duration=0){
        this.scrollBox.style[transitionDuration] =`${duration}ms`;
        this.scrollBox.style[transform] = `translate3d(0,${h}px,0)`;
	}
	progressRote(h=0){			//更改下拉刷新的文字和动画
		const r=360;
		let rotate=r*h/this.options.pull.height
		this.progress.style[transform] = `rotate(${rotate}deg)`;
		if(h>=this.options.pull.height){		//可以刷新
			if(!this.data.canRefresh){
				this.progressTxt.innerText=this.options.pull.contentover
				this.data.canRefresh=true
			}				
		}else{			//不可以刷新
			if(this.data.canRefresh){
				this.progressTxt.innerText=this.options.pull.contentdown
				this.data.canRefresh=false
			}
			
		}
	}
}
/*
container:容器
pull.set:是否启用上拉（下拉）；
pull.height:下拉height，触发刷新
pull.callback:满足下拉或上拉条件时触发
pull.dampRate:阻尼
*/
PullToRefresh.default={
	container:"body",
	pull:{
		dampRate:0.4,
		set:true,
		height:60,
		contentdown:"下拉刷新",
		contentover:"释放刷新",
		contentfresh:"刷新中……"
	},
	up:{
		set:true,
		height:120,
		contentfresh:"正在加载……",
		contentnomore:"没有更多数据了"
	}
}
