<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = ['name', 'color', 'owner_id'];

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}
