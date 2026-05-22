import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBoardTasks, getAllUsers, addTask, getLocalDateString, getUserById, User } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const todayStr = getLocalDateString();
    const dateStr = dateParam || todayStr;

    // Validate date format YYYY-MM-DD
    if (dateStr && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const [users, tasks] = await Promise.all([
      getAllUsers(),
      getBoardTasks(dateStr)
    ]);

    // Sanitize user passwords/pins out of the response
    const sanitizedUsers = users.map(u => {
      const sanitized = { ...u };
      delete (sanitized as Partial<User>).pin;
      return sanitized;
    });

    return NextResponse.json({
      date: dateStr,
      isToday: dateStr === todayStr,
      users: sanitizedUsers,
      tasks,
    });
  } catch (error) {
    console.error('Fetch board error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board data.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
      return NextResponse.json(
        { error: 'Invalid session.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json(
        { error: 'Task text is required.' },
        { status: 400 }
      );
    }

    const todayStr = getLocalDateString();
    const existingTasks = await getBoardTasks(todayStr);
    const userTasksCount = existingTasks.filter(t => t.userId === userId).length;

    const newTask = await addTask(todayStr, {
      userId,
      text: text.trim(),
      status: 'todo',
      order: userTasksCount,
    });

    return NextResponse.json({ success: true, task: newTask });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Failed to create task.' },
      { status: 500 }
    );
  }
}
