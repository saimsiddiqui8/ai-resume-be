import uploadManager from "./uploadManager.js";

const uploadDocuments = async (files, isUpdate = false) => {
  // Check for empty files
  if (!files && isUpdate) {
    return {};
  } else if (!files) {
    throw { message: "No files uploaded", status: 400 };
  }

  const uploadTasks = [];
  const documents = {};
  const fileNames = [];

  // Prepare document objects with filenames and paths
  for (const [key, value] of Object.entries(files)) {
    if (value) {
      // If the key is 'boat_images' and the value is an array, handle multiple images
      if (key === 'boat_images' && Array.isArray(value)) {
        documents[key] = [];
        for (const file of value) {
          const fileName = file.filename;
          const fileReference = file.path;
          const contentType = file.mimetype;

          // Storing file names
          fileNames.push({ key, fileName });

          uploadTasks.push(
            uploadManager.upload({
              key: `documents`,
              fileName,
              fileReference,
              contentType,
            })
          );
        }
      } else {
        // Handle other files as single uploads
        const fileName = value[0].filename;
        const fileReference = value[0].path;
        const contentType = value[0].mimetype;

        // Storing file names
        fileNames.push({ key, fileName });

        uploadTasks.push(
          uploadManager.upload({
            key: `documents`,
            fileName,
            fileReference,
            contentType,
          })
        );
      }
    }
  }

  try {
    // Upload documents in parallel using Promise.all
    const results = await Promise.all(uploadTasks);

    // Extract uploaded file locations
    for (let i = 0; i < results.length; i++) {
      const { key, fileName } = fileNames[i];
      if (key === 'boat_images') {
        documents[key].push(results[i].Location);
      } else {
        documents[key] = results[i].Location;
      }
    }

    return {
      ...documents,
    };
  } catch (error) {
    console.error(error);
    throw {message:"Error uploading documents", status:500};
  }
};

export default uploadDocuments;
