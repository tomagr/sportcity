import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION!;
const bucketName = process.env.AWS_S3_BUCKET_NAME!;
const bucketDir = process.env.AWS_S3_BUCKET_DIR ?? "";

export const s3Client = new S3Client({ region });

export async function uploadAvatarToS3(params: {
  userId: string;
  contentType: string;
  body: Buffer | Uint8Array | Blob | string;
  filename: string;
}): Promise<string> {
  const key = [bucketDir, "avatars", params.userId, params.filename]
    .filter(Boolean)
    .join("/");

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
      ACL: "public-read",
    })
  );

  const base = `https://${bucketName}.s3.${region}.amazonaws.com`;
  return `${base}/${key}`;
}


