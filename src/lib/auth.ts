import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle";
import { nextCookies } from "better-auth/next-js";
import { schema } from "@/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema
    }),

    emailAndPassword:{
        enabled:true
    },
    user:{
additionalFields:{
    role:{
        type:"string",
        defaultValue:"CUSTOMER_B2C",
        input:false
    },
    customerId:{
        type:"string",
        required:false,
        input:false
    }
}
    },

    plugins:[nextCookies()]
});