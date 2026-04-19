<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    protected $fillable = ['task_id', 'name', 'url', 'drive_file_id', 'file_type', 'attached_by'];

    public function attacher()
    {
        return $this->belongsTo(User::class, 'attached_by');
    }
}
