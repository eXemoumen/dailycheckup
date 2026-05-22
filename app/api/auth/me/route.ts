import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById, User } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated.' },
        { status: 401 }
      );
    }

    const user = await getUserById(userId);
    if (!user) {
      // Clear cookie if user is invalid/deleted
      cookieStore.delete('session');
      return NextResponse.json(
        { error: 'User session invalid.' },
        { status: 401 }
      );
    }

    // Return user without PIN for security
    const userWithoutPin = { ...user };
    delete (userWithoutPin as Partial<User>).pin;
    return NextResponse.json({ user: userWithoutPin });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to log out.' },
      { status: 500 }
    );
  }
}
