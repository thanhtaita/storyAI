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
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
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
  // const storyDoc = doc(db, "storyAI", storyName);
  try {
    for (let i = 0; i < imagesString.length; i++) {
      const fileName = `image${i}` + Date.now() + ".png";
      const imageRef = ref(storage, `storyAI/${fileName}`);
      await uploadString(imageRef, imagesString[i], "data_url").then(
        (snapshot) => {
          console.log("Uploaded a data_url string!");
          console.log(imageRef);
        }
      );
    }
    res.json("Images uploaded successfully");
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
