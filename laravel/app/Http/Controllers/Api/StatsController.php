<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function totalTime()
    {
        $taskTotal = DB::selectOne("
            SELECT COALESCE(SUM(
                elapsed_seconds + CASE
                    WHEN timer_started_at IS NOT NULL
                    THEN (CAST(strftime('%s','now') AS INTEGER) - timer_started_at)
                    ELSE 0
                END
            ), 0) AS total FROM tasks
        ")->total;

        $subtaskTotal = DB::selectOne("
            SELECT COALESCE(SUM(
                elapsed_seconds + CASE
                    WHEN timer_started_at IS NOT NULL
                    THEN (CAST(strftime('%s','now') AS INTEGER) - timer_started_at)
                    ELSE 0
                END
            ), 0) AS total FROM subtasks
        ")->total;

        return response()->json(['total_seconds' => $taskTotal + $subtaskTotal]);
    }
}
