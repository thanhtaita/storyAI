// const express = require("express");
// const cors = require("cors");
// const { stories } = require("./config");
// const admin = require("firebase-admin");
import express from "express";
import cors from "cors";
import axios from "axios";
import fs from "fs";
import { db, storage } from "./config.js";
import { ref } from "firebase/storage";
import {
  doc,
  setDoc,
  collection,
  addDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { getDownloadURL, uploadString } from "firebase/storage";
import OpenAI, { toFile } from "openai";
import { get } from "http";
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

async function downloadImageAsBuffer(imageUrl) {
  try {
    console.log("downloading image");
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    console.log(response.data);
    return response.data; // This is a buffer
  } catch (error) {
    console.error("Failed to download image", error);
    throw error;
  }
}
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

app.get("/", async (req, res) => {
  console.log(
    await downloadImageAsBuffer(
      "https://firebasestorage.googleapis.com/v0/b/storyai-b4fb6.appspot.com/o/storyAI%2Fimage01706978788410.png?alt=media&token=d2e900a1-88b1-452f-a58d-bb9b5bdceedd"
    )
  );
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

// test store images
app.post("/storeImages", async (req, res) => {
  console.log("server storing images");
  const imageURLs = [
    "https://firebasestorage.googleapis.com/v0/b/storyai-b4fb6.appspot.com/o/storyAI%2Fimg1.png?alt=media&token=e875c217-ef61-435b-95ba-ab0acbdf4495",
    "https://firebasestorage.googleapis.com/v0/b/storyai-b4fb6.appspot.com/o/storyAI%2Fimg2.png?alt=media&token=94633441-9c56-4c94-9e66-97bb4c45d147",
    "https://firebasestorage.googleapis.com/v0/b/storyai-b4fb6.appspot.com/o/storyAI%2Fimg3.png?alt=media&token=9932a712-aec5-4470-b80f-3817bafc3a72",
    "https://firebasestorage.googleapis.com/v0/b/storyai-b4fb6.appspot.com/o/storyAI%2Fimg4.png?alt=media&token=761b79ea-8785-4f67-a16c-e6c99d921a89",
  ];
  const storyName = "white switches";
  if (storeImages(imageURLs, storyName)) {
    return res.json("Images stored successfully");
  }
  return res.json("Images stored failed");
});

// convert buffer to data_url base 64 string
const bufferToDataUrl = (buffer) => {
  const base64String = buffer.toString("base64");
  return `data:image/png;base64,${base64String}`;
};

// store the generated images to storage
const storeImages = async (imageURLs, storyName) => {
  const imageObjs = {};
  try {
    console.log("download images as buffer");
    for (let i = 0; i < imageURLs.length; i++) {
      const buffer = await downloadImageAsBuffer(imageURLs[i]);
      const fileName = `image${i + 1}` + Date.now() + ".png";
      const imageRef = ref(storage, `storyAI/${fileName}`);
      console.log("uploading images to storage");
      await uploadString(imageRef, bufferToDataUrl(buffer), "data_url").then(
        async (snapshot) => {
          console.log("Uploaded a data_url string!");
          try {
            getDownloadURL(imageRef).then((url) => {
              imageObjs[`image${i + 1}`] = url;
            });
          } catch (error) {
            console.log(error.message);
          }
        }
      );
    }
    const generatedImages = { generatedImgs: JSON.stringify(imageObjs) };
    const storyDoc = doc(db, "storyAI", storyName);
    try {
      await setDoc(storyDoc, generatedImages, { merge: true });
    } catch (error) {
      console.log(error.message);
    }
    console.log("Refereced images stored successfully");
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

// start generate images
const generateImages = async (storyName) => {
  const storyDoc = doc(db, "storyAI", storyName);
  const storyData = await getDoc(storyDoc);
  try {
    if (storyData.exists()) {
      console.log("data exist");
      const story = storyData.data();
      const captions = JSON.parse(story.captions);
      // const imageLinksPromise = [];

      // for (let i = 1; i <= 4; i++) {
      //   const imagePath = story[`image${i}`];
      //   const imageRef = ref(storage, imagePath);
      //   imageLinksPromise.push(getDownloadURL(imageRef));
      // }

      // const imageLinks = await Promise.all(imageLinksPromise);
      // console.log("imageLinks", imageLinks);
      // if (imageLinks.length < 4) {
      //   return { error: "Not enough images" };
      // }
      // generate images 4 times wit accumulative images since we have prompt limited by 1000 characters
      // first image
      // let file;
      // try {
      //   file = await toFile(downloadImageAsBuffer(imageLinks[0]));
      // } catch (error) {
      //   console.log(error.message);
      // }

      const imageURLs = [];
      try {
        for (let i = 0; i < 4; i++) {
          const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `I'm creating a picture-caption story that includes 4 images, each with its own caption. Below are 4 texts representing the visual and thematic elements of the story. Please generate image ${
              i + 1
            } for the text${
              i + 1
            }. Picture includes no text. The visual aspects mentioned should guide the creation of the general theme. The text${
              i + 1
            } is: ${
              captions[`text${i + 1}`]
            }. This is the whole story: ${captions}`,
            n: 1,
          });
          console.log("response", response);
          imageURLs.push(response.data[0].url);
          await setDoc(
            storyDoc,
            {
              [`image${i + 1}_prompt`]: JSON.stringify(
                response.data[0].revised_prompt
              ),
            },
            { merge: true }
          );
        }
        console.log("Images generated successfully");
        console.log(imageURLs);
        // store images to storage
        if (storeImages(imageURLs, storyName)) {
          return { status: true };
        }
        return { status: false };
      } catch (error) {
        console.log(error.message);
        return { status: false };
      }
    } else {
      console.log("Story not found");
      return { status: false };
    }
  } catch (error) {
    console.log(error.message);
    return { status: false };
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
    console.log("Refereced images and captions stored successfully");
    if (generateImages(storyName).status) {
      return res.json("Generate images and captionssuccessfully");
    }
    return res.json("Generate images and captions failed");
  } catch (error) {
    res.json({ error: error.message });
  }
});

// get story data
app.get("/story", async (req, res) => {
  const storyName = req.query.storyName;
  console.log(storyName);
  const storyDoc = doc(db, "storyAI", storyName);
  const storyData = await getDoc(storyDoc);
  if (storyData.exists()) {
    console.log("Document data:", storyData.data());
    res.json({ data: storyData.data() });
  } else {
    console.log("No such document!");
    res.json({ data: "" });
  }
});

// get all story names
app.get("/stories", async (req, res) => {
  const storyRef = collection(db, "storyAI");
  console.log(storyRef);
  const storyData = await getDocs(storyRef);
  const stories = [];
  storyData.forEach((doc) => {
    stories.push(doc.id);
  });
  res.json({ data: stories });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
