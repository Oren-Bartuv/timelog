<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\Comment;
use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        $task->update([
            'name'        => $request->input('name', $task->name),
            'description' => $request->input('description', $task->description),
            'due_date'    => $request->has('due_date') ? $request->due_date : $task->due_date,
            'priority'    => $request->input('priority', $task->priority),
            'done'        => $request->has('done') ? (bool)$request->done : $task->done,
        ]);

        $task->load('creator');

        return response()->json(array_merge($task->fresh()->toArray(), [
            'creator_username' => $task->creator->username,
        ]));
    }

    public function destroy(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $user = $request->user();

        if ($user->role === 'viewer') {
            return response()->json(['error' => 'Viewers cannot delete tasks'], 403);
        }

        $project = $task->project_id ? \App\Models\Project::find($task->project_id) : null;
        $canDelete = $user->role === 'owner'
            || $task->created_by === $user->id
            || ($project && $project->owner_id === $user->id);

        if (!$canDelete) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $task->delete();
        return response()->json(['ok' => true]);
    }

    public function storeSubtask(Request $request, $taskId)
    {
        $request->validate(['name' => 'required|string']);
        $subtask = Subtask::create(['task_id' => $taskId, 'name' => $request->name]);
        return response()->json($subtask);
    }

    // --- Timer ---

    public function timerStart(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        if ($task->timer_started_at) {
            return response()->json(['timer_started_at' => $task->timer_started_at]);
        }

        $now = time();
        $task->update(['timer_started_at' => $now]);
        return response()->json(['timer_started_at' => $now]);
    }

    public function timerStop(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        if (!$task->timer_started_at) {
            return response()->json(['elapsed_seconds' => $task->elapsed_seconds]);
        }

        $added = time() - $task->timer_started_at;
        $task->update([
            'elapsed_seconds'  => $task->elapsed_seconds + $added,
            'timer_started_at' => null,
        ]);

        return response()->json(['elapsed_seconds' => $task->elapsed_seconds + $added]);
    }

    public function timerSync(Request $request, $id)
    {
        $request->validate(['elapsed_seconds' => 'required|numeric']);

        $task = Task::findOrFail($id);
        $task->update([
            'elapsed_seconds'  => (int)$request->elapsed_seconds,
            'timer_started_at' => time(),
        ]);

        return response()->json($task->fresh()->only(['elapsed_seconds', 'timer_started_at']));
    }

    // --- Comments ---

    public function comments($id)
    {
        $comments = Comment::with('user')->where('task_id', $id)->orderBy('created_at')->get();
        return response()->json($comments->map(fn($c) => array_merge($c->toArray(), [
            'username' => $c->user->username,
        ])));
    }

    public function storeComment(Request $request, $id)
    {
        $request->validate(['text' => 'required|string']);
        $comment = Comment::create([
            'task_id' => $id,
            'user_id' => $request->user()->id,
            'text'    => $request->text,
        ]);
        $comment->load('user');
        return response()->json(array_merge($comment->toArray(), ['username' => $comment->user->username]));
    }

    // --- Attachments ---

    public function attachments($id)
    {
        $items = Attachment::with('attacher')->where('task_id', $id)->orderBy('created_at')->get();
        return response()->json($items->map(fn($a) => array_merge($a->toArray(), [
            'attacher_username' => $a->attacher->username,
        ])));
    }

    public function storeAttachment(Request $request, $id)
    {
        $request->validate(['name' => 'required|string', 'url' => 'required|string']);

        $attachment = Attachment::create([
            'task_id'       => $id,
            'name'          => $request->name,
            'url'           => $request->url,
            'drive_file_id' => $request->input('drive_file_id'),
            'file_type'     => $request->input('file_type'),
            'attached_by'   => $request->user()->id,
        ]);

        $attachment->load('attacher');
        return response()->json(array_merge($attachment->toArray(), [
            'attacher_username' => $attachment->attacher->username,
        ]));
    }
}
