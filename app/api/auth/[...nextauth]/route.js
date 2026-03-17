// app/api/auth/[...nextauth]/route.js
// Handler NextAuth — letakkan di path ini persis

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
