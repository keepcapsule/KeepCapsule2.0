export async function uploadFileToS3(file, title, type, email) {
  try {
    const queryParams = new URLSearchParams({
      title,
      type,
      email,
      filename: file.name,
    });

    const response = await fetch(
      `https://xkl1o711jk.execute-api.eu-west-1.amazonaws.com/prod/upload-file?${queryParams.toString()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
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