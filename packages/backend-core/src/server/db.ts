import { PrismaClient } from '@prisma/client'
import 'dotenv-defaults/config'

export const db = new PrismaClient()
