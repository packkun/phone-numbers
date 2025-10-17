import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const adminPassword = process.env.ADMIN_PASSWORD || "changeme"

    // Verify password matches
    if (password !== adminPassword) {
      return NextResponse.json({ error: "Неверный пароль" }, { status: 401 })
    }

    // Test backend connection
    const response = await fetch(`${backendUrl}/api/v1/phones?limit=1&password=${encodeURIComponent(password)}`)

    if (!response.ok) {
      return NextResponse.json({ error: "Ошибка подключения к серверу" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
