import React, { useState} from "react";
// Custom Button Component

const hexToString = (hex) => {
  return hex
    .match(/.{1,2}/g)
    .map((byte) => String.fromCharCode(parseInt(byte, 16)))
    .join("");
};
const AlertBox = ({ title, message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center">
      <div className="bg-gray-800 p-6  text-center w-80 rounded-2xl">
        <div className="mb-4 text-m font-semibold text-white whitespace-pre-line">{title}</div>
        <div className="mb-4 text-m text-white whitespace-pre-line text-left">{message}</div>
        <button onClick={onClose} className="w-full bg-blue-500 text-white py-2 rounded-lg">OK</button>
      </div>
    </div>
  );
};
export default function App() {
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');

  const [selectedFile, setFile] = useState(null);
  const [username, setUsername] = useState("Your name will be here (* ^ ω ^)");
  const [unlockBalls, setUnlockBalls] = useState(true);
  
  
  const [unlockPutters, setUnlockPutters] = useState(true);
  const [unlockCourses, setUnlockCourses] = useState(true);
  const [buyCourses, setBuyCourses] = useState(true);
  const [hexData, setHexData] = useState("");
  const fileInputRef = React.useRef(null);


  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    // setFileName(selectedFile?.name);
    // console.log(fileName);
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryData = new Uint8Array(e.target.result);
      const hexString = Array.from(binaryData)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      setHexData(hexString);
      setUsername(extractUsername(hexString) || "UNKNOWN");
    };
    reader.readAsArrayBuffer(selectedFile);
    setFile(selectedFile);
  };

  const extractUsername = (hex) => {
    const match = hex.match(/4e616d65(.*?)506c6174666f726d446973706c61794e616d65/);
    if (!match) return null;
    const extractedHex = match[1].match(/56616c7565(.*?)48617356616c7565/);
    if (!extractedHex) return null;
    const usernameHex = extractedHex[1].match(/000000(.*?)0008/);
    if (!usernameHex) return null;
    return hexToString(usernameHex[1]);
  };

  const modifyHexSection = (hex, startMarker, endMarker, replacements) => {
    let startIndex = hex.indexOf(startMarker);
    if (startIndex === -1) {
        setAlertTitle("Doesn't look like Walkabout Mini Golf profile file.\n\nPlease select correct file!");
        setAlertMessage(``); 
        setAlertOpen(true);
        return hex;
    }

    let endIndex = endMarker ? hex.indexOf(endMarker, startIndex) : -1;
    if (endIndex === -1) endIndex = hex.length;
  
    let extractedHex = hex.substring(startIndex, endIndex);
    let changesCount = 0;
  
    // Apply the replacements and count the changes
    for (const [oldVal, newVal] of Object.entries(replacements)) {
      const occurences = (extractedHex.split(oldVal).length - 1);
      if (occurences > 0) {
        changesCount += occurences;
        extractedHex = extractedHex.split(oldVal).join(newVal);
      }
    }
  
    return { updatedHex: hex.substring(0, startIndex) + extractedHex + hex.substring(endIndex), changesCount };
  };

  const saveFile = (hexData, username) => {
    const byteArray = new Uint8Array(hexData.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    const blob = new Blob([byteArray], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = selectedFile.name; // User-defined filename
    document.body.appendChild(link);
    link.click(); // This triggers the file download dialog
    document.body.removeChild(link);
  };
  const handleUnlock = () => {
    if (!selectedFile || !hexData) {
      setAlertTitle("Please select a file first!");
      setAlertMessage(''); 
      setAlertOpen(true);
      //alert("Please select a file first!");
      return;
    }
    let newHexData = hexData;
    let ballsChanges = 0;
    let puttersChanges = 0;

    let coursesPurchasesChanges = 0;
    let coursesUnlockChanges = 0;

    if (unlockPutters) {
      const result = modifyHexSection(newHexData, "50757474657273556e6c6f636b6564", "436f7572736544617461", {
        "56616c7565000008": "56616c7565000108",
        "48617356616c7565000009": "48617356616c7565000109",
      });
      newHexData = result.updatedHex;
      puttersChanges += result.changesCount;
    }
    if (unlockBalls) {
      const result = modifyHexSection(newHexData, "42616c6c73466f756e64", "42616c6c506f736974696f6e73", {
        "48617356616c7565000009": "48617356616c7565000109",
        "56616c756500ffffffffffffffff08": "56616c756500000000000000000008",
      });
      newHexData = result.updatedHex;
      ballsChanges += result.changesCount;
    }
    
    if (buyCourses) {
      const result = modifyHexSection(newHexData, "436f7572736544617461", "436f736d657469635061636b44617461", {
        "4973507572636861736564002b0000000856616c756500000848617356616c7565000009": "4973507572636861736564002b0000000856616c756500010848617356616c7565000109",
        "4973507572636861736564002b0000000856616c7565000008": "4973507572636861736564002b0000000856616c7565000108",
      });
      newHexData = result.updatedHex;
      coursesPurchasesChanges += result.changesCount;
    }
    if (unlockCourses) {
      const result = modifyHexSection(newHexData, "436f7572736544617461", "436f736d657469635061636b44617461", {
        "4973556e6c6f636b6564002b0000000856616c756500000848617356616c7565000009": "4973556e6c6f636b6564002b0000000856616c756500010848617356616c7565000109",
        "4973556e6c6f636b6564002b0000000856616c7565000008": "4973556e6c6f636b6564002b0000000856616c7565000108",
      });
      newHexData = result.updatedHex;
      coursesUnlockChanges += result.changesCount;
    }

    setHexData(newHexData);
    saveFile(newHexData);

    setAlertTitle("Success!");
    setAlertMessage(`Balls unlocked: ${Math.floor(ballsChanges / 2)}\nPutters unlocked: ${Math.floor(puttersChanges / 2)}\n\nPaid courses unlocked: ${Math.floor(coursesPurchasesChanges / 2)}\nHard courses unlocked: ${Math.floor(coursesUnlockChanges / 2)}\n\n File saved!\n\nReplace original file on your headset/device with new one`); 
    setAlertOpen(true);
  };
  

  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8 m-5 rounded-3xl">
      {alertOpen && <AlertBox title={alertTitle} message={alertMessage} onClose={() => setAlertOpen(false)} />}
      <div className="text-center text-xl font-bold">Walkabout Mini Golf</div>
      <div className="text-center text-lg font-semibold">UNLOCKER</div>
      <div className="text-center text-sm mt-1">by K1TTYBLACK</div>

      <div className="flex space-x-2 mt-2">
        {/* <button 
          className="bg-gray-700 px-4 py-1 rounded"
          onClick={() => window.open("https://github.com/K1TTYBLACK/WalkaboutMiniGolf-Unlocker", "_blank")}
        >
          GitHub
        </button> */}
        <button 
          className="bg-gray-700 px-4 py-1 rounded"
          onClick={() => window.open("https://github.com/K1TTYBLACK/WalkaboutMiniGolf-Unlocker-WEB", "_blank")}
        >
          GitHub
        </button>
        <button 
          className="bg-gray-700 px-4 py-1 rounded"
          onClick={() => window.open("https://horizon.meta.com/profile/112795680903761/", "_blank")}
        >
          Meta
        </button>
      </div>
      <div className="text-center text-sm mt-1">Last updated: 7th of March 2025 (game version v5.7) </div>
      <div className="bg-gray-800 p-4 mt-4 rounded-lg w-full max-w-md">
        <div className="text-sm font-semibold">1. Instructions</div>
        <br></br>
        <p className="text-xs mt-1">1. Quit game</p>
        <p className="text-xs mt-1">2. If you use Meta Quest, connect it to your device and copy file:</p>
        <p className="text-xs mt-1 mx-5"><b>Oculus:</b> Android/data/com.MightyCoconut.WalkaboutMiniGolf/files/Profiles/Oculus/XXXXXXXXXXXXX/Player_XXXXXXX.data</p>
        <p className="text-xs mt-1 mx-5"><b>Steam/Quest Link:</b>  %USERPROFILE%\AppData\LocalLow\Mighty Coconut\Walkabout Mini Golf\Profiles</p>
        <p className="text-xs mt-1">3. <b>⚠️ Disable internet on device you play golf on.</b></p>
        <p className="text-xs mt-1">4. Import <b>Player_XXXXXXX.data</b> here and click UNLOCK.</p>
        <p className="text-xs mt-1">5. Replace modified file in directory you got it from.</p>
        <p className="text-xs mt-1">6. Launch Walkabout Mini Golf <b>with internet off</b>.</p>
        <p className="text-xs mt-1">7. ⚠️ Ensure everything is unlocked and <b>enable internet while in game</b>.</p>
        <p className="text-xs mt-1">8. ⚠️ <b>Join any multiplayer match.</b></p>

      </div>
      <div className="bg-gray-800 p-4 mt-4 rounded-lg w-full max-w-md">
        <div className="text-sm font-semibold">2. Import profile</div>
        <p className="text-xs mt-1">Select "Profile_Default.data"  or "Profile_XXXXXX.data"</p>
        <div className="flex space-x-2 mt-2">
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".data"
          />
          <input
            type="text"
            className="bg-gray-700 p-2 w-full rounded text-white"
            value={selectedFile ? selectedFile.name : ""}
            placeholder="Select a file..."
            readOnly
          />
          <button
            className="bg-blue-600 px-4 py-2 rounded"
            onClick={() => fileInputRef.current.click()}
          >
            Browse...
          </button>
        </div>
        <button className="bg-gray-700 w-full mt-2 py-2 rounded">
          {username}
        </button>
      </div>

      <div className="bg-gray-800 p-4 mt-4 rounded-lg w-full max-w-md">
        <div className="text-sm font-semibold">3. Unlocker</div>
        <div className="flex flex-col mt-2 space-y-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={unlockBalls}
            onChange={() => setUnlockBalls(!unlockBalls)}
            className="h-5 w-5 cursor-pointer" // Making the checkbox bigger
          />
          <span>Unlock balls</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={unlockPutters}
            onChange={() => setUnlockPutters(!unlockPutters)}
            className="h-5 w-5 cursor-pointer" // Making the checkbox bigger
          />
          <span>Unlock putters</span>
        </label>   
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={unlockCourses}
            onChange={() => setUnlockCourses(!unlockCourses)}
            className="h-5 w-5 cursor-pointer" // Making the checkbox bigger
          />
          <span>Unlock "hard" courses</span>
        </label> 
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={buyCourses}
            onChange={() => setBuyCourses(!buyCourses)}
            className="h-5 w-5 cursor-pointer" // Making the checkbox bigger
          />
          <span>UNLOCK PAID COURSES</span>
          <span className="text-xs mt-1 text-gray-500">(import "Profile_Default.data")</span>
        </label>
        </div>
        <button className="bg-gray-700 w-full mt-2 py-2 rounded" onClick={handleUnlock}>
          UNLOCK & SAVE
        </button>


        <div>

      
    </div>
      </div>
    </div>
  );
  
}
