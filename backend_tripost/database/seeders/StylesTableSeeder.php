<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StylesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('styles')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        DB::table('styles')->insert([
            ['name' => 'ソロ'],
            ['name' => '家族'],
            ['name' => 'カップル'],
            ['name' => '友達'],
            ['name' => 'バックパッカー'],
            ['name' => 'ビジネス'],
            ['name' => 'ラグジュアリー'],
            ['name' => '団体・ツアー'],
        ]);
    }
}
