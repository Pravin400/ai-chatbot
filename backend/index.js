const express = require("express");
const app = express();
const port = 3000;

//

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get("/", async (req, res) => {
  const chat = model.startChat({
    history: [],
  });

  const result = await chat.sendMessage("What is html??");
  const response = await result.response;
  const text = response.text();

  /** Send the response returned by the model as the API's response. */
  res.send({ text: text });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
