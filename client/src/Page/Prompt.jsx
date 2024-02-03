import { useState } from "react";

const Prompt = () => {
  const [images, setImages] = useState([]);
  const [instruction, setInstruction] = useState("");
  const [storyName, setStoryName] = useState("");
  const handlePromptChange = (e) => {
    console.log(e.target.value);
    setInstruction(e.target.value);
  };

  const handleStoryNameChange = (e) => {
    console.log(e.target.value);
    setStoryName(e.target.value);
  };

  const handleSetImages = (e) => {
    const files = e.target.files;
    if (files.length + images.length > 4) {
      alert("You can only upload 4 images");
      return;
    }
    // convert to image base 64
    const imagesBase64 = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      reader.onloadend = function () {
        // Push the Base64 string onto the array
        imagesBase64.push({
          local: URL.createObjectURL(file),
          base64: reader.result,
        });

        // Check if all files have been processed
        if (imagesBase64.length === files.length) {
          setImages([...images, ...imagesBase64]);
          console.log([...images, ...imagesBase64]); // Here you have an array of Base64 strings
        }
      };

      reader.onerror = function (error) {
        console.error("Error reading file:", error);
      };

      reader.readAsDataURL(file); // Convert the file to a Data URL (Base64)
    });
  };

  const handleGenerate = async () => {
    console.log("Start generating story");
    if (storyName === "" || instruction === "") {
      alert("Story name and prompt can not be empty");
      return;
    }
    console.log(images);
    // get only the base64 strings
    const imagesString = images.map((image) => image.base64);
    const request = await fetch("http://localhost:3000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imagesString, instruction, storyName }),
    });
    const data = await request.json();
    console.log(data);
    // window.location.assign("/prompt");
  };

  return (
    <div className="flex flex-col">
      <div className="w-full flex flex-col items-center ">
        <h1 className="mb-[2rem]">Upload your referenced images and prompt</h1>
        <div className="w-full flex flex-row justify-center">
          <div className="w-[50%] flex flex-col justify-center items-center">
            <div>Images</div>
            <div className="w-full h-[30rem] border-[1px] border-solid border-[#fff] flex flex-row flex-wrap gap-[1rem] justify-center p-[1rem]">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image["local"]}
                  alt="upload"
                  className="w-[40%] h-[40%] object-cover"
                />
              ))}
            </div>
            <input
              type="file"
              name="images"
              id="images"
              multiple
              accept="image/*"
              onChange={handleSetImages}
              disabled={images.length > 3}
              className="flex flex-row justify-center"
            />
          </div>
          <div className="w-[50%] flex flex-col items-center gap-[1rem]">
            <div className="w-full flex flex-col  items-center">
              <div>Story&apos;s name</div>
              <input
                type="text"
                name="storyName"
                id="storyName"
                value={storyName}
                placeholder="Enter your story name"
                className="p-[1rem] w-[70%] border-[1px] border-solid border-[#fff] rounded-md"
                onChange={handleStoryNameChange}
              />
            </div>
            <div className="w-full flex flex-col  items-center">
              <div>Prompt</div>
              <textarea
                name="prompt"
                id="prompt"
                cols="30"
                rows="10"
                value={instruction}
                placeholder="Enter your prompt here"
                onChange={handlePromptChange}
                className="p-[1rem] w-[70%] h-[20rem] border-[1px] border-solid border-[#fff] rounded-md"
              >
                {instruction}
              </textarea>
            </div>
            <button className="mt-[2rem] bg-[#6803ff]" onClick={handleGenerate}>
              Start Prompting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prompt;
