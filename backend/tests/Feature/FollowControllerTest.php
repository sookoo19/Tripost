<?php

namespace Tests\Feature;

use App\Models\Follow;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FollowControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_follow_another_user(): void
    {
        $follower = User::factory()->create();
        $target   = User::factory()->create();

        $this->actingAs($follower)
            ->post('/follow/add', ['user_id' => $target->id])
            ->assertRedirect();

        $this->assertDatabaseHas('follows', [
            'following' => $follower->id,
            'followed'  => $target->id,
        ]);
    }

    public function test_user_cannot_follow_same_user_twice(): void
    {
        $follower = User::factory()->create();
        $target   = User::factory()->create();

        Follow::create(['following' => $follower->id, 'followed' => $target->id]);

        $this->actingAs($follower)
            ->post('/follow/add', ['user_id' => $target->id])
            ->assertRedirect();

        // レコードが 1 件のままであることを確認
        $this->assertSame(1, Follow::where('following', $follower->id)
            ->where('followed', $target->id)
            ->count());
    }

    public function test_user_can_unfollow(): void
    {
        $follower = User::factory()->create();
        $target   = User::factory()->create();

        Follow::create(['following' => $follower->id, 'followed' => $target->id]);

        $this->actingAs($follower)
            ->post('/follow/remove', ['user_id' => $target->id])
            ->assertRedirect();

        $this->assertDatabaseMissing('follows', [
            'following' => $follower->id,
            'followed'  => $target->id,
        ]);
    }

    public function test_guest_cannot_follow(): void
    {
        $target = User::factory()->create();

        $this->post('/follow/add', ['user_id' => $target->id])
            ->assertRedirect('/auth/login');
    }

    public function test_follow_creates_notification(): void
    {
        $follower = User::factory()->create();
        $target   = User::factory()->create();

        $this->actingAs($follower)
            ->post('/follow/add', ['user_id' => $target->id]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $target->id,
            'actor_id' => $follower->id,
            'type' => 'follow',
        ]);
    }
}
