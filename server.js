const express = require("express");
const multer = require("multer");
const { createCanvas, loadImage } = require("canvas");
const jsQR = require("jsqr");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
const port = process.env.PORT | 3001;

app.post("/generate-totp", async (req, res) => {
  // Decode the Base64 string
  const imageBuffer = Buffer.from(req.body.data, "base64");

  // Write the buffer to a file (example: image.png)
  const timestamp = Date.now();
  fs.writeFile(`${timestamp}.png`, imageBuffer, async (err) => {
    if (err) throw err;
    console.log(`Image saved as ${timestamp}.png`);
    try {
      const imagePath = `${timestamp}.png`;
      console.log(`Load image at ${imagePath}`);
      const image = await loadImage(imagePath);

      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);

      fs.unlinkSync(imagePath); // Remove the uploaded file

      if (code) {
        const url = new URL(code.data);
        const secret = url.searchParams.get("secret");
        if (secret) {
          const { otp } = TOTP.generate(secret, {
            digits: 8,
            algorithm: "SHA-512",
            period: 60,
          });
          res.json({ data: otp });
        } else {
          res.status("400").send("Invalid QR");
        }
      } else {
        res.status(404).json({ error: "No QR code found" });
      }
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "An error occurred while processing the image" });
    }
  });
});
app.get("/", (req, res, next) => {
  res.send("Hello world");
});

const server = app.listen(port, () => {
  console.log(`Server listening at 127.0.0.1:${port}`);
});
