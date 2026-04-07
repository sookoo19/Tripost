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
        Schema::table('users', function (Blueprint $table) {
            $table->string('displayid',50)->unique()->after('email');
            $table->string('profile_image_url')->nullable()->after('displayid');
            $table->text('bio')->nullable()->after('profile_image_url');
            //プロフィールの渡航済国登録 $table->foreignId('country_id')->nullable()->constrained('countries')->after('bio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //プロフィールの渡航済国登録 $table->dropForeign(['country_id']);
            $table->dropColumn([
                'displayid',
                'profile_image_url',
                'bio',
                //プロフィールの渡航済国登録 'country_id'
            ]);
        });
    }
};
