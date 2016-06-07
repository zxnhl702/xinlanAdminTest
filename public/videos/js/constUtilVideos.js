/**
 * 存放热点直播模块常量的js
 */
var host = window.location.host;
var domain = window.location.hostname;
//后台ajax地址
var ajaxURL = "http://"+domain+":11002/xinlan/videos/";
//用户投票图片地址
var userImgURL = "http://" + domain + ":11001/images/videos/";
//微信js用初始化ajax地址
var wxAjaxURL = "http://develop.zsgd.com:11010/auth";
//微信用URL模版
var wechatURL = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=APPID&redirect_uri=http%3A%2F%2Fdevelop.zsgd.com%2Fauth%3Fcmd%3Dauth%26callback%3Dnil%26token%3DJh2044695&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect";