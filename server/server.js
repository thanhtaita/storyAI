// const express = require("express");
// const cors = require("cors");
// const { stories } = require("./config");
// const admin = require("firebase-admin");
import express from "express";
import cors from "cors";
import { db, storage } from "./config.js";
import { ref } from "firebase/storage";
import { doc, setDoc, collection, addDoc, getDoc } from "firebase/firestore";
import { getDownloadURL, uploadString } from "firebase/storage";
import OpenAI from "openai";
const app = express();
const port = 3000;
const openai = new OpenAI();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

// parse the string from OPENAI API response to JSON object
const jsonParse = (jsonString) => {
  const replacedString = jsonString.replace(/['\n\t+]/g, "");
  console.log(replacedString);
  try {
    const o = JSON.parse(replacedString);
    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {}
  return false;
};

async function generateCaptions(prompt) {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: `I'm creating a story that combines 4 images with 4 accompanying texts, each pairing an image with a specific text. For the story prompt provided, please generate 4 distinct texts, ensuring each one is composed of at least two sentences. These texts should be returned in a JSON object format, where the keys are 'text1' through 'text4', each associated with its respective text content. Additionally, include a 'visuals' key in the JSON object, where the value summarizes the visual aesthetics and themes extracted from the story prompt. The story prompt is as follows: ${prompt}`,
      },
    ],

    model: "gpt-3.5-turbo-0125",
    max_tokens: 700,
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  console.log(completion.choices[0].message.content);
  return jsonParse(`${completion.choices[0].message.content}`);
}

app.get("/", (req, res) => {
  res.json({ message: "Hi, server is running" });
});

// test get image download URL from firebase storage
app.get("/image", async (req, res) => {
  try {
    const imageRef = ref(storage, "storyAI/image01706978788410.png");
    getDownloadURL(imageRef).then((url) => {
      console.log(url);
    });
  } catch (error) {
    res.json({ error: error.message });
  }
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

app.get("/generateImages", async (req, res) => {
  const storyName = "magical ability";
  try {
    await generateImages(storyName);
    res.json("Images generated successfully");
  } catch (error) {
    res.json({ error: error.message });
  }
});

// start generate images
const generateImages = async (storyName) => {
  const storyDoc = doc(db, "storyAI", storyName);
  const storyData = await getDoc(storyDoc);
  try {
    if (storyData.exists()) {
      console.log("data exist");
      const story = storyData.data();
      const captions = JSON.parse(story.captions);
      const imageLinks = [];
      const imageLinksPromise = [];

      for (let i = 1; i <= 4; i++) {
        const imagePath = story[`image${i}`];
        const imageRef = ref(storage, imagePath);
        imageLinksPromise.push(
          getDownloadURL(imageRef).then((url) => {
            imageLinks.push(url);
          })
        );
      }

      await Promise.all(imageLinksPromise);
      console.log("imageLinks", imageLinks);
      if (imageLinks.length < 4) {
        return { error: "Not enough images" };
      }
      // generate images 4 times wit accumulative images since we have prompt limited by 1000 characters
      // first image
      const response1 = await openai.images
        .edit({
          image: [imageLinks[0]],
          prompt: `Generate an image that represents the following text: ${captions.text1}. This text is a part of a story and this is the summary and the visual aspect of the story ${captions.visuals}`,
        })
        .then((response) => {
          console.log("response1", response.data.url);
        });

      // second image
      const response2 = await openai.images.edit({
        image: [imageLinks[0], imageLinks[1]],
        prompt: `Generate an image that represents the following text: ${captions.text2}. This text is a part of a story and this is the summary and the visual aspect of the story ${captions.visuals}`,
      });

      // third image
      const response3 = await openai.images.edit({
        image: [imageLinks[0], imageLinks[1], imageLinks[2]],
        prompt: `Generate an image that represents the following text: ${captions.text3}. This text is a part of a story and this is the summary and the visual aspect of the story ${captions.visuals}`,
      });

      // fourth image
      const response4 = await openai.images.edit({
        image: [imageLinks[0], imageLinks[1], imageLinks[2], imageLinks[3]],
        prompt: `Generate an image that represents the following text: ${captions.text4}. This text is a part of a story and this is the summary and the visual aspect of the story ${captions.visuals}`,
      });

      console.log("response1", response1.data.url);
      console.log("response2", response2.data.url);
      console.log("response3", response3.data.url);
      console.log("response4", response4.data.url);
    } else {
      return { error: "Story not found" };
    }
  } catch (error) {
    return { error: error.message };
  }
};

// generate prompt and upload referenced images and captions to firestore
app.post("/generate", async (req, res) => {
  console.log("server generating");
  // geting story name
  const storyName = req.body.storyName;
  // getting prompt and generate captions
  const prompt = req.body.instruction;
  let captions;
  try {
    captions = await generateCaptions(prompt);
    console.log(captions);
  } catch (error) {
    return res.json({ error: error.message });
  }
  // getting images string
  const imagesString = req.body.imagesString;
  // uploading referenced images and captions to firestore
  const storyDoc = doc(db, "storyAI", storyName);
  // store origin prompt and the whole generated captions first
  await setDoc(storyDoc, {
    prompt: prompt,
    captions: JSON.stringify(captions),
  });
  // store images with their corresponding image paths
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
                [`image${i + 1}`]: imageRef._location.path_,
              },
              { merge: true }
            );
          } catch (error) {
            console.log(error.message);
          }
        }
      );
    }
    res.json("Refereced images and captions stored successfully");
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
