"use server"

import { db } from "@/db/drizzle"
import { user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const getCurrentUserAction = async () =>{
const session = await auth.api.getSession({
    headers: await headers()
})

if (!session){
    redirect("/auth/signin")
}

// const currentUser = await db.query.user.findFirst({
//     where: eq(user.id, session.user.id)
// })

// if (!currentUser){
//     redirect("/auth/signin")
// }

return{
    ...session,
    user: session.user
    // currentUser,
     
}
}

