/**
 * 存放投票模块常量的js
 */
var host = window.location.host;
var domain = window.location.hostname;
// 后台ajax地址
var ajaxURL = "http://"+host+"/xinlan/votes";
// 微信js用初始化ajax地址
//var wxAjaxURL = "http://"+host+"/xinlan/jssdk";
var wxAjaxURL = "http://develop.zsgd.com:11010/auth";
// 图片基准地址
var imgURL = "http://" + domain + ":11001/images/votes";
// 微信用URL模版
var wechatURL = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=APPID&redirect_uri=http%3A%2F%2Fdevelop.zsgd.com%3A11010%2Fauth%3Fcmd%3Dauth%26callback%3Dnil%26token%3DJh2044695&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect";
//测试用
var debugMod = false;