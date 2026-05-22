import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBoardTasks, updateTask, deleteTask, getLocalDateString } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const dateStr = dateParam || getLocalDateString();

    const body = await req.json();
    const { status, text, order } = body;

    // Find the task to verify ownership
    const tasks = await getBoardTasks(dateStr);
    const task = tasks.find(t => t.id === id);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found on this date.' },
        { status: 404 }
      );
    }

    if (task.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized. You can only edit your own tasks.' },
        { status: 403 }
      );
    }

    // Build update object
    const updates: Parameters<typeof updateTask>[2] = {};
    if (status !== undefined) {
      if (!['todo', 'working', 'done'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value.' },
          { status: 400 }
        );
      }
      updates.status = status;
    }
    if (text !== undefined) {
      if (typeof text !== 'string' || text.trim() === '') {
        return NextResponse.json(
          { error: 'Task text cannot be empty.' },
          { status: 400 }
        );
      }
      updates.text = text.trim();
    }
    if (order !== undefined && typeof order === 'number') {
      updates.order = order;
    }

    const updatedTask = await updateTask(dateStr, id, updates);

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Failed to update task.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const dateStr = dateParam || getLocalDateString();

    // Verify task existence and ownership
    const tasks = await getBoardTasks(dateStr);
    const task = tasks.find(t => t.id === id);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found on this date.' },
        { status: 404 }
      );
    }

    if (task.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized. You can only delete your own tasks.' },
        { status: 403 }
      );
    }

    const deleted = await deleteTask(dateStr, id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete task.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Failed to delete task.' },
      { status: 500 }
    );
  }
}
