/*
 *	注意： 覆盖层id : printViewPop 调用这个函数，页面中不要出现相同的id名称
 * 打印数据：	print.log( msg );
 * 清空数据：print.clear();  // question clear定义在哪里
 * */

(function( $ ){
	var styleCss = '' +
		'.printViewPop{position:fixed; width:35%; max-width:50%; min-height:30px; font-size:14px; color:#fff; z-index:9999; background-color:rgba(0, 0, 0, 0.7); padding:5px 10px; transition:width 0.3s; -webkit-transition:width 0.3s; }' +
		'.printViewPop .clear{position:absolute; right:5px; top:5px; display:block; width:36px; height:24px; line-height:24px; text-align:center; color:#17b202; font-size:12px; z-index:999; padding:2px; }' +
		'.printViewPop em{color:red; margin-left:5px;  }' +
		'.printClose{width:30px; color:rgba(0, 0, 0, 0.7); font-size:0; }' + 
		'.printViewPop p{width:calc(100% - 30px); line-height:22px; padding:5px 0; word-wrap:break-word; position:relative; } ' +
		'.printViewPop p:before{position:absolute; left:0; content:""; width:100%; height:1px; }' +
		'.printViewPop p:before{top:0; background-image:-webkit-linear-gradient(left, #4c4c4c 0, #5e5e5e 50%, #4c4c4c 100%); }' +
		'.printViewPop p:first-of-type:before{background-image:none; }' +
		'';
	var utils = (function(){
		var me = {};
		me.addcss = function(){
			$( '<style>' + styleCss + '</style>' ).appendTo( 'head' );
		};
		
		me.cover = function( options, father ){
			utils.addcss();
			father = father || 'body';
			if( $('#printViewPop').length ){
				$('#printViewPop').remove();
			}
			var defaultCss = {
				top : '5px',
				right : '5px',
			}
			if( options && options.bottom ){
				defaultCss.top = 'auto'
			}
			if( options && options.left ){
				defaultCss.right = 'auto'
			}
			var popCss = $.extend({}, defaultCss, options); 
			var printViewPop = $('<div id="printViewPop" class="printViewPop"><span class="clear">清空</span></div>').appendTo( father ).css( popCss );
			utils.bindevent();
			return printViewPop;
		};
		
		me.bindevent = function(){
			$('#printViewPop').on('click', function(){
				$(this).toggleClass('printClose');
			});
			$('#printViewPop').on('click', '.clear', function(){
				$('#printViewPop').find('p').remove();
			});
		};
		return me;
	})();
	
	window.print = (function( utils ){
		var log = function( msg ){
			var printViewPop = $('#printViewPop' );
			if( !printViewPop.length ){
				printViewPop = utils.cover();
			}
			if( typeof msg == 'object' ){
				if( msg[0] && msg[0] instanceof HTMLElement ){  // question 这个是什么情况
					msg = msg[0].className + '<em>类名</em>';
				}else{
					msg = JSON.stringify( msg );
				}	
			}
			$('<p>' + msg + '</p>').appendTo( printViewPop );
		};
		var clear = function(){
			$('#printViewPop').find('p').remove();
		}
		return {
			log : log,
			clear : clear
		};
	})( utils );
})( window.jQuery || window.Zepto  );
