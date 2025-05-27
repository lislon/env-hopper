// If you see type errors for 'cors' or 'jsonwebtoken', run:
// pnpm add -D @types/cors @types/jsonwebtoken
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { log } from 'console';

const prisma = new PrismaClient();

const typeDefs = `#graphql
  type App {
    id: Int!
    name: String!
    displayName: String!
  }
  type User {
    id: Int!
    uid: String!
    username: String!
    email: String!
    firstName: String!
    lastName: String!
  }
  type Query {
    apps: [App!]!
    users: [User!]!
  }
`;

const resolvers = {
  Query: {
    apps: async () => {
      return prisma.app.findMany();
    },
    users: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Unauthorized');
      }
      return prisma.user.findMany();
    },
  },
};

const OKTA_ISSUER = 'https://natera.oktapreview.com/oauth2/ausxb83g4wY1x09ec0h7';
const OKTA_CLIENT_ID = '0oa2elff0brL0IZHF0h8';
const JWKS = createRemoteJWKSet(new URL(`${OKTA_ISSUER}/v1/keys`));

export async function getUserFromToken(authHeader?: string) {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: OKTA_ISSUER,
      audience: OKTA_CLIENT_ID,
    });
    return payload;
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
}

async function seedApps() {
  // Remove all old apps
  await prisma.app.deleteMany();
  // Insert a few fake apps
  await prisma.app.createMany({
    data: [
      { name: 'app1', displayName: 'Fake App 1' },
      { name: 'app2', displayName: 'Fake App 2' },
      { name: 'app3', displayName: 'Fake App 3' },
    ],
  });
  console.log('Apps seeded');
}

async function startServer() {
  await seedApps();
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();

  app.use(
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const user = await getUserFromToken(req.headers.authorization);
        return { user };
      },
    })
  );

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 