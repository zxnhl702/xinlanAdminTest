/**
 * 投票模块的业务处理后台代码
 */
package switcher

import (
	"database/sql"
//	_ "github.com/mattn/go-sqlite3"
	_ "github.com/go-sql-driver/mysql"
	"log"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"
)

const (
	vote_img_root          = VOTE_IMG_ROOT
	vote_sub_fold          = "/vote_"
	vote_top_img_name      = "banner"
	vote_profile_img_name  = "profile"
	vote_item_thumb_prefix = "thumb"
)

// 投票信息结构体
type Votes struct {
	Vote_id         int    `json:"id"`         //投票编号
	Vote_title      string `json:"title"`      //投票标题
	Vote_type       string `json:"type"`       //投票类型
	Vote_item_count int    `json:"itemCount"`  //参赛人数
	Vote_count      int    `json:"voteCount"`  //投票人次
	Vote_clicks     int    `json:"clickCount"` //访问量
	Vote_status     int    `json:"status"`     //投票活动状态
}

// 投票标题结构体
type VoteTitle struct {
	Vote_id    int    `json:"id"`    //投票编号
	Vote_title string `json:"title"` //投票标题
	Vote_type  string `json:"type"`  //投票类型
}

// 投票名称列表结构体
type VoteName struct {
	Vote_id    int    `json:"id"`    //投票编号
	Vote_title string `json:"title"` //投票标题
}

// 投票修改用结构体
type VoteInfo struct {
	Vote_id      int    `json:"id"`      //投票编号
	Vote_title   string `json:"title"`   //投票标题
	Vote_Top     string `json:"banner"`  //投票头图
	Vote_Profile string `json:"profile"` //投票简介图
}

// 投票选项信息结构体
type VoteItems struct {
	VItem_id     int    `json:"id"`     //选项编号
	VItem_name   string `json:"name"`   //参加投票的用户名
	VItem_work   string `json:"work"`   //参加投票的作品名/参赛标题/描述
	VItem_img    string `json:"img"`    //参加投票的图片地址
	VItem_thumb  string `json:"thumb"`  //参赛投票的缩略图地址
	VItem_status int    `json:"status"` //投票项目状态
}

// 投票项名称列表结构体
type VoteItemName struct {
	VItem_id   int    `json:"id"`   //选项编号
	VItem_name string `json:"name"` //参加投票的用户名
}

// 手机页面用投票选项信息结构体
type VoteCandidate struct {
	Id    int    `json:"id"`    //选项编号
	Name  string `json:"name"`  //参加投票的用户名
	Work  string `json:"work"`  //参加投票的作品名/参赛标题/描述
	Img   string `json:"img"`   //投票图片或者音频
	Thumb string `json:"thumb"` //投票的缩略图
	Cnt   int    `json:"cnt"`   //票数
}

// 手机页面用评论结构体
type VoteComment struct {
	RowId   int    `json:"id"`      //评论编号
	Comment string `json:"comment"` //评论内容
}

func VoteDispatch(db *sql.DB) Dlm {
	return Dlm{

		// 认证&手机页面初始化
		"auth": func(r *http.Request) (string, interface{}) {
			newVoteVisitLog(r, db)
			// 返回消息
			msg := "验证成功"
			// device_token
			device_token := GetParameter(r, "device_token")
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			// 检测投票是否上线
			//			var voteCount int
			//			var voteStatus int
			//			err := db.QueryRow("select count(id), isOnline from votes where id = ? and isOnline > 0", vote_id).Scan(&voteCount, &voteStatus)
			var voteStatus sql.NullInt64
			var voteTitle sql.NullString
			err := db.QueryRow("select title, isOnline from votes where id = ? and isOnline > 0", vote_id).Scan(&voteTitle, &voteStatus)
			if nil != err || !voteTitle.Valid {
				log.Println(err)
				panic("活动不存在")
			}
			if 1 == voteStatus.Int64 {
//				panic("活动还未开始")
				msg = "活动准备中 数据会被清除"
			}
			if 3 == voteStatus.Int64 {
				panic("活动已经结束")
			}
			// 检测是否已经登记过登陆信息
			deviceCount := -1
			err = db.QueryRow("select count(device_token) from votes_app_user where device_token = ? and vote_id = ?", device_token, vote_id).Scan(&deviceCount)
			if nil != err {
				log.Println(err)
				panic("认证失败2")
			}
			// 没有登记过就登记信息
			if 0 == deviceCount {
				stmt, _ := db.Prepare("insert into votes_app_user(device_token, vote_id) values(?, ?)")
				defer stmt.Close()
				stmt.Exec(device_token, vote_id)
			}
			var v Votes
			v.Vote_id, _ = strconv.Atoi(vote_id)
			v.Vote_title = voteTitle.String
			v.Vote_status = int(voteStatus.Int64)
			// votes_candidate表  参赛人数
			err = db.QueryRow("select count(id) from votes_candidate where isOnline = 1 and vote_id = ?", vote_id).Scan(&v.Vote_item_count)
			if nil != err {
				log.Println(err)
				panic("认证失败3")
			}
			// votes_info表  投票人次
			err = db.QueryRow("select count(vote_for) from votes_info where vote_id = ?", vote_id).Scan(&v.Vote_count)
			if nil != err {
				log.Println(err)
				panic("认证失败4")
			}
			// votes_clicks表  访问量
			err = db.QueryRow("select count(ip) from votes_clicks where vote_id = ?", vote_id).Scan(&v.Vote_clicks)
			if nil != err {
				log.Println(err)
				panic("认证失败5")
			}
			return msg, v
		},

		// insert
		// 新增投票
		"newVote": func(r *http.Request) (string, interface{}) {

			// 投票头图
			topImg := GetParameter(r, "topImg")
			newTopImg := vote_top_img_name + path.Ext(topImg)
			// 投票简介图
			profileImg := GetParameter(r, "profileImg")
			newProfileImg := vote_profile_img_name + path.Ext(profileImg)
			// 投票标题
			title := GetParameter(r, "title")
			// 投票类型
			voteType := GetParameter(r, "voteType")
			// 插入投票数据
			result := newVote(title, newTopImg, newProfileImg, voteType, db)
			// 获取新增投票的编号
			rowid, _ := result.LastInsertId()
			// 新投票创建投票项目采番
			newVoteItemIdSeq(strconv.FormatInt(rowid, 10), db)
			// 创建新投票图片文件夹
			os.Mkdir(vote_img_root+vote_sub_fold+strconv.FormatInt(rowid, 10), os.ModePerm)
			// 图片文件移动至指定文件夹
			moveFile(vote_img_root, vote_sub_fold, topImg, newTopImg, strconv.FormatInt(rowid, 10))
			moveFile(vote_img_root, vote_sub_fold, profileImg, newProfileImg, strconv.FormatInt(rowid, 10))
			return "插入新投票成功", nil
		},

		// 新增投票项目
		"newVoteItem": func(r *http.Request) (string, interface{}) {
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			// 投票类型
			voteType := GetParameter(r, "voteType")
			log.Println(voteType)
			// 用户名
			name := GetParameter(r, "name")
			// 参赛标题
			work := GetParameter(r, "work")
			// 大图
			img := GetParameter(r, "img")
			// 图片投票
			if "0" == voteType {
				// 缩略图
				thumb := GetParameter(r, "thumb")
				// 投票项目编号
				id, err := getVoteItemIdSeq(vote_id, db)
				if nil != err {
					// 删除已经上传的图片
					os.Remove(vote_img_root + "/" + img)
					os.Remove(vote_img_root + "/" + thumb)
					panic("获取投票项目编号失败")
				}
				// 新图片名称
				newImg := strconv.Itoa(id) + path.Ext(img)
				// 新缩略图名称
				newThumb := vote_item_thumb_prefix + strconv.Itoa(id) + path.Ext(thumb)
				// 插入投票项目数据
				err = newVoteItem(strconv.Itoa(id), vote_id, name, work, newImg, newThumb, db)
				if nil != err {
					// 删除已经上传的图片
					os.Remove(vote_img_root + "/" + img)
					os.Remove(vote_img_root + "/" + thumb)
					panic("插入投票项目数据失败")
				}
				// 图片文件移动至指定文件夹
				moveFile(vote_img_root, vote_sub_fold, img, newImg, vote_id)
				moveFile(vote_img_root, vote_sub_fold, thumb, newThumb, vote_id)
				// 音频投票
			} else if "1" == voteType {
				// 投票项目编号
				id, err := getVoteItemIdSeq(vote_id, db)
				if nil != err {
					// 删除已经上传的图片
					os.Remove(vote_img_root + "/" + img)
					panic("获取投票项目编号失败")
				}
				// 新音频名称
				newImg := strconv.Itoa(id) + path.Ext(img)
				// 插入投票项目数据
				err = newVoteItem(strconv.Itoa(id), vote_id, name, work, newImg, newImg, db)
				if nil != err {
					// 删除已经上传的图片
					os.Remove(vote_img_root + "/" + img)
					panic("插入投票项目数据失败")
				}
				// 图片文件移动至指定文件夹
				moveFile(vote_img_root, vote_sub_fold, img, newImg, vote_id)
				// 视频投票
			} else if "2" == voteType {
				// 缩略图
				thumb := GetParameter(r, "thumb")
				// 投票项目编号
				id, err := getVoteItemIdSeq(vote_id, db)
				if nil != err {
					// 删除已经上传的图片
					os.Remove(vote_img_root + "/" + img)
					os.Remove(vote_img_root + "/" + thumb)
					panic("获取投票项目编号失败")
				}
				// 新视频名称
				newImg := "v" + strconv.Itoa(id) + path.Ext(img)
				// 新缩略图名称
				newThumb := vote_item_thumb_prefix + strconv.Itoa(id) + path.Ext(thumb)
				// 插入投票项目数据
				err = newVoteItem(strconv.Itoa(id), vote_id, name, work, newImg, newThumb, db)
				if nil != err {
					// 删除已经上传的图片
					os.Remove(vote_img_root + "/" + img)
					os.Remove(vote_img_root + "/" + thumb)
					panic("插入投票项目数据失败")
				}
				// 图片文件移动至指定文件夹
				moveFile(vote_img_root, vote_sub_fold, img, newImg, vote_id)
				moveFile(vote_img_root, vote_sub_fold, thumb, newThumb, vote_id)
				// 文字投票
			} else if "3" == voteType {
				// 投票项目编号
				id, err := getVoteItemIdSeq(vote_id, db)
				if nil != err {
					panic("获取投票项目编号失败")
				}
				err = newVoteItem(strconv.Itoa(id), vote_id, name, work, "null", "null", db)
				if nil != err {
					panic("插入投票项目数据失败")
				}
			}

			return "插入新投票项目成功", nil
		},

		// 新增评论
		"comment": func(r *http.Request) (string, interface{}) {
			// 评论
			comment := GetParameter(r, "comment")
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			_, err := db.Exec("insert into votes_comments(vote_id, comment, logdate) values(?, ?, now())", vote_id, comment)
			if err != nil {
				panic("评论失败")
			}
			return "评论成功", nil
		},

		// select
		// 获取投票编号
		"getVotesIds": func(r *http.Request) (string, interface{}) {

			rows, err := db.Query("select id from votes where isOnline > 0 order by id desc")
			defer rows.Close()
			if nil != err {
				log.Println(err)
				panic("获取投票编号失败")
			}
			var ids []int
			for rows.Next() {
				var id int
				rows.Scan(&id)
				ids = append(ids, id)
			}
			return "获取投票编号成功", ids
		},

		// 根据全部投票编号获取投票信息
		"getAllVotesByIds": func(r *http.Request) (string, interface{}) {

			// 投票信息结构体的集合
			var votes []Votes
			// 投票编号
			ids := GetParameter(r, "ids")
			for _, i := range strings.Split(ids, "|") {
				votes = append(votes, getVoteById(i, db))
			}
			return "根据全部编号获取投票信息成功", votes
		},

		// 获取投票项目编号
		"getVoteItemsIds": func(r *http.Request) (string, interface{}) {

			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			stmt, err := db.Prepare("select id from votes_candidate where vote_id = ? order by id desc")
			defer stmt.Close()
			if nil != err {
				log.Println(err)
				panic("获取投票项目编号失败")
			}
			rows, err := stmt.Query(vote_id)
			defer rows.Close()
			if nil != err {
				log.Println(err)
				panic("获取投票项目编号失败2")
			}
			// 投票编号的集合
			var ids []int
			for rows.Next() {
				var id int
				rows.Scan(&id)
				ids = append(ids, id)
			}
			return "获取投票项目编号成功", ids
		},

		// 根据全部投票项目项目编号获取项目信息
		"getAllVoteItemsByIds": func(r *http.Request) (string, interface{}) {

			// 投票项目结构体的集合
			var items []VoteItems
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			ids := GetParameter(r, "ids")
			for _, i := range strings.Split(ids, "|") {
				items = append(items, getVoteItemById(i, vote_id, db))
			}
			return "根据全部投票项目项目编号获取项目信息成功", items
		},

		// 根据投票编号获取投票标题
		"getVoteTitleByVoteId": func(r *http.Request) (string, interface{}) {
			// 投票标题结构体
			var vt VoteTitle
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			stmt, err := db.Prepare("select id, title, voteType from votes where id = ?")
			defer stmt.Close()
			if nil != err {
				log.Println(err)
				panic("获取投票标题失败")
			}
			err = stmt.QueryRow(vote_id).Scan(&vt.Vote_id, &vt.Vote_title, &vt.Vote_type)
			if nil != err {
				log.Println(err)
				panic("获取投票标题失败2")
			}
			return "获取投票标题成功", vt
		},

		// 获取参赛者信息
		"getCandidates": func(r *http.Request) (string, interface{}) {
			newVoteVisitLog(r, db)
			// 开始编号
			from := GetParameter(r, "from")
			// 现实参赛者数量
			amount := GetParameter(r, "amount")
			//			// 结束编号
			//			to := from + amount
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			//			rows, err := db.Query("select vc.id, vc.name, vc.work, count(vi.vote_from) as cnt from votes_candidate vc, votes_info vi where vc.id >= ? and vc.id < ? and vc.id = vi.vote_for and vc.vote_id = ? and vc.vote_id = vi.vote_id and vc.isOnline = 1 group by id", from, to, vote_id)
			stmt, err := db.Prepare("select vc.id, vc.name, vc.work, vc.img, vc.thumb, count(vi.vote_from) as cnt from votes_candidate vc left outer join votes_info vi on vc.id = vi.vote_for and vc.vote_id = vi.vote_id where vc.id > ? and vc.vote_id = ? and vc.isOnline = 1 group by id limit ?")
			defer stmt.Close()
			if err != nil {
				log.Println(err)
				panic("获取参赛者信息失败")
			}
			rows, err := stmt.Query(from, vote_id, amount)
			defer rows.Close()
			if nil != err {
				log.Println(err)
				panic("获取参赛者信息失败2")
			}
			var candidates []VoteCandidate
			for rows.Next() {
				var c VoteCandidate
				rows.Scan(&c.Id, &c.Name, &c.Work, &c.Img, &c.Thumb, &c.Cnt)
				candidates = append(candidates, c)
			}

			return "获取参赛者信息成功", candidates
		},

		// 根据投票项目编号获取参赛者信息
		"getCandidateById": func(r *http.Request) (string, interface{}) {
			newVoteVisitLog(r, db)
			// 投票项目编号
			id, _ := strconv.Atoi(GetParameter(r, "id"))
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			var c VoteCandidate
			err := db.QueryRow("select id, name, work, img, thumb from votes_candidate where id = ? and vote_id = ? and isOnline = 1", id, vote_id).Scan(&c.Id, &c.Name, &c.Work, &c.Img, &c.Thumb)
			if err != nil {
				panic("没有该id指定的参赛者")
			}
			err = db.QueryRow("select count(vote_from) from votes_info where vote_for = ? and vote_id = ?", id, vote_id).Scan(&c.Cnt)
			if err != nil {
				panic("没有该id指定的参赛者")
			}
			return "获取id参赛者信息成功", c
		},

		// 获取评论
		"getComments": func(r *http.Request) (string, interface{}) {
			//			newVoteVisitLog(r, db)
			//			rowid, _ := strconv.Atoi(GetParameter(r, "id"))
			amount, _ := strconv.Atoi(GetParameter(r, "amount"))
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			//			rows, err := db.Query("select rowid, comment from votes_comments where rowid < ? and vote_id = ? order by rowid desc limit ?", rowid, vote_id, amount)
			rows, err := db.Query("select comment from votes_comments where vote_id = ? order by rand() limit ?", vote_id, amount)
			defer rows.Close()
			if err != nil {
				log.Println(err)
				panic("获取评论失败")
			}
			var comments []VoteComment
			for rows.Next() {
				var c VoteComment
				rows.Scan(&c.Comment)
				c.RowId = 0
				comments = append(comments, c)
			}
			return "获取评论成功", comments
		},

		// 获取前10个投票项目信息
		"top_list": func(r *http.Request) (string, interface{}) {
			newVoteVisitLog(r, db)
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			rows, err := db.Query("select vc.id, vc.name, vc.work, count(vi.vote_from) as cnt, vc.thumb from votes_candidate vc, votes_info vi where vc.id = vi.vote_for and vc.vote_id = ? and vc.vote_id = vi.vote_id and vc.isOnline = 1 group by id order by cnt desc limit 10", vote_id)
			defer rows.Close()
			if err != nil {
				panic("获取前10个信息失败")
			}
			var candidates []VoteCandidate
			for rows.Next() {
				var c VoteCandidate
				rows.Scan(&c.Id, &c.Name, &c.Work, &c.Cnt, &c.Thumb)
				candidates = append(candidates, c)
			}
			return "获取前10个成功", candidates
		},

		// 获得投票名称列表
		"getVoteNameList": func(r *http.Request) (string, interface{}) {
			// 投票状态
			voteStatus := GetParameter(r, "votestatus")
			// 拼查询sql
			sqlstr := "select id, title from votes where isOnline > 0"
			// 99：查询全部
			if "99" != voteStatus {
				sqlstr = sqlstr + " and isOnline = " + voteStatus
			}
			sqlstr = sqlstr + " order by id desc"
			rows, err := db.Query(sqlstr)
			defer rows.Close()
			if nil != err {
				log.Println(err)
				panic("获得投票名称列表失败")
			}
			var vn []VoteName
			for rows.Next() {
				var v VoteName
				rows.Scan(&v.Vote_id, &v.Vote_title)
				vn = append(vn, v)
			}

			return "获得投票名称列表成功", vn
		},

		// 获得投票信息
		"getVoteInfoById": func(r *http.Request) (string, interface{}) {
			// 投票编号
			id := GetParameter(r, "id")
			stmt, err := db.Prepare("select id, title, topImg, profileImg from votes where id = ?")
			defer stmt.Close()
			if nil != err {
				log.Println(err)
				panic("获得投票信息失败")
			}
			var v VoteInfo
			err = stmt.QueryRow(id).Scan(&v.Vote_id, &v.Vote_title, &v.Vote_Top, &v.Vote_Profile)
			if nil != err {
				log.Println(err)
				panic("获得投票信息失败")
			}
			return "获得投票信息成功", v
		},

		// 获得投票项名称列表
		"getVoteItemNameList": func(r *http.Request) (string, interface{}) {
			vote_id := GetParameter(r, "vote_id")
			rows, err := db.Query("select id, name from votes_candidate where vote_id = ?", vote_id)
			defer rows.Close()
			if nil != err {
				log.Println(err)
				panic("获得投票项名称列表失败")
			}
			var vin []VoteItemName
			for rows.Next() {
				var v VoteItemName
				rows.Scan(&v.VItem_id, &v.VItem_name)
				vin = append(vin, v)
			}
			return "获得投票项名称列表成功", vin
		},

		// 获得投票项信息
		"getVoteItemInfoById": func(r *http.Request) (string, interface{}) {
			// 投票项目编号
			id := GetParameter(r, "id")
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			vi := getVoteItemById(id, vote_id, db)
			return "获得投票项信息成功", vi
		},

		// update
		// 更新投票活动状态
		"updateVoteStatus": func(r *http.Request) (string, interface{}) {
			// 投票编号
			id := GetParameter(r, "id")
			// 原活动状态
			originStatus := GetParameter(r, "originStatus")
			// 更新活动状态至
			changeTo := GetParameter(r, "changeTo")
			stmt, err := db.Prepare("update votes set isOnline = ? where id =?")
			defer stmt.Close()
			if nil != err {
				log.Println(err)
				panic("更新投票活动状态失败")
			}
			_, err = stmt.Exec(changeTo, id)
			if nil != err {
				log.Println(err)
				panic("更新投票活动状态失败2")
			}
			// 如果状态从准备中->进行中
			if(originStatus == "1" && changeTo == "2") {
				// 清除存在的投票数据
				clearVoteDataByVoteId(id, db)
			}
			return "更新投票活动状态成功", nil
		},

		// 更新投票信息
		"updateVote": func(r *http.Request) (string, interface{}) {
			// 投票编号
			id := GetParameter(r, "id")
			// 投票标题
			title := GetParameter(r, "title")
			// 头图
			topImg := GetParameter(r, "topImg")
			// 简介图
			profileImg := GetParameter(r, "profileImg")
			// 如果修改了标题
			if "null" != title {
				// 如果更新失败
				if !updateVoteTitleById(id, title, db) {
					// 删除已经上传的图片
					if "null" != topImg {
						os.Remove(vote_img_root + "/" + topImg)
					}
					if "null" != profileImg {
						os.Remove(vote_img_root + "/" + profileImg)
					}
					panic("更新投票信息失败")
				}
			}
			// 如果修改了头图
			if "null" != topImg {
				// 头图移动到对应文件夹
				newTopImg := vote_top_img_name + path.Ext(topImg)
				moveFile(vote_img_root, vote_sub_fold, topImg, newTopImg, id)
			}
			// 如果修改了简介图
			if "null" != profileImg {
				// 简介图移动到对应文件夹
				newProfileImg := vote_profile_img_name + path.Ext(profileImg)
				moveFile(vote_img_root, vote_sub_fold, profileImg, newProfileImg, id)
			}
			return "更新投票信息成功", nil
		},
		
		// 更新投票项目信息
		"updateVoteItem": func(r *http.Request) (string, interface{}) {
			// 投票类型
			voteType := GetParameter(r, "voteType")
			// 投票项目编号
			id := GetParameter(r, "id")
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			// 投票项目名
			name := GetParameter(r, "name")
			// 投票项目描述
			work := GetParameter(r, "work")
			// 大图/视频/音频
			img := GetParameter(r, "img")
			// 缩略图
			thumb := GetParameter(r, "thumb")
			// 如果修改了投票项目名或者投票项目描述
			if "null" != name || "null" != work {
				// 更新数据库中投票项目名、投票项目描述
				if !updateVoteItemInfoById(id, vote_id, name, work, db) {
					// 删除已经上传的图片
					if "null" != img {
						os.Remove(vote_img_root + "/" + img)
					}
					if "null" != thumb {
						os.Remove(vote_img_root + "/" + thumb)
					}
					panic("更新投票项目信息失败")
				}
			}
			// 移动文件
			// 如果修改了大图
			if "null" != img {
				// 头图移动到对应文件夹
				var newImg string
				if "2" == voteType {
					newImg = "v" + id + path.Ext(img)
				} else {
					newImg = id + path.Ext(img)
				}
				moveFile(vote_img_root, vote_sub_fold, img, newImg, vote_id)
			}
			// 图片投票
			if "0" == voteType || "2" == voteType {
				// 如果修改了缩略图
				if "null" != thumb {
					// 头图移动到对应文件夹
					newThumb := vote_item_thumb_prefix + id + path.Ext(thumb)
					moveFile(vote_img_root, vote_sub_fold, thumb, newThumb, vote_id)
				}
			}
			return "更新投票项目信息成功", nil
		},
		
		// 更新投票项目状态
		"updateVoteItemStatus": func(r *http.Request) (string, interface{}) {
			// 投票项目编号
			id := GetParameter(r, "id")
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			// 状态至
			statusTo := GetParameter(r, "statusTo")
			stmt, err := db.Prepare("update votes_candidate set isOnline = ? where id = ? and vote_id = ?")
			defer stmt.Close()
			if nil != err {
				log.Println(err)
				panic("更新投票项目状态失败")
			}
			_, err = stmt.Exec(statusTo, id, vote_id)
			if nil != err {
				log.Println(err)
				panic("更新投票项目状态失败")
			}
			return "更新投票项目状态成功", nil
		},

		// 根据投票编号逻辑删除投票
		"removeVoteLogicallyById": func(r *http.Request) (string, interface{}) {
			// 投票编号
			id := GetParameter(r, "id")
			stmt, err := db.Prepare("update votes set isOnline = 0 where id = ?")
			defer stmt.Close()
			if nil != err {
				log.Println(err)
				panic("逻辑删除投票失败")
			}
			_, err = stmt.Exec(id)
			if nil != err {
				log.Println(err)
				panic("逻辑删除投票失败2")
			}
			return "逻辑删除投票成功", nil
		},

		// 根据投票项目编号逻辑删除投票项目
		"removeVoteItemLogicallyById": func(r *http.Request) (string, interface{}) {
			// 投票项目编号
			id := GetParameter(r, "id")
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			stmt, err := db.Prepare("update votes_candidate set isOnline = 0 where id = ? and vote_id = ?")
			defer stmt.Close()
			if nil != err {
				log.Println(err)
				panic("逻辑删除投票项目失败")
			}
			_, err = stmt.Exec(id, vote_id)
			if nil != err {
				log.Println(err)
				panic("逻辑删除投票项目失败2")
			}
			return "逻辑删除投票项目成功", nil
		},

		// 投票
		"vote_for": func(r *http.Request) (string, interface{}) {
			newVoteVisitLog(r, db)
			// 用户设备编号
			dt := GetParameter(r, "device_token")
			// 投票给
			vf := GetParameter(r, "vote_for")
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			// 投票活动状态
			status := getVoteStatus(vote_id, db)
			// 投票flag
			var if_voted int
			err := db.QueryRow("select if_voted from votes_app_user where device_token = ? and vote_id = ?", dt, vote_id).Scan(&if_voted)
			if err != nil {
				log.Println(err)
				panic("非法的app用户")
			}
			if if_voted == 1 {
				panic("您已经投过了")
			}
			if "99999" == vf {
				return "ok", nil
			}
			stmt, _ := db.Prepare("insert into votes_info (vote_id, vote_from, vote_for, vote_datetime) values(?, ?, ?, now())")
			defer stmt.Close()

			for _, v := range strings.Split(vf, "|") {
				_, err = stmt.Exec(vote_id, dt, v)
				if err != nil {
					log.Println(err)
					panic("投票失败")
				}
			}

			stmt, _ = db.Prepare("update votes_app_user set if_voted = 1 where device_token = ? and vote_id = ?")
			stmt.Exec(dt, vote_id)
			// 如果是准备中 提示投票数据会被
			if 1 == status {
				return "活动准备中 投票成功", nil
			} else {
				return "投票成功", nil
			}
		},
		
		// delete
		// 根据编号物理删除投票
		"removeVoteById": func(r *http.Request) (string, interface{}) {
			// 投票编号
			id := GetParameter(r, "id")
			// 根据编号删除投票项目采番
			removeVoteItemIdSeqByVoteId(id, db)
			// 根据编号删除投票项目
			removeVoteItemByVoteId(id, db)
			// 根据编号删除投票信息
			removeVoteInfoByVoteId(id, db)
			// 根据编号删除投票评论
			removeVoteCommentsByVoteId(id, db)
			// 根据编号删除投票用户
			removeVoteAppUserByVoteId(id, db)
			// 根据编号删除投票访问记录
			removeVoteClicksByVoteId(id, db)
			log.Println(vote_img_root + "/vote_" + id)
			// 删除投票图片文件夹
			err := os.RemoveAll(vote_img_root + "/vote_" + id)
			if nil != err {
				log.Println(err)
			}
			// 删除投票
			removeVoteByVoteId(id, db)
			return "删除投票成功", nil
		},

		// 根据投票项目编号物理删除投票项目
		"removeVoteItemById": func(r *http.Request) (string, interface{}) {
			// 投票项目编号
			id := GetParameter(r, "id")
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			stmt, err := db.Prepare("delete from votes_candidate where id = ? and vote_id = ?")
			defer stmt.Close()
			if nil != err {
				log.Println(err)
				panic("删除投票项目失败")
			}
			_, err = stmt.Exec(id, vote_id)
			if nil != err {
				log.Println(err)
				panic("删除投票项目失败2")
			}
			return "删除投票项目成功", nil
		},
	}
}

// select
// 获取投票状态
func getVoteStatus(vote_id string, db *sql.DB) int {
	// 检索sql
	selectSql := "select isOnline from votes where id = ?"
	var status int
	err := db.QueryRow(selectSql, vote_id).Scan(&status)
	if nil != err {
		log.Println(err)
		panic("获取投票状态失败")
	}
	return status
}

// insert
// 新增投票
func newVote(title, topImg, profileImg, voteType string, db *sql.DB) sql.Result {
	stmt, err := db.Prepare("insert into votes (title, topImg, profileImg, voteType, logdate) values (?, ?, ?, ?, now())")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		panic("插入新投票失败")
	}
	result, err := stmt.Exec(title, topImg, profileImg, voteType)
	if nil != err {
		log.Println(err)
		panic("插入新投票失败2")
	}
	return result
}

// 新增投票项目 no panic
func newVoteItem(id, vote_id, name, work, newImg, newThumb string, db *sql.DB) error {
	stmt, err := db.Prepare("insert into votes_candidate (id, vote_id, name, work, img, thumb, isOnline) values (?, ?, ?, ?, ?, ?, 1)")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		log.Println("插入投票项目失败")
		return err
	}
	_, err = stmt.Exec(id, vote_id, name, work, newImg, newThumb)
	if nil != err {
		log.Println(err)
		log.Println("插入投票项目失败2")
		return err
	}
	return nil
}

// 新增投票项目采番
func newVoteItemIdSeq(vote_id string, db *sql.DB) bool {

	stmt, err := db.Prepare("insert into votes_seq (vote_id) values (?)")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		panic("新增投票项目采番失败")
	}
	_, err = stmt.Exec(vote_id)
	if nil != err {
		log.Println(err)
		panic("新增投票项目采番失败2")
	}
	return true
}

// 新增访问记录
func newVoteVisitLog(r *http.Request, db *sql.DB) {
	// ip地址
	ip := r.RemoteAddr
	// 投票编号
	vote_id := GetParameter(r, "vote_id")
	stmt, err := db.Prepare("insert into votes_clicks (ip, vote_id, logdate) values (?, ?, now())")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		log.Println("新增访问记录")
	}
	_, err = stmt.Exec(ip, vote_id)
	if nil != err {
		log.Println(err)
		log.Println("新增访问记录2")
	}
}

// select
// 根据投票编号获取投票信息
func getVoteById(id string, db *sql.DB) Votes {

	// 投票信息结构体的集合
	var v Votes
	// vote表 投票标题
	err := db.QueryRow("select id, title, voteType, isOnline from votes where id = ?", id).Scan(&v.Vote_id, &v.Vote_title, &v.Vote_type, &v.Vote_status)
	if nil != err {
		log.Println(err)
		panic("根据编号获取投票信息失败")
	}
	// votes_candidate表  参赛人数
	err = db.QueryRow("select count(id) from votes_candidate where isOnline > 0 and vote_id = ?", id).Scan(&v.Vote_item_count)
	if nil != err {
		log.Println(err)
		panic("根据编号获取投票信息失败2")
	}
	// votes_info表  投票人次
	err = db.QueryRow("select count(vote_for) from votes_info where vote_id = ?", id).Scan(&v.Vote_count)
	if nil != err {
		log.Println(err)
		panic("根据编号获取投票信息失败3")
	}
	// votes_clicks表  访问量
	err = db.QueryRow("select count(ip) from votes_clicks where vote_id = ?", id).Scan(&v.Vote_clicks)
	if nil != err {
		log.Println(err)
		panic("根据编号获取投票信息失败4")
	}
	return v
}

// 根据投票选项编号获取投票选项信息
func getVoteItemById(id string, vote_id string, db *sql.DB) VoteItems {

	// 投票项目结构体的集合
	var item VoteItems
	err := db.QueryRow("select id, name, work, img, thumb, isOnline from votes_candidate where id = ? and vote_id = ?", id, vote_id).
		Scan(&item.VItem_id, &item.VItem_name, &item.VItem_work, &item.VItem_img, &item.VItem_thumb, &item.VItem_status)
	if nil != err {
		log.Println(err)
		panic("根据投票选项编号获取投票选项信息失败")
	}
	return item
}

// 获得投票项目的采番 no panic
func getVoteItemIdSeq(vote_id string, db *sql.DB) (int, error) {

	// 当前采番值
	var idSeq int
	err := db.QueryRow("select seq from votes_seq where vote_id = ?", vote_id).Scan(&idSeq)
	if nil != err {
		log.Println(err)
		log.Println("获得投票项目的采番失败")
		return -1, err
	}
	idSeq++
	stmt, err := db.Prepare("update votes_seq set seq = ? where vote_id = ?")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		log.Println("获得投票项目的采番失败2")
		return -1, err
	}
	_, err = stmt.Exec(idSeq, vote_id)
	if nil != err {
		log.Println(err)
		log.Println("获得投票项目的采番失败3")
		return -1, err
	}
	return idSeq, nil
}

// update
// 更新投票标题
func updateVoteTitleById(id, title string, db *sql.DB) bool {
	stmt, err := db.Prepare("update votes set title = ? where id = ?")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		return false
	}
	_, err = stmt.Exec(title, id)
	if nil != err {
		log.Println(err)
		return false
	}
	return true
}

// 更新投票项目名、描述
func updateVoteItemInfoById(id, vote_id, name, work string, db *sql.DB) bool {
	updatesql := "update votes_candidate set"
	if "null" != name && "null" == work {
		updatesql = updatesql + " name = '" + name + "'"
	} else if "null" == name && "null" != work {
		updatesql = updatesql + " work = '" + work + "'"
	} else {
		updatesql = updatesql + " name = '" + name + "', work = '"+ work + "'"
	}
	updatesql = updatesql + " where id = " + id + " and vote_id = " + vote_id
	_, err := db.Exec(updatesql)
	if nil != err {
		log.Println(err)
		return false
	}
	return true
}

// delelte
// 删除投票数据
func clearVoteDataByVoteId(vote_id string, db *sql.DB) bool {
	// 投票信息
	removeVoteInfoByVoteId(vote_id, db)
	// 投票评论
	removeVoteCommentsByVoteId(vote_id, db)
	// 投票用户
	removeVoteAppUserByVoteId(vote_id, db)
	// 投票访问记录
	removeVoteClicksByVoteId(vote_id, db)
	return true
}

// 删除投票
func removeVoteByVoteId(vote_id string, db *sql.DB) bool {
	stmt, err := db.Prepare("delete from votes where id = ?")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		panic("删除投票失败")
	}
	_, err = stmt.Exec(vote_id)
	if nil != err {
		log.Println(err)
		panic("删除投票失败2")
	}
	return true
}

// 删除投票项目采番
func removeVoteItemIdSeqByVoteId(vote_id string, db *sql.DB) bool {
	stmt, err := db.Prepare("delete from votes_seq where vote_id = ?")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		panic("删除投票项目采番失败")
	}
	_, err = stmt.Exec(vote_id)
	if nil != err {
		log.Println(err)
		panic("删除投票项目采番失败2")
	}
	return true
}

// 删除投票项目
func removeVoteItemByVoteId(vote_id string, db *sql.DB) bool {
	stmt, err := db.Prepare("delete from votes_candidate where vote_id = ?")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		panic("删除投票项目失败")
	}
	_, err = stmt.Exec(vote_id)
	if nil != err {
		log.Println(err)
		panic("删除投票项目失败2")
	}
	return true
}

// 删除投票信息
func removeVoteInfoByVoteId(vote_id string, db *sql.DB) bool {
	stmt, err := db.Prepare("delete from votes_info where vote_id = ?")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		panic("删除投票信息失败")
	}
	_, err = stmt.Exec(vote_id)
	if nil != err {
		log.Println(err)
		panic("删除投票信息失败2")
	}
	return true
}

// 删除投票评论
func removeVoteCommentsByVoteId(vote_id string, db *sql.DB) bool {
	stmt, err := db.Prepare("delete from votes_comments where vote_id = ?")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		panic("删除投票评论失败")
	}
	_, err = stmt.Exec(vote_id)
	if nil != err {
		log.Println(err)
		panic("删除投票评论失败2")
	}
	return true
}

// 删除投票用户
func removeVoteAppUserByVoteId(vote_id string, db *sql.DB) bool {
	stmt, err := db.Prepare("delete from votes_app_user where vote_id = ?")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		panic("删除投票用户失败")
	}
	_, err = stmt.Exec(vote_id)
	if nil != err {
		log.Println(err)
		panic("删除投票用户失败2")
	}
	return true
}

// 删除投票访问记录
func removeVoteClicksByVoteId(vote_id string, db *sql.DB) bool {
	stmt, err := db.Prepare("delete from votes_clicks where vote_id = ?")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		panic("删除投票访问记录失败")
	}
	_, err = stmt.Exec(vote_id)
	if nil != err {
		log.Println(err)
		panic("删除投票访问记录失败2")
	}
	return true
}
