$(function() {
//	_upload({
//		"fileElement": $("#select"),
//		"fileSelectCallback": function(filename) {
//			$("#show").text(filename);
//		},
//		"submitElement": $("#upload"),
//		"data": {
//			filename: "tupian"
//		},
//		"uploadCallback": function(d) {
//			console.log(d);
//		},
//		"uploadUrl": "http://127.0.0.1:11006/uploadVoteImg/"
//	});
	
	$("#imgUpload").click(function() {
		var uploadForm = $("#fileupload");
		var formfiles = "";
		uploadForm.find("input[type='file']").each(function(i,r) {
			if("" != r.value) {
				formfiles = formfiles + ',' + r.name;
			}
		});
		formfiles = formfiles.substring(1);

		uploadForm.ajaxSubmit({
			"url": "http://127.0.0.1:11006/upload/votes",
			"type": "post",
			"dataType": "json",
			"data": {
				formfile: formfiles
			},
			"success": function(d) {
				console.log(d);
				console.log(d.data);
				var array = d.data;
				console.log(array[0]+"   "+array[1]);
			}
		});
	})
});
