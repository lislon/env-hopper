import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { FilterPlugin } from '@env-hopper/types';

const prisma = new PrismaClient();

const baseTypeDefs = `#graphql
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

const baseResolvers = {
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

const OKTA_ISSUER = process.env.OKTA_ISSUER || '';
const OKTA_CLIENT_ID = process.env.OKTA_CLIENT_ID || '';
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
  await prisma.app.deleteMany();
  await prisma.app.createMany({
    data: [
      { name: 'app1', displayName: 'Fake App 1' },
      { name: 'app2', displayName: 'Fake App 2' },
      { name: 'app3', displayName: 'Fake App 3' },
    ],
  });
  console.log('Apps seeded');
}

export async function runServer(plugin: FilterPlugin) {
  await seedApps();
  const app = express();
  const httpServer = http.createServer(app);

  let typeDefs = [baseTypeDefs];
  let resolvers = { ...baseResolvers };

  if (plugin.extendTypeDefs) {
    typeDefs = plugin.extendTypeDefs(typeDefs);
  }
  if (plugin.extendResolvers) {
    resolvers = plugin.extendResolvers(resolvers);
  }

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
    if (plugin && plugin.name) {
      console.log(`🧩 Plugin loaded: ${plugin.name}`);
    }
  });
} 