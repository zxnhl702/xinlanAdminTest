/*
 * 1. 需要获取webview返回数据，如获取设备信息，用户信息，经纬度，传回调函数 needSystemInfo, needUserInfo, needLocation
 * 2. 直接跳入其他页面，如 去用户中心，返回页，回到首页，传触发按钮类名 triggerBtn : ['goUcenter', 'goBack', 'goHome'],
 * 		dom节点上绑定 data-operation="goUcenter" 表示调用webview的该方法,
 * 2.1. 需传参数给webview调用，如分享，调地图，打电话，去外链页，去支付 传触发按钮 triggerBtn : ['goshare', 'goToMap']
 * 		如 调用去分享的方法 参数triggerBtn 中传入 触发按钮的类名， dom节点上绑定 data-operation="sharePlatsAction",
 * 		dom节点上绑定 data-param='{...}' 或 传参数 sharePlatsActionParam = {...}
 * 2.2. 去外链页, 如去列表页， 传触发按钮类名 triggerBtn : ['goOutlink'],   绑定数据data-operation="goOutlink" data-type="order#"
 * 
 * 注意：格式 data-param='{"title" : "测试"}'  单引号里面包双引号
 * */


(function(){
	var pluginName = 'hg_h5app';
		
	var defaultOptions = {
		triggerBtn : '',		//点击按钮去webview页面，dom节点，多个节点可以是数组
								// 'goUnceter'或 ['goUncenter', 'goBack']
		
		
		triggerEvent : 'click',	//是否需要绑定事件，默认'click',如果参数为空，表示 没有绑定事件
		
		//回调函数
		needSystemInfo : '',	//获取设备信息的回调函数
		needUserInfo : '',		//获取用户信息
		needLocation : '',		//获取经纬度
		
		sharePlatsActionParam : '',		//去分享参数，可以传字段，也可以通过data-param绑定在dom节点上
		goToMapParam : '',				//去地图
		makeTelParam : '',				//打电话参数
		
		appAuthTimeout : 6e3,
		scrollElement : $('.page-content').length ? $('.page-content') : $('body')
	}
	var H5App = function( options ){
		$.my = this;
		this.op = $.extend( {}, defaultOptions, options );
		this.wificz = true;
		this.msg = {
			callSystemInfo_error : '不能获取设备信息',
			callUserInfo_error : '不能获取用户信息',
			callLocation_error : '不能获取经纬度',
			sharePlatsAction_error : '暂不支持分享功能',
			goToMap_error : '暂不支持调地图功能',
			appALiPay_error : '暂不支持调支付宝功能',
			makeTel_error : '暂不支持打电话功能',
			goOutlink_error : '暂不支持去外链页'
		};
		this.init();
	}
	H5App.prototype = {
		constructor : H5App,
		
		init : function(){
			var self = this,
				op = self.op;
			
			if( op.triggerBtn ){
				if( typeof op.triggerBtn == 'string' ){
					op.triggerBtn = op.triggerBtn.split(" ");
				}
			}
			
			if( !!op.triggerEvent ){
				self.bindEvent(); 
			}
			
			if( !!op.needSystemInfo ){
				var duration = 0;
				var intervalId = setInterval(function() {
					if ( self.appSystemInfo ) {
						clearInterval( intervalId );
					} else {
						duration += 500;
						if (duration >= self.op.appAuthTimeout) {
							clearInterval( intervalId );
							if ( !self.appSystemInfo ) {
								self.wificz = false;
								console.log('刷新试试');
							}
						}
					}
				}, 500);
				self.callWebviewMethod('callSystemInfo', 'getSystemInfo'); // 桌面浏览器测试用到两个参数
			}
			
			if( !!op.needUserInfo ){
				self.callWebviewMethod('callUserInfo', 'getUserInfo');
			}
			
			if( !!op.needLocation ){
				self.callWebviewMethod('callLocation', 'getLocation');
			}
		},
		
		bindEvent : function(){
			var self = this,
				op = this.op;
			$.each( op.triggerBtn, function( kk, vv ){
				if( /^\./.test( vv ) ) {
					alert("类名不正确, 格式是 XXX");
					return false;
				}
				var elem = $( '.' + vv );
				if( !elem.length ){
					return;
				}
				elem.on( op.triggerEvent, $.proxy( self.gainElemParam, self ));
			});
		},
		
		//无需传参数到webview,去页面或获取webview数据
		gainElemParam : function( event ){
			this.prevent( event );
			var obj = $( event.currentTarget ), params,
				operation = obj.attr('data-operation');
			if( obj.data('param') ){
				// dom的相应元素包含data-param的属性
				params = typeof obj.data('param') == 'string' ? JSON.parse( obj.data('param') ) : obj.data('param');
			}else{
				params = this.op[ operation + 'Param'] || ''
			}
			if( operation == 'goOutlink' ){
				var type = obj.data('type') || '';
				this.callOutlink( type );
			}
			if( params ){
				// print.clear();
				// print.log(operation+" -> "+JSON.stringify(params)); 
				this.callneedParamMethod( operation, params );
			}else{
				// print.clear();
				// print.log(operation);
				this.callWebviewMethod( operation );
			}
		},
		
		
		//调用webview方法, callfunc 发起请求的方法, backfunc 接收参数的方法
		callWebviewMethod : function( callfunc, backfunc ){
			backfunc = backfunc || callfunc;
			var self = this,
				mbldevice = self.getMobileDevice();

			if (/photo/gi.test(callfunc)) {
				if (mbldevice == 'Android')	{
					callfunc = 'showPhotoActionSheet';
				} else if(mbldevice == 'iOS') {
					callfunc = 'sendPhotos';
				}
			}

			if( mbldevice == 'Android' ){
				try{
					window.android[ callfunc ]();
				}catch(e){
					$.isFunction( this.op.errorTip ) && this.op.errorTip( this.msg[ callfunc + '_error' ]  );
				}
			}else if( mbldevice == 'iOS' ){
				window.location.hash = "";
				window.location.hash = "#func=" + backfunc; 
			}else if( backfunc != callfunc ){
				// 在桌面浏览器上，要用两个参数，是默认的PCview方式
				$.pcUlts[ callfunc ].call( self );
			}else{
				// console.log('请到移动设备上测试');
				print.log('请到移动设备上测试');
			}
		},
		
		//调用webview方法，需传参数，callfunc 发起请求的方法, param 需要传递给webview的参数
		callneedParamMethod : function( callfunc, params ){
			var mbldevice = this.getMobileDevice(),
				ios_sch = '';
			$.each(params, function(kk, vv){
				vv = encodeURI( vv ); // 编码
				ios_sch += ('&' + kk + '=' + vv);
			});
			if( callfunc == 'sharePlatsAction' ){
				// question 什么情况？
				if( !this.wificz ){
					var t = $("#tip-share");
					if (t.length > 0) {
						t.show()
					} else {
						t = $('<div id="tip-share" class="tip-share-wechat"><img src="//app.wifiwx.com/img/tip-share-wechat.png" width="100%" alt="分享提示" /></div>').css({
							position:'absolute',
							width:'100%',
							top:0,
							left:0,
							'z-index':101,
							'max-height' : '170px'
						});
						this.op.scrollElement.append( t );
						t.click(function() {
							$(this).hide()
						})
					}
					return;
				}
			}
			if( mbldevice == 'Android' ){
				try{
					switch( callfunc ){
						case 'sharePlatsAction' : {		//分享
							window.android.sharePlatsAction( params.content, params.content_url, params.pic );
							break;
						}
						case 'goToMap' : {
							window.android.goToMap( params.address, params.lat, params.lng, params.name );
							break;
						}
						case 'makeTel' : {
							window.android.makeTel( params.tel );
							break;
						}
						case 'appALiPay' : {
							window.android.appALiPay( params.order_id );
						}
					}
				}catch( e ){
					$.isFunction( this.op.errorTip ) && this.op.errorTip( this.msg[ callfunc + '_error' ]  );
				}
			}else if( mbldevice == 'iOS' ){
				window.location.hash = "";
				window.location.hash = "#func=" + callfunc + ios_sch; 
			}else{
				console.log( callfunc );
			}
		},
		
		//去外链页，传类型
		callOutlink : function( type ){
			var mbldevice = this.getMobileDevice();
			if( mbldevice == 'Android' ){
				try{
					window.android.goOutlink( type );
				}catch(e){
					$.isFunction( this.op.errorTip ) && this.op.errorTip( this.msg[ 'goOutlink_error' ]  );
				}
			}else if( mbldevice == 'iOS' ){
				type = type.replace("#", "&");
				window.location.hash = "";
				window.location.hash = "#" + type
			}else{
				console.log( type );
			}
		},
		//返回设备
		getSystemInfo : function( json ){
			var self = $.my,
				op = self.op;
			self.appSystemInfo = json.device_token ? json : json.deviceInfo; //question json.deviceInfo是viewPC默认的值
			if( !!op.needSystemInfo && $.isFunction( op.needSystemInfo ) ){
				op.needSystemInfo.call( this, json );
			}
		},
		
		//返回用户信息
		getUserInfo : function( json ){
			var self = $.my,
				op = self.op;
			if( !!op.needUserInfo && $.isFunction( op.needUserInfo ) ){
				op.needUserInfo.call( this, json );
			}
		},
		
		//返回经纬度信息
		getLocation : function( json ){
			var self = $.my,
				op = self.op;
			if( !!op.needLocation && $.isFunction( op.needLocation ) ){
				op.needLocation.call( this, json );
			}
		},
		
		//获取移动设备类型
		getMobileDevice : function(){
			var mbldevice = navigator.userAgent.toLowerCase();
			if (/iphone|ipod|ipad/gi.test( mbldevice ))
			{
				return "iOS";
			}
			else if (/android/gi.test( mbldevice ))
			{
				return "Android";
			}
			else
			{
				return "Unknow Device";
			}
		},
		
		prevent : function( e ){
			if ( e ) {
	            e.stopPropagation();
	            e.preventDefault();
	       	}
		}
	};
	
	window.getSystemInfo = function( json ){
		H5App.prototype.getSystemInfo.call( H5App.prototype, json );
	};
	window.getUserInfo = function( json ){
		H5App.prototype.getUserInfo( json );
	};
	window.getLocation = function( json ){
		H5App.prototype.getLocation( json );
	};
	$[pluginName] = function( option ) {
		return new H5App( option );
	};
})();

/*调用方式
 *var H5app = $.Hg_h5app({
	triggerBtn : ['goUcenter', 'goBack', 'goShare', 'goToMap', 'makeTel', 'goOrder', 'goPay'],
	needLocation : function( json ){
		console.log( json );
	},
	needUserInfo : function( json ){
		console.log( json );
	},
	needSystemInfo : function( json ){
		console.log( json );
	},
	
	goToMapParam : {
		address : "义乌小商品市场五栋107#108#（荆州义乌店）",
		lat : "30.35314",
		lng : "112.265589",
		name : "【e线大礼包】王氏瓷器玻璃批发 100元代金券"
	},
	
	makeTelParam : {
		tel : '0716-4162727'
	},
});
 * */
