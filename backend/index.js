const express = require("express");
const mongoose = require("mongoose");
const User = require("./schemas");

const app = express();
app.use(express.json());

// Google sdk start

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Google sdk end

// signup user
app.post("/signup", async (req, res) => {
  const data = req.body;

  const userName = data.userName;
  const passowrd = data.password;
  const email = data.email;

  const user = new User({ userName, passowrd, email });

  const savedUser = await user.save();

  res.status(201).json({ msg: "Signup successfull", savedUser });
});

// login
app.get("/login", async (req, res) => {
  const data = req.body;
  const email = data.email;
  const password = data.passowrd;

  const existingUser = await User.findOne({ password, email });

  if (!existingUser) {
    res.status(401).json({ msg: "Invalid credentials" });
    return;
  }

  res.status(200).json({ msg: "Login successfull", existingUser });
});

app.get("/", async (req, res) => {
  const question = req.body.question;

  const chat = model.startChat({
    history: [],
  });

  const result = await chat.sendMessage(question);
  const response = result.response;
  const text = response.text();

  /** Send the response returned by the model as the API's response. */
  res.send({ text: text });
});

app.listen(3000, () => {
  console.log(`Example app listening on port 3000`);
});

mongoose.connect(
  "mongodb+srv://salmanshaikh:zvmFMdAh3iTZ0MDi@cluster0.bvh6a.mongodb.net"
);
