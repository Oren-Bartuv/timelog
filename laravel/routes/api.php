<?php

use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\SubtaskController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
});

// Protected routes
Route::middleware('auth:api')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);

    // Projects
    Route::get('projects',              [ProjectController::class, 'index']);
    Route::post('projects',             [ProjectController::class, 'store']);
    Route::put('projects/{id}',         [ProjectController::class, 'update']);
    Route::delete('projects/{id}',      [ProjectController::class, 'destroy']);
    Route::get('projects/{id}/tasks',   [ProjectController::class, 'tasks']);
    Route::post('projects/{id}/tasks',  [ProjectController::class, 'storeTask']);

    // Tasks
    Route::put('tasks/{id}',                    [TaskController::class, 'update']);
    Route::delete('tasks/{id}',                 [TaskController::class, 'destroy']);
    Route::post('tasks/{taskId}/subtasks',       [TaskController::class, 'storeSubtask']);
    Route::post('tasks/{id}/timer/start',        [TaskController::class, 'timerStart']);
    Route::post('tasks/{id}/timer/stop',         [TaskController::class, 'timerStop']);
    Route::patch('tasks/{id}/timer/sync',        [TaskController::class, 'timerSync']);
    Route::get('tasks/{id}/comments',            [TaskController::class, 'comments']);
    Route::post('tasks/{id}/comments',           [TaskController::class, 'storeComment']);
    Route::get('tasks/{id}/attachments',         [TaskController::class, 'attachments']);
    Route::post('tasks/{id}/attachments',        [TaskController::class, 'storeAttachment']);

    // Subtasks
    Route::put('subtasks/{id}',             [SubtaskController::class, 'update']);
    Route::delete('subtasks/{id}',          [SubtaskController::class, 'destroy']);
    Route::post('subtasks/{id}/timer/start',[SubtaskController::class, 'timerStart']);
    Route::post('subtasks/{id}/timer/stop', [SubtaskController::class, 'timerStop']);
    Route::patch('subtasks/{id}/timer/sync',[SubtaskController::class, 'timerSync']);

    // Attachments
    Route::delete('attachments/{id}', [AttachmentController::class, 'destroy']);

    // Stats
    Route::get('stats/total-time', [StatsController::class, 'totalTime']);
});
