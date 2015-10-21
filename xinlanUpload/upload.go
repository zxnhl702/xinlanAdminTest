package xinlanUpload

import (
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
	"path"
)

type Ret struct {
	Success bool        `json:"success"`
	ErrMsg  string      `json:"errMsg"`
	Data    interface{} `json:"data"`
}

func UploadHandler(rw http.ResponseWriter, r *http.Request, p httprouter.Params) {
	defer func() {
		err := recover()
		if err != nil {
			rw.Write(formJson(&Ret{false, err.(string), nil}))
		}
	}()

	r.ParseMultipartForm(32 << 20)
	file, handle, err := r.FormFile("tupian")
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
	err = ioutil.WriteFile("./public/hots/img/"+filename, data, 0666)
	if err != nil {
		panic("保存文件失败")
	}

	rw.Write(formJson(&Ret{true, "上传成功", filename}))
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

func formJson(rt *Ret) []byte {
	bs, err := json.Marshal(rt)
	if err != nil {
		panic(err)
	}
	return []byte(string(bs))
}
