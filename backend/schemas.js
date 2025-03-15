const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  userName: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now },
  //   history : [{type : Date, qustion : String}]
});

const User = mongoose.model("User", userSchema);

module.exports = User;
