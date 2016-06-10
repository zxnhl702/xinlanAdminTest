package ueditor

import (
	"bytes"
	"crypto/md5"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"github.com/julienschmidt/httprouter"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	
	sw "xinlanAdminTest/switcher"
)

type Ret struct {
	Success bool        `json:"success"`
	ErrMsg  string      `json:"errMsg"`
	Data    interface{} `json:"data"`
}

// 初始化读取配置文件
func UeditorHandler(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {
	log.Println(sw.GetParameter(r, "action"), p.ByName("module"))
	file, err := os.Open("./ueditor/config.json")
	if err != nil {
		log.Fatal(err)
		panic(err)
	}
	defer file.Close()
	buf := bytes.NewBuffer(nil)
	buf.ReadFrom(file)
	rw.Write(buf.Bytes())
}

// 上传文件
func UeditorUploadHandler(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {
	log.Println(sw.GetParameter(r, "action"), p.ByName("module"))
	op := sw.GetParameter(r, "action")
	switch op {
		case "uploadimage": uploadFile(rw, r, p)
		case "uploadscrawl": uploadScrawl(rw, r, p)
		case "uploadvideo": uploadFile(rw, r, p)
		case "uploadfile": uploadFile(rw, r, p)
	}
}

// 上传图片、视频、文件
func uploadFile(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {
	r.ParseMultipartForm(32 << 20)
	file, handle, err := r.FormFile("upfile")
	if err != nil {
		log.Println(err)
		panic("上传失败")
	}
	defer file.Close()

	// filename
	filename := handle.Filename
	log.Println(filename)
	filename = GetGuid() + path.Ext(filename)

	// save file
	data, err := ioutil.ReadAll(file)
	if err != nil {
		panic("读取文件数据失败")
	}
	err = ioutil.WriteFile(sw.IMG_ROOT+"/"+p.ByName("module")+"/"+filename, data, 0777)
	if err != nil {
		log.Println(err)
		panic("保存文件失败")
	}
	b, err := json.Marshal(map[string]string{
		"url":      sw.IMG_ROOT_URL + p.ByName("module") + "/" + filename, //保存后的文件路径
		"title":    "",                                                    //文件描述，对图片来说在前端会添加到title属性上
		"original": handle.Filename,                                       //原始文件名
		"state":    "SUCCESS",                                             //上传状态，成功时返回SUCCESS,其他任何值将原样返回至图片上传框中
	})
	rw.Write(b)
}

// 上传涂鸦
// P.S 上传涂鸦生成的图片只能网页端打开 直接电脑中打开。jpg文件会显示错误
func uploadScrawl(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {
	err := r.ParseForm()
	if err != nil {
		log.Println(err)
		panic("上传失败")
	}
	str := r.Form.Get("upfile")
	data, err := base64.StdEncoding.DecodeString(str)
	if err != nil {
		log.Println(err)
		panic("上传失败")
	}

	// filename
	filename := GetGuid() + ".jpg"

	// save file
	err = ioutil.WriteFile(sw.IMG_ROOT+"/"+p.ByName("module")+"/"+filename, data, 0777)
	if err != nil {
		log.Println(err)
		panic("保存文件失败")
	}
	b, err := json.Marshal(map[string]string{
		"url":      sw.IMG_ROOT_URL + p.ByName("module") + "/" + filename, //保存后的文件路径
		"title":    "",                                                    //文件描述，对图片来说在前端会添加到title属性上
		"original": filename,                                              //原始文件名
		"state":    "SUCCESS",                                             //上传状态，成功时返回SUCCESS,其他任何值将原样返回至图片上传框中
	})
	rw.Write(b)
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