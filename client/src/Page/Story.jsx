import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "./Story.css";
// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import { FreeMode, Pagination } from "swiper/modules";

const Story = () => {
  const params = new URLSearchParams(window.location.search);
  const storyName = params.get("storyName");
  const [images, setImages] = useState([]);
  const [captions, setCaptions] = useState([]);

  useEffect(() => {
    console.log(storyName);
    const getStory = async () => {
      const response = await fetch(
        `http://localhost:3000/story?storyName=${storyName}`
      );
      const data = await response.json();
      console.log(data);
      if (data?.empty) {
        alert("Story not found");
        window.location.assign("/");
      }

      const imagesTemp = [];
      const captionsTemp = [];
      try {
        const captionsParse = await JSON.parse(data.data.captions);
        const imagesParse = await JSON.parse(data.data.generatedImgs);

        for (let i = 0; i < 4; i++) {
          imagesTemp.push(imagesParse[`image${i + 1}`]);
          captionsTemp.push(captionsParse[`text${i + 1}`]);
        }
        console.log(imagesTemp);
        console.log(captionsTemp);
        setImages(imagesTemp);
        setCaptions(captionsTemp);
      } catch (e) {
        console.log(e);
      }
    };
    getStory();
  }, [storyName]);

  return (
    <div className="relative">
      <button
        className="absolute left-[-7rem] bg-[#6803ff]"
        onClick={() => window.location.assign("/")}
      >
        main page
      </button>
      <h1 className="text-3xl text-center mb-[1rem] font-bold">
        {storyName.toUpperCase()}
      </h1>
      <Swiper
        slidesPerView={2}
        spaceBetween={30}
        freeMode={true}
        pagination={{
          clickable: true,
        }}
        modules={[FreeMode, Pagination]}
        className="mySwiper"
      >
        {images.map((image, index) => (
          <SwiperSlide
            className="flex flex-col justify-center items-center hover:scale-105 transition-all duration-300 ease-in-out hover:shadow-2xl"
            key={index}
          >
            <img className="w-[350px]" src={image} alt="image1" />
            <p>{captions[index]}</p>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Story;
