//Libraries
var tray = require('tray-windows'); //System Tray Icon
var express = require('express'); //Rest server
var cp = require("child_process"); //Launch commands in child-process
var ws = require('windows-shortcuts'); //Generate windows shortcuts
var notifier = require('node-notifier'); //Notifications
var fs = require('fs'); //Manage file

serverPort = 31400;

/* File path */
//Startup shortcut
var startupPath = process.env.APPDATA + "\\Microsoft\\Windows\\Start Menu\\Programs\\Startup";
var startupFile = startupPath + "\\restShutdown.lnk";
//Program location
var currentPath = require('path').join(__dirname,'../');
var currentFile = currentPath + "\\restShutdown.bat";
//Token location
var tokenFile = require('path').join(__dirname,"token.txt");

/* Read token */
var token = "";
token = readToken(tokenFile).trim();



if(token !== undefined){

    /* REST SERVER */
    var appRest = express();

//Manage shutdown
appRest.get('/shutdown/:token', function (req, res) {
  console.log(token);
  console.log(req.params.token);
  if(token == req.params.token){
    cp.exec("Shutdown.exe -s -t 00");
    res.status = 200;
    res.send("OK");
  }
  else{
    res.status = 401;
    res.send("WRONG TOKEN");
  }
});

//Manage shutdown
appRest.get('/sleep/:token', function (req, res) {
  console.log(token);
  console.log(req.params.token);
  if(token == req.params.token){
    res.status = 200;
    res.send("OK");
    cp.exec("powercfg -hibernate off");
    cp.exec("rundll32.exe powrprof.dll,SetSuspendState 0,1,0");
  }
  else{
    res.status = 401;
    res.send("WRONG TOKEN");
  }
});

//Manage shutdown
appRest.get('/restart/:token', function (req, res) {
  console.log(token);
  console.log(req.params.token);
  if(token == req.params.token){
    res.status = 200;
    res.send("OK");
    cp.exec("Shutdown.exe -r -t 00");
  }
  else{
    res.status = 401;
    res.send("WRONG TOKEN");
  }
});

//Create server
var server = appRest.listen(serverPort, function () {
    var host = server.address().address;
    var port = server.address().port;
    notify("server started on http://127.0.0.1:"+port);
});



/* System Tray icon */
tray({
    name: 'restShutdown',
    items: ['Token','Enable on Boot','Disable on Boot', 'Exit'],
    icon: tray.icons.black()
}, function (err, app) {
    if (err) { return console.log('e', err); }
    
    //console.log('Rest server running');
    app.on('click:menuItem', function (menuItem) {
        //console.log('clicked',menuItem);

        if (menuItem.text === 'Token') {
            cp.exec(tokenFile);
            console.log("Trigger token change");

        }

        if (menuItem.text === 'Enable on Boot'){
            console.log("Create "+startupFile);
            
            ws.create(startupFile, {
                target : currentFile,
                workingDir : currentPath
            }, function(err) {
                if (err){
                    notify(err);
                    throw Error(err);
                }
                else
                    notify("Enable on boot");
            });
        }

        if (menuItem.text === 'Disable on Boot'){
            console.log("Remove "+ startupFile);
            
            fs.unlinkSync(startupFile, function(err){
                if (err) throw err;
            });
            
            notify("Disable on boot");
        }

        if (menuItem.text === 'Exit') {
            notify("server stopped");
            app.exit();
            server.close();
        }
    }); 
});
}
else{
    notify("Can't read token");
}

function notify(message){
    notifier.notify({
      title: 'restShutdown',
      message: message,
  wait: false // wait with callback until user action is taken on notification 
}, function (err, response) {
  // response is response from notification 
});
}

function readToken(tokenFile){
    return fs.readFileSync(tokenFile).toString();
}
