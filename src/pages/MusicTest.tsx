import { useState } from "react";

const MusicTest = () => {
  const [message] = useState("Music page is working!");

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-4xl font-bold text-center">{message}</h1>
      <p className="text-center mt-4">This is a test version of the music page.</p>
    </div>
  );
};

export default MusicTest;
