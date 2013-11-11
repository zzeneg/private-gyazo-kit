var
  http = require("http"),
  formidable = require("formidable"),
  fs = require("fs"),
  crypto = require("crypto"),
  path = require("path"),
  mime = require('mime'),
  jsonconfig = require("jsonconfig");

jsonconfig.load(["./gyazo.conf"], function(err){
  if (err) throw err;
});
var HOST = jsonconfig["host"];
var PORT = jsonconfig["port"];
var PATH = jsonconfig["path"];
var URL = "http://" + HOST + ":" + PORT + "/";

function connectFile(path, res) {
  var input = fs.createReadStream(path);
  input.pipe(res);
}
function distributeFile(file, res) {
  path.exists(file, function(exists){
    if (exists) {
      res.writeHead(200, {"Content-Type": mime.lookup(file)});
      connectFile(file, res);
    } else {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.end("Not Found");
    }
  });
}

server = http.createServer(function(req, res){
  var url = req.url;

  if (url == PATH) {
    // upload
    var form = new formidable.IncomingForm();
    form.encoding = "binary";
    var md5sum = crypto.createHash("md5");
    form.on("file", function(name, file){
      fs.readFile(file.path, function(err, data){
        if (err) console.log(err);
        var dst_name;
        if (name == "imagedata") {
          md5sum.update(data, "binary");
          var hash = md5sum.digest("hex");
          dst_name = "./image/" + hash + ".png";
        }
        else {
          dst_name = "./file/" + file.name;
        }
        fs.rename(file.path, dst_name, function(err){
          if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"})
            res.end("cannot write uploaded data");
          } else {
            res.writeHead(200, {"Content-Type": "text/plain"});
            res.end(URL + dst_name);
            console.log("uploaded " + URL + dst_name);
          }
        });
      });
    });
    form.parse(req);
  }
  else {
    // publish file
    distributeFile("./" + url, res);
  }
});

server.listen(PORT);
console.log("Server running at " + URL);
