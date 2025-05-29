import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db/models/User";

// Adicionando tipagem para a sessão
import { DefaultSession } from "next-auth";

// Estendendo a tipagem para incluir o ID e role do usuário
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: 'user' | 'admin';
    } & DefaultSession["user"];
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    role?: 'user' | 'admin';
  }
}

// Verificar e registrar informações sobre a configuração
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
if (!NEXTAUTH_SECRET) {
  console.error("AVISO: NEXTAUTH_SECRET não está definido!");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Em ambiente de desenvolvimento, permitir login sem verificação
          if (process.env.NODE_ENV === 'development') {
            console.log('Login em ambiente de desenvolvimento aceito automaticamente');
            return {
              id: "dev-user-id",
              name: "Usuário de Desenvolvimento",
              email: credentials?.email || "dev@example.com",
              role: "admin"
            };
          }
          
          // Validar credenciais
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Buscar usuário no banco de dados por email
          const user = await getUserByEmail(credentials.email);

          // Se não encontrou o usuário
          if (!user) {
            console.log(`Usuário não encontrado para email: ${credentials.email}`);
            return null;
          }

          // Comparar a senha fornecida com a hash armazenada
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log(`Senha inválida para email: ${credentials.email}`);
            return null;
          }

          // Retorna as informações do usuário sem a senha
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Erro na autenticação:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Adicionar dados detalhados para log
        console.log("JWT criado/atualizado para usuário:", user.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'user' | 'admin';
        console.log('Session user ID:', session.user.id, 'Role:', session.user.role);
      }
      return session;
    },
  },
  // Aumentar o tempo do cookie de sessão
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 dias
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: NEXTAUTH_SECRET,
  jwt: {
    // Aumentar a segurança
    secret: NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  // Aumentar a segurança dos tokens
  useSecureCookies: process.env.NODE_ENV === "production",
};

// Log para diagnóstico durante a inicialização
console.log("NextAuth configurado. Ambiente:", process.env.NODE_ENV);

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 