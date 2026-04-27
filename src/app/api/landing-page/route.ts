import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authoption } from "../auth/[...nextauth]/authOption";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_API_URL}/landing-page`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

     const data = await response.json();
    console.log("Landing Page GET response:", data);
   

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch landing page" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Landing Page GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authoption);
    const token = session?.accessToken as string;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${BACKEND_API_URL}/landing-page`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to update landing page" }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Landing Page PUT error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
