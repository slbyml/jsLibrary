/*支付密码  格式化为一个数字占一个格*/
/*
*@param {number} length 限制输入得个数
*@param {number} width 每个输入框得宽度
*/
;(function($, window, document,undefined) {
    var validate = function(ele, opt) {
        this.$ele = ele,
        this.defaults = {
            'length': 6,
            'width':0,
        },
        this.options = $.extend(true, this.defaults, opt||{});
        this.inputVal="";
        this.n=0;
    }
    validate.prototype = {
        constructor:validate,
        init: function() {
        	if(!this.options.width){
        		this.options.width=parseFloat(this.$ele.css('height'))
        	};
        	this.$ele.hide();
        	this.FillHTML();
        	this.event();
            return this;
        },
        FillHTML:function(){
        	var w=this.options.width;
        	var $p=this.$ele.parent();
        	var html="<div class='validateInput'>";
			for(var i=0;i<this.options.length;i++){
				html+="<span style='width:"+(w-1)+"px;height:"+w+"px'></span>"
			};
			html+="<input type='password'  style='width:"+w+"px;height:"+w+"px'></div>"
			$p.append(html);
			this.inputBox=$p.find('.validateInput');
			this.input=this.inputBox.find('input');
			this.item=$p.find('span')
        },
        event:function(){
        	var that=this,isRunning=[],flag=true,keyDownFlag=true;//flag判断是否输入正确,keyDownFlag:当前是否有按下还没弹起得键
            var keyDN=0;        //如果有按下得数字且没有弹起，则不允许退格键
        	that.inputBox.click(function(){
        		var v=that.input.val()
        		that.input.show().focus().val("").val(v);
        	});
        	that.input.blur(function(){
        		that.input.hide()
        	});
            function keyDownFn(e,c){
                var ev=e,code=c;      
                if(keyDN && code===8){  
                    keyDownFlag=false;
                    return false;
                }; 
                keyDownFlag=true;
                if(typeof isRunning[code] == "undefined" || isRunning[code]==false){    //限制长按
                    isRunning[code] = true;
                    keyDN++;        
                }else{
                    return false
                };
                var l=that.inputVal.length;
                if(l>=that.options.length && code!=8){
                    return false;
                };
                if((code<48 || code>57) && (code<96 || code>105) && code!=8){
                    flag=false
                    return false
                };
                flag=true;
                return true;
            };
            function keyUpFn(e,c,t){
                var ev=e,code=c,_input=t;
                isRunning[code] = false;
                if(keyDN>0 && keyDownFlag){keyDN--; };                
                if(!flag) return false;
                var txt="";l=0;
                if(code==8){
                    if(that.n===0) return false;
                    that.n--;
                    that.input.val("");
                    that.item.eq(that.n).removeClass('active');
                    that.input.css('left',that.n*that.options.width);
                    that.inputVal=that.inputVal.substr(0,that.n);
                    that.$ele.val(that.inputVal)
                    return false
                };
                txt=$.trim(_input.value);
                that.item.eq(that.n).addClass('active');
                if(that.n>=that.options.length && code!=8){                    
                    _input.value="1";
                    return false
                };
                _input.value="";
                that.inputVal+=txt;
                that.$ele.val(that.inputVal.substr(0,6))
                that.n++;
                if(that.n>=that.options.length){
                    _input.value="1"
                     return false
                };
                that.input.css('left',that.n*that.options.width)

            }
        	that.input.keydown(function(ev){  		
        		var ev=ev||window.event;
        		var code=ev.keyCode; 
               var f=keyDownFn(ev,code);
               if(!f) return false;
        	});
        	that.input.keyup(function(ev){
        		var ev=ev||window.event;
        		var code=ev.keyCode;
                var t=this;
                keyUpFn(ev,code,t)
        	})
        },
        empty:function(flag){
            this.item.removeClass("active");
            this.inputVal="";
            this.$ele.val("");
            this.input.val("")
            this.input.css('left',0);
            this.n=0;
            if(flag){
                this.input.show().focus()
            }
        }
    }
    $.fn.validateInput = function(options) {
        var v = new validate(this, options);
        return v.init();
    }
})(jQuery, window, document);