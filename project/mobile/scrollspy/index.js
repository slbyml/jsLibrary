var _nav=document.querySelector(".nav")
var _list=[].slice.apply(_nav.querySelectorAll(".list"))
var offsets=[]    //存放位置信息
var targets=[]      //存放锚点
var _scrollNav=document.querySelector(".scrollNav")
var _navOffsetHeight=$(_scrollNav).offset().top  ///nav距离页面的距离
var _scrollHeight=0     //页面滚动的距离
var _activeTarget=null   //选中的导航
var _offset=_scrollNav.offsetHeight   //nav的高度
function  getScrollHeight(){		//获取页面的高度
	return Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)
}
function refresh(){				//重置数据
	var	arr=[];
	offsets=[],
	targets=[];
	 _scrollHeight=getScrollHeight()
	_list.forEach(function(item,index){
		var _target=item.dataset.target
		arr.push([$(_target).offset().top,_target])
	})
	arr.sort(function(a,b){
		return a[0]-b[0]
	})
	arr.map(function(item){
		offsets.push(item[0] - _offset)
		targets.push(item[1])
	})
}
function process(){		//获取滚动数据
	var _scrollTop=document.body.scrollTop || document.documentElement.scrollTop
	var _scrollHeight1 = getScrollHeight()
	if(_scrollHeight1 !== _scrollHeight){		//滚动的时候发现页面高度有变化
		refresh()
	}
	if(_scrollTop>=_navOffsetHeight){
		_scrollNav.classList.add("fixed")
	}else{
		_scrollNav.classList.remove("fixed")		
	}
	for(var i=offsets.length;i--;){
		_activeTarget !== targets[i] && _scrollTop >= offsets[i] && (offsets[i + 1] === undefined || _scrollTop < offsets[i + 1]) && activate(targets[i])
	}
}
function activate(target){		//
	_activeTarget=target	
	_list.forEach(function(item,index){
		if(item.classList.contains("active")){
			item.classList.remove("active")
		}		
	})
	_nav.querySelector(".list[data-target='"+target+"']").classList.add("active")
}

refresh()
process()
$(_list).on("click",function(){		//点击导航
	var _target=this.dataset.target
	var _index=targets.findIndex(function(i){
		return i === _target
	})
	document.documentElement.scrollTop=document.body.scrollTop = offsets[_index]
})
$(window).on("scroll",function(){		//页面滚动
	process()
})
