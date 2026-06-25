import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless'; // 💡 Changement ici (neon-serverless au lieu de neon-http)
import * as schema from './schema';
import ws from "ws";

// 1. On configure le constructeur global pour les WebSockets
neonConfig.webSocketConstructor = ws;

// 2. On crée un Pool de connexions persistantes (requis pour maintenir l'état des transactions)
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

// 3. On initialise Drizzle avec le pool
export const db = drizzle({ client: pool, schema });