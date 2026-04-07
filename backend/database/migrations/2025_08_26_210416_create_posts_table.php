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
        Schema::create('posts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('title', 50)->default('');
            $table->string('subtitle', 50)->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('country_id');
            $table->string('region', 50)->nullable();
            $table->unsignedBigInteger('style_id')->nullable();
            $table->date('period')->nullable();
            $table->integer('days');
            $table->unsignedBigInteger('purpose_id')->nullable();
            $table->unsignedBigInteger('budget_id')->nullable();
            $table->enum('post_status', ['準備中', '旅行中', '旅行済']);
            $table->enum('share_scope', ['非公開', '公開']);
            $table->timestamps();

            // 外部キー制約
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('country_id')->references('id')->on('countries');
            $table->foreign('style_id')->references('id')->on('styles');
            $table->foreign('purpose_id')->references('id')->on('purposes');
            $table->foreign('budget_id')->references('id')->on('budgets');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
