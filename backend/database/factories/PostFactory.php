<?php

namespace Database\Factories;

use App\Models\Country;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Post>
 */
class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id'     => User::factory(),
            'title'       => $this->faker->sentence(3),
            'subtitle'    => $this->faker->sentence(5),
            'description' => $this->faker->paragraph(),
            'region'      => $this->faker->city(),
            'period'      => $this->faker->date('Y-m'),
            'days'        => $this->faker->numberBetween(1, 10),
            'post_status' => '旅行済',
            'share_scope' => '公開',
            'country_id'  => Country::factory(),
            'style_id'    => null,
            'purpose_id'  => null,
            'budget_id'   => null,
            'trip_plan'   => null,
            'photos'      => null,
        ];
    }

    public function private(): static
    {
        return $this->state(['share_scope' => '非公開']);
    }

    public function draft(): static
    {
        return $this->state([
            'share_scope' => '非公開',
            'post_status' => '準備中',
        ]);
    }
}
