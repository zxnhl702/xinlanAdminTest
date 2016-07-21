package main

import (
	"crypto/md5"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/codegangsta/negroni"
	"github.com/julienschmidt/httprouter"
//	_ "github.com/mattn/go-sqlite3"
	_ "github.com/go-sql-driver/mysql"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"path"
	"strings"
	"time"
	sw "xinlanAdminTest/switcher"
	ue "xinlanAdminTest/ueditor"
	xupload "xinlanAdminTest/xinlanUpload"
)

type Ret struct {
	Success bool        `json:"success"`
	ErrMsg  string      `json:"errMsg"`
	Data    interface{} `json:"data"`
}

var file_dir = sw.FILE_DIR
var img_root = sw.IMG_ROOT

func main() {
	rt := httprouter.New()
	rt.GET("/getGuid", GetGuidHandler)
	rt.GET("/xinlan", DlmHandler)
	rt.GET("/xinlan/:module", DlmVoteHandler)
	rt.GET("/ueditor/:module", ue.UeditorHandler)
	rt.POST("/ueditor/:module", ue.UeditorUploadHandler)
	rt.POST("/upload", UploadHandler)
	rt.POST("/videosupload", UploadVideosHandler)
	rt.POST("/upload/:module", UploadVoteHandler)
	rt.POST("/xupload", xupload.UploadHandler)

	n := negroni.Classic()
	n.UseHandler(rt)
	n.Run(sw.SERVER_PORT)
}

func GetMd5String(s string) string {
	h := md5.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}

func GetGuid() string {
	b := make([]byte, 48)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		panic("创建文件名出错")
	}
	return GetMd5String(base64.URLEncoding.EncodeToString(b))
}

func SubString(s string, pos, length int) string {
	runes := []rune(s)
	l := pos + length
	if l > len(runes) {
		l = len(runes)
	}
	return string(runes[pos:l])
}

// 生成guid的句柄
func GetGuidHandler(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {
//	session := sessions.GetSession(r)
//	log.Println(session)
	guid := generateGuid()
	log.Println("guid:"+guid)
//	session.Set("guid", guid)
//	cookie := http.Cookie{Name: "guid", Value: guid}
//	http.SetCookie(rw, &cookie)
	rw.Write(GenJsonpResult(r, &Ret{true, "", guid}))
}

// 上传文件的句柄
func UploadVoteHandler(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {

	// 模块名称
	module := p.ByName("module")
	log.Println("1module: " + module)

	defer func() {
		err := recover()
		if err != nil {
			rw.Write(formJson(&Ret{false, err.(string), nil}))
		}
	}()
	
	r.ParseMultipartForm(32 << 20)
	// 文件名列表
	formfiles := r.FormValue("formfile")
	log.Println("formfiles:" + formfiles)

	var filename []string
	for _, formfile := range strings.Split(formfiles, ",") {
		// 上传
		if "null" != formfile {
			filename = append(filename, UploadFormFile(r, formfile, module))
		// 未上传
		} else {
			filename = append(filename, formfile)
		}
	}
	
	rw.Write(formJson(&Ret{true, "上传成功", filename}))
}

// 上传文件到服务器 TODO
func UploadFormFile(r *http.Request, formfile string, module string) string {
	// 打开文件
	file, handle, err := r.FormFile(formfile)
	if err != nil {
		log.Println(err)
		panic("上传失败")
	}
	defer file.Close()
	// 重新命名文件
	filename := handle.Filename
	log.Println("filename: " + filename)
//	filename = formfile + strings.ToLower(path.Ext(filename))
	filename = GetGuid() + strings.ToLower(path.Ext(filename))
	
	// 读取文件数据
	data, err := ioutil.ReadAll(file)
	if err != nil {
		log.Println(err)
		panic("读取文件数据失败")
	}
	// 写入文件到服务器指定路径
	err = ioutil.WriteFile(img_root + "/" + module + "/" + filename, data, 0777)
	if err != nil {
		log.Println(err)
		panic("保存文件失败")
	}
	return filename
}

func UploadHandler(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {
	r.ParseMultipartForm(32 << 20)
	file, handle, err := r.FormFile("upload")
	if err != nil {
		log.Println(err)
		panic("上传失败")
	}
	defer file.Close()

	// filename
	filename := handle.Filename
	log.Println(filename)
	// ext := SubString(filename, strings.LastIndex(filename, "."), 4)
	filename = GetGuid() + path.Ext(filename)

	// save file
	data, err := ioutil.ReadAll(file)
	if err != nil {
		panic("读取文件数据失败")
	}
	err = ioutil.WriteFile(file_dir+"/"+filename, data, 0777)
	if err != nil {
		log.Println(err)
		panic("保存文件失败")
	}
	callback := sw.GetParameter(r, "CKEditorFuncNum")
	log.Println("callback: " + callback) // ----- TEST
	fmt.Fprintf(rw, "<script type=\"text/javascript\">window.parent.CKEDITOR.tools.callFunction("+callback+",'"+sw.HOTS_IMG_URL+filename+"','')</script>")
}
func UploadVideosHandler(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {
	r.ParseMultipartForm(32 << 20)
	file, handle, err := r.FormFile("upload")
	if err != nil {
		log.Println(err)
		panic("上传失败")
	}
	defer file.Close()

	// filename
	filename := handle.Filename
	log.Println(filename)
	// ext := SubString(filename, strings.LastIndex(filename, "."), 4)
	filename = GetGuid() + path.Ext(filename)

	// save file
	data, err := ioutil.ReadAll(file)
	if err != nil {
		panic("读取文件数据失败")
	}
	err = ioutil.WriteFile(sw.VIDEO_IMG_ROOT+"/"+filename, data, 0777)
	if err != nil {
		log.Println(err)
		panic("保存文件失败")
	}
	callback := sw.GetParameter(r, "CKEditorFuncNum")
	log.Println("callback: " + callback) // ----- TEST
	fmt.Fprintf(rw, "<script type=\"text/javascript\">window.parent.CKEDITOR.tools.callFunction("+callback+",'"+sw.VIDEOS_IMG_URL+filename+"','')</script>")
}

// 投票的业务句柄
func DlmVoteHandler(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {
	module := p.ByName("module")
	log.Println("module: " + module + "| cmd: " + GetParameter(r, "cmd"))
	// 根据模块连接相对应的数据库
	db := GetModuleConnectDB(module)

	defer func() {
		db.Close()
		err := recover()
		if err != nil {
			rw.Write(GenJsonpResult(r, &Ret{false, err.(string), nil}))
			log.Println(err)
		}
	}()
	// 根据模块选择相对应的业务逻辑处理函数
	switcher := GetModuleSwitcher(module, db)
	var ret []byte
	if Authorize(r) {
		msg, data := switcher[GetParameter(r, "cmd")](r)
		log.Println("rth4")
		ret = GenJsonpResult(r, &Ret{true, msg, data})
	} else {
		panic("Not authorized!")
	}
	rw.Write(ret)
}

func DlmHandler(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {
//	db := ConnectDB("./middle.db")
	db := ConnectMySql()

	defer func() {
		db.Close()
		err := recover()
		if err != nil {
			rw.Write(GenJsonpResult(r, &Ret{false, err.(string), nil}))
			log.Println(err)
		}
	}()

	if r.URL.Query().Get("hot_id") != "" {
		LogClient(r.RemoteAddr, GetParameter(r, "hot_id"), db)
	}

	switcher := sw.Dispatch(db)
	var ret []byte
	if Authorize(r) {
		msg, data := switcher[sw.GetParameter(r, "cmd")](r)
		log.Println("rth4")
		ret = GenJsonpResult(r, &Ret{true, msg, data})
	} else {
		panic("Not authorized!")
	}
	rw.Write(ret)
}

func Authorize(r *http.Request) bool {
	token := sw.GetParameter(r, "token")
	// log.Println(token)
	return token == "Jh2044695"
}

func GenJsonpResult(r *http.Request, rt *Ret) []byte {
	bs, err := json.Marshal(rt)
	if err != nil {
		panic(err)
	}
	return []byte(sw.GetParameter(r, "callback") + "(" + string(bs) + ")")
}

// 根据模块连接数据库
func GetModuleConnectDB(moduleName string) *sql.DB {
	return ConnectMySql()
//	switch moduleName {
//	case "votes":
//		return ConnectDB("middle.db")
//	case "quiz":
//		return ConnectDB("middle_quiz.db")
//	case "videos":
//		return ConnectDB("middle_video.db")
//	case "jssdk":
//		return ConnectDB(sw.JSSDK_DB_PATH)
//	default:
//		return ConnectDB("middle.db")
//	}
}

func ConnectMySql() *sql.DB {
	dbinfo := sw.MYSQL_USERNAME + ":" + sw.MYSQL_PASSWORD + "@/" + sw.MYSQL_DATABASE + "?charset=utf8"
	db, err := sql.Open(sw.MYSQL_DRIVER, dbinfo)
	if err != nil {
		panic(err)
	}
	return db
}

func ConnectDB(dbPath string) *sql.DB {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		panic(err)
	}
	return db
}

func LogClient(ip string, hot_id string, db *sql.DB) {
	stmt, err := db.Prepare("insert into clicks(ip, hot_id) values(?,?)")
	if err != nil {
		panic(err)
	}
	stmt.Exec(ip, hot_id)
	defer stmt.Close()
}

func GetParameter(r *http.Request, key string) string {
	s := r.URL.Query().Get(key)
	if s == "" {
		panic("没有参数" + key)
	}
	return s
}

// 得到指定模块的业务逻辑处理函数
func GetModuleSwitcher(moduleName string, db *sql.DB) sw.Dlm {
	var switcher sw.Dlm
	switch moduleName {
	case "votes":
		switcher = sw.VoteDispatch(db)
		//case "quiz":
		//	switcher = sw.QuizDispatch(db)
	case "choices":
		switcher = sw.VoteDispatch(db)
	case "jssdk":
		switcher = sw.JssdkDispatch(db)
	case "videos":
		switcher = sw.VideoDispatch(db)
	default:
		switcher = sw.Dispatch(db)
	}
	return switcher
}

func formJson(rt *Ret) []byte {
	bs, err := json.Marshal(rt)
	if err != nil {
		panic(err)
	}
	return []byte(string(bs))
}

// 生成随机码 GUID
func generateGuid() string {
	b := make([]byte, 48)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		panic("获取随机码错误")
	}
	h := md5.New()
	h.Write([]byte(base64.URLEncoding.EncodeToString(b)))
	return hex.EncodeToString(h.Sum(nil)) + time.Now().Format("20060102150405")
}
