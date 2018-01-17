/*日历插件
     *starYear：开始年份
     *endYear：结束年份
     *callback：点起确定的回掉
     */
;(function(window, document, undefined) {
    let selectDate = {}; //当前选择的日期
    let monthDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; //每个月有多少天
    let yearScroll=null,yearMonth=null,dateScroll=null
    const translatedTwo= num=> { //将一位数转为两位数
        if (num < 10) {
            num = '0' + num
        }
        return '' + num
    };
    let ttime = null;

    const nowDate=txt=> { //获取时间
        let nowdate;
        if (txt) {
            nowdate = new Date(txt)
        } else {
            nowdate = new Date()
        };
        selectDate = {
            year: translatedTwo(nowdate.getFullYear()),
            month: translatedTwo(nowdate.getMonth() + 1),
            date: translatedTwo(nowdate.getDate())
        };
    };

    const isLeap=y=> { //是否是润年
        if ((y % 4 == 0 && y % 100 != 0) || y % 400 == 0) {
            return true;
        } else {
            return false;
        }
    };
    let alloyArr = {};
    const AlloyTouchFn=(scroll, h, txt, min)=> { //初始化滚动
        Transform(scroll, true);
        alloyArr[txt] = new AlloyTouch({
            touch: scroll,
            target: scroll,
            max: 0,
            min: min * h || 0,
            property: "translateY",
            step: h,
            initialValue: 0
        })
    };
    class picker {
    	constructor(ele, opt){
	        this.$dom = ele
            this.defaults = {
                starYear: 2010,
                itemH: 42, 			//每个li的高度
                endYear: 2030,
                callback: null
            }
            this.options = Object.assign(true, this.defaults, opt || {});
	        if (this.$dom.is('input')) { //判断当前标签是否是input
	            this.isInput = true;
	        } else {
	            this.isInput = false;
	        }    		
    	}
    	init(){
            this.event();
            return this    		
    	}    	
        renderDom() {
            if (document.getElementById('zlwDateBox')) return false;
            let html = `<div id="zlwDateBox">
            				<header class="pickerHeader"><button class="pickerBtn" id="pickerSure">确定</button><button class="pickerBtn" id="pickerEsc">取消</button>
                        </header>
                        <section class="pickerTitle"><span>年</span><span>月</span><span>日</span></section>
                        <div class="pickerBody">
                            <div class="pickerList" id="yearBox"><div><ul></ul></div></div>
                            <div class="pickerList" id="monthBox"><ul></ul></div>
                            <div class="pickerList" id="dateBox"><ul></ul></div>
                        </div>
                    </div>`;
            $('body').append(html);
            setTimeout(()=> {
                document.getElementById('zlwDateBox').classList.add('pickerIn')
            }, 10)
            this.AlloyTouch()
            this.pickerEvent()
            this.creatYear();
            this.creatMonth();
            this.creatDate();
        }
        AlloyTouch() {
            let n = this.defaults.endYear - this.defaults.starYear;
            const year = document.querySelector('#yearBox ul');
            const month = document.querySelector('#monthBox ul');
            const date = document.querySelector('#dateBox ul');
            AlloyTouchFn(year, this.options.itemH, 'year', -n + 1);
            AlloyTouchFn(month, this.options.itemH, 'month', -11);
            AlloyTouchFn(date, this.options.itemH, 'date')
        }
        pickerEvent() { //日历事件
            document.getElementById('pickerEsc').onclick = ()=> {
                this.destroy()
            }
            document.getElementById('pickerSure').onclick = ()=> {
                this.destroy();
                const txt = `${selectDate.year}-${selectDate.month}-${selectDate.date}`;
                if (this.isInput) { //如果是input标签则设置input值，否则设置data
                    this.$dom.val(txt)
                } else {
                    this.$dom.data('date', txt)
                };
                this.options.callback && this.options.callback(txt, selectDate)
            }
        }
        destroy() { //销毁
            const scrollArr = [yearScroll, yearMonth, dateScroll];
            scrollArr.forEach(function(item) {
                if (item != null) {
                    item.destroy();
                    item = null;
                }
            });
            document.getElementById('pickerEsc').onclick = null;
            document.getElementById('pickerSure').onclick = null;
            document.getElementById('zlwDateBox').classList.remove('pickerIn');
            setTimeout(()=> {
                $('#zlwDateBox,#zlwBj').remove();
            }, 350)
        }
        creatYear() { //创建年份
            const that = this;
            let n = that.defaults.endYear - that.defaults.starYear,
                i = 0,
                li = '',
                h = that.options.itemH;
            let initIndex = selectDate.year - that.options.starYear;
            for (; i < n; i++) {
                let m = (that.defaults.starYear + i);
                if (initIndex === i) {
                    li += `<li data-num='${m}' class='on'>${m}</li>`
                } else {
                    li += `<li data-num='${m}'>${m}</li>`
                }
            };

            const yearscrollEnd=val=>{ //滚动结束的回掉
                let index = -val / h;
                $('#yearBox li').eq(index).addClass('on').siblings().removeClass('on')
                selectDate.year = that.options.starYear + index;
                if (isLeap(selectDate.year)) { //闰年改变二月的天数
                    monthDay[1] = 29;
                } else {
                    monthDay[1] = 28
                }
                if (selectDate.month === '02') {
                    that.creatDate(index)
                }
            };
            const oUl = document.getElementById('yearBox');
            oUl.querySelector('ul').innerHTML = li;
            const scroll = oUl.querySelector('ul');
            scroll.translateY = -initIndex * h;
            alloyArr.year.animationEnd = function(value) {
                yearscrollEnd(value)
            }
        }
        creatMonth() { //创建月份
            let that = this,
                i = 1,
                li = '',
                index = 0;
            const oUl = document.getElementById('monthBox');
            let scroll = oUl.querySelector('ul');
            let initIndex = selectDate.month - 1;
            let h = that.options.itemH;
            this.renderItem(12, oUl, 1, initIndex + 1);

            const monthscrollEnd=val=>{
                index = -val / h;
                selectDate.month = translatedTwo(1 + index);
                that.creatDate(index)
                $('#monthBox li').eq(index).addClass('on').siblings().removeClass('on')
            };
            scroll.translateY = -initIndex * h;
            alloyArr.month.animationEnd = function(value) {
                monthscrollEnd(value)
            }
        }
        creatDate(num) {
            let that = this,
                i = 1,
                li = '',
                index = 0;
            const oUl = document.getElementById('dateBox');
            const scroll = oUl.querySelector('ul');
            let initIndex = selectDate.date - 1;
            let h = that.options.itemH;
            num = num ? num : parseInt(selectDate.month) - 1;
            this.renderItem(monthDay[selectDate.month - 1], oUl, 1, initIndex + 1);

            const datescrollEnd=val=>{
                index = -val / h;
                selectDate.date = translatedTwo(1 + index);
                $('#dateBox li').eq(index).addClass('on').siblings().removeClass('on')
            }
            let sdate = parseInt(selectDate.date);
            if (num && sdate > 28 && sdate > monthDay[num]) {
                selectDate.date = '' + monthDay[num];
                $('#dateBox li').eq(selectDate.date - 1).addClass('on').siblings().removeClass('on')
            };
            scroll.translateY = -(selectDate.date - 1) * h;
            alloyArr.date.min = -(monthDay[num] - 1) * h;
            alloyArr.date.animationEnd = function(value) {
                datescrollEnd(value)
            }
        }
        scrollEnd(ele, txt) { //时、分、秒滚动完后回掉
            const that = this;
            index = -ele.y / that.options.itemH;
            selectDate[txt] = translatedTwo(index);
            $(`#${txt}Box li`).eq(index).addClass('on').siblings().removeClass('on')
        }
        renderItem(num, box, num2, initIndex) { //时分秒的填充   
            let that = this,
                i = num2,
                li = '',
                index = 0;
            for (; i <= num; i++) {
                let n = translatedTwo(i);
                if (initIndex === i) {
                    li += `<li data-num='${n}' class='on'>${n}</li>`
                } else {
                    li += `<li data-num='${n}'>${n}</li>`
                }
            };
            box.querySelector('ul').innerHTML = li;
        }
        event() { //事件
            let that = this,
                data;
            this.$dom.on('click', function() {
                if (that.isInput) { //如果是input标签则获取input值，否则获取data
                    data = $(this).val()
                } else {
                    data = $(this).data('date')
                };
                let _Bj = document.getElementById('zlwBj')
                if (!_Bj) {
                    _Bj = document.createElement('DIV');
                    _Bj.id = 'zlwBj';
                    $('body').append(_Bj)
                };
                _Bj.style.display = 'block';
                nowDate(data);
                that.renderDom();
            })
        }
    }
    $.fn.dataPicker = function(options) {
        var d = new picker(this, options);
        return d.init();
    }
})(window, document);
