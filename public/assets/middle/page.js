function _pageBar(allIds, pageClass, leftIconId, rightIconId, updateCb) {
	/*
	 * Page bar like this: < 1 2 3 4 5 >
	 */

	var cntPerPage = $(pageClass).size(),
			pagesCnt = Math.ceil(allIds.length/cntPerPage);
	
	var updatePage = function(activePageId) {
		var lastPage = $(pageClass+":last");
		if (activePageId < 1) {
			activePageId = 1;
		} else if (activePageId > pagesCnt) {
			activePageId = pagesCnt;
		}
		start = parseInt((activePageId-1)/cntPerPage)*cntPerPage+1;
		$(pageClass).each(function() {
			if (start > pagesCnt) {
				$(this).hide();
			} else {
				$(this).show();
				$(this).text(start);
			}
			start += 1;
		});
		$(pageClass).removeClass("disabled");
		_tell(activePageId%cntPerPage-1);
		$(pageClass+":eq("+(activePageId%cntPerPage-1)+")").addClass("disabled");
	};

	/*
	var ifFirst = function() {
		return $(pageClass+".disabled").text() == $(pageClass+":first").text();
	}

	var ifLast = function() {
		return $(pageClass+".disabled").text() == $(pageClass+":last").text();
	}

	var pageMoveTowards = function(dir) {
		// dir: 0 left; 1 right
		
		var activePageId = parseInt($(pageClass+".disabled").text());
		var idBorder = 1,
				ifRangeEnd = ifFirst(),
				nextPageId = activePageId-1;
		if (dir) {
			idBorder = pagesCnt;
			ifRangeEnd = ifLast();
			nextPageId = activePageId+1;
		}

		if (activePageId == idBorder) return false;
		if (ifRangeEnd) {
			updatePage(nextPageId);
		} else {
			var ele = $(pageClass+".disabled");
			ele.removeClass("disabled");
			if (dir) {
				ele.next().addClass("disabled");
			} else {
				ele.prev().addClass("disabled");
			}
		}
		return true;
	};
	*/

	var updateDetailListByIds = function() {
		var activePageId = parseInt($(pageClass+".disabled").text()),
				start = (activePageId-1)*cntPerPage,
				end = start+cntPerPage,
				ids = allIds.slice(start, end);
		updateCb(ids);
	};

	$(leftIconId).unbind().click(function() {
		var active = parseInt($(pageClass+".disabled").text())-1;
		updatePage(active);
		updateDetailListByIds()
		// if (pageMoveTowards(0)) updateDetailListByIds();
	});
	$(rightIconId).unbind().click(function() {
		// if (pageMoveTowards(1)) updateDetailListByIds();
		var active = parseInt($(pageClass+".disabled").text())+1;
		updatePage(active);
		updateDetailListByIds();
	});
	$(pageClass).click(function() {
		$(pageClass).removeClass("disabled");
		$(this).addClass("disabled");
		updateDetailListByIds();
	});

	// updatePage(1);

	return {
		"pages": function() {
			return allIds;
		},
		"renew": function(ids, toActive) {
			if (!toActive) {
				toActive = parseInt($(pageClass+".disabled").text());
			}
			if (!ids) ids = [];
			allIds = ids;
			cntPerPage = $(pageClass).size(),
			pagesCnt = Math.ceil(allIds.length/cntPerPage);
			updatePage(toActive);
			updateDetailListByIds();
		},
		"update": function(toActive){
			updatePage(toActive);
			updateDetailListByIds();
		}
	}
};
