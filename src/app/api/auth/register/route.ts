import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, isEmailInUse } from "@/lib/db/models/User";

// Este exemplo usa um banco de dados em memória
// Em uma aplicação real, você usaria um banco de dados como MongoDB, PostgreSQL, etc.

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validações básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Dados incompletos. Nome, email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Email inválido." },
        { status: 400 }
      );
    }

    // Verificar se a senha tem pelo menos 8 caracteres
    if (password.length < 8) {
      return NextResponse.json(
        { message: "A senha deve ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    // Verificar se o email já está em uso
    const emailExists = await isEmailInUse(email);
    if (emailExists) {
      return NextResponse.json(
        { message: "Este email já está em uso." },
        { status: 409 }
      );
    }

    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar o novo usuário no banco de dados
    const newUser = await createUser({
      name,
      email,
      password: hashedPassword,
    });

    // Retornar sucesso, sem a senha
    return NextResponse.json(
      {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    
    // Erros específicos de banco de dados
    if (error instanceof Error) {
      if (error.message.includes("duplicate key error")) {
        return NextResponse.json(
          { message: "Este email já está em uso." },
          { status: 409 }
        );
      }
      
      if (error.message.includes("validation failed")) {
        return NextResponse.json(
          { message: "Dados inválidos. Verifique os requisitos." },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 