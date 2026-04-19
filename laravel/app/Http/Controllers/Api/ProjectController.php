<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $projects = Project::withCount('tasks')->orderByDesc('created_at')->get();
        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string']);

        $project = Project::create([
            'name'     => $request->name,
            'color'    => $request->input('color', '#6366f1'),
            'owner_id' => $request->user()->id,
        ]);

        return response()->json($project);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        if ($project->owner_id !== $request->user()->id && $request->user()->role !== 'owner') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $project->update([
            'name'  => $request->input('name', $project->name),
            'color' => $request->input('color', $project->color),
        ]);

        return response()->json($project->fresh());
    }

    public function destroy(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        if ($request->user()->role === 'viewer') {
            return response()->json(['error' => 'Viewers cannot delete projects'], 403);
        }

        if ($project->owner_id !== $request->user()->id && $request->user()->role !== 'owner') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $project->delete();
        return response()->json(['ok' => true]);
    }

    public function tasks(Request $request, $id)
    {
        $tasks = Task::with(['subtasks', 'creator'])
            ->where('project_id', $id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($tasks->map(fn($t) => array_merge($t->toArray(), [
            'creator_username' => $t->creator->username,
            'subtasks'         => $t->subtasks,
        ])));
    }

    public function storeTask(Request $request, $id)
    {
        $request->validate(['name' => 'required|string']);

        $task = Task::create([
            'project_id'  => $id,
            'name'        => $request->name,
            'description' => $request->input('description', ''),
            'due_date'    => $request->input('due_date'),
            'priority'    => $request->input('priority', 'none'),
            'created_by'  => $request->user()->id,
        ]);

        $task->load('creator');

        return response()->json(array_merge($task->toArray(), [
            'creator_username' => $task->creator->username,
            'subtasks'         => [],
        ]));
    }
}
