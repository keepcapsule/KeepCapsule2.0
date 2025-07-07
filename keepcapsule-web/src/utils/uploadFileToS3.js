export async function uploadFileToS3(file, title, type) {
  try {
    const token = localStorage.getItem('authToken');
    const base64Data = await fileToBase64(file);

    const response = await fetch(
      'https://xkl1o711jk.execute-api.eu-west-1.amazonaws.com/prod/upload-file',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          base64Data: base64Data.split(',')[1],
          title,
          type,
          filename: file.name,
          mimeType: file.type,
        }),
      }
    );

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
