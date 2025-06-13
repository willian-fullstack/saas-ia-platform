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

// Função auxiliar para log detalhado
function logAuth(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH ${timestamp}] ${message}`);
  if (data) {
    console.log(`[AUTH ${timestamp}] Data:`, JSON.stringify(data, null, 2));
  }
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
          logAuth("Tentativa de login iniciada");
          
          // Validar credenciais
          if (!credentials?.email || !credentials?.password) {
            logAuth("Credenciais incompletas");
            return null;
          }

          logAuth(`Buscando usuário com email: ${credentials.email}`);
          
          // Buscar usuário no banco de dados por email
          const user = await getUserByEmail(credentials.email);

          // Se não encontrou o usuário
          if (!user) {
            logAuth(`Usuário não encontrado para email: ${credentials.email}`);
            return null;
          }

          logAuth(`Usuário encontrado: ${user._id.toString()}`);
          
          // Comparar a senha fornecida com a hash armazenada
          logAuth("Verificando senha...");
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            logAuth(`Senha inválida para email: ${credentials.email}`);
            return null;
          }

          logAuth(`Login bem-sucedido para: ${user.email}`);
          
          // Retorna as informações do usuário sem a senha
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          logAuth(`Erro na autenticação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { error });
          return null;
        }
      }
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
      logAuth("Callback JWT", { tokenId: token.sub, userId: user?.id });
      if (user) {
        token.id = user.id;
        token.role = user.role;
        logAuth("JWT atualizado com dados do usuário", { token });
      }
      return token;
    },
    async session({ session, token }) {
      logAuth("Callback Session", { sessionUser: session.user?.email, tokenId: token.sub });
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'user' | 'admin';
        logAuth('Session atualizada', { 
          userId: session.user.id, 
          role: session.user.role,
          email: session.user.email
        });
      }
      return session;
    },
  },
  // Configuração de cookies ajustada para funcionar sem HTTPS
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false, // Definido como false para funcionar sem HTTPS
        maxAge: 30 * 24 * 60 * 60, // 30 dias
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  debug: true, // Habilitando modo de debug para mais informações
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 