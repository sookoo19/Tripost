<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Country>
 */
class CountryFactory extends Factory
{
    public function definition(): array
    {
        static $counter = 0;
        $counter++;

        return [
            'code' => strtoupper($this->faker->unique()->lexify('??')) . $counter,
            'name' => $this->faker->country(),
        ];
    }
}
