<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PurposesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('purposes')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        DB::table('purposes')->insert([
            ['name' => '自然'],
            ['name' => '文化・歴史'],
            ['name' => 'グルメ'],
            ['name' => '体験・アクティビティ'],
            ['name' => 'リラックス'],
            ['name' => '都市・街歩き'],
            ['name' => 'イベント・祭り'],
            ['name' => 'アート・エンタメ'],
        ]);
    }
}
