<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subtask;
use Illuminate\Http\Request;

class SubtaskController extends Controller
{
    public function update(Request $request, $id)
    {
        $subtask = Subtask::findOrFail($id);

        $subtask->update([
            'name' => $request->input('name', $subtask->name),
            'done' => $request->has('done') ? (bool)$request->done : $subtask->done,
        ]);

        return response()->json($subtask->fresh());
    }

    public function destroy($id)
    {
        Subtask::findOrFail($id)->delete();
        return response()->json(['ok' => true]);
    }

    public function timerStart($id)
    {
        $subtask = Subtask::findOrFail($id);

        if ($subtask->timer_started_at) {
            return response()->json(['timer_started_at' => $subtask->timer_started_at]);
        }

        $now = time();
        $subtask->update(['timer_started_at' => $now]);
        return response()->json(['timer_started_at' => $now]);
    }

    public function timerStop($id)
    {
        $subtask = Subtask::findOrFail($id);

        if (!$subtask->timer_started_at) {
            return response()->json(['elapsed_seconds' => $subtask->elapsed_seconds]);
        }

        $added = time() - $subtask->timer_started_at;
        $subtask->update([
            'elapsed_seconds'  => $subtask->elapsed_seconds + $added,
            'timer_started_at' => null,
        ]);

        return response()->json(['elapsed_seconds' => $subtask->elapsed_seconds + $added]);
    }

    public function timerSync(Request $request, $id)
    {
        $request->validate(['elapsed_seconds' => 'required|numeric']);

        $subtask = Subtask::findOrFail($id);
        $subtask->update([
            'elapsed_seconds'  => (int)$request->elapsed_seconds,
            'timer_started_at' => time(),
        ]);

        return response()->json($subtask->fresh()->only(['elapsed_seconds', 'timer_started_at']));
    }
}
