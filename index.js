var mysql      = require('mysql');
var mqtt       = require('mqtt');
var express    = require('express');        
var app        = express();                 
var bodyParser = require('body-parser');
const cool     = require('cool-ascii-faces')





// ===============Setup MQTT Broker==============
const client = mqtt.connect("mqtt://m14.cloudmqtt.com", {
    username: "maukmmii",
    password: "nsSM0k2eJ2z3",
    port: 15712,
    clientId: "WebUI"
})
client.on("connect", () => {
    client.subscribe("Topic")
    client.subscribe("Remove")
    console.log("connected!")
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
  host: "localhost",
  user: "root",
  password: "",
  database: "mydb"
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
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});
router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:8080");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}); 
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
});
router.post('/remove',function(req,res){
    console.log("Message :",req.body)
    var text = "{\"remove\":"+req.body.remove+"}";
    client.publish("Remove", ""+text+"");
    res.json({message : 'deleted success'})
})
app.use('/api', router);
app.listen(process.env.PORT || 8080);


//=========== Controller =============================
app.set('view engine', 'ejs');
app.set('views','./views')
app.get('/', function (req, res) {
  res.render('remote');
})
app.get('/cool', (req, res) => res.send(cool()))