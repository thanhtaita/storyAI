// const express = require("express");
// const cors = require("cors");
// const { stories } = require("./config");
// const admin = require("firebase-admin");
import express from "express";
import cors from "cors";
import { db, storage } from "./config.js";
import { ref } from "firebase/storage";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { getDownloadURL, uploadString } from "firebase/storage";
import OpenAI from "openai";
const app = express();
const port = 3000;
const openai = new OpenAI();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

async function generateCaptions(prompt) {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: `I'm making a story with 4 images and 4 texts, each image has 1 text. Given the prompt below, help me to generate 4 texts in JSON object with key-value is "text1"-value1 and so on. Each text can be more than one sentence. At the end, bive me a pair with a key named "visuals" and the value is all the visual aesthetic you can extract from the promp. This is the prompt: ${prompt}`,
      },
    ],

    model: "gpt-3.5-turbo-0125",
    max_tokens: 700,
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  console.log(completion.choices[0].message.content);
  return completion.choices[0].message.content;
}

const jsonParse = (jsonString) => {
  const replacedString = jsonString.replace(/\n/g, "").replace(/\+ /g, "");
  console.log(replacedString);
  try {
    const o = JSON.parse(replacedString);
    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {}
  return false;
};

app.get("/", (req, res) => {
  const content = `'{\n' +
      '  "text1": "Elian possessed a unique ability to empathize deeply with those around him, feeling their joys and sorrows as if they were his own.",\n' +
      '  "text2": "One evening, under the painted sky, Elian's compassionate nature led him to a desolate figure on a bench, radiating profound sadness.",\n' +
      '  "text3": "Engaging the man in conversation, Elian absorbed his emotions, riding the turbulent waves of the stranger's narrative with unwavering empathy.",\n' +
      '  "text4": "As the night unfolded, Elian's innate gift of shared emotions transformed a moment of despair into a glimmer of hope, illuminating the power of human connection."\n' +
      '  ,\n' +
      '  "visuals": "The visuals in this story evoke a sense of emotional depth and connection. Imagery of a young boy with a perceptive gaze, a sunset casting warm hues over a serene setting, and a solitary figure on a bench exuding melancholy can paint a poignant picture. The evolving sky from orange to pink mirrors the 
emotional journey of the characters, while the stars emerging symbolize newfound solace and companionship."\n' +
      '}'`;
  res.json({ message: parsed });
});

app.post("/create", async (req, res) => {
  const data = req.body;
  try {
    const storyDoc = doc(db, "try", "story1");
    await setDoc(storyDoc, {
      caption: "caption 1",
      image: "image 1",
    });
    res.json("Story created successfully");
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.post("/image", async (req, res) => {
  try {
    const imageRef = ref(storage, "storyAI/TaiTa.png");
    getDownloadURL(imageRef).then((url) => {
      console.log(url);
    });
    res.json("Image uploaded successfully");
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.post("/generate", async (req, res) => {
  console.log("server generating");
  const imagesString = req.body.imagesString;
  const storyName = req.body.storyName;
  const storyDoc = doc(db, "storyAI", storyName);
  try {
    for (let i = 0; i < imagesString.length; i++) {
      const fileName = `image${i}` + Date.now() + ".png";
      const imageRef = ref(storage, `storyAI/${fileName}`);
      await uploadString(imageRef, imagesString[i], "data_url").then(
        async (snapshot) => {
          console.log("Uploaded a data_url string!");
          console.log(imageRef._location.path_);
          try {
            await setDoc(
              storyDoc,
              {
                [`image${i}`]: imageRef._location.path_,
              },
              { merge: true }
            );
          } catch (error) {
            console.log(error.message);
          }
        }
      );
    }
    res.json("Images uploaded successfully");
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get("/generateCaption", async (req, res) => {
  console.log("server generating caption");
  const prompt = req.body.prompt;
  try {
    const caption = await generateCaptions(prompt);
    console.log(caption);
    res.json(caption);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
