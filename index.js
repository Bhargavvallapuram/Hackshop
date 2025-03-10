import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import pg from "pg";
import nodemailer from "nodemailer";
import bodyparser from "body-parser";
import bcrypt from "bcrypt";


const app=express();
const port=3000;
var newUser=null;
var user=null;
const saltrounds=10;
var otp=null;

//if visitor  visitor or user users and null
var authro=false;

app.use(express.static('public'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

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
    res.render("index after login.ejs",{name:user.fullnamex});
  }
});

app.get("/about",(req,res)=>{
  if(authro==false){
    res.render("about.ejs");
  }
  else{
    res.render("about after login.ejs",{name:user.fullname});
  }
});

app.get("/service",(req,res)=>{
  if(authro==false){
    res.render("service.ejs");
  }
  else{
    res.render("service after login.ejs",{name:user.fullname});
  }
});
app.get("/contact",(req,res)=>{
  if(authro==false){
    res.render("contact.ejs");
  }
  else{
    res.render("contact after login.ejs",{name:user.fullname});
  }
});


app.get("/up",(req,res)=>{
    if(authro==false){
      res.render("up.ejs");
    }
    else{
      res.render("up after login.ejs",{name:user.fullname});
    }
});

app.post("/visitor",async(req,res)=>{
  const visitor=req.body;
  try{
    const respose=await db.query("INSERT INTO visitors (name, email) VALUES ($1,$2)",[visitor.name,visitor.email]);

    console.log("visitor data",visitor.name,visitor.email);
  }
  catch(err){
    if(err.constraint== 'visitors_email_key'){
        console.log("user mail already exist in the databases") 
    }
  }

  authro="visitor";
  res.redirect("/");
});

app.get("/Dashboard",(req,res)=>{
  if(authro==true){
    res.render("Dashboard.ejs",{name:user.fullname});
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
    res.render("login.ejs",{error:""});
});
app.get("/register",(req,res)=>{
  res.render("register.ejs",{error:""});
});

app.post("/register",async(req,res)=>{
  newUser=req.body
  console.log("new user details:",newUser);
  try {
      const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [newUser.email]);
  
      if (checkResult.rows.length > 0) {
        res.render("register.ejs",{error:"Email already exists. Try login."});
      } else {
        await otpSender(newUser.email);
        res.render("Send otp.ejs",{error:""});        
      }
    } catch (err) {
      console.log(err);
    }
});

app.post("/otpVerify",async(req,res)=>{
  if(otp==req.body.otp){
    //solve the error  when existing user forget password
    if (newUser!=null){
      const data = await db.query("SELECT * FROM users WHERE email = $1", [newUser.email]);
    }else{
      const data = await db.query("SELECT * FROM users WHERE email = $1", [user.email]);
    }
    if(data.rows.length>0)
    {
        authro=true;
        res.render("password.ejs");
    }else{
      bcrypt.hash(newUser.password,saltrounds,async(err,hash)=>{
        if(err){
            res.send("register.ejs",{error:"Try Again Server fail to process the request"});
        }        
        else{
          const result = await db.query("INSERT INTO users (fullname, email, password) VALUES ($1,$2,$3)",[newUser.fullName,newUser.email,hash]);
          console.log(result);
          authro=true;
          res.render("about after login.ejs",{name:newUser.fullName});
        }
      });
    }
}else{
    res.render("Send otp.ejs",{error:"Wrong OTP Try Again"});
}

});

app.post("/login",async(req,res)=>{
  const email = req.body.email;
    const password = req.body.password;
  
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
      if (result.rows.length > 0) {
        user = result.rows[0];
        const storedPassword = user.password;
        bcrypt.compare(password,storedPassword,(err,result)=>{
          if(err){
            res.send("server failure to process the request");
          }
          else{
            console.log(result);
            authro=true;
            res.render("index after login.ejs",{name:user.fullname});
          }
        });
  
        //if (res) {
          //res.render("secrets.ejs");
        //} else {
          //res.send("Incorrect Password");
        //}
      } else {
        res.render("login.ejs",{error:"user not found"});
      }
    } catch (err) {
      console.log(err);
    }
});

app.get("/ForgotPassword",(req,res)=>{
  res.render("Forgot password.ejs",{error:""});
});


app.post("/forget",async(req,res)=>{
  const email=req.body.email;
  try{
   user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if(user.rows.length>0){
    user=user.rows[0];
    await otpSender(email);
    res.render("Send otp.ejs",{error:""});
  }
}catch(err){
  res.render("Forgot password.ejs",{error:"email not found"});
}
});


app.post("/password",async(req,res)=>{
  const password=req.body.new_password;
  const conformation=req.body.confirm_password;
  if(password==conformation){
    try{
      const result = await db.query("UPDATE users SET password = $1 WHERE email = $2",[new_password,user.email]);
      res.render("index after login.ejs",{name:user.fullname});
    }
    catch(err){
      console.log(err);
      res.render("password.ejs",{error:"server not responding try Again Later"});
    }
    
  }else{
    res.render("password.ejs",{error:"password and confirmation not matching try Again"});
  }
});

async function otpSender(mail){

  
    otp = Math.floor(100000 + Math.random() * 900000);
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
        }
    });
    console.log("mail sent to this ",mail);

}



app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
});



