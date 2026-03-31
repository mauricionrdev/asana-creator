import { NextResponse } from "next/server";
import { listAssignableUsers } from "@/lib/asana-client";

export async function GET() {
  try {
    const users = await listAssignableUsers();
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Erro ao carregar usuários do Asana", error);
    return NextResponse.json(
      {
        success: false,
        message: "Não foi possível carregar os responsáveis agora."
      },
      { status: 500 }
    );
  }
}
