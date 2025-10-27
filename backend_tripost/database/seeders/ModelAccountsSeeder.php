<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class ModelAccountsSeeder extends Seeder
{
    public function run()
    {
        User::updateOrCreate(
            ['email' => 'demo@example.com'],
            [
                'name' => 'Demo User',
                'password' => '1q2w3e4R',
                'email_verified_at' => now(),
                'remember_token' => Str::random(10),
                'displayid' => 'demouser', 
            ]
        );
    }
}