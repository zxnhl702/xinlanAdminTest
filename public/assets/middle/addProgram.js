$(function() {
	var user_id = _getPar("user_id");
	var privilege = _getPar("privilege");
	// ajax的后台地址
	var _callAjax = _genCallAjax(ajaxRootURL + "/videos");
	var video_id = _getPar("video_id");
	
	var ifMobile = $(window).width() < 640;
    var flag="insert";
     _callAjax({
		"cmd":"getVideosByIds",
		"ids":video_id
	}, function(d) {
		//alert(JSON.stringify(d.data));
		$('#video-title').val(d.data[0].title);
		getProgram();
	})

    var getProgram = function(){
		 _callAjax({
			"cmd":"getProgram",
			"video_id":video_id
		}, function(d) {
	        if(d.success){
				flag="update";
				//$("#editor1").val(d.data.program);
				CKEDITOR.instances.editor1.setData(d.data.program);
			}
			
		})
	}
	
	var addProgram = function() {
		 _callAjax({
			"cmd":"addProgram",
			"video_id":video_id,
			"program":CKEDITOR.instances.editor1.getData()
		}, function(d) {
	        if(d.success){
				_toast.show("添加节目成功");
				//location.href = "video.html?video_id="+video_id+"&user_id="+user_id+"&privilege="+privilege;
			}else{
				_toast.show("添加节目失败，请重试");
			}
			
		})
	};
    var updateProgram = function() {
		 _callAjax({
			"cmd":"updateProgram",
			"video_id":video_id,
			"program":CKEDITOR.instances.editor1.getData()
		}, function(d) {
	         if(d.success){
				_toast.show("更改节目成功");
				//location.href = "video.html?video_id="+video_id+"&user_id="+user_id+"&privilege="+privilege;
			}else{
				_toast.show("更改节目失败，请重试");
			}
		})
	};

	$("#program-add").click(function() {
		//$("#event-content-wrapper").after('<div class="form-label col-md-2 bottom-margin clearfix" id="attachment-btns-wrapper"> <a class="btn medium primary-bg" style=" float: left; " id="file-sel-btn"><span class="button-content">文件</span></a><div style=" float: left; margin: 0px 10px; " id="file-sel-show"></div><a class="btn medium primary-bg" id="upload-btn"><span class="button-content">上传</span></a> </div>');		
		if("insert"==flag){
			addProgram();
		}else if("update"==flag){
			updateProgram();
		}
		/*_upload({
			"fileElement": $("#file-sel-btn"),
			"fileSelectCallback": function(fn) {
				$("#file-sel-show").html(_at(fn.split('\\'), -1));
			},
			"submitElement": $("#upload-btn"),
			"uploadCallback": function(d) {
				// d = JSON.parse(d);
				_tell(d.errMsg);
				_toast.show(d.errMsg);
				var pos = $("#editor1")[0].selectionStart,
						content = $("#editor1").val(),
						former = content.substring(0, pos),
						later = content.substring(pos, content.length);
				if (d.success) $("#editor1").val(former+"\n<img src='img/"+d.data+"'/>\n"+later);
			},
			"uploadUrl": "upload/videos"
		});*/
	});
});
