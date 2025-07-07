import imageCompression from 'browser-image-compression';

const API_BASE = 'https://xkl1o711jk.execute-api.eu-west-1.amazonaws.com/prod';

export async function uploadFileToS3(file, title, type) {
  try {
    const token = localStorage.getItem('authToken');

    let finalFile = file;

    // 🧠 Compress image if it's image and larger than ~1MB
    if (file.type.startsWith('image/') && file.size > 1 * 1024 * 1024) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      finalFile = await imageCompression(file, options);
      console.log('✅ Image compressed:', finalFile.size);
    }

    const base64Data = await fileToBase64(finalFile);

    const response = await fetch(`${API_BASE}/upload-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        base64Data: base64Data.split(',')[1],
        title,
        type,
        filename: finalFile.name,
        mimeType: finalFile.type,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
