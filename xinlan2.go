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
	_ "github.com/mattn/go-sqlite3"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"path"
	// "strings"
	sw "xinlanAdminTest/switcher"
)

type Ret struct {
	Success bool        `json:"success"`
	ErrMsg  string      `json:"errMsg"`
	Data    interface{} `json:"data"`
}

var file_dir = "/home/zxn/web-location/images/hots"

func main() {
	rt := httprouter.New()
	rt.GET("/xinlan", DlmHandler)
	rt.POST("/upload", UploadHandler)

	n := negroni.Classic()
	n.UseHandler(rt)
	n.Run(":11006")
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

func UploadHandler(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {
	r.ParseMultipartForm(32 << 20)
	file, handle, err := r.FormFile("upload")
	if err != nil {
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
		panic("保存文件失败")
	}
	callback := sw.GetParameter(r, "CKEditorFuncNum")
	log.Println("callback: " + callback) // ----- TEST
	fmt.Fprintf(rw, "<script type=\"text/javascript\">window.parent.CKEDITOR.tools.callFunction("+callback+",'"+"http://60.190.176.70:11001/images/hots/"+filename+"','')</script>")
}

func DlmHandler(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {
	db := ConnectDB("./middle.db")

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

func ConnectDB(dbPath string) *sql.DB {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		panic(err)
	}
	return db
}

func LogClient(ip string, hot_id string,db *sql.DB) {
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