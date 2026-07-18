const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream('../final.csv'));

    const response = await axios.post('http://localhost:8000/api/v1/datasets/upload', form, {
      headers: {
        ...form.getHeaders()
      }
    });
    console.log("Success:", response.data);
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
  }
}

testUpload();
