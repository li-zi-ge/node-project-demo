var mysql = require('mysql');
var async = require("async");
var db = {};
var option = {
    host: "127.0.0.1",
    user: "root",
    password: "lizige",
    database: "test",
    connectionLimit: 10,
    port: "3306",
    waitForConnections: false
}

var pool = mysql.createPool(option);

//获取连接
db.getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        if (err) {
            callback(null);
            return;
        }
        callback(connection);
    });
}

//执行单个sql
db.exec = function(sqls, values, after) {
    var client = mysql.createConnection(option);

    client.connect(function(err) {
        if (err) {

            console.log(err);
            return;
        }

        client.query(sqls || '', values || [], function(err, r) {
            after(err, r);
        });
        client.end();

    });
    client.on('error', function(err) {
        if (err.errno != 'ECONNRESET') {
            after("err01", false);
            throw err;
        } else {
            after("err02", false);
        }
    });
}

// 一个sql语句，用于执行事务
db.getNewSqlParamEntity = function(sql, params, callback) {
    if (callback) {
        return callback(null, {
            sql: sql,
            params: params
        });
    }
    return {
        sql: sql,
        params: params
    };
}

// 执行事务
db.execTrans = function(sqlparamsEntities, callback) {
    pool.getConnection(function(err, connection) {
        if (err) {
            return callback(err, null);
        }
        connection.beginTransaction(function(err) {
            if (err) {
                return callback(err, null);
            }
            console.log("开始执行transaction，共执行" + sqlparamsEntities.length + "条数据");
            var funcAry = [];
            sqlparamsEntities.forEach(function(sql_param) {
                var temp = function(cb) {
                    var sql = sql_param.sql;
                    var param = sql_param.params;
                    connection.query(sql, param, function(tErr, rows, fields) {
                        if (tErr) {
                            connection.rollback(function() {
                                console.log("事务失败，" + sql_param + "，ERROR：" + tErr);
                                throw tErr;
                            });
                        } else {
                            return cb(null, 'ok');
                        }
                    })
                };
                funcAry.push(temp);
            });

            async.series(funcAry, function(err, result) {
                console.log("transaction error: " + err);
                if (err) {
                    connection.rollback(function(err) {
                        console.log("transaction error: " + err);
                        connection.release();
                        return callback(err, null);
                    });
                } else {
                    connection.commit(function(err, info) {
                        console.log("transaction info: " + JSON.stringify(info));
                        if (err) {
                            console.log("执行事务失败，" + err);
                            connection.rollback(function(err) {
                                console.log("transaction error: " + err);
                                connection.release();
                                return callback(err, null);
                            });
                        } else {
                            connection.release();
                            return callback(null, info);
                        }
                    })
                }
            })
        });
    });
}

// exports.db = db;
module.exports = db;
