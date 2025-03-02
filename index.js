import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import pg from "pg";
import nodemailer from "nodemailer";
import bodyparser from "body-parser";

const app=express();
const port=3000;

var authro=false;

app.use(express.static('public'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(bodyparser.json());

dotenv.config();

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL,
    pass: process.env.PASS
  }
});


const db = new pg.Client({
  user: process.env.PG_USER,
  host:process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password:process.env.PG_PASSWORD ,
  port:process.env.PG_PORT,
  ssl: { rejectUnauthorized: false }
});
db.connect()
  .then(()=>{
    console.log("database connected successfully");
  })
  .catch((err)=>{
    console.log("error in connecting to databases",err);
  });


app.get("/",(req,res)=>{
  if(authro==false){
    res.render("index.ejs");
  }
  else{
    res.render("index after login.ejs")
  }
});

app.get("/about",(req,res)=>{
  if(authro==false){
    res.render("about.ejs");
  }
  else{
    res.render("about after login.ejs");
  }
});

app.get("/service",(req,res)=>{
  if(authro==false){
    res.render("service.ejs");
  }
  else{
    res.render("service after login.ejs");
  }
});
app.get("/contact",(req,res)=>{
  if(authro==false){
    res.render("contact.ejs");
  }
  else{
    res.render("contact after login.ejs");
  }
});


app.get("/up",(req,res)=>{
    if(authro==false){
      res.render("up.ejs");
    }
    else{
      res.render("up after login.ejs");
    }
});

app.post("/visit",(req,res)=>{
  const visitor=req.body.name;
  console.log("visitor data",visitor);
  authro=true;
  res.redirect("/");
});

app.get("/Dashboard",(req,res)=>{
  if(authro==true){
    res.render("Dashboard.ejs");
  }
  else{
    res.send("<center><h1>please register or login to goto Dashboard</h1></center>")
  }
});

app.get("/logout",(req,res)=>{
  authro=false;
  res.redirect("/");
});

app.get("/login",(req,res)=>{
    res.render("login.ejs");
});
app.get("/register",(req,res)=>{
  res.render("register.ejs");
});

app.post("/register",(req,res)=>{
  authro=true;
  res.render("index after login.ejs")
});

app.post("/login",(req,res)=>{
  res.render("index after login.ejs");
});

app.post("/forgetPassword",(req,res)=>{
  res.render("Forgot password.ejs");
});


app.post("/submit-email",async(req,res)=>{

    const mail=req.body.email;
    const otp = Math.floor(100000 + Math.random() * 900000);
const mailOptions = {
  from: "hackshop2025@gmail.com", // Sender email
  to: `${mail}`, 
  subject: "Your OTP Code",
  text: `Your OTP is: ${otp}. This code will expire in 5 minutes.`, 
  html: `<p>Your OTP is: <b>${otp}</b>. This code will expire in 5 minutes.</p>`,
};

 await transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
    res.render("send.ejs");
  }
});
console.log("mail sent to this ",mail);

});



app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
});



