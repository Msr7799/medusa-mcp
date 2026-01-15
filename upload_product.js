import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = "https://mero-closet-adb92a18a188.herokuapp.com";
const TOKEN = "sk_c6246c8530b630647f6ed0e72901625d0f95660836bd88f02cfd09644dd897db";
const IMAGE_PATH = "C:\\Users\\code4\\Desktop\\MEDUSA-MERO\\blue-dress.jpg";

async function main() {
  try {
    // 1. Upload Image
    if (!fs.existsSync(IMAGE_PATH)) {
      console.error("Image file not found:", IMAGE_PATH);
      process.exit(1);
    }

    const form = new FormData();
    form.append('files', fs.createReadStream(IMAGE_PATH));

    console.log("Uploading image...");
    const uploadRes = await axios.post(`${BASE_URL}/admin/uploads`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${TOKEN}`
      }
    });

    const uploads = uploadRes.data.uploads;
    if (!uploads || uploads.length === 0) {
      throw new Error("No upload URL returned");
    }

    const imageUrl = uploads[0].url;
    console.log("Image uploaded:", imageUrl);

    // 2. Create Product
    const productPayload = {
      title: "Blue Patterned Dress",
      subtitle: "Fresh arrival",
      description: "Elegant blue dress with intricate patterns. / فستان أزرق بنقوش مميزة",
      images: [imageUrl],
      thumbnail: imageUrl,
      status: "published",
      options: [{ title: "Size" }],
      variants: [
        {
          title: "One Size",
          prices: [
            {
              amount: 15000, // 15.000 BHD
              currency_code: "bhd"
            }
          ],
          inventory_quantity: 10,
          options: [{ value: "One Size" }]
        }
      ]
    };

    console.log("Creating product...");
    const createRes = await axios.post(`${BASE_URL}/admin/products`, productPayload, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    console.log("Product created successfully!");
    console.log("ID:", createRes.data.product.id);
    console.log("Title:", createRes.data.product.title);

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

main();
