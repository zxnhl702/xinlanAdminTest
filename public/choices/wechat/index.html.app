<!DOCTYPE html>
<html>

	<head>
		<meta charset="utf-8" />
		<meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" name="viewport">
		<meta content="yes" name="apple-mobile-web-app-capable">
		<meta content="black" name="apple-mobile-web-app-status-bar-style">
		<meta content="telephone=no" name="format-detection">
		<!-- site style -->
		<link rel="stylesheet" href="css/reset.min.css" />
		<link rel="stylesheet" href="css/font-awesome.min.css" />
		<!-- site script -->
		<script src="js/jquery-1.11.1.min.js"></script>
		<script src="js/fastclick.js"></script>
		<script src="js/damoo.min.js"></script>
		<script src="js/spin.min.js"></script>
		<script src="js/toast.min.js"></script>
		<script src="js/print.js"></script>
		<script src="js/viewPC.js"></script>
		<script src="js/h5app.js"></script>
		<script src="js/constUtilVotes.js"></script>
		<script src="js/ref.js"></script>
		<script src="js/tp.js"></script>
		<title>投票</title>
		<script type="text/javascript">
		$(function(){
			$("body").append("<div class='load-container load6 bg_light' style='position:fixed;width: 100%;height:100%;left:0;top:0;z-index:99'>	<div class='loader'>Loading...</div><a href='#load6' style='display:block;width:100%;text-align: center;color: #666;letter-spacing: 1px;font-size:14px'>投票页面正在加载中......</a><p style='position:absolute;bottom:20%;left:50%;margin-left:-10%;width:20%;text-align:center;border:1px solid #7cc8ff;color:#7cc8ff;border-radius:5px;-webkit-border-radius:5px;font-size:14px;padding:5px 0'>新蓝广科</p></div>")
			$("head").append("<style>.load6 .loader{font-size:90px;text-indent:-9999em;overflow:hidden;width:1em;height:1em;border-radius:50%;margin:.8em auto;position:relative;-webkit-animation:load6 1.7s infinite ease;animation:load6 1.7s infinite ease}@-webkit-keyframes load6{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg);box-shadow:-0.11em -0.83em 0 -0.4em #7cc8ff,-0.11em -0.83em 0 -0.42em #7cc8ff,-0.11em -0.83em 0 -0.44em #7cc8ff,-0.11em -0.83em 0 -0.46em #7cc8ff,-0.11em -0.83em 0 -0.477em #7cc8ff}5%,95%{box-shadow:-0.11em -0.83em 0 -0.4em #7cc8ff,-0.11em -0.83em 0 -0.42em #7cc8ff,-0.11em -0.83em 0 -0.44em #7cc8ff,-0.11em -0.83em 0 -0.46em #7cc8ff,-0.11em -0.83em 0 -0.477em #7cc8ff}30%{box-shadow:-0.11em -0.83em 0 -0.4em #7cc8ff,-0.51em -0.66em 0 -0.42em #7cc8ff,-0.75em -0.36em 0 -0.44em #7cc8ff,-0.83em -0.03em 0 -0.46em #7cc8ff,-0.81em .21em 0 -0.477em #7cc8ff}55%{box-shadow:-0.11em -0.83em 0 -0.4em #7cc8ff,-0.29em -0.78em 0 -0.42em #7cc8ff,-0.43em -0.72em 0 -0.44em #7cc8ff,-0.52em -0.65em 0 -0.46em #7cc8ff,-0.57em -0.61em 0 -0.477em #7cc8ff}100%{-webkit-transform:rotate(360deg);transform:rotate(360deg);box-shadow:-0.11em -0.83em 0 -0.4em #7cc8ff,-0.11em -0.83em 0 -0.42em #7cc8ff,-0.11em -0.83em 0 -0.44em #7cc8ff,-0.11em -0.83em 0 -0.46em #7cc8ff,-0.11em -0.83em 0 -0.477em #7cc8ff}}@keyframes load6{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg);box-shadow:-0.11em -0.83em 0 -0.4em #7cc8ff,-0.11em -0.83em 0 -0.42em #7cc8ff,-0.11em -0.83em 0 -0.44em #7cc8ff,-0.11em -0.83em 0 -0.46em #7cc8ff,-0.11em -0.83em 0 -0.477em #7cc8ff}5%,95%{box-shadow:-0.11em -0.83em 0 -0.4em #7cc8ff,-0.11em -0.83em 0 -0.42em #7cc8ff,-0.11em -0.83em 0 -0.44em #7cc8ff,-0.11em -0.83em 0 -0.46em #7cc8ff,-0.11em -0.83em 0 -0.477em #7cc8ff}30%{box-shadow:-0.11em -0.83em 0 -0.4em #7cc8ff,-0.51em -0.66em 0 -0.42em #7cc8ff,-0.75em -0.36em 0 -0.44em #7cc8ff,-0.83em -0.03em 0 -0.46em #7cc8ff,-0.81em .21em 0 -0.477em #7cc8ff}55%{box-shadow:-0.11em -0.83em 0 -0.4em #7cc8ff,-0.29em -0.78em 0 -0.42em #7cc8ff,-0.43em -0.72em 0 -0.44em #7cc8ff,-0.52em -0.65em 0 -0.46em #7cc8ff,-0.57em -0.61em 0 -0.477em #7cc8ff}100%{-webkit-transform:rotate(360deg);transform:rotate(360deg);box-shadow:-0.11em -0.83em 0 -0.4em #7cc8ff,-0.11em -0.83em 0 -0.42em #7cc8ff,-0.11em -0.83em 0 -0.44em #7cc8ff,-0.11em -0.83em 0 -0.46em #7cc8ff,-0.11em -0.83em 0 -0.477em #7cc8ff}}</style>")
		})
		</script>
	</head>

	<body class="bgf5">
		<!--首页头部-->
		<header>
			<div class="banner">
			<!-- 
				<img src="img/banner.jpg" width="100%" class="db"/>
			 -->
			</div>
			<div id="dm-main" class="zx1">
				<div id="dm-screen"></div>
			</div>
			<div class="head pl20 pr20 pt15">
				<!--<span class="btn p0 pt10 pb10 f14 btn_assertive db pct100">我要报名</span>-->
				<div class="num-box tc f16 orange">
					<div class="cx-num">
						<span class="g9" id="candidates-count">142</span>
						<span class="db">参赛人数</span>
					</div>
					<div class="cx-num">
						<span class="g9" id="votes-count">142</span>
						<span class="db">投票人次</span>
					</div>
					<div class="cx-num">
						<span class="g9" id="clicks-count">142</span>
						<span class="db">访问量</span>
					</div>
				</div>
			</div>
			<div class="search pl20 pr20 pt20">
				<div class="search_con">
					<div class="search-btn"><span class="db"><i class="fa fa-search light"></i></span></div>
					<div class="text_box">
						<input type="search" id="searchText" placeholder="搜编号" autocomplete="off" class="light" />
					</div>
				</div>
			</div>
		</header>
		<!--主体-->
		<div class="main mt10 pl20 pr20">
			<!--筛选-->
			<!--<div class="filter tc f14">
				<span class="bg_balanced light mr5 pt5 pb5">男</span><span class="bg_balanced light pt5 pb5">男</span>
			</div>-->
			<div class="list mt15">
				<ul class="mr20" id="left">
					<!--
					<li class="mb20">
						<div class="rel bg_light">
							<i class="number db abs tc light bg_orange n">1</i>
							<a class="img db">
								<img src="http://dz.625555.net/source/plugin/hejin_toupiao//Uploads/1440034442517.jpeg" width="100%">
							</a>
							<div class="name tc ml5 mr5 mb5 bbe g6 pb5">隔壁家老王</div>
							<div class="clearfix pb10">
								<p class="l orange pct45 f16">1票</p>
								<a class="vote bg_orange light tc r pct35 mr10 f14 pl5 pr5"><i class="fa fa-heart mr10"></i>投票</a>
							</div>
						</div>
					</li>
					<li class="mb20">
						<div class="rel bg_light">
							<i class="number db abs tc light bg_orange n">1</i>
							<a class="img db">
								<img src="http://dz.625555.net/source/plugin/hejin_toupiao//Uploads/1440034442517.jpeg" width="100%">
							</a>
							<div class="name tc ml5 mr5 mb5 bbe g6 pb5">隔壁家老王</div>
							<div class="clearfix pb10">
								<p class="l orange pct45 f16">1票</p>
								<a class="vote bg_orange light tc r pct35 mr10 f14 pl5 pr5"><i class="fa fa-heart mr10"></i>投票</a>
							</div>
						</div>
					</li>
					-->
				</ul>
				<ul id="right">
					<!--
					<li class="mb20">
						<div class="rel bg_light">
							<i class="number db abs tc light bg_orange n">1</i>
							<a class="img db">
								<img src="http://dz.625555.net/source/plugin/hejin_toupiao//Uploads/1440034442517.jpeg" width="100%">
							</a>
							<div class="name tc ml5 mr5 mb5 bbe g6 pb5">隔壁家老王</div>
							<div class="clearfix pb10">
								<p class="l orange pct45 f16">1票</p>
								<a class="vote bg_orange light tc r pct35 mr10 f14 pl5 pr5"><i class="fa fa-heart mr10"></i>投票</a>
							</div>
						</div>
					</li>
					<li class="mb20">
						<div class="rel bg_light">
							<i class="number db abs tc light bg_orange n">1</i>
							<a class="img db">
								<img src="http://dz.625555.net/source/plugin/hejin_toupiao//Uploads/1440034442517.jpeg" width="100%" id="list-img">
							</a>
							<div class="name tc ml5 mr5 mb5 bbe g6 pb5">隔壁家老王</div>
							<div class="clearfix pb10">
								<p class="l orange pct45 f16">1票</p>
								<a class="vote bg_orange light tc r pct35 mr10 f14 pl5 pr5"><i class="fa fa-heart mr10"></i>投票</a>
							</div>
						</div>
					</li>
					-->
				</ul>
			</div>
			<span class="db btn bg_orange" id="more-candidates"><i class="fa fa-angle-double-down mr10"></i>查看更多</span>
			<a href="http://www.xinlantech.com/" class="db tc g6 f14 pb20 pt20">技术支持：新蓝广科</a>
		</div>
		<!--底栏-->
		<footer class="pct100">
			<div class="footer-cloumn bgf5 btc tc pt5 pb5">
				<a id="goIndex" href="index.html" class="orange"><i class="fa fa-home fa-2x"></i><br />首页</a>
				<a id="goProfile" href="profile.html" class="g6"><i class="fa fa-info fa-2x"></i><br />简介</a>
				<a id="goRank" href="rank.html" class="g6"><i class="fa fa-signal fa-2x"></i><br />排行</a>
				<a class="g6 comment"><i class="fa fa-comments-o fa-2x"></i><br />评论</a>
			</div>
		</footer>
		<!--遮罩层-->
		<div class="layer pct100 fix zx2 dn" id="datu">
			<!--大图-->
			<div class="list-detail abs pct90 bg_light p5 dn">
				<div class="img ovh">
					<img id="datu-img" src="img/test.jpg" width="100%"/>
				</div>
				<div class="intro mt10" id="datu-work">
					<!--
					<i class="fa fa-quote-left fa-pull-left fa-2x"></i>
					我在家来自黄土高坡我在家来自黄土高坡我在家来自黄土高坡我在家来自黄土高坡我在家来自黄土高坡我在家来自黄土高坡
					-->
				</div>
				<div class="vote-btn-group clearfix mt10">
					<a id="datu-vote" class="vote bg_orange light tc l pct35 mr15 ml10 f14 pt2 pb2 pl10 pr10"><i class="fa fa-heart mr10"></i>投票</a><span class="vote-num orange l f16"><span id="datu-cnt">50</span>票</span>
					<span class="r f16 g6 mr10" id="datu-info">-77号 赵丽颖</span>
				</div>
				<div class="list-detail-close abs"></div>
			</div>
			<!--评论-->
			<div class="commentArea dn bg_light pct70 abs p10"><textarea rows="3" class="pct100 f16 g6" maxlength="20" placeholder="说说您的看法,20字内"></textarea><span class="btn bg_positive r mt10 report">评论</span>	<span class="btn bg_stable r mt10 mr10 undo">取消</span></div>
		</div>
	</body>

</html>
<script>
	/*
	FastClick.attach(document.body)
	//弹幕
	var damoo = Damoo('dm-screen', 'dm-canvas', 10, "microsoft yahei");
	damoo.start();
	damoo.emit({ text: "I got a shadow!", color: "#000", shadow: true });
	var list = [{ text: "美国 圣地亚戈 American Shengdiyage", color: "#000",shadow:true}];
	var i = 0;
	var demoInterval = setInterval(function() {
	    if (list[i]) {
	        damoo.emit(list[i++]);
	    } else {
	        clearInterval(demoInterval);
	    }
	}, 150);
	//显示大图
	$(".list img").bind('touchstart',function(){
		showlayer('.list-detail');
		$('.list-detail-close').bind('touchstart',function(){
			hidelayer('.list-detail')
		})
	})

	//显示评论
	$('.comment').bind('touchstart',function(){
		showlayer('.commentArea');
		$('.commentArea span').bind('touchstart',function(){
			hidelayer('.commentArea')
		})
	})
	
	function showlayer(cl){
		$('.layer').show().children(cl).show()
	}
	function hidelayer(cl){
		$(cl).hide().parent().hide()
	}

	*/
</script>
