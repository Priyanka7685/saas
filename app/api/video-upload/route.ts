import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

// global initialization of prisma
const prisma = new PrismaClient()

// Configuration
cloudinary.config({ 
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

interface CloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration?: number;
    [key: string]: any
}


export async function POST(request: NextRequest) {
const { userId } = await auth() 

try {

    if(!userId) {
        return NextResponse.json({erro: "unauthorized"}, {status: 400})
    }
    
    if(
        !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET
    ) {
        return NextResponse.json({error: "Cloudinary creadentials not found"}, {status: 500})
    }


    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const originalSize = Number(formData.get("originalSize")) ;
    const description = formData.get("description") as string;

    if(!file) {
        return NextResponse.json({error: "File Not Found"}, {status: 400})
    }

    // important--- converting into bytes and buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise<CloudinaryUploadResult>
    ((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "video",
                folder: "video-uploads",
                transformation: [
                    {
                        quality: "auto",
                        fetch_format: "mp4"
                    }
                ]
            },
            (error, result) => {
                if(error)
                    reject(error);
                else
                resolve(result as unknown as CloudinaryUploadResult);
            }
        )
        uploadStream.end(buffer);
    })
    const video = await prisma.video.create({
        data: {
            title,
            description,
            publicId: result.public_id,
            originalSize: Number(originalSize),
            compressedSize: result.bytes,
            duration: result.duration || 0

        }
    })
    return NextResponse.json(
        video
    )
} catch(error) {
    console.log("uploading video got failed");
    return NextResponse.json({error: "Upload video failed"}, {status: 400});
} finally {
    await prisma.$disconnect()
}
    
    
};