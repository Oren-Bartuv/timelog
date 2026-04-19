<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'project_id', 'name', 'description', 'due_date',
        'priority', 'done', 'created_by', 'elapsed_seconds', 'timer_started_at',
    ];

    protected $casts = ['done' => 'boolean'];

    public function subtasks()
    {
        return $this->hasMany(Subtask::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }
}
