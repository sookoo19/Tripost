<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BudgetTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('budgets')->insert([
            ['min' => 0,       'max' => 50000,    'label' => '〜5万円'],        // 東南アジアの短期旅・LCC利用など
            ['min' => 50000,   'max' => 100000,   'label' => '5〜10万円'],     // アジア主要都市・安めの欧州
            ['min' => 100000,  'max' => 200000,   'label' => '10〜20万円'],    // 欧州・北米・オセアニアの標準旅
            ['min' => 200000,  'max' => 300000,   'label' => '20〜30万円'],    // リゾートホテル滞在・欧州長め
            ['min' => 300000,  'max' => 500000,   'label' => '30〜50万円'],    // 高級リゾートや長期滞在
            ['min' => 500000,  'max' => null,     'label' => '50万円以上'],    // 世界一周・超高級旅
        ]);
    }
}
