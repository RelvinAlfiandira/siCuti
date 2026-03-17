// lib/auth.js
// Konfigurasi NextAuth — login dengan email + password

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const authOptions = {
  providers: [
    {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) return null

        const passwordMatch = bcrypt.compareSync(credentials.password, user.password)
        if (!passwordMatch) return null

        return {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
        }
      }
    }
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.nama = user.nama
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.nama = token.nama
        session.user.role = token.role
      }
      return session
    }
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 hari
  },

  secret: process.env.NEXTAUTH_SECRET,
}

module.exports = { authOptions }
