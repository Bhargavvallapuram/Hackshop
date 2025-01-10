import express from "express";
import axios from "axios";
import env from "dotenv";
import pg from "pg";
import  { Sequelize } from "sequelize";
import nodemailer from "nodemailer";

const app=express();
const port=3000;

app.use(express.static('public'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

env.config();

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hackshop2025@gmail.com',
    pass: 'pnma nemv pdyf zhhb'
  }
});




const sequelize = new Sequelize(process.env.PG_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
  
  (async () => {
    try {
      await sequelize.sync();
      console.log("Database connected");
    } catch (err) {
      console.error("Error connecting to the database:", err);
    }
  })();

app.get("/",(req,res)=>{
    res.render("index.ejs");
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
  }
});

res.render("send.ejs");
console.log("mail sent to this ",mail);

});



app.get("/tablecreate",async(req,res)=>{

    await sequelize.query("CREATE TABLE users(id SERIAL PRIMARY KEY,email VARCHAR(100) NOT NULL UNIQUE,password VARCHAR(100))");
    res.send("Table created");
});

app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
});
