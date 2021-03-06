var mysql      = require('mysql');
var mqtt       = require('mqtt');
var express    = require('express');        
var app        = express();                 
var bodyParser = require('body-parser');




// ===============Setup MQTT Broker==============
const client = mqtt.connect("mqtt://m14.cloudmqtt.com", {
    username: "maukmmii",
    password: "iQ7Cfl13XHNy",
    port: 15712,
    clientId: "WebUI"
})
client.on("connect", () => {
    client.subscribe("Topic")
    client.subscribe("Remove")
    console.log("connected mqtt!")
})
client.on("error", (e) => {
    console.log(e)
})
client.on("close", (e) => {
    client.reconnect()
})
client.on("message", (topic, message) => {
    switch(topic) {
        case "Topic":  addSql(message); break;
        case "Remove":  removeSql(message); break;
    }
})

//================Setup Mysql Connection================

var con = mysql.createConnection({
  host: "85.10.205.173",
  user: "kenkenls95",
  password: "vaozoo8121995",
  database: "kenkenls"
});

const addSql = (data) => {
  try{
  var value = JSON.parse(data)
  var humidity = value.humidity
  var temperature = value.temperature
  var soilmoisture = value.soilmoisture
  var led = value.led
  // console.log(led)
  var led1 = led[0]
  var led2 = led[1]
  var led3 = led[2]
  var led4 = led[3]
  var isSuccess = value.success

  addHumidity(humidity,isSuccess)
  addTemperature(temperature,isSuccess)
  addSoilmoisture(soilmoisture)
  addLed(led1,led2,led3,led4)
  }catch (error) {
        console.log(error)
    }
}

const addHumidity = (humidity,isSuccess) => {
  con.connect(function(err) {
  var now = new Date()
  var date = now.getFullYear()+"/"+(now.getMonth()+1)+"/"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
  console.log("Connected!");
  var sql = "INSERT INTO `tbl_humidity` (`id`, `value`, `date`,`status`) VALUES (NULL, '"+humidity+"', '"+date+"','"+isSuccess+"')";
  con.query(sql, function (err, result) {
    console.log("1 record humidity inserted");
  });
});
}

const addTemperature = (temperature,isSuccess) => {
  con.connect(function(err) {
  var now = new Date()
  var date = now.getFullYear()+"/"+(now.getMonth()+1)+"/"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
  console.log("Connected!");
  var sql = "INSERT INTO `tbl_temperature` (`id`, `value`, `date`,`status`) VALUES (NULL, '"+temperature+"', '"+date+"','"+isSuccess+"')";
  con.query(sql, function (err, result) {    
    console.log("1 record temperature inserted");
  });
});
}

const addSoilmoisture = (soilmoisture) => {
  con.connect(function(err) {
  var now = new Date()
  var date = now.getFullYear()+"/"+(now.getMonth()+1)+"/"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
  console.log("Connected!");
  var sql = "INSERT INTO `tbl_soilmoisture` (`id`, `value`, `date`) VALUES (NULL, '"+soilmoisture+"', '"+date+"')";
  con.query(sql, function (err, result) {
    console.log("1 record soilmoisture inserted");
  });
});
}


const removeSql = (data) => {
  var key = JSON.parse(data)
  if(key.remove){
  con.connect(function(err) {  
  var sql = "TRUNCATE TABLE `tbl_humidity`";
  con.query(sql, function (err, result) {    
    console.log("Table humidity have been remove");
  });
  var sql = "TRUNCATE TABLE `tbl_temperature`";
  con.query(sql, function (err, result) {    
    console.log("Table temperature have been remove");
  });
  var sql = "TRUNCATE TABLE `tbl_soilmoisture`";
  con.query(sql, function (err, result) {    
    console.log("Table soilmoisture have been remove");
  });
  var sql = "TRUNCATE TABLE `tbl_led`";
  con.query(sql, function (err, result) {    
    console.log("Table led status have been remove");
  });
});
}
}

const addLed = (led1,led2,led3,led4) =>{
  con.connect(function(err) {
  var now = new Date()
  var date = now.getFullYear()+"/"+(now.getMonth()+1)+"/"+now.getDate()+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
  console.log("Connected!");
  var sql = "INSERT INTO `tbl_led` (`id`, `led1`, `led2`,`led3`,`led4`, `date`) VALUES (NULL, '"+led1+"','"+led2+"','"+led3+"','"+led4+"', '"+date+"')";
  con.query(sql, function (err, result) {
    console.log("1 record led status inserted");
  });
});
}



// ============Setup API==========================

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router(); 
router.post('/doLed',function(req,res){
    console.log("Message :",req.body)
    var led1 = req.body.led[0];
    var led2 = req.body.led[1];
    var led3 = req.body.led[2];
    var led4 = req.body.led[3];
    var text = "{led:["+led1+","+led2+","+led3+","+led4+"]}"
    client.publish("Client-parse",""+text+"");
    
    res.json({ message: 'send success' ,
               success: true
             });
      try{con.connect(function(err){
        var sql = "SELECT `id` FROM `tbl_led` ORDER BY id DESC LIMIT 1"
        var id;
        con.query(sql, function (err,result) {
        id = result[0].id;
        var sql = "UPDATE `tbl_led` SET `led1` = '"+led1+"', `led2` = '"+led2+"', `led3` = '"+led3+"', `led4` = '"+led4+"' WHERE `tbl_led`.`id`= "+id+""
        console.log(sql)
        con.query(sql, function(err){
        console.log("Update led status");  
        });
        });
      });}catch(e){
        console.log(e);
      }
});
router.post('/remove',function(req,res){
    console.log("Message :",req.body)
    var text = "{\"remove\":"+req.body.remove+"}";
    client.publish("Remove", ""+text+"");
    res.json({message : 'deleted success',
              success : true})
})
router.get('/getLed',function(req,res){
  
    con.connect(function(err){
    var sql = "SELECT * FROM `tbl_led` ORDER BY id DESC LIMIT 1";
    con.query(sql,function(err,result,fields){ 
    Object.keys(result).forEach(function(key) {
    var field = result[key];
      res.json(field)
    });
    });
  });
});

var routerEn = express.Router();

routerEn.post('/humidity/lasthum',function(req,res){
  con.connect(function(err){
    var sql = "SELECT `value` FROM `tbl_humidity` ORDER BY id DESC LIMIT 1";
    con.query(sql,function(err,result){
      res.json(result);
    })
  })
})

routerEn.post('/temperature/lasttemp',function(req,res){
  con.connect(function(err){
    var sql = "SELECT `value` FROM `tbl_temperature` ORDER BY id DESC LIMIT 1";
    con.query(sql,function(err,result){
      res.json(result);
    })
  })
})

routerEn.post('/soilmoisture/lastsoil',function(req,res){
  con.connect(function(err){
    var sql = "SELECT `value` FROM `tbl_soilmoisture` ORDER BY id DESC LIMIT 1";
    con.query(sql,function(err,result){
      res.json(result);
    })
  })
})

app.use('/environment', routerEn);
app.use('/remote/api', router);
app.listen(process.env.PORT || 5000);


//=========== Controller =============================
app.set('view engine', 'ejs');
app.set('views','./views')
app.get('/remote', function (req, res) {
  res.render('remote');
})
app.get('/environment/humidity', function (req, res) {
  con.connect(function(err){
       con.query('SELECT * FROM `tbl_humidity` ', function(err, result) {
        var obj = {};
        if(err){
            throw err;
        } else {
            obj = {print: result};
            res.render('humidity', obj);                
        }
    });
  })
})
app.get('/environment/temperature', function (req, res) {
  con.connect(function(err){
       con.query('SELECT * FROM `tbl_temperature`', function(err, result) {
        var obj = {};
        if(err){
            throw err;
        } else {
            obj = {print: result};
            res.render('temperature', obj);                
        }
    });
  })
})
app.get('/environment/soilmoisture', function (req, res) {
  con.connect(function(err){
       con.query('SELECT * FROM `tbl_soilmoisture`', function(err, result) {
        var obj = {};
        if(err){
            throw err;
        } else {
            obj = {print: result};
            res.render('soilmoisture', obj);                
        }
    });
  })
})
app.get('/', function (req, res) {
  res.render('index');
})