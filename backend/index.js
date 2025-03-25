import express, { json } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connect } from "mongoose";
import User from "./schemas.js";
import model from "./utils.js";
import dotenv from "dotenv";
import authMiddleware from "./middlewares/auth-middleware.js";

const app = express();
app.use(json());
app.use(cors());
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "JSONTW3BT0k3nS3KR3t";

app.post("/signup", async (req, res) => {
  const { userName, password, email } = req.body;

  if (!userName || !password || !email) {
    return res.status(400).json({ msg: "Required all the fields" });
  }

  // check if that alredy exists in db or not

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash the password

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({ userName, email, password: hashedPassword });

  await user.save();

  // generating token

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });

  res.status(201).json({ msg: "Signup successfull", token });
});

// login
app.get("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if user exists

    const user = await User.findOne({ email });

    console.log(user);

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Let's compare passwords here

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.log("Error in login route", error);
    res.status(500).json({ message: "Server error" });
  }
});

// cors

app.get("/ask-quetion", authMiddleware, async (req, res) => {
  // id -->

  console.log(req.user);

  const question = req.body.question;

  //   id bhej raha hai kya
  // id ke saath db koi user exists karta hai kya?? --> yes, uno

  // ====================== this ==============================

  // const chat = model.startChat({
  //   history: [],
  // });

  // const result = await chat.sendMessage(question);
  // const response = result.response;

  // ======================== or ===============================

  const result = await model.generateContent(question);

  const text = result.response.text();

  /** Send the response returned by the model as the API's response. */
  res.send({ text: text });
});

app.get("/", (req, res) => {
  res.send("Hello!!!");
});

app.listen(3000, () => {
  console.log(`Example app listening on port 3000`);
});

connect(
  "mongodb+srv://salmanshaikh:zvmFMdAh3iTZ0MDi@cluster0.bvh6a.mongodb.net"
);
