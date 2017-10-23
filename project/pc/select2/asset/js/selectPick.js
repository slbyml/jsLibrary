/*
container:盛放select得dom
search:是否启用模糊搜索
data:存放数据
key:有这个说明数组里面是object格式得
listLength:一屏显示几个list
listHeight:每个list的高度
placeholder:提示
value:输入框初始值
noData:没有数据时得显示
*/
;(function($, w, document,undefined){
	//页面大小改变时时更改下拉框得大小和为止
	const resizeWindow=(self)=>{			
		self.setPosition()
	}	
	//设置选中项
	const activeList=(ele,addName,self)=>{
		ele.addClass(addName).siblings().removeClass(addName)
		self.data.nowNode={			//记录选中的项的数据
			id:ele.data("id"),
			text:ele.text()
		}
	}	
	//隐藏下拉框
	const listHide=(self)=>{			
		self.data.show=false;		
		node.drop.hide();	
		node.mask.hide()

		//防止混乱和多次绑定事件，每次隐藏下拉时，都注销公用部分事件
		node.lists.off("click mouseenter")		
		node.mask.off("click")

		$(window).off("resize",resizeWindow(self))	
		$(window).off("scroll",self.setPosition())
	}
	/*默认值*/
	const defaults={
		container:"body",
		search:false,
		data:[],
		key:null,
		value:"",
		listLength:4,
		listHeight:32,
		placeholder:"请输入",
		callback:null,
		noData:"没有数据"		
	}
	let node={} //存放插件得dom		
	class selectPick{
		constructor(opt){
			this.o=$.extend(true,{},defaults, opt||{})
			this.data={  //存放插件里面得状态和数据
				listLength:0,		//是否有数据
				searchLength:0,		//搜索结果的个数
				show:false,   //当前下拉是否已经显示
				change:false,  //当前数据是否更改过
				tabIndex:0,  //用来记录按上下键时的id即焦点在第几个li上
				nowNode:{		//存放已经选中得项
					id:-1,
					text:""
				}
			}	
			this.child={}  //存放container下得元素
		}
		init(){
			this.renderHTML()
			this.bind()
			if(this.o.search){		//是否有模糊搜索功能
				this.search()
			}
		}
		renderHTML(){		//渲染页面
			this.child.select=$(` <div class="selectPick" ><input type="text" placeholder="${this.o.placeholder}" value="${this.o.value}"></div>`);
			//公共背景
			const mask=document.getElementById("selectMask");
			if(!mask){ 
				node.mask=$("<div id='selectMask'></div>")
				$("body").append(node.mask)
			}else{
				node.mask=$(mask)
			}
			//公共列表
			const drop=document.getElementById("selectDrop");
			if(!drop){		
				node.drop=$(`<div id="selectDrop" style="max-height:${this.o.listLength*this.o.listHeight}px"><ul></ul></div>`)
				$("body").append(node.drop)
			}else{
				node.drop=$(drop)
			}

			$(this.o.container).html(this.child.select);
			this.child.input=this.child.select.find("input");
			node.lists=node.drop.find("ul");
			if(!this.o.search){		//如果没有模糊搜索，则禁用输入框
				this.child.input.attr("disabled","disabled")
				this.child.select.append(`<div class="inputDisabled"></div>`)
			}		
		}
		renderList(text="",searchFlag=false){		//渲染list;text：默认选择和此值匹配得项，searchFlag:区分当前是否是在模糊搜索
			let html="",item="",m=this.data.nowNode.id>=0?this.data.nowNode.id:0;
			this.data.searchLength=0
			this.data.listLength=this.o.data.length
			if(this.data.listLength<=0 || this.o.data[0]==="") return false;			//没有数据
			for(let i=0;i<this.data.listLength;i++){
				item=this.o.key?this.o.data[i][this.o.key]:this.o.data[i]
				if(this.o.search && item.indexOf(text)<0 && text != "" && searchFlag) continue;		//如果有模糊搜索并且没有匹配到则退出当前循环
				if(text != "" && this.data.nowNode.id<0){	//如果有初始值,则默认选中初始值	
					if(item===text){
						html+=`<li data-id="${i}" class="active">${item}</li>`;
						this.data.nowNode={
							id:i,
							text:item
						}
						this.data.tabIndex=i
					}else{
						html+=`<li data-id="${i}">${item}</li>`
					}				
				}else{
					html+=`<li data-id="${i}" ${m===i?`class="active"`:""}>${item}</li>`
				}			
				++this.data.searchLength
			}
			if(this.o.search && html==="") return false;  //搜索时没有匹配到
			node.lists.html(html)
			node.items=node.lists.find("li");		//选择已经渲染到页面得数据node
			return true
		}
		setData(data=[]){			//设置下拉列表得数据
			this.o.data=data;
			if(this.o.value === ""){
				this.child.input.val("");			
			}else{
				this.child.input.val(this.o.value)
			}
			this.data={
				show:false,
				nowNode:{
					id:-1,
					text:""
				}
			}
			this.data.show=false;
			node.drop.hide();	
			node.mask.hide()
			return this
		}
		getValue(){			//获取已经选中得项得数据
			return {
				data:this.data.nowNode.id<0?-1:this.o.data[this.data.nowNode.id],
				value:this.data.nowNode.text
			}				
		}
		setDefaultVal(val=""){		//设置默认值，为异步设置默认值用得
			this.o.value=val
			this.child.input.val(val)
			let item="";
			for(let i=0,l=this.o.data.length;i<l;i++){
				item=this.o.key?this.o.data[i][this.o.key]:this.o.data[i];
				if(item===val){					
					this.data.nowNode={
						id:i,
						text:item
					}
					return false
				}
			}
		}
		gotoActive(){			//设置已经选中项在页面可视区域
			if(this.data.nowNode.id === -1){		//如果没有选中项，
				node.drop.scrollTop(0)
				return false
			}
			const $active=node.items.eq(this.data.nowNode.id),
				  currentOffset=node.drop.offset().top + node.drop.outerHeight(false),
				  activeBottom = $active.offset().top + $active.outerHeight(false),
				  activeOffset = node.drop.scrollTop() + activeBottom - currentOffset;
			node.drop.scrollTop(activeOffset)
		}
		setPosition(){		//设置下拉框得位置和大小
			const currentOffset=this.child.select.offset(),
			      currentTop=currentOffset.top+this.child.select.outerHeight(false),
			      currentWidth=this.child.select.outerWidth(),
			      currentLeft=currentOffset.left;
			node.drop.css({
				left:currentLeft,
				top:currentTop,
				width:currentWidth-2
			})
		}
		bind(){		//绑定事件
			const self=this;
			const $input=(()=>{			//选择接受点击事件得元素
				if(!this.o.search){
					return this.child.select.find(".inputDisabled")
				}else{
					return this.child.input
				}
			})();
			$input.on("click",e=>{				//显示下拉菜单
				const ev=window.event|| e
				const flag=this.renderList(this.o.value)
				if(!flag){		//没有数据
					node.lists.html(`<li data-disabled="true">${this.o.noData}</li>`)
				}
				this.setPosition()
				node.mask.show()
				node.drop.show();
				this.gotoActive()
				this.data.show=true;			
				this.data.tabIndex=this.data.nowNode.id<0?0:this.data.nowNode.id;		//tabindex默认是0

				//重新绑定事件
				this.bindMask($input)
				this.bindItem()

				$(window).on("resize",resizeWindow(this))
				$(window).on("scroll",this.setPosition.bind(this))
				ev.stopPropagation?ev.stopPropagation():ev.cancelBubble=true;
			})
			this.bindKeyDown($input)
		}
		bindItem(){			//为列表绑定事件
			const self=this;
			node.lists.on("mouseenter","li",function(){		//鼠标滑过
				$(this).addClass("active").siblings().removeClass("active")
				self.data.tabIndex=$(this).data("id")
			})
			node.lists.on("click","li",function(e){			//点击具体得item
				var ev=window.event|| e
				const $that=$(this);		
				if($that.data("disabled")) return false;		//当前不可点击
				activeList($that,"active",self)
				self.child.input.val(self.data.nowNode.text)
				listHide(self)
				ev.stopPropagation?ev.stopPropagation():ev.cancelBubble=true;
			})
		}
		bindMask($input){   //为背景设置点击事件			
			node.mask.on('click',()=>{			//点击其它地方隐藏下拉框
				if(this.data.show){
					if(this.data.nowNode.text !== ""){		//如果没有选择，则再关闭时回复输入框默认的值
						$input.val(this.data.nowNode.text)
					}else{
						$input.val(this.o.value)
					}		
					listHide(this)
				}
			});
		}
		bindKeyDown($input){		//绑定键盘事件	
			const self=this;	
			this.child.select.on("keydown",e=>{			//上下键
				const ev=window.event|| e;				
				if(ev.keyCode==38){				//按↑键
					if(this.data.tabIndex<=0) return false;
					--this.data.tabIndex
					const currentOffset=node.drop.offset().top,
						  $next=node.items.eq(this.data.tabIndex),
						  nextTop = $next.offset().top,
						  nextOffset = node.drop.scrollTop() + (nextTop - currentOffset);
					$next.addClass("active").siblings().removeClass("active")
					if(nextTop - currentOffset < 0){
						node.drop.scrollTop(nextOffset)
					}
					return false
				}
				if(ev.keyCode==40){		//按↓键
					if(this.data.tabIndex>=this.data.searchLength-1) return false;
					++this.data.tabIndex;
					const $next=node.items.eq(this.data.tabIndex),
						  currentOffset = node.drop.offset().top + node.drop.outerHeight(false),
						  nextBottom = $next.offset().top + $next.outerHeight(false),
						  nextOffset = node.drop.scrollTop() + nextBottom - currentOffset;
					$next.addClass("active").siblings().removeClass("active")
					if(nextBottom > currentOffset){
						node.drop.scrollTop(nextOffset)
					}
					return false
				}			
				if(ev.keyCode==13){		//回车
					let nowNode=node.items.eq(self.data.tabIndex);
					if(nowNode.data("disabled")) return false;		//当前不可点击
					listHide(self)	
					activeList(nowNode,"active",self)
					this.child.input.val(self.data.nowNode.text)
					const back=self.getValue();
					self.o.callback && self.o.callback(back.data,back.value)
					$input.blur()
				}
			})
		}
		search(){			//搜索
			const self=this;
			this.child.input.on("input propertychange",function(){
				if(self.data.listLength<=0){ //没有数据还搜索
					node.lists.html(`<li data-disabled="true">${this.o.noData}</li>`)
					return false
				}
				const val=$.trim(this.value);
				const flag=self.renderList(val,true)
				if(!flag){		//没有搜索到匹配的
					node.lists.html(`<li data-disabled="true">未找到“${val}”</li>`)					
					return false
				}else{
					if(val===""){		//如果输入框是空
						self.data.tabIndex=self.data.nowNode.id
						self.gotoActive()
					}else{				//匹配到输入的内容，并让第一个item获得焦点
						self.data.tabIndex=0
						node.items.eq(0).addClass("active").siblings().removeClass("active")
					}				
				}
			})
		}
	}
	w.selectPick=selectPick;
})(jQuery, window, document)
