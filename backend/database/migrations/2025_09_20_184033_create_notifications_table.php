<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->comment('通知を受け取るユーザーID')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->comment('アクションを起こしたユーザーID')->constrained('users')->nullOnDelete();
            $table->string('type')->comment('通知タイプ (follow, like など)');
            $table->unsignedBigInteger('notifiable_id')->nullable()->comment('関連オブジェクトID (post_id など)');
            $table->string('notifiable_type')->nullable()->comment('関連オブジェクトタイプ (App\\Models\\Post など)');
            $table->boolean('read')->default(false)->comment('既読フラグ');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
