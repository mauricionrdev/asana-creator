import { NextResponse } from "next/server";
import { createProjectFromTemplate } from "@/lib/asana-client";
import { validatePayload } from "@/lib/validation-v3";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validatePayload(body);

    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          message: validation.errors[0] ?? "Dados inválidos."
        },
        { status: 400 }
      );
    }

    console.info("Solicitação de criação recebida", {
      mode: validation.data.mode,
      nomeProjeto: validation.data.nomeProjeto,
      timestamp: new Date().toISOString()
    });

    const result = await createProjectFromTemplate(validation.data);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Falha ao criar projeto", error);
    return NextResponse.json(
      {
        success: false,
        message: "Não foi possível criar o projeto agora. Tente novamente."
      },
      { status: 500 }
    );
  }
}
