const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
var shortId = require('short-mongo-id')

const cors = require('cors')

mongoose.connect(process.env.MLAB_URI || 'mongodb://skyscrapper:sky123scrapper@ds024778.mlab.com:24778/apis_and_microservices_fcc')
app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(express.static('public'))


var userSchema = new mongoose.Schema({
    short_id:{
      type:String,
      unique:true},
    user_name : {
      type: String,
      required: true}
  });
var exerciseSchema = new mongoose.Schema({
    "user_id":{
      type: String,
      required: true
    },
    "description": {
      type: String,
      required: true},
    "duration": {
      type: String,
      required: true},
    "date": {
      type: String,
      required: true}
})
var exercise = mongoose.model('exercise', exerciseSchema)
var user = mongoose.model('user', userSchema);
function done(results){
  console.log("results",results);
}
app.post('/api/exercise/new-user', function(req, res){
       user.findOne({user_name:req.body.username}).then(data=>{
         if(!data){
           const newUser = new user({ user_name: req.body.username});
           newUser.short_id = shortId(newUser._id);
           newUser.save((err, data) => err ? done(err) : done(data));
           res.json({'username': newUser.user_name, id:newUser.short_id})
         }else{
           res.send("User name already taken").status(401);
         }                
       })
});
app.post('/api/exercise/add', (req, res) => {
  user.findOne({short_id:req.body.userId}).then(data=>{
    if(data){
    req.body.date = new Date(req.body.date).toDateString();
    let exerciseInfo = Object.assign({username:data.user_name, id:data.short_id},req.body);
    const newExercise = new exercise({user_id:exerciseInfo.id,description:exerciseInfo.description,duration:exerciseInfo.duration,date:exerciseInfo.date});
    newExercise.save((err, data) => err ? res.json("All fields are required") : res.json(exerciseInfo));
    }else{
    res.json("invalid user id");
    }
  })
});
app.get('/api/exercise/log', (req, res) => {
  var results = [];
  
  if(req.query.userId){
    
    if(req.query.from && req.query.to){
      exercise.find({user_id:req.query.userId,date:{$gte:new Date(req.query.from),$lte:new Date(req.query.to)}}).select("-_id -__v").limit(+req.query.limit).then(data=>{
        results = data;
        res.json(results);
      });  
    }else{
      exercise.find({user_id:req.query.userId}).select("-_id -__v").limit(+req.query.limit).then(data=>{
        results = data;
        res.json(results);
      });
    }
  }
});
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})