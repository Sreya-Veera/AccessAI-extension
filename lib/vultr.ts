// lib/vultr.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const vultr = new S3Client({
  endpoint: process.env.VULTR_ENDPOINT!,
  region: 'ewr',
  credentials: {
    accessKeyId: process.env.VULTR_ACCESS_KEY!,
    secretAccessKey: process.env.VULTR_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export async function saveReportToVultr(data: any, filename: string): Promise<string> {
  console.log('🔵 Vultr Object Storage: Saving report...');
  
  try {
    await vultr.send(new PutObjectCommand({
      Bucket: process.env.VULTR_BUCKET_NAME || 'accessai-reports',
      Key: `reports/${filename}`,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
      Metadata: {
        'generated-by': 'AccessAI',
        'timestamp': new Date().toISOString(),
      }
    }));
    
    const url = `${process.env.VULTR_ENDPOINT}/${process.env.VULTR_BUCKET_NAME}/reports/${filename}`;
    console.log('✅ Vultr Object Storage: Report saved!');
    console.log(`   URL: ${url}`);
    
    return url;
  } catch (error) {
    console.error('❌ Vultr error:', error);
    throw error;
  }
}

export async function saveImageToVultr(buffer: Buffer, filename: string, altText: string): Promise<string> {
  console.log('🔵 Vultr Object Storage: Saving image...');
  
  try {
    await vultr.send(new PutObjectCommand({
      Bucket: process.env.VULTR_BUCKET_NAME || 'accessai-reports',
      Key: `images/${filename}`,
      Body: buffer,
      ContentType: 'image/jpeg',
      Metadata: {
        'alt-text': altText,
        'processed-by': 'AccessAI',
      }
    }));
    
    const url = `${process.env.VULTR_ENDPOINT}/${process.env.VULTR_BUCKET_NAME}/images/${filename}`;
    console.log('✅ Vultr Object Storage: Image saved!');
    
    return url;
  } catch (error) {
    console.error('❌ Vultr error:', error);
    throw error;
  }
}