/**
 * Access to Node's HTTP-related functionality, the ability
 * to interact with the filesystem, functionality related to file paths, and the ability to
 * determine a file's MIME type. The cache variable will be used to cache file data
 */
 var http = require('http');
 var fs = require('fs');
 var mime = require('mime');
 var path = require('path');
 var cache = {};

//Handle the sending of 404 errors for when a file is requested that doesn't exist.
 function send404(res){
     res.writeHead(404, {'Content-type': 'text/plain'});
     res.write('Error 404: resource not found.');
     res.end();
 }

 //Handles serving file data.The function first writes the appropriate HTTP headers then sends the contents of the file
 function sendFile(res, filePath, fileContent){
     res.writeHead(
         200,
         {'Content-type': mime.lookup(path.basename(filePath))}
     );
     res.end(fileContent);
 }

 /*Determines whether or not a file is cached and, if so, serves it.
  If a file isn't cached, it is read from disk and served.
  If the file doesn't exist, an HTTP 404 error is returned as a response.*/
 function serverStatic(res, cache, absPath){
     if (cache[absPath]){
         sendFile(res, absPath, cache[absPath]);
     } else {
         fs.exists(absPath, function(exist){
             if (exist){
                 fs.readFile(absPath, function(err, data){
                     if (err){
                         send404(res);
                     } else{
                         cache[absPath] = data;
                         sendFile(res, absPath, data);
                     }
                 });
             } else{
                 send404(res);
             }
         });
     }
 }

 var server = http.createServer(function (res, req) {
     var filePath = false;
     if(req.url === '/'){
         filePath = 'public/index.html';
     } else {
         filePath = 'public' + req.url;
     }
     var absPath = './' + filePath;
     serverStatic(res, cache, absPath)
});

 /*Port 3000 is an arbitrary choice: any unused port
  above 1024 would work as well (a port under 1024 may also work if you're
  running Windows or, if in Linux or OS X, start your application using a privileged
  user such as "root").*/
 server.listen(3000, function(){
     console.log('Im love it on port 3000!');
 });