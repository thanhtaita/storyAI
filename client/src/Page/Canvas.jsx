import { useEffect, useState, useRef } from "react";
import { fabric } from "fabric";
const Canvas = () => {
  const [color, setColor] = useState("#0000FF");
  const [width, setWidth] = useState(10);
  const canvasRef = useRef(null);

  useEffect(() => {
    const getContent = async () => {
      const response = await fetch("http://localhost:3000/");
      const data = await response.json();
      console.log(data);
    };
    getContent();
    // Initialize the canvas
    const canvas = new fabric.Canvas("canvas", {
      isDrawingMode: true,
      selection: true,
      hoverCursor: "pointer",
      height: 500,
      width: 500,
    });

    canvasRef.current = canvas;

    // Set drawing properties
    canvas.freeDrawingBrush.width = parseInt(width, 10);
    canvas.freeDrawingBrush.color = color;

    // Event to make the drawn objects non-selectable
    canvas.on("mouse:up", () => {
      if (canvas._objects.length > 0) {
        canvas.item(canvas._objects.length - 1).selectable = false;
      }
    });
    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    canvasRef.current.freeDrawingBrush.width = parseInt(width, 10);
    canvasRef.current.freeDrawingBrush.color = color;
  }, [color, width]);

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const image = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream"); // indicate this file is downloadable
      const link = document.createElement("a");
      link.download = "canvas.png";
      link.href = image;
      link.click();
    }
  };

  return (
    <div>
      <div className="flex flex-row justify-center items-center gap-[6rem]">
        <div>
          <h1 className="text-3xl font-bold underline mb-[1rem]">
            Draw something
          </h1>
          <canvas className="border-[1px] rounded" id="canvas" />
          <input
            type="color"
            id="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
          <div>
            <input
              type="range"
              id="width"
              value={width}
              onChange={(event) => setWidth(event.target.value)}
            />
            <div>{width}</div>
          </div>
          <div className="flex flex-row gap-[1rem] justify-center">
            <button onClick={() => canvasRef.current.clear()}>Clear</button>
            <button onClick={downloadCanvas}>Download drawing</button>
          </div>
        </div>
        <button
          className="bg-[#6803ff]"
          onClick={() => window.location.assign("/prompt")}
        >
          Start Prompting
        </button>
      </div>
    </div>
  );
};

export default Canvas;
