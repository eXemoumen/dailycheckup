import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByName, createUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, pin, color, avatar } = body;

    if (!name || !pin) {
      return NextResponse.json(
        { error: 'Name and PIN are required.' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long.' },
        { status: 400 }
      );
    }

    const pinStr = pin.toString().trim();
    if (!/^\d{4}$/.test(pinStr)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits.' },
        { status: 400 }
      );
    }

    // Attempt to fetch user
    let user = await getUserByName(trimmedName);

    if (user) {
      // Existing user - verify PIN
      if (user.pin !== pinStr) {
        return NextResponse.json(
          { error: 'Incorrect PIN. This username is already registered.' },
          { status: 401 }
        );
      }
    } else {
      // New user - Register them!
      if (!color || !avatar) {
        return NextResponse.json(
          { error: 'Color and avatar are required for registration.' },
          { status: 400 }
        );
      }
      user = await createUser({
        name: trimmedName,
        pin: pinStr,
        color,
        avatar,
      });
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
