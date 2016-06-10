(function( $ ){
	var defaultdata = {
		systemInfo : {
			deviceInfo : {
				debug : 1,
				types : "x86_64",
				system : 'iPhone OS7.1',
				device_token : '111',
				program_name : 'zhuihuiwuxi',
				program_version : '2.4.0',
				appid : 20,
				appkey : '4fJrS03Ergz9KE1ztJ5vNmrnmZgt0moU'
			}
		},
		userInfo : {
			userInfo : {
				userid : 18,
				telephone : 13770834057,
				username : '这你都能猜到',
				userTokenKey : 'd29ad7e51063301c4bd5664176e0bd14',
				picurl : 'http://img.wifiwx.com/material/members/img/2013/08/8b223b1467b38415d63f58257cac5a76.jpg'
			}
		},
		locationInfo : {
			longitude : 118.824952,
			latitude : 31.97819
		}
	}
	$.pcUlts = (function(){
		var func = {};
		func.callSystemInfo = function(){
			this.getSystemInfo( defaultdata.systemInfo ); // question 默认的传入参数？
		};
		func.callUserInfo = function(){
			this.getUserInfo( defaultdata.userInfo );
		};
		func.callLocation = function(){
			this.getLocation( defaultdata.locationInfo );
		};
		return func;
	})();
})( window.jQuery || window.Zepto );


/*
 * 调用方法
 *  
 *	var getSystemInfo = function( json ){		//用户数据回调方法
		console.log( json );
	}
	$.pcUlts.callSystemInfo.call( this );		//this当前环境作用域, 也是需要回调数据的作用域
*/
