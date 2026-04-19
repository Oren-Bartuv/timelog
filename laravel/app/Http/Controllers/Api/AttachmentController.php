<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;

class AttachmentController extends Controller
{
    public function destroy($id)
    {
        Attachment::findOrFail($id)->delete();
        return response()->json(['ok' => true]);
    }
}
