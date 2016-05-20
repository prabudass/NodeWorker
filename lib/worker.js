'use strict';

var db = require('./db'),
    influx = require('influx'),
    path = './sample.txt',
    Tail = require('tail').Tail,
    fs = require('fs'),
    consts = require('./consts'),
    tail;

class Worker {

    constructor() {
        this.conn = null;
    }

    terminate(err) {
        console.log(err);
        process.exit();
    }

    run() {
        var self = this;
        db.getInstance(function(err, conn) {
            if (err) {
                self.terminate(err);
            }

            self.conn = conn;

            self.checkFileExists((status) => {
                if (status) {
                    self.watchTail((err, data) => {
                        console.log(err);
                        console.log(data);
                    });
                } else {
                    console.log('File not found');
                    process.exit();
                }
            })

        });
    }

    checkFileExists(done) {
        fs.exists(path, function(exists) {
            done(exists);
        });
    }

    watchTail(done) {
        var self = this;
        tail = new Tail(path);
        tail.on("line", function(data) {
            var str = JSON.stringify(data),
            spl = str.split('-'),
            date = spl[0],
            site = spl[1],
            title = spl[2],
            file_path = spl[3];

            //var obb = Object.assign(date,site,title,file_path);
            /*console.log(obb);
            process.exit();*/
            //console.log('date:'+date+'\n'+'site:'+site+'\n'+'title:'+title+'\n'+"path: "+file_path);
            self.conn.writePoint(consts.TBL_NAME, {
                time: new Date(),
                dates: date,
                Web:site,
                Title:title,
                FilePath:file_path
            }, null, done);
           // console.log(data);
        });

        var done = function(err){

            if (err){
                console.log("error"+err);
            }

        }
    }
}

module.exports = Worker;