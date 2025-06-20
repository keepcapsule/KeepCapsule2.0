export async function uploadFileToS3(file, title, type, email) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('type', type);
      formData.append('email', email);
  
      const response = await fetch('https://xkl1o711jk.execute-api.eu-west-1.amazonaws.com/prod/upload', {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
  
      return data; // { message: 'File uploaded', fileKey, title, type }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
  