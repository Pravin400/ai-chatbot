import { Schema, model } from "mongoose";

const userSchema = Schema({
  userName: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now },
  //   history : [{type : Date, qustion : String}]
});

const User = model("User", userSchema);

export default User;
