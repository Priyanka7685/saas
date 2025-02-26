// setting prisma client to have connection

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient()

// can test on postman
export async function GET(request: NextRequest) {
    try {
       const videos = await prisma.video.findMany({
            orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(videos)

    } catch (error) {
        return NextResponse.json({error: "Error fetching videos"}, {status: 400});

    } finally {
        await prisma.$disconnect()
    }
}