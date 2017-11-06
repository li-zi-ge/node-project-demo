var express = require('express');
var app = express();
app.set('port', process.env.PORT || 8081);
//创建 application/x-www-form-urlencoded 编码解析
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var cookieParser = require('cookie-parser')
var db = require('./mysqlDB.js');

var fs = require("fs");

var multer = require('multer');

app.use(express.static('public'));
app.use(urlencodedParser);
app.use(cookieParser());
app.use(multer({ dest: '/tmp/' }).array('image'));


//  主页输出 "Hello World"
app.get('/', function(req, res) {
    console.log("主页 GET 请求");
    res.send('Hello GET');
});


//POST 请求
app.post('/', function(req, res) {
    console.log("主页 POST 请求");
    res.send('Hello POST');
});

// 添加一条记录
app.get('/add_user', function(req, res) {
    console.log("/add_user 响应 Add 请求");
    var addSql = 'INSERT INTO websites(Id,name,url,alexa,country) VALUES(0,?,?,?,?)';
    var addSqlParams = ['菜鸟工具', 'https://c.runoob.com', '23453', 'CN'];
    console.log(db);
    db.exec(addSql, addSqlParams, function(err, result) {
        if (err) {
            console.log('[INSERT ERROR] - ', err.message);
            return;
        }
        console.log('--------------------------INSERT----------------------------');
        //console.log('INSERT ID:',result.insertId);        
        console.log('INSERT ID:', result);
        console.log('-----------------------------------------------------------------\n\n');
    });
    res.send('添加页面');
});

//添加多条记录
app.get('/add_users', function(req, res) {
    console.log("/add_user 响应 Add 请求");
    // ...更多要事务执行的sql
    var sqlParamsEntity = [];
    var addSql = 'INSERT INTO websites(Id,name,url,alexa,country) VALUES(0,?,?,?,?)';
    var addSqlParams = ['事务1', 'https://c.runoob.com', '23453', 'CN'];
    sqlParamsEntity.push(db.getNewSqlParamEntity(addSql, addSqlParams));

    var modSql = 'UPDATE websites SET name = ?,url = ? WHERE Id = ?';
    var modSqlParams = ['事务2', '修改第8条记录的数据', 6];
    sqlParamsEntity.push(db.getNewSqlParamEntity(modSql, modSqlParams));

    db.execTrans(sqlParamsEntity, function(err, result) {
        if (err) {
            console.log('执行事务失败 - ', err.message);
            return;
        }
        console.log('--------------------------INSERT----------------------------');
        //console.log('INSERT ID:',result.insertId);        
        console.log('INSERT ID:', result);
        console.log('-----------------------------------------------------------------\n\n');
    });
    res.send('添加多条记录');
});

//  /del_user 页面响应
app.get('/del_user', function(req, res) {
    console.log("/del_user 响应 DELETE 请求");
    res.send('删除页面');
});

//  /list_user 页面 GET 请求
app.get('/list_user', function(req, res) {
    console.log("/list_user GET 请求");
    res.send('用户列表页面');
});

// 对页面 abcd, abxcd, ab123cd, 等响应 GET 请求
app.get('/ab*cd', function(req, res) {
    console.log("/ab*cd GET 请求");
    res.send('正则匹配');
})

app.get('/index', function(req, res) {
    console.log("Cookies:", req.cookies);
    res.sendFile(__dirname + "/" + "index.html");
})

app.get('/process_get', function(req, res) {

    // 输出 JSON 格式
    var response = {
        "first_name": req.query.first_name,
        "last_name": req.query.last_name
    };
    console.log(response);
    res.end(JSON.stringify(response));
})

app.post('/process_post', urlencodedParser, function(req, res) {

    // 输出 JSON 格式
    var response = {
        "first_name": req.body.first_name,
        "last_name": req.body.last_name
    };
    console.log(response);
    res.end(JSON.stringify(response));
})

app.post('/file_upload', function(req, res) {

    console.log(req.files[0]); // 上传的文件信息

    var des_file = __dirname + "/public/images" + req.files[0].originalname;
    fs.readFile(req.files[0].path, function(err, data) {
        fs.writeFile(des_file, data, function(err) {
            if (err) {
                console.log(err);
            } else {
                response = {
                    message: 'File uploaded successfully',
                    filename: req.files[0].originalname
                };
            }
            console.log(response);
            res.end(JSON.stringify(response));
        });
    });
})

//只能放在最后，不然所有请求都是404
//定制404页面
app.use(function(req, res) {
    res.type("text/plain");
    res.status(404);
    console.error("找不到页面")
    res.send('404-Not Found');
});
//定制500页面
app.use(function(req, res) {
    res.type("text/plain");
    res.status(500);
    console.error("服务器错误");
    res.send('500-Server Error');
});

var server = app.listen(app.get('port'), function() {

    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)

});
