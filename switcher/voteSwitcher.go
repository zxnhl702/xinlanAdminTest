/**
 * 投票模块的业务处理后台代码
 */
package switcher

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"strings"
	"strconv"
	"net/http"
	"path"
	"os"
)

const (
	vote_img_root = "/home/zhangxiangnan/web_location/images/votes"
	vote_top_img_name = "banner"
	vote_profile_img_name = "profile"
	vote_item_thumb_prefix = "thumb"
)

// 投票信息结构体
type Votes struct {
	Vote_id         int    `json:"id"`         //投票编号
	Vote_title      string `json:"title"`      //投票标题
	Vote_item_count int    `json:"itemCount"`  //参赛人数
	Vote_count      int    `json:"voteCount"`  //投票人次
	Vote_clicks     int    `json:"clickCount"` //访问量
}

// 投票标题结构体
type VoteTitle struct {
	Vote_id         int    `json:"id"`         //投票编号
	Vote_title      string `json:"title"`      //投票标题
}

// 投票选项信息结构体
type VoteItems struct {
	VItem_id         int    `json:"id"`     //选项编号
	VItem_name       string `json:"name"`   //参加投票的用户名
	VItem_work       string `json:"work"`   //参加投票的作品名/参赛标题/描述
	VItem_img        string `json:"img"`    //参加投票的图片地址
}

// 手机页面用投票选项信息结构体
type VoteCandidate struct {
	Id   int    `json:"id"`   //选项编号
	Name string `json:"name"` //参加投票的用户名
	Work string `json:"work"` //参加投票的作品名/参赛标题/描述
	Cnt  int    `json:"cnt"`  //票数
}

// 手机页面用评论结构体
type VoteComment struct {
	RowId   int    `json:"id"`      //评论编号
	Comment string `json:"comment"` //评论内容
}

func VoteDispatch(db *sql.DB) Dlm {
	return Dlm {
		
		// 认证&手机页面初始化
		"auth": func(r *http.Request) (string, interface{}) {
			NewVoteVisitLog(r, db)
			// device_token
			device_token := GetParameter(r, "device_token")
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			stmt, _ := db.Prepare("insert into votes_app_user(device_token, vote_id) values(?, ?)")
			defer stmt.Close()
			stmt.Exec(device_token, vote_id)
			var v Votes
			// votes_candidate表  参赛人数
			err := db.QueryRow("select count(id) from votes_candidate where isOnline = 1 and vote_id = ?", vote_id).Scan(&v.Vote_item_count)
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
			return "验证成功", v
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
			// 插入投票数据
			result := newVote(title, newTopImg, newProfileImg, db)
			// 获取新增投票的编号
			rowid, _ := result.LastInsertId()
			// 新投票创建投票项目采番
			NewVoteItemIdSeq(strconv.FormatInt(rowid, 10), db)
			// 创建新投票图片文件夹
			os.Mkdir(vote_img_root+"/vote_"+strconv.FormatInt(rowid, 10), os.ModePerm)
			// 图片文件移动至指定文件夹
			MoveFile(topImg, newTopImg, strconv.FormatInt(rowid, 10))
			MoveFile(profileImg, newProfileImg, strconv.FormatInt(rowid, 10))
			return "插入新投票成功", nil
		},
		
		// 新增投票项目
		"newVoteItem": func(r *http.Request) (string, interface{}) {
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			// 用户名
			name := GetParameter(r, "name")
			// 参赛标题
			work := GetParameter(r, "work")
			// 大图
			img := GetParameter(r, "img")
			// 缩略图
			thumb := GetParameter(r, "thumb")
			// 投票项目编号
			id, err := GetVoteItemIdSeq(vote_id, db)
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
			MoveFile(img, newImg, vote_id)
			MoveFile(thumb, newThumb, vote_id)
			return "插入新投票项目成功", nil
		},
		
		// 新增评论
		"comment": func(r *http.Request) (string, interface{}) {
			// 评论
			comment := GetParameter(r, "comment")
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			_, err := db.Exec("insert into votes_comments(vote_id, comment) values(?, ?)", vote_id, comment)
			if err != nil {
				panic("评论失败")
			}
			return "评论成功", nil
		},
		
		// select
		// 获取投票编号
		"getVotesIds": func(r *http.Request) (string, interface{}) {

			rows, err := db.Query("select id from votes order by id desc")
			defer rows.Close()
			if nil != err {
				log.Println(err)
				panic("获取投票编号失败")
			}
			var ids[] int
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
				votes = append(votes, GetVoteById(i, db))
			}
			return "根据全部编号获取投票信息成功", votes
		},
		
		// 获取投票项目编号
		"getVoteItemsIds": func(r *http.Request) (string, interface{}) {

			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			stmt, err := db.Prepare("select id from votes_candidate where isOnline = 1 and vote_id = ? order by id desc")
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
			var ids[] int
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
			for _, i := range(strings.Split(ids, "|")) {
				items = append(items, GetVoteItemById(i, vote_id, db))
			}
			return "根据全部投票项目项目编号获取项目信息成功", items
		},
		
		// 根据投票编号获取投票标题
		"getVoteTitleByVoteId": func(r *http.Request) (string, interface{}) {
			// 投票标题结构体
			var vt VoteTitle
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			stmt, err := db.Prepare("select id, title from votes where id = ?")
			defer stmt.Close()
			if nil != err {
				log.Println(err)
				panic("获取投票标题失败")
			}
			err = stmt.QueryRow(vote_id).Scan(&vt.Vote_id, &vt.Vote_title)
			if nil != err {
				log.Println(err)
				panic("获取投票标题失败2")
			}
			return "获取投票标题成功", vt
		},
		
		// 获取参赛者信息
		"getCandidates": func(r *http.Request) (string, interface{}) {
			NewVoteVisitLog(r, db)
			// 开始编号
			from := GetParameter(r, "from")
			// 现实参赛者数量
			amount := GetParameter(r, "amount")
//			// 结束编号
//			to := from + amount
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
//			rows, err := db.Query("select vc.id, vc.name, vc.work, count(vi.vote_from) as cnt from votes_candidate vc, votes_info vi where vc.id >= ? and vc.id < ? and vc.id = vi.vote_for and vc.vote_id = ? and vc.vote_id = vi.vote_id and vc.isOnline = 1 group by id", from, to, vote_id)
			stmt, err := db.Prepare("select vc.id, vc.name, vc.work, count(vi.vote_from) as cnt from votes_candidate vc left outer join votes_info vi on vc.id = vi.vote_for and vc.vote_id = vi.vote_id where vc.id < ? and vc.vote_id = ? and vc.isOnline = 1 group by id order by id desc limit ?")
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
				rows.Scan(&c.Id, &c.Name, &c.Work, &c.Cnt)
				candidates = append(candidates, c)
			}

			return "获取参赛者信息成功", candidates
		},
		
		// 根据投票项目编号获取参赛者信息
		"getCandidateById": func(r *http.Request) (string, interface{}) {
			NewVoteVisitLog(r, db)
			// 投票项目编号
			id, _ := strconv.Atoi(GetParameter(r, "id"))
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			var c VoteCandidate
			err := db.QueryRow("select vc.id, vc.name, vc.work, count(vi.vote_from) as cnt from votes_candidate vc, votes_info vi where vc.id = ? and vc.id = vi.vote_for and vc.vote_id = ? and vc.vote_id = vi.vote_id and vc.isOnline = 1 group by id", id, vote_id).Scan(&c.Id, &c.Name, &c.Work, &c.Cnt)
			if err != nil {
				panic("没有该id指定的参赛者")
			}
			return "获取id参赛者信息成功", c
		},
		
		// 获取评论
		"getComments": func(r *http.Request) (string, interface{}) {
			NewVoteVisitLog(r, db)
//			rowid, _ := strconv.Atoi(GetParameter(r, "id"))
			amount, _ := strconv.Atoi(GetParameter(r, "amount"))
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
//			rows, err := db.Query("select rowid, comment from votes_comments where rowid < ? and vote_id = ? order by rowid desc limit ?", rowid, vote_id, amount)
			rows, err := db.Query("select rowid, comment from votes_comments where vote_id = ? order by random() limit ?", vote_id, amount)
			defer rows.Close()
			if err != nil {
				log.Println(err)
				panic("获取评论失败")
			}
			var comments []VoteComment
			for rows.Next() {
				var c VoteComment
				rows.Scan(&c.RowId, &c.Comment)
				comments = append(comments, c)
			}
			return "获取评论成功", comments
		},
		
		// 获取前10个投票项目信息
		"top_list": func(r *http.Request) (string, interface{}) {
			NewVoteVisitLog(r, db)
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			rows, err := db.Query("select vc.id, vc.name, vc.work, count(vi.vote_from) as cnt from votes_candidate vc, votes_info vi where vc.id = vi.vote_for and vc.vote_id = ? and vc.vote_id = vi.vote_id and vc.isOnline = 1 group by id order by cnt desc limit 10", vote_id)
			defer rows.Close()
			if err != nil {
				panic("获取前10个信息失败")
			}
			var candidates []VoteCandidate
			for rows.Next() {
				var c VoteCandidate
				rows.Scan(&c.Id, &c.Name, &c.Work, &c.Cnt)
				candidates = append(candidates, c)
			}
			return "获取前10个成功", candidates
		},
		
		// update
		// 根据投票项目编号逻辑删除投票项目
		"removeVoteItemLogicallyById": func(r *http.Request) (string, interface{}) {
			// 投票项目编号
			id := GetParameter(r, "id")
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
			stmt, err := db.Prepare("update votes_candidate set isOnline = 0 where id = 1 and vote_id = 7")
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
			NewVoteVisitLog(r, db)
			// 用户设备编号
			dt := GetParameter(r, "device_token")
			// 投票给
			vf := GetParameter(r, "vote_for")
			// 投票编号
			vote_id := GetParameter(r, "vote_id")
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
			stmt, _ := db.Prepare("insert into votes_info (vote_id, vote_from, vote_for) values(?, ?, ?)")
			defer stmt.Close()
			_, err = stmt.Exec(vote_id, dt, vf)
			if err != nil {
				log.Println(err)
				panic("投票失败")
			}
			stmt, _ = db.Prepare("update votes_app_user set if_voted = 1 where device_token = ? and vote_id = ?")
			stmt.Exec(dt, vote_id)
			return "投票成功", nil
		},
		
		// delete
		// 根据编号物理删除投票信息
		"removeVoteById": func(r *http.Request) (string, interface{}) {
			
			// 投票编号
			id := GetParameter(r, "id")
			stmt, err := db.Prepare("delete from votes where id = ?")
			defer stmt.Close()
			if nil != err {
				log.Println(err)
				panic("删除投票失败")
			}
			_, err = stmt.Exec(id)
			if nil != err {
				log.Println(err)
				panic("删除投票失败2")
			}
			// 根据编号删除投票项目采番
			RemoveVoteItemIdSeq(id, db)
			// 删除投票图片文件夹
			os.RemoveAll(vote_img_root + "/vote_" + id)
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

// insert
// 新增投票
func newVote(title, topImg, profileImg string, db *sql.DB) sql.Result {
	stmt, err := db.Prepare("insert into votes (title, topImg, profileImg) values (?, ?, ?)")
	defer stmt.Close()
	if nil != err {
		log.Println(err)
		panic("插入新投票失败")
	}
	result, err := stmt.Exec(title, topImg, profileImg)
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
func NewVoteItemIdSeq(vote_id string, db *sql.DB) bool{
	
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
func NewVoteVisitLog(r *http.Request, db *sql.DB) {
	// ip地址
	ip := r.RemoteAddr
	// 投票编号
	vote_id := GetParameter(r, "vote_id")
	stmt, err := db.Prepare("insert into votes_clicks (ip, vote_id) values (?, ?)")
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
func GetVoteById(id string, db *sql.DB) Votes {

	// 投票信息结构体的集合
	var v Votes
	// vote表 投票标题
	err := db.QueryRow("select id, title from votes where id = ?", id).Scan(&v.Vote_id, &v.Vote_title)
	if nil != err {
		log.Println(err)
		panic("根据编号获取投票信息失败")
	}
	// votes_candidate表  参赛人数
	err = db.QueryRow("select count(id) from votes_candidate where isOnline = 1 and vote_id = ?", id).Scan(&v.Vote_item_count)
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
func GetVoteItemById(id string, vote_id string, db *sql.DB) VoteItems {

	// 投票项目结构体的集合
	var item VoteItems
	err := db.QueryRow("select id, name, work, img from votes_candidate where id = ? and vote_id = ?", id, vote_id).Scan(&item.VItem_id, &item.VItem_name, &item.VItem_work, &item.VItem_img)
	if nil != err {
		log.Println(err)
		panic("根据投票选项编号获取投票选项信息失败")
	}
	return item
}

// 获得投票项目的采番 no panic
func GetVoteItemIdSeq(vote_id string, db *sql.DB) (int, error) {
	
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

// delelte
// 删除投票项目采番
func RemoveVoteItemIdSeq(vote_id string, db *sql.DB) bool {
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

// file operate
func MoveFile(filename, newfilename,vote_id string) error {
	oldPath := vote_img_root + "/" + filename
	newPath := vote_img_root + "/vote_" + vote_id + "/" + newfilename
	return os.Rename(oldPath, newPath)
}