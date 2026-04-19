<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subtask extends Model
{
    protected $fillable = ['task_id', 'name', 'done', 'elapsed_seconds', 'timer_started_at'];
    protected $casts = ['done' => 'boolean'];
}
