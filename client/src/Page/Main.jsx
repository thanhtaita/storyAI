import { useState, useEffect } from "react";
const Main = () => {
  const [stories, setStories] = useState([]);
  useEffect(() => {
    const getStories = async () => {
      const response = await fetch("http://localhost:3000/stories");
      const data = await response.json();
      console.log(data);
      setStories(data.data);
    };
    getStories();
  }, []);
  return (
    <div>
      <div className="w-[50rem] flex flex-row flex-wrap justify-center gap-[5rem] mb-[10rem]">
        {stories.map((story, index) => (
          <div className="text-[1.5rem] hover:underline" key={index}>
            <a href={`/story?storyName=${story}`}>{story}</a>
          </div>
        ))}
      </div>
      <button onClick={() => window.location.assign("/canvas")}>
        Generate a new story
      </button>
    </div>
  );
};

export default Main;
