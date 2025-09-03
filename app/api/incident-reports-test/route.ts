import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'GET incident reports test working' })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'POST incident reports test working' })
}