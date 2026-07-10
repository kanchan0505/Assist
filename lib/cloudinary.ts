import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export async function uploadResumeFile(
  buffer: Buffer,
  fileName: string,
  userId: string,
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "pdf";
  const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `resume-interview/resumes/${userId}`,
        public_id: `${baseName}-${Date.now()}`,
        resource_type: "raw",
        format: ext,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });
}

export { isCloudinaryConfigured };
