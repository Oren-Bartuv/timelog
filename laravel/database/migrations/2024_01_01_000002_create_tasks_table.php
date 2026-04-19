<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->default('');
            $table->string('due_date')->nullable();
            $table->string('priority')->default('none');
            $table->boolean('done')->default(false);
            $table->foreignId('created_by')->constrained('users');
            $table->integer('elapsed_seconds')->default(0);
            $table->integer('timer_started_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
