import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// middleware protects everything in next.js
const isPublicRoute = createRouteMatcher([
    "/sign-in",
    "/sign-up",
    "/",
    "/home"
])

const isPublicApiRoute = createRouteMatcher([
    "/api/videos"
])

export default clerkMiddleware(async(auth, req) => {
    // we'll get these info if someone accessing the page
    const { userId } = await auth(); // extracting userId from auth
    const currentUrl = new URL(req.url)
    const isAccessingDashboard = currentUrl.pathname === "/home"
    const isApiRequest = currentUrl.pathname.startsWith("/api")


    // if user is logged in and accessing public route but not dashboard-- then cannot direct to signin page and will go to home page if tries to
    if(userId && isPublicRoute(req) && !isAccessingDashboard) {
        return NextResponse.redirect(new URL("/home", req.url))
    } 
    // if user is not logged in then take user to sign in page
    if(!userId) {
        if(!isPublicRoute(req) && !isPublicApiRoute(req)) {
            return NextResponse.redirect(new URL("/sign-in", req.url))
        }

        // if api request but not public api route then directing to signin page
        if(isApiRequest && !isPublicApiRoute(req)) {
            return NextResponse.redirect(new URL("/sign-in", req.url))
        }
    }
    return NextResponse.next()
})


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}